variable "cognito_tags" {
  type        = map(string)
  default     = {}
  description = "Tags to apply to the Cognito resources"
}

variable "base_url" {
  type        = string
  description = "The base URL for callback and logout URLs"
}

variable "deletion_protection" {
  type        = string
  default     = "ACTIVE"
  description = "Whether to enable deletion protection for the Cognito User Pool"
}