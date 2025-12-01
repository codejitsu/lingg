data "aws_region" "current" {}

resource "aws_cognito_user_pool" "pool" {
    name = "users-pool"

    username_attributes = ["email"]
    auto_verified_attributes = ["email"]

    schema {
        attribute_data_type      = "String"
        name                     = "name"
        required                 = true
        mutable                  = true

        string_attribute_constraints {
            min_length = "2"
            max_length = "50"
        }
    }

    deletion_protection = var.deletion_protection

    tags = var.cognito_tags
}

resource "aws_cognito_identity_provider" "google_provider" {
    user_pool_id  = aws_cognito_user_pool.pool.id
    provider_name = "Google"
    provider_type = "Google"

    provider_details = {
        authorize_scopes = "openid email profile"
        client_id        = var.google_client_id
        client_secret    = var.google_client_secret
    }

    attribute_mapping = {
        name     = "name"
        email    = "email"
        username = "sub"
    }
}

resource "aws_cognito_user_pool_domain" "main" {
    domain       = "auth-${random_string.domain_suffix.result}"
    user_pool_id = aws_cognito_user_pool.pool.id
    managed_login_version = 2
}

resource "random_string" "domain_suffix" {
    length  = 8
    special = false
    upper   = false
}

resource "aws_cognito_user_pool_client" "client" {
    name         = "cognito-auth-client"
    user_pool_id = aws_cognito_user_pool.pool.id

    generate_secret           = true
    explicit_auth_flows       = ["ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_PASSWORD_AUTH"]
    prevent_user_existence_errors = "ENABLED"

    allowed_oauth_flows       = ["code", "implicit"]
    allowed_oauth_scopes      = ["email", "openid", "profile"]

    allowed_oauth_flows_user_pool_client = true

    supported_identity_providers         = ["COGNITO", "Google"]

    callback_urls             = ["${var.base_url}/index.html"]
    logout_urls               = ["${var.base_url}/index.html"]

    depends_on = [
        aws_cognito_identity_provider.google_provider
    ]
}

resource "aws_cognito_managed_login_branding" "client_branding" {
    user_pool_id = aws_cognito_user_pool.pool.id
    client_id    = aws_cognito_user_pool_client.client.id

    use_cognito_provided_values = true

    depends_on = [
        aws_cognito_user_pool_domain.main
    ]
}
