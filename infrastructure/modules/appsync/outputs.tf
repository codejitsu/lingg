output "appsync_api_url" {
  description = "The AppSync GraphQL API endpoint URL"
  value       = aws_appsync_graphql_api.api.uris["GRAPHQL"]
}

output "appsync_api_key" {
  description = "The API key for the AppSync GraphQL API"
  value       = aws_appsync_api_key.api_key.key
}