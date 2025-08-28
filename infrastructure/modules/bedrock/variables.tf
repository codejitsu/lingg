variable "allowed_models" {
  description = "List of allowed Bedrock model IDs."
  type        = list(string)
  default = [
    #"anthropic.claude-opus-4-1-20250805-v1:0",
    #"anthropic.claude-3-haiku-20240307-v1:0",
    #"anthropic.claude-3-7-sonnet-20250219-v1:0",
    #"anthropic.claude-3-5-haiku-20241022-v1:0",

    "anthropic.claude-sonnet-4-20250514-v1:0",
    "us.anthropic.claude-sonnet-4-20250514-v1:0", # US variant of the above

    #"amazon.nova-premier-v1:0",
    #"amazon.titan-text-premier-v1:0",
    #"amazon.titan-text-lite-v1",
    #"amazon.nova-lite-v1:0",
    #"amazon.nova-micro-v1:0",
    #"amazon.nova-pro-v1:0"
  ]
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}
