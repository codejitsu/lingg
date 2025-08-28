variable "lambda_runtime" {
  type        = string
  description = "Runtype type for AWS Lambda."
}

variable "graphql_api_lambda_tags" {
  description = "Tags to apply to the lambda for graphql API."
  type        = map(string)
  default     = {}
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "log_level" {
  description = "AWS Lambda log level"
  type        = string
}

variable "allowed_bedrock_model_arns" {
  description = "List of allowed Bedrock model ARNs."
  type        = list(string)
  default     = []
}

variable "bedrock_model_id" {
  description = "The model ID to use for Bedrock."
  type        = string
  default     = "amazon.nova-premier-v1:0"
}

variable "dynamodb_table_arn" {
  description = "The ARN of the DynamoDB table."
  type        = string
}