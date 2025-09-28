use std::collections::HashMap;
use std::time::Duration;

use aws_config::timeout::TimeoutConfig;
use aws_sdk_bedrockruntime::error::SdkError;
use aws_sdk_bedrockruntime::operation::converse::{ConverseError, ConverseOutput};

use crate::{Chapter, ChapterStatus, LanguageName, Placeholder, StartStoryInput, Story};

use lambda_appsync::{serde_json, ID};
use uuid::Uuid;

use aws_config::BehaviorVersion;
use aws_config::Region;
use aws_sdk_bedrockruntime::types::{ContentBlock, ConversationRole, Message};
use aws_sdk_bedrockruntime::Client;

use crate::placeholders::replace_parts_of_words;

#[derive(Debug)]
pub struct BedrockConverseError(String);
impl std::fmt::Display for BedrockConverseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Can't invoke model. Reason: {}", self.0)
    }
}
impl std::error::Error for BedrockConverseError {}
impl From<&str> for BedrockConverseError {
    fn from(value: &str) -> Self {
        BedrockConverseError(value.to_string())
    }
}
impl From<&ConverseError> for BedrockConverseError {
    fn from(value: &ConverseError) -> Self {
        BedrockConverseError::from(match value {
            ConverseError::ModelTimeoutException(_) => "Model took too long",
            ConverseError::ModelNotReadyException(_) => "Model is not ready",
            _ => "Unknown",
        })
    }
}

pub fn build_story_id(user_id: &ID, client_request_id: &ID) -> Uuid {
    let namespace = Uuid::new_v5(&Uuid::NAMESPACE_OID, user_id.as_bytes());
    Uuid::new_v5(&namespace, client_request_id.as_bytes())
}

fn get_converse_output_text(output: ConverseOutput) -> Result<String, BedrockConverseError> {
    let text = output
        .output()
        .ok_or("no output")?
        .as_message()
        .map_err(|_| "output not a message")?
        .content()
        .first()
        .ok_or("no content in message")?
        .as_text()
        .map_err(|_| "content is not text")?
        .to_string();
    Ok(text)
}

fn process_model_output(
    output: ConverseOutput,
    input: &StartStoryInput,
) -> Result<Story, SdkError<ConverseError>> {
    let text_with_title = get_converse_output_text(output).unwrap();

    let parts: Vec<&str> = text_with_title.splitn(2, '|').collect();
    let text = if parts.len() == 2 {
        parts[1].trim().to_string()
    } else {
        text_with_title.trim().to_string()
    };

    let title = if parts.len() == 2 {
        parts[0].trim().to_string()
    } else {
        "My Story".to_string()
    };

    let story_id = build_story_id(&input.user_id, &input.client_request_id);
    let chapter_id = Uuid::now_v7();

    let (template, placeholder_map) = replace_parts_of_words(&text, 0.3);

    let placeholders: Vec<Placeholder> = placeholder_map
        .iter()
        .map(|(key, value)| Placeholder {
            name: key.clone(),
            text: value.clone(),
        })
        .collect();

    let chapter = Chapter {
        chapter_id: ID::try_from(chapter_id.to_string()).unwrap(),
        story_id: ID::try_from(story_id.to_string()).unwrap(),
        status: ChapterStatus::Created,
        content: text,
        template: template,
        created_at: chrono::Utc::now().to_rfc3339().into(),
        placeholders: placeholders,
        user_input: vec![],
        completed_at: None,
        finalized_content: None,
    };

    let story = Story {
        user_id: ID::try_from(input.user_id.to_string()).unwrap(),
        story_id: ID::try_from(story_id.to_string()).unwrap(),
        target_language: input.target_language,
        explain_language: input.explain_language,
        story_type: input.story_type,
        started_at: chrono::Utc::now().to_rfc3339().into(),
        title: title.into(),
        chapters: vec![chapter],
    };

    Ok(story)
}

async fn get_client() -> Client {
    let aws_region = env::var("REGION").unwrap();
    let sdk_config = aws_config::defaults(BehaviorVersion::latest())
        .region(Region::new(aws_region))
        .timeout_config(
            TimeoutConfig::builder()
                .read_timeout(Duration::from_secs(3600))
                .build(),
        )
        .load()
        .await;

    Client::new(&sdk_config)
}

fn get_model_id() -> String {
    let model_id = env::var("BEDROCK_MODEL_ID").unwrap();

    println!("Using Bedrock model ID: {}", model_id);

    model_id
}

pub async fn generate_new_story(input: &StartStoryInput) -> Result<Story, BedrockConverseError> {
    let message = format!(
        "Create a story in {}. The story should be about {}. The length of the story should be around 100 words.
        Don't use any swear words or adult content.
        The story should be not finalized, so we can iterate further. Don't include anyting like 'The End' or 'To be continued'.
        Dont include any new lines or line breaks. Return the story in the following format: <story-title>|<story-content>
        
        Example: My Adventure|Once upon a time...",
        input.target_language, input.story_type
    );

    let client = get_client().await;
    let bedrock_model_id = get_model_id();

    let story = client
        .converse()
        .model_id(bedrock_model_id)
        .messages(
            Message::builder()
                .role(ConversationRole::User)
                .content(ContentBlock::Text(message.to_string()))
                .build()
                .unwrap(),
        )
        .send()
        .await
        .and_then(|output| process_model_output(output, &input))
        .map_err(|e| BedrockConverseError(e.to_string()))?;

    Ok(story)
}

pub async fn generate_new_chapter(
    story: &str,
    target_language: &LanguageName,
    story_id: &ID,
) -> Result<Chapter, BedrockConverseError> {
    let message = format!(
        "Create a new chapter for the following story in {} language. The chapter should be around 100 words.
        The chapter should continue the story and not repeat anything that was already said in the story.
        Don't use any swear words or adult content.
        The chapter should be not finalized, so we can iterate further. Don't include anyting like 'The End' or 'To be continued'.
        Dont include any new lines or line breaks. Return only the chapter text.

        ## Story is below:
        --------------------------------------------
        {}",
        target_language, story
    );

    let client = get_client().await;
    let bedrock_model_id = get_model_id();

    let chapter_text = client
        .converse()
        .model_id(bedrock_model_id)
        .messages(
            Message::builder()
                .role(ConversationRole::User)
                .content(ContentBlock::Text(message.to_string()))
                .build()
                .unwrap(),
        )
        .send()
        .await
        .map(|output| get_converse_output_text(output).unwrap())
        .map_err(|e| BedrockConverseError(e.to_string()))?;

    let template = replace_parts_of_words(&chapter_text, 0.3);

    Ok(Chapter {
        chapter_id: ID::try_from(Uuid::now_v7().to_string()).unwrap(),
        story_id: story_id.clone(),
        status: ChapterStatus::Created,
        content: chapter_text,
        template: template.0,
        created_at: chrono::Utc::now().to_rfc3339().into(),
        placeholders: template
            .1
            .iter()
            .map(|(k, v)| Placeholder {
                name: k.clone(),
                text: v.clone(),
            })
            .collect(),
        user_input: vec![],
        completed_at: None,
        finalized_content: None,
    })
}

pub async fn verify_spelling_and_grammar(
    template: &str,
    applied_template: &str,
    target_language: &LanguageName,
    explain_language: &LanguageName,
) -> Result<HashMap<String, String>, BedrockConverseError> {
    let message = format!(
        "Check the following text for spelling and grammar mistakes. The text is in {} language.
        Return a list of mistakes found, or return an empty list if no mistakes were found. All found mistakes must be explained in {} language.

        User has filled empty placeholders in the template. Some of the words may be misspelled or grammatically incorrect.
        Your task is to find mistakes in the filled text, not in the template itself. All words that were part of the template are guaranteed to be correct.
        Only check the parts that were filled by the user. The text with filled placeholders must make sense.

        Initial template with empty placeholders is below: 
        --------------------------------------------
        {}

        Text with filled placeholders is below: 
        --------------------------------------------
        {}

        Return the result as a JSON object, where each field is a placeholder name to mistake mapping.

        # Rules:
        - The output must be a valid JSON only. 
        - If no mistakes were found, return an empty JSON object.
        - NO additional text, only JSON.
        
        Example:
        --------
        {{
            \"ph-1\": \"mistake 1\",
            \"ph-2\": \"mistake 2\"
        }}",
        target_language, explain_language, template, applied_template
    );

    let client = get_client().await;
    let bedrock_model_id = get_model_id();

    let mistakes_text = client
        .converse()
        .model_id(bedrock_model_id)
        .messages(
            Message::builder()
                .role(ConversationRole::User)
                .content(ContentBlock::Text(message.to_string()))
                .build()
                .unwrap(),
        )
        .send()
        .await
        .map(|output| get_converse_output_text(output).unwrap())
        .map_err(|e| BedrockConverseError(e.to_string()))?;

    log::debug!("Mistakes from model={:?}", mistakes_text);

    let mistakes: HashMap<String, String> =
        serde_json::from_str(&mistakes_text).unwrap_or_else(|_| HashMap::new());

    Ok(mistakes)
}
