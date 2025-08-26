use aws_config::Region;
use lambda_appsync::appsync_lambda_main;
use lambda_appsync::ID;
use lambda_appsync::{appsync_operation, AppsyncError, AppsyncEvent};
use uuid::Uuid;
use aws_sdk_bedrockruntime::Client;
use aws_sdk_bedrockruntime::types::{ConversationRole, ContentBlock, Message};
use aws_sdk_bedrockruntime::operation::converse::{ConverseOutput, ConverseError};
use aws_config::BehaviorVersion;

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

#[appsync_operation(mutation(startStory), with_appsync_event)]
async fn start_story(
    args: StartStoryArguments,
    _event: &AppsyncEvent<Operation>
) -> Result<Story, AppsyncError> {
    let aws_region = env::var("REGION").unwrap();
    let bedrock_model_id = env::var("BEDROCK_MODEL_ID").unwrap();

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
        Dont include any new lines or line breaks.",
        args.target_language, args.story_type
    );

    let model_response = client
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
        .await;

    match model_response {
        Ok(output) => {
            let response = get_converse_output_text(output).unwrap();

            let story_id = Uuid::now_v7();
            let chapter_id = Uuid::now_v7();

            let chapter = Chapter {
                chapter_id: ID::try_from(chapter_id.to_string()).unwrap(),
                story_id: ID::try_from(story_id.to_string()).unwrap(),
                content: response,
                created_at: "2023-10-01T00:00:00Z".to_string().into(),
            };

            let story = Story {
                story_id: ID::try_from(story_id.to_string()).unwrap(),
                target_language: args.target_language,
                explain_language: args.explain_language,
                story_type: args.story_type,
                started_at: "2023-10-01T00:00:00Z".to_string().into(),
                chapters: vec![chapter],
            };

            Ok(story)
        }
        Err(e) => {
            Err(AppsyncError::new("ModelError", e.to_string()))
        },
    }
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

