output "user_pool_id" {
    description = "The ID of the Cognito User Pool"
    value       = aws_cognito_user_pool.pool.id
}

output "user_pool_client_id" {
    description = "The ID of the Cognito User Pool Client"
    value       = aws_cognito_user_pool_client.client.id
}

output "user_pool_client_secret" {
    description = "The secret of the Cognito User Pool Client"
    value       = aws_cognito_user_pool_client.client.client_secret
    sensitive   = true
}

output "user_pool_domain" {
    description = "The domain name of the Cognito User Pool"
    value       = aws_cognito_user_pool_domain.main.domain
}

output "user_pool_hosted_ui_url" {
    description = "The URL of the Cognito hosted UI login page"
    value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com/login?client_id=${aws_cognito_user_pool_client.client.id}&response_type=code&scope=email+openid+profile&redirect_uri=${var.base_url}/auth/callback"
}

output "auth_url" {
    description = "The Cognito authorization URL"
    value       = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.pool.id}"
}

output "redirect_urls" {
    description = "The redirect URLs for the Cognito User Pool Client"
    value       = aws_cognito_user_pool_client.client.callback_urls
}

output "logout_urls" {
    description = "The logout URLs for the Cognito User Pool Client"
    value       = aws_cognito_user_pool_client.client.logout_urls
}

output "user_pool_domain_url" {
    description = "The domain name of the Cognito User Pool"
    value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com"
}