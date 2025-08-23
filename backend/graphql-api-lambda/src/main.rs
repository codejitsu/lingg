use lambda_appsync::appsync_lambda_main;
use lambda_appsync::ID;
use lambda_appsync::{appsync_operation, AppsyncError, AppsyncEvent};

// Generate types and runtime setup from schema
appsync_lambda_main!(
    "schema.graphql",
    // Initialize DynamoDB client if needed
    dynamodb() -> aws_sdk_dynamodb::Client,
    batch = false
);

#[appsync_operation(mutation(startStory), with_appsync_event)]
async fn start_story(
    target_language_code: String,
    explain_language_code: String,
    story_type: String,
    _event: &AppsyncEvent<Operation>
) -> Result<Story, AppsyncError> {
    let story = Story {
        story_id: ID::new(),
        target_language_code: target_language_code,
        explain_language_code: explain_language_code,
        story_type: story_type,
        content: "Once upon a time...".to_string(),
        created_at: "2023-10-01T00:00:00Z".to_string().into(),
    };

    Ok(story)
}

