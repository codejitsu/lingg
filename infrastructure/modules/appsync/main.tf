resource "aws_appsync_graphql_api" "api" {
  name                = "lingg-api"
  authentication_type = "API_KEY"
  schema              = file("../../../backend/schema.graphql")
}

resource "aws_appsync_api_key" "api_key" {
  api_id      = aws_appsync_graphql_api.api.id
  description = "API key for Lingg AppSync API"
  expires     = timeadd(timestamp(), "720h") # API key valid for 30 days
}

data "aws_iam_policy_document" "appsync_invoke_lambda_inline_policy" {
  statement {
    effect  = "Allow"
    actions = ["lambda:InvokeFunction"]
    resources = [
      var.function_arn
    ]
  }
}

resource "aws_iam_role" "appsync_datasource_role" {
  name = "appsync_datasource_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "appsync.amazonaws.com"
        }
      },
    ]
  })

  inline_policy {
    name   = "appsync_invoke_lambda_inline"
    policy = data.aws_iam_policy_document.appsync_invoke_lambda_inline_policy.json
  }
}

resource "aws_appsync_datasource" "lambda_datasource" {
  api_id = aws_appsync_graphql_api.api.id
  name   = "LambdaDataSource"
  type   = "AWS_LAMBDA"

  lambda_config {
    function_arn = var.function_arn
  }

  service_role_arn = aws_iam_role.appsync_datasource_role.arn

  depends_on = [aws_lambda_permission.appsync_lambda_permission]
}

resource "aws_lambda_permission" "appsync_lambda_permission" {
  statement_id  = "AllowExecutionFromAppSync"
  action        = "lambda:InvokeFunction"
  function_name = var.function_name
  principal     = "appsync.amazonaws.com"
  source_arn    = aws_appsync_graphql_api.api.arn
}

resource "aws_appsync_resolver" "start_story_resolver" {
  api_id      = aws_appsync_graphql_api.api.id
  type        = "Mutation"
  field       = "startStory"
  data_source = aws_appsync_datasource.lambda_datasource.name
  kind        = "UNIT"

  request_template = <<EOF
  {
    "version": "2018-05-29",
    "operation": "Invoke",
    "payload": {
      "field": "$context.info.fieldName",
      "arguments": $util.toJson($context.arguments)
    }
  }
  EOF

  response_template = <<EOF
    $utils.toJson($context.result)
  EOF
}
