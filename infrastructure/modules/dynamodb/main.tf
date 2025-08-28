resource "aws_dynamodb_table" "lingg-table" {
    name         = "lingg-table"
    billing_mode = "PAY_PER_REQUEST"

    hash_key = "PK"
    range_key = "SK"

    attribute {
        name = "PK"
        type = "S"
    }

    attribute {
        name = "SK"
        type = "S"
    }

    ttl {
        attribute_name = "TTL"
        enabled        = true
    }

    tags = var.dynamodb_tags
}