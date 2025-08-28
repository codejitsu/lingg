variable "dynamodb_tags" {
    type        = map(string)
    default     = {}
    description = "Tags to apply to the DynamoDB table"
}
