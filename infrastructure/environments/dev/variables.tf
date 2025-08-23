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