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