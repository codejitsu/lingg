module "bedrock" {
  source = "../../modules/bedrock"

  aws_region = var.region
}

module "dynamodb" {
  source = "../../modules/dynamodb"

  dynamodb_tags = {
    Environment = lower(var.environment)
  }
}

module "lambda" {
  source                     = "../../modules/lambda"
  lambda_runtime             = "provided.al2023"
  aws_region                 = var.region
  log_level                  = "debug"
  allowed_bedrock_model_arns = module.bedrock.bedrock_model_arns
  bedrock_model_id           = var.bedrock_model_id
  dynamodb_table_arn         = module.dynamodb.dynamodb_table_arn
  dynamodb_table_name        = module.dynamodb.dynamodb_table_name

  graphql_api_lambda_tags = {
    Environment = lower(var.environment)
  }
}

module "cognito" {
  source = "../../modules/cognito"

  deletion_protection = "INACTIVE"

  base_url      = "http://localhost:5173"
  cognito_tags = {
    Environment = lower(var.environment)
  }
}

module "appsync" {
  source = "../../modules/appsync"

  aws_region            = var.region

  function_arn          = module.lambda.function_arn
  function_name         = module.lambda.function_name

  cognito_user_pool_id  = module.cognito.user_pool_id

  appsync_tags = {
    Environment = lower(var.environment)
  }
}

output "appsync_api_url" {
  value = module.appsync.appsync_api_url
}