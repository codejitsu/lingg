output "bedrock_model_arns" {
    value = concat(
        [for model_id in var.allowed_models : "arn:aws:bedrock:${var.aws_region}:${data.aws_caller_identity.current.account_id}:inference-profile/${model_id}"],
        [for model_id in var.allowed_models : "arn:aws:bedrock:us-east-1::foundation-model/${model_id}"],
        [for model_id in var.allowed_models : "arn:aws:bedrock:us-east-2::foundation-model/${model_id}"]
    )
}