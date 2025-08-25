use lambda_appsync::appsync_lambda_main;
use lambda_appsync::ID;
use lambda_appsync::{appsync_operation, AppsyncError, AppsyncEvent};
use uuid::Uuid;

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
    let story_id = Uuid::now_v7();
    let chapter_id = Uuid::now_v7();

    let chapter = Chapter {
        chapter_id: ID::try_from(chapter_id.to_string()).unwrap(),
        story_id: ID::try_from(story_id.to_string()).unwrap(),
        content: "Once upon a time...".to_string(),
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

