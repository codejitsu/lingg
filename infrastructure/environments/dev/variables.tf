variable "environment" {
  description = "Current environment."
  type        = string
  default     = "development"
}

variable "region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region."
}

variable "aws_profile" {
  description = "AWS CLI profile to use."
  type        = string
  default     = "developer"
}

variable "bedrock_model_id" {
  description = "The model ID to use for Bedrock."
  type        = string
  default     = "us.anthropic.claude-sonnet-4-20250514-v1:0"
}