variable "function_arn" {
  description = "ARN of the Lambda function to be used with AppSync"
  type        = string
}

variable "function_name" {
  description = "Name of the Lambda function to be used with AppSync"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool for AppSync authentication"
  type        = string
}

variable "appsync_tags" {
  description = "Tags to apply to the AppSync resources"
  type        = map(string)
  default     = {}
}