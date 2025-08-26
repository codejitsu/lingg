output "appsync_api_url" {
  description = "The AppSync GraphQL API endpoint URL"
  value       = aws_appsync_graphql_api.api.uris["GRAPHQL"]
}

output "aws_appsync_api_key" {
  description = "The AppSync API key"
  value       = aws_appsync_api_key.api_key.key
}