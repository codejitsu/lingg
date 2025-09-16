use crate::storage::{get_stories_by_user_id, get_story_with_chapters_by_id, save_story_to_db};

use crate::ai::{build_story_id, process_model_output};

use lambda_appsync::{appsync_operation, AppsyncError, AppsyncEvent, ID};

use crate::{Operation, StartStoryArguments, Story};

use uuid::Uuid;

use aws_config::BehaviorVersion;
use aws_config::Region;
use aws_sdk_bedrockruntime::types::{ContentBlock, ConversationRole, Message};
use aws_sdk_bedrockruntime::Client;

#[appsync_operation(query(listStories), with_appsync_event)]
pub async fn list_stories(
    user_id: ID,
    _event: &AppsyncEvent<Operation>,
) -> Result<Vec<Story>, AppsyncError> {
    let stories = get_stories_by_user_id(&user_id)
        .await
        .map_err(|e| AppsyncError::new("StorageReadError", e.to_string()))?;
    Ok(stories)
}

#[appsync_operation(query(fetchStoryById), with_appsync_event)]
pub async fn fetch_story_by_id(
    user_id: ID,
    story_id: ID,
    _event: &AppsyncEvent<Operation>,
) -> Result<Option<Story>, AppsyncError> {
    let story_uuid = Uuid::parse_str(&story_id.to_string())
        .map_err(|e| AppsyncError::new("InvalidStoryID", e.to_string()))?;
    let story = get_story_with_chapters_by_id(&user_id, story_uuid)
        .await
        .map_err(|e| AppsyncError::new("StorageReadError", e.to_string()))?;
    Ok(story)
}

#[appsync_operation(mutation(startStory), with_appsync_event)]
pub async fn start_story(
    args: StartStoryArguments,
    _event: &AppsyncEvent<Operation>,
) -> Result<Story, AppsyncError> {
    let aws_region = env::var("REGION").unwrap();
    let bedrock_model_id = env::var("BEDROCK_MODEL_ID").unwrap();

    let story_id = build_story_id(&args.user_id, &args.client_request_id);
    let existing_story = get_story_with_chapters_by_id(&args.user_id, story_id).await;

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
                Ok(story) => save_story_to_db(story, args.user_id, args.client_request_id, 0)
                    .await
                    .map_err(|e| AppsyncError::new("StorageWriteError", e.to_string())),
                Err(e) => Err(e),
            }
        }
        Err(e) => {
            return Err(AppsyncError::new("StorageReadError", e.to_string()));
        }
    }
}
