data "aws_iam_policy_document" "lambda_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_execute_role" {
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  name               = "lambda-execute-role"
}

resource "aws_iam_role_policy_attachment" "lambda_execute" {
  policy_arn = aws_iam_policy.lambda_execute.arn
  role       = aws_iam_role.lambda_execute_role.name
}

resource "aws_iam_policy" "lambda_execute" {
  policy = data.aws_iam_policy_document.lambda_execute.json
}

data "aws_iam_policy_document" "lambda_execute" {
  statement {
    sid       = "AllowInvokingLambdas"
    effect    = "Allow"
    resources = ["arn:aws:lambda:${var.aws_region}:*:function:*"]
    actions   = ["lambda:InvokeFunction"]
  }

  statement {
    sid       = "AllowCreatingLogGroups"
    effect    = "Allow"
    resources = ["arn:aws:logs:${var.aws_region}:*:*"]
    actions   = ["logs:CreateLogGroup"]
  }

  statement {
    sid       = "AllowWritingLogs"
    effect    = "Allow"
    resources = ["arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/*:*"]

    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
  }  
}

data "archive_file" "bootstrap_graphql_api_lambda" {
  type        = "zip"
  source_dir  = "../../../backend/target/lambda/graphql-api-lambda/"
  output_path = "dist/graphql-api-lambda.zip"
}

resource "aws_lambda_function" "graphql_api_lambda" {
  function_name = "graphql-api-lambda"
  role          = aws_iam_role.lambda_execute_role.arn

  filename         = data.archive_file.bootstrap_graphql_api_lambda.output_path
  source_code_hash = data.archive_file.bootstrap_graphql_api_lambda.output_base64sha256

  runtime     = var.lambda_runtime
  handler     = "bootstrap"
  timeout     = 10
  memory_size = 256

  tags_all = var.graphql_api_lambda_tags

  environment {
    variables = {
      RUST_BACKTRACE        = "1",
      RUST_LOG              = var.log_level,
      AWS_LAMBDA_LOG_FORMAT = "json",
      AWS_LAMBDA_LOG_LEVEL  = var.log_level
    }
  }
}

resource "aws_cloudwatch_log_group" "graphql_api_lambda_log" {
  name              = "/aws/lambda/${aws_lambda_function.graphql_api_lambda.function_name}"
  retention_in_days = 1
}