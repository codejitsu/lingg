use aws_sdk_dynamodb::types::AttributeValue;
use lambda_appsync::ID;
use std::{collections::HashMap, convert::TryFrom};

use crate::{storage::StorageError, Chapter, ChapterStatus, Placeholder, UserInputValue};

impl TryFrom<&HashMap<String, AttributeValue>> for Chapter {
    type Error = StorageError;

    fn try_from(item: &HashMap<String, AttributeValue>) -> Result<Self, Self::Error> {
        // SK = STORY#<story_id>#CHAP#<chapter_id>
        let sk = item.get("SK").and_then(|v| v.as_s().ok()).unwrap();

        let sk_parts = sk.split("#").collect::<Vec<&str>>();

        let story_id = sk_parts.get(1).ok_or("Missing story_id")?;
        let chapter_id = sk_parts.get(3).ok_or("Missing chapter_id")?;

        let content = item
            .get("content")
            .and_then(|v| v.as_s().ok())
            .ok_or("Error by reading 'content' field.")?;

        let template = item
            .get("template")
            .and_then(|v| v.as_s().ok())
            .ok_or("Error by reading 'template' field.")?;

        let created_at = item
            .get("created_at")
            .and_then(|v| v.as_s().ok())
            .ok_or("Error by reading 'created_at' field.")?;

        let chapter_status = item
            .get("chapter_status")
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

        let user_input = if let Some(attr) = item.get("user_input") {
            if let Ok(list) = attr.as_l() {
                list.iter()
                    .filter_map(|v| v.as_m().ok())
                    .filter_map(|m| {
                        let name = m.get("name").and_then(|v| v.as_s().ok())?;
                        let text = m.get("text").and_then(|v| v.as_s().ok())?;
                        Some(UserInputValue {
                            name: name.to_string(),
                            text: text.to_string(),
                        })
                    })
                    .collect()
            } else {
                vec![]
            }
        } else {
            vec![]
        };

        Ok(Chapter {
            chapter_id: ID::try_from(chapter_id.to_string())
                .map_err(|_| "Cannot parse 'chapter_id' value")?,
            story_id: ID::try_from(story_id.to_string())
                .map_err(|_| "Cannot parse 'story_id' value")?,
            status: ChapterStatus::try_from(chapter_status.as_str())
                .map_err(|_| "Cannot parse 'chapter_status' value")?,
            content: content.to_string().into(),
            template: template.to_string().into(),
            created_at: created_at.to_string().into(),
            placeholders: placeholders,
            user_input: user_input,
        })
    }
}

#[cfg(test)]
mod tests {
    use uuid::Uuid;

    use super::*;

    fn make_chapter_item(
        story_id: &str,
        chapter_id: &str,
        content: &str,
        template: &str,
        created_at: &str,
        chapter_status: &str,
        placeholders: Vec<(String, String)>,
    ) -> HashMap<String, AttributeValue> {
        let mut item = HashMap::new();
        item.insert(
            "SK".to_string(),
            AttributeValue::S(format!("STORY#{}#CHAP#{}", story_id, chapter_id)),
        );
        item.insert(
            "content".to_string(),
            AttributeValue::S(content.to_string()),
        );
        item.insert(
            "template".to_string(),
            AttributeValue::S(template.to_string()),
        );
        item.insert(
            "created_at".to_string(),
            AttributeValue::S(created_at.to_string()),
        );
        item.insert(
            "chapter_status".to_string(),
            AttributeValue::S(chapter_status.to_string()),
        );

        let list = placeholders
            .into_iter()
            .map(|(name, text)| {
                let mut m = HashMap::new();
                m.insert("name".to_string(), AttributeValue::S(name));
                m.insert("text".to_string(), AttributeValue::S(text));
                AttributeValue::M(m)
            })
            .collect();
        item.insert("placeholders".to_string(), AttributeValue::L(list));

        item
    }

    #[test]
    fn test_try_from_valid_item() {
        let story_id = Uuid::new_v4().to_string();
        let chapter_id = Uuid::new_v4().to_string();

        let item = make_chapter_item(
            &story_id,
            &chapter_id,
            "Some content",
            "Some template",
            "2024-06-01T12:00:00Z",
            "Created",
            vec![("name1".to_string(), "text1".to_string())],
        );
        let chapter = Chapter::try_from(&item);
        assert!(chapter.is_ok());
        let chapter = chapter.unwrap();
        assert_eq!(chapter.story_id.to_string(), story_id);
        assert_eq!(chapter.chapter_id.to_string(), chapter_id);
        assert_eq!(chapter.content, "Some content");
        assert_eq!(chapter.template, "Some template");
        assert_eq!(chapter.created_at, "2024-06-01T12:00:00Z".into());
        assert_eq!(chapter.status, ChapterStatus::Created);
        assert_eq!(chapter.placeholders.len(), 1);
        assert_eq!(chapter.placeholders[0].name, "name1");
        assert_eq!(chapter.placeholders[0].text, "text1");
    }

    #[test]
    fn test_try_from_missing_fields() {
        let mut item = HashMap::new();
        item.insert(
            "SK".to_string(),
            AttributeValue::S("STORY#story123#CHAP#chap456".to_string()),
        );
        // Missing content, template, created_at, chapter_status
        let result = Chapter::try_from(&item);
        assert!(result.is_err());
    }

    #[test]
    fn test_try_from_invalid_sk_format() {
        let mut item = HashMap::new();
        item.insert(
            "SK".to_string(),
            AttributeValue::S("INVALID_SK_FORMAT".to_string()),
        );
        item.insert(
            "content".to_string(),
            AttributeValue::S("content".to_string()),
        );
        item.insert(
            "template".to_string(),
            AttributeValue::S("template".to_string()),
        );
        item.insert(
            "created_at".to_string(),
            AttributeValue::S("date".to_string()),
        );
        item.insert(
            "chapter_status".to_string(),
            AttributeValue::S("Created".to_string()),
        );
        let result = Chapter::try_from(&item);
        assert!(result.is_err());
    }

    #[test]
    fn test_try_from_empty_placeholders() {
        let story_id = Uuid::new_v4().to_string();
        let chapter_id = Uuid::new_v4().to_string();

        let item = make_chapter_item(
            &story_id,
            &chapter_id,
            "Some content",
            "Some template",
            "2024-06-01T12:00:00Z",
            "Created",
            vec![],
        );
        let chapter = Chapter::try_from(&item).unwrap();
        assert!(chapter.placeholders.is_empty());
    }

    #[test]
    fn test_try_from_invalid_chapter_status() {
        let story_id = Uuid::new_v4().to_string();
        let chapter_id = Uuid::new_v4().to_string();

        let item = make_chapter_item(
            &story_id,
            &chapter_id,
            "Some content",
            "Some template",
            "2024-06-01T12:00:00Z",
            "INVALID_STATUS",
            vec![],
        );
        let result = Chapter::try_from(&item);
        assert!(result.is_err());
    }

    #[test]
    fn test_try_from_placeholders_with_missing_fields() {
        let story_id = Uuid::new_v4().to_string();
        let chapter_id = Uuid::new_v4().to_string();

        let mut item = make_chapter_item(
            &story_id,
            &chapter_id,
            "Some content",
            "Some template",
            "2024-06-01T12:00:00Z",
            "Created",
            vec![],
        );
        // Add a placeholder missing "text"
        let mut ph_map = HashMap::new();
        ph_map.insert("name".to_string(), AttributeValue::S("name1".to_string()));
        let ph_list = vec![AttributeValue::M(ph_map)];
        item.insert("placeholders".to_string(), AttributeValue::L(ph_list));
        let chapter = Chapter::try_from(&item).unwrap();
        // Should skip the invalid placeholder
        assert!(chapter.placeholders.is_empty());
    }
}
