use aws_config::BehaviorVersion;
use aws_lambda_events::event::appsync::AppSyncRequest;
use lambda_runtime::service_fn;
use lambda_runtime::tracing::init_default_subscriber;
use lambda_runtime::tracing::{debug, error, info};
use lambda_runtime::{Error, LambdaEvent};
use serde_json::ser;
use std::env;
use serde_json::{json, Value};

#[derive(Debug, serde::Deserialize, serde::Serialize)]
struct Story {
    storyId: String,
    targetLanguageCode: String,
    explainLanguageCode: String,
    storyType: String,
    content: String,
    createdAt: String,
}

async fn handler(event: LambdaEvent<AppSyncRequest>) -> Result<Value, Error> {
    let config = aws_config::defaults(BehaviorVersion::v2024_03_28())
        .region("us-east-1")
        .load()
        .await;

    if event.payload.other.get("field") == Some(&"startStory".into()) {
        let arguments = event.payload.other.get("arguments").clone();
        let target_language_code = arguments
            .and_then(|args| args.get("targetLanguageCode"))
            .and_then(|val| val.as_str())
            .unwrap_or("en")
            .to_string();

        let explain_language_code = arguments
            .and_then(|args| args.get("explainLanguageCode"))
            .and_then(|val| val.as_str())
            .unwrap_or("en")
            .to_string();

        let story_type = arguments
            .and_then(|args| args.get("storyType"))
            .and_then(|val| val.as_str())
            .unwrap_or("pirate")
            .to_string();

        info!(
            "Starting story with target language: {}, explain language: {}, story type: {}",
                target_language_code, explain_language_code, story_type
        );

        // start_story(target_language_code, explain_language_code, story_type).await;
        let story = Story {
            storyId: "123".to_string(),
            targetLanguageCode: target_language_code,
            explainLanguageCode: explain_language_code,
            storyType: story_type,
            content: "Once upon a time...".to_string(),
            createdAt: "2023-10-01T00:00:00Z".to_string(),
        };

        // Create the response in the format AppSync expects
        let response = json!(story);

        info!("Story created successfully: {}", response);

        return Ok(response);
    } else {
        error!("Unsupported field in AppSync request");    
    }

    Err(Error::from("Unsupported field in AppSync request"))
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    init_default_subscriber();

    let service = service_fn(handler);
    lambda_runtime::run(service).await?;

    Ok(())
}
