mod placeholders;
mod storage;

use std::vec;

use aws_config::BehaviorVersion;
use aws_config::Region;
use aws_sdk_bedrockruntime::error::SdkError;
use aws_sdk_bedrockruntime::operation::converse::{ConverseError, ConverseOutput};
use aws_sdk_bedrockruntime::types::{ContentBlock, ConversationRole, Message};
use aws_sdk_bedrockruntime::Client;
use lambda_appsync::appsync_lambda_main;
use lambda_appsync::ID;
use lambda_appsync::{appsync_operation, AppsyncError, AppsyncEvent};
use placeholders::replace_parts_of_words;
use uuid::Uuid;

#[derive(Debug)]
struct BedrockConverseError(String);
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

// Generate types and runtime setup from schema
appsync_lambda_main!(
    "schema.graphql",
    // Initialize DynamoDB client if needed
    dynamodb() -> aws_sdk_dynamodb::Client,
    batch = false
);

#[appsync_operation(query(listStories), with_appsync_event)]
async fn list_stories(
    user_id: ID,
    _event: &AppsyncEvent<Operation>,
) -> Result<Vec<Story>, AppsyncError> {
    let stories = storage::get_stories_by_user_id(&user_id)
        .await
        .map_err(|e| AppsyncError::new("StorageReadError", e.to_string()))?;
    Ok(stories)
}

#[appsync_operation(query(fetchStoryById), with_appsync_event)]
async fn fetch_story_by_id(
    user_id: ID,
    story_id: ID,
    _event: &AppsyncEvent<Operation>,
) -> Result<Option<Story>, AppsyncError> {
    let story_uuid = Uuid::parse_str(&story_id.to_string())
        .map_err(|e| AppsyncError::new("InvalidStoryID", e.to_string()))?;
    let story = storage::get_story_with_chapters_by_id(&user_id, story_uuid)
        .await
        .map_err(|e| AppsyncError::new("StorageReadError", e.to_string()))?;
    Ok(story)
}

#[appsync_operation(mutation(startStory), with_appsync_event)]
async fn start_story(
    args: StartStoryArguments,
    _event: &AppsyncEvent<Operation>,
) -> Result<Story, AppsyncError> {
    let aws_region = env::var("REGION").unwrap();
    let bedrock_model_id = env::var("BEDROCK_MODEL_ID").unwrap();

    let story_id = build_story_id(&args.user_id, &args.client_request_id);
    let existing_story = storage::get_story_with_chapters_by_id(&args.user_id, story_id).await;

    match existing_story {
        Ok(Some(story)) => {
            println!("Story already exists, returning existing story");
            return Ok(story);
        }
        Ok(None) => {
            println!("No existing story found, creating new story");

            println!("Using Bedrock model ID: {}", bedrock_model_id);

            let sdk_config = aws_config::defaults(BehaviorVersion::latest())
                .region(Region::new(aws_region))
                .load()
                .await;

            let client = Client::new(&sdk_config);

            let message = format!(
                "Create a story in {}. The story should be about {}. The length of the story should be around 100 words.
                Don't use any swear words or adult content.
                The story should be not finalized, so we can iterate further. Don't include anyting like 'The End' or 'To be continued'.
                Dont include any new lines or line breaks. Return the story in the following format: <story-title>|<story-content>
                
                Example: My Adventure|Once upon a time...",
                args.target_language, args.story_type
            );

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
                .and_then(|output| process_model_output(output, &args))
                .map_err(|e| AppsyncError::new("ModelError", e.to_string()));

            match story {
                Ok(story) => {
                    storage::save_story_to_db(story, args.user_id, args.client_request_id, 0)
                        .await
                        .map_err(|e| AppsyncError::new("StorageWriteError", e.to_string()))
                }
                Err(e) => Err(e),
            }
        }
        Err(e) => {
            return Err(AppsyncError::new("StorageReadError", e.to_string()));
        }
    }
}

fn process_model_output(
    output: ConverseOutput,
    args: &StartStoryArguments,
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

    let story_id = build_story_id(&args.user_id, &args.client_request_id);
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
        content: text,
        template: template,
        created_at: chrono::Utc::now().to_rfc3339().into(),
        placeholders,
    };

    let story = Story {
        user_id: ID::try_from(args.user_id.to_string()).unwrap(),
        story_id: ID::try_from(story_id.to_string()).unwrap(),
        target_language: args.target_language,
        explain_language: args.explain_language,
        story_type: args.story_type,
        started_at: chrono::Utc::now().to_rfc3339().into(),
        title: title.into(),
        chapters: vec![chapter],
    };

    Ok(story)
}

fn build_story_id(user_id: &ID, client_request_id: &ID) -> Uuid {
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
