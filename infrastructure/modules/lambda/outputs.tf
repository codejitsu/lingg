output "function_arn" {
  description = "The ARN of the GraphQL API Lambda function"
  value       = aws_lambda_function.graphql_api_lambda.arn
}

output "function_name" {
  description = "The name of the GraphQL API Lambda function"
  value       = aws_lambda_function.graphql_api_lambda.function_name
}

output "lambda_execute_role_arn" {
  description = "The ARN of the IAM role that allows Lambda execution"
  value       = aws_iam_role.lambda_execute_role.arn
}
