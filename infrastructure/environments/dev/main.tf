module "lambda" {
  source                                  = "../../modules/lambda"
  lambda_runtime                          = "provided.al2023"
  aws_region                              = var.region
  log_level                               = "trace"
  
  graphql_api_lambda_tags                 = {
    Environment = lower(var.environment)
  }
}

module "appsync" {
  source                                  = "../../modules/appsync"
  region                                  = var.region

  function_arn                           = module.lambda.function_arn
  function_name                          = module.lambda.function_name
}

output "appsync_api_url" {
  value = module.appsync.appsync_api_url
}
