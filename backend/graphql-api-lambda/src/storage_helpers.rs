use std::{collections::HashMap, convert::TryFrom};
use aws_sdk_dynamodb::types::AttributeValue;
use lambda_appsync::ID;

use crate::{storage::StorageError, Chapter, ChapterStatus, Placeholder};

impl TryFrom<&HashMap<String, AttributeValue>> for Chapter {
    type Error = StorageError;

    fn try_from(item: &HashMap<String, AttributeValue>) -> Result<Self, Self::Error> {
        // SK = STORY#<story_id>#CHAP#<chapter_id>
        let sk = item.get("SK").and_then(|v| v.as_s().ok()).unwrap();

        let sk_parts = sk.split("#").collect::<Vec<&str>>();
        
        let story_id = sk_parts.get(1).ok_or("Missing story_id")?;
        let chapter_id = sk_parts.get(3).ok_or("Missing chapter_id")?;

        let content = item.get("content")
            .and_then(|v| v.as_s().ok())
            .ok_or("Error by reading 'content' field.")?;

        let template = item.get("template")
            .and_then(|v| v.as_s().ok())
            .ok_or("Error by reading 'template' field.")?;

        let created_at = item.get("created_at")
            .and_then(|v| v.as_s().ok())
            .ok_or("Error by reading 'created_at' field.")?;

        let chapter_status = item.get("chapter_status")
            .and_then(|v| v.as_s().ok())
            .ok_or("Error by reading 'chapter_status' field.")?;

        let placeholders = if let Some(attr) = item.get("placeholders") {
            if let Ok(list) = attr.as_l() {
                list.iter()
                    .filter_map(|v| v.as_m().ok())
                    .filter_map(|m| {
                        let name = m.get("name").and_then(|v| v.as_s().ok())?;
                        let text = m.get("text").and_then(|v| v.as_s().ok())?;
                        Some(Placeholder::new(name, text))
                    })
                    .collect()
            } else {
                vec![]
            }
        } else {
            vec![]
        };

        Ok(Chapter {
            chapter_id: ID::try_from(chapter_id.to_string()).map_err(|_| "Cannot parse 'chapter_id' value")?,
            story_id: ID::try_from(story_id.to_string()).map_err(|_| "Cannot parse 'story_id' value")?,
            status: ChapterStatus::try_from(chapter_status.as_str()).map_err(|_| "Cannot parse 'chapter_status' value")?,
            content: content.to_string().into(),
            template: template.to_string().into(),
            created_at: created_at.to_string().into(),
            placeholders,
        })
    }
}