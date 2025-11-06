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
  description = "Deletion protection status for the Cognito User Pool. Valid values are 'ACTIVE' or 'INACTIVE'"
}