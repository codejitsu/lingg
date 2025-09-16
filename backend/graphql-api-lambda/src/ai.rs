use aws_sdk_bedrockruntime::error::SdkError;
use aws_sdk_bedrockruntime::operation::converse::{ConverseError, ConverseOutput};

use crate::{Chapter, Placeholder, StartStoryArguments, Story};

use lambda_appsync::ID;
use uuid::Uuid;

use crate::placeholders::replace_parts_of_words;

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

pub fn process_model_output(
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
