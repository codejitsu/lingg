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
  default     = "us.amazon.nova-micro-v1:0"
}

variable "google_client_id" {
  type        = string
  description = "Google OAuth 2.0 client ID from Google Cloud Console"
}

variable "google_client_secret" {
  type        = string
  description = "Google OAuth 2.0 client secret from Google Cloud Console"
  sensitive   = true
}