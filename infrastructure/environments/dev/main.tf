module "bedrock" {
  source = "../../modules/bedrock"
  
  aws_region           = var.region
}

module "lambda" {
  source                      = "../../modules/lambda"
  lambda_runtime              = "provided.al2023"
  aws_region                  = var.region
  log_level                   = "trace"
  allowed_bedrock_model_arns  = module.bedrock.bedrock_model_arns
  bedrock_model_id            = var.bedrock_model_id

  graphql_api_lambda_tags = {
    Environment = lower(var.environment)
  }
}

module "appsync" {
  source = "../../modules/appsync"

  function_arn  = module.lambda.function_arn
  function_name = module.lambda.function_name
}

output "appsync_api_url" {
  value = module.appsync.appsync_api_url
}

output "aws_appsync_api_key" {
  value = nonsensitive(module.appsync.aws_appsync_api_key)
}