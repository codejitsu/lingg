mod ai;
mod model_helpers;
mod operations;
mod placeholders;
mod storage;
mod storage_helpers;
mod spellchecker;

use lambda_appsync::appsync_lambda_main;

// Generate types and runtime setup from schema
appsync_lambda_main!(
    "schema.graphql",
    // Initialize DynamoDB client if needed
    dynamodb() -> aws_sdk_dynamodb::Client,
    batch = false
);
