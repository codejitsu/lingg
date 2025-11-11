output "appsync_api_url" {
  description = "The AppSync GraphQL API endpoint URL"
  value       = aws_appsync_graphql_api.api.uris["GRAPHQL"]
}