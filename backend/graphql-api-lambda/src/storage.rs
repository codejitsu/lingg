use crate::{
    Chapter, ChapterStatus, LanguageName, Story, StoryType, UserInputValueInput, dynamodb, models::User
};

use aws_sdk_dynamodb::types::{AttributeValue, TransactWriteItem, Update};
use lambda_appsync::ID;

use std::collections::HashMap;

#[derive(Debug)]
pub struct StorageError(String);
impl std::fmt::Display for StorageError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Storage error: {}", self.0)
    }
}
impl std::error::Error for StorageError {}
impl From<&str> for StorageError {
    fn from(value: &str) -> Self {
        StorageError(value.to_string())
    }
}

pub struct StoryId(pub ID);
pub struct ChapterId(pub ID);
pub struct ClientRequestId(pub ID);

fn table_name() -> String {
    let table_name = std::env::var("BACKEND_TABLE_NAME")
        .expect("Mandatory environment variable `BACKEND_TABLE_NAME` is not set");
    log::debug!("BACKEND_TABLE_NAME={table_name}");
    table_name
}

fn string_to_language_name(lang: &str) -> Option<LanguageName> {
    match lang {
        "English" => Some(LanguageName::English),
        "Spanish" => Some(LanguageName::Spanish),
        "French" => Some(LanguageName::French),
        "German" => Some(LanguageName::German),
        "Russian" => Some(LanguageName::Russian),
        "Ukrainian" => Some(LanguageName::Ukrainian),
        _ => None,
    }
}

fn string_to_story_type(story_type: &str) -> Option<StoryType> {
    match story_type {
        "Adventure" => Some(StoryType::Adventure),
        "Animals" => Some(StoryType::Animals),
        "BedtimeStory" => Some(StoryType::BedtimeStory),
        "Fantasy" => Some(StoryType::Fantasy),
        "FairyTales" => Some(StoryType::FairyTales),
        "Pirates" => Some(StoryType::Pirates),
        "SciFi" => Some(StoryType::SciFi),
        "Superheroes" => Some(StoryType::Superheroes),
        _ => None,
    }
}

pub async fn get_stories_by_user_id(user_id: &User) -> Result<Vec<Story>, StorageError> {
    let client = dynamodb();
    let table_name = table_name();

    let items = client
        .query()
        .table_name(&table_name)
        .key_condition_expression("PK = :pk")
        .expression_attribute_values(
            ":pk",
            AttributeValue::S(format!("USER#{}", user_id.to_string())),
        )
        .send()
        .await;

    match items {
        Ok(output) => {
            if let Some(items) = output.items {
                let mut stories: HashMap<String, Story> = HashMap::new();
                let mut chapters: HashMap<String, Vec<Chapter>> = HashMap::new();

                for item in items {
                    let sk = item.get("SK").and_then(|v| v.as_s().ok()).unwrap();

                    if sk.starts_with("STORY#") && sk.ends_with("#META") {
                        let story_id = sk.trim_start_matches("STORY#").trim_end_matches("#META");
                        let title = item.get("title").and_then(|v| v.as_s().ok()).unwrap();
                        let target_language = item
                            .get("target_language")
                            .and_then(|v| v.as_s().ok())
                            .unwrap();
                        let explain_language = item
                            .get("explain_language")
                            .and_then(|v| v.as_s().ok())
                            .unwrap();
                        let story_type =
                            item.get("story_type").and_then(|v| v.as_s().ok()).unwrap();
                        let started_at =
                            item.get("started_at").and_then(|v| v.as_s().ok()).unwrap();

                        stories.insert(
                            story_id.to_string(),
                            Story {
                                story_id: ID::try_from(story_id.to_string()).unwrap(),
                                target_language: string_to_language_name(target_language)
                                    .unwrap_or(LanguageName::English),
                                explain_language: string_to_language_name(explain_language)
                                    .unwrap_or(LanguageName::English),
                                story_type: string_to_story_type(story_type)
                                    .unwrap_or(StoryType::Superheroes),
                                started_at: started_at.to_string().into(),
                                title: title.to_string().into(),
                                chapters: vec![],
                            },
                        );
                    } else if sk.contains("#CHAP#") {
                        // chapter
                        let chapter = Chapter::try_from(&item)?;

                        if let Some(chapters_for_story) =
                            chapters.get_mut(&chapter.story_id.to_string())
                        {
                            chapters_for_story.push(chapter);
                        } else {
                            chapters.insert(chapter.story_id.to_string(), vec![chapter]);
                        }
                    }
                }

                stories.iter_mut().for_each(|(story_id, story)| {
                    if let Some(chaps) = chapters.get(story_id) {
                        story.chapters = chaps.clone();
                    }
                });

                Ok(stories.into_values().collect())
            } else {
                Ok(Vec::new())
            }
        }
        Err(e) => Err(StorageError(e.to_string())),
    }
}

pub async fn get_story_with_chapters_by_id(
    user_id: &User,
    story_id: &StoryId,
) -> Result<Option<Story>, StorageError> {
    let client = dynamodb();
    let table_name = table_name();

    let items = client
        .query()
        .table_name(&table_name)
        .key_condition_expression("PK = :pk AND begins_with(SK, :sk_prefix)")
        .expression_attribute_values(
            ":pk",
            AttributeValue::S(format!("USER#{}", user_id.to_string())),
        )
        .expression_attribute_values(
            ":sk_prefix",
            AttributeValue::S(format!("STORY#{}#", story_id.0.to_string())),
        )
        .send()
        .await;

    match items {
        Ok(output) => {
            if let Some(items) = output.items {
                if items.is_empty() {
                    return Ok(None);
                }

                let mut story_meta_opt: Option<Story> = None;
                let mut chapters: Vec<Chapter> = vec![];

                let meta_sk = format!("STORY#{}#META", story_id.0.to_string());

                for item in items {
                    let sk = item.get("SK").and_then(|v| v.as_s().ok()).unwrap();

                    if *sk == meta_sk {
                        // This is the story metadata
                        // TODO address all unwrap calls here
                        let title = item.get("title").and_then(|v| v.as_s().ok()).unwrap();
                        let target_language = item
                            .get("target_language")
                            .and_then(|v| v.as_s().ok())
                            .unwrap();
                        let explain_language = item
                            .get("explain_language")
                            .and_then(|v| v.as_s().ok())
                            .unwrap();
                        let story_type =
                            item.get("story_type").and_then(|v| v.as_s().ok()).unwrap();
                        let started_at =
                            item.get("started_at").and_then(|v| v.as_s().ok()).unwrap();

                        story_meta_opt = Some(Story {
                            story_id: ID::try_from(story_id.0.to_string()).unwrap(),
                            target_language: string_to_language_name(target_language)
                                .unwrap_or(LanguageName::English),
                            explain_language: string_to_language_name(explain_language)
                                .unwrap_or(LanguageName::English),
                            story_type: string_to_story_type(story_type)
                                .unwrap_or(StoryType::Superheroes),
                            started_at: started_at.to_string().into(),
                            title: title.to_string().into(),
                            chapters: vec![],
                        });
                    } else {
                        // This is a chapter
                        let chapter = Chapter::try_from(&item)?;

                        chapters.push(chapter);
                    }
                }

                if let (Some(story_meta), chapters) = (story_meta_opt, chapters) {
                    let story = Story {
                        chapters,
                        ..story_meta
                    };

                    Ok(Some(story))
                } else {
                    Ok(None)
                }
            } else {
                Ok(None)
            }
        }
        Err(e) => Err(StorageError(e.to_string())),
    }
}

// Querying chapter by id:
// PK = USER#<user_id>
// SK = STORY#<story_id>#CHAP#<chapter_id>
pub async fn get_chapter_by_id(
    user_id: &User,
    story_id: &ID,
    chapter_id: &ID,
) -> Result<Option<Chapter>, StorageError> {
    let client = dynamodb();
    let table_name = table_name();

    let sk = format!(
        "STORY#{}#CHAP#{}",
        story_id.to_string(),
        chapter_id.to_string()
    );

    let item = client
        .get_item()
        .table_name(&table_name)
        .key(
            "PK",
            AttributeValue::S(format!("USER#{}", user_id.to_string())),
        )
        .key("SK", AttributeValue::S(sk))
        .send()
        .await;

    match item {
        Ok(output) => {
            if let Some(item) = output.item {
                let chapter = Chapter::try_from(&item)?;

                Ok(Some(chapter))
            } else {
                Ok(None)
            }
        }
        Err(e) => Err(StorageError(e.to_string())),
    }
}

// User -> [Story]
// Story -> [Chapter]
//
// Querying all stories for a user:
// PK = USER#<user_id>
// SK = begins_with(STORY#<story_id>#)
//
// Querying all chapters for a story:
// PK = USER#<user_id>
// SK = begins_with(STORY#<story_id>#CHAP#)
//
// PK = USER#<user_id>
// SK = STORY#<story_id>#CHAP#<chapter_id>
pub async fn store_story(
    story: Story,
    user_id: &User,
    client_request_id: ID,
    chapter_index: usize,
) -> Result<Story, StorageError> {
    let client = dynamodb();
    let table_name = table_name();

    // 1. Add story to the user partition
    // PK = USER#<user_id>
    // SK = STORY#<story_id>#META
    // Attributes:
    //  title
    //  user_id
    //  client_request_id
    //  target_language
    //  explain_language
    //  story_type
    //  started_at

    let user_story = Update::builder()
        .table_name(&table_name)
        .key("PK", AttributeValue::S(format!("USER#{}", user_id)))
        .key(
            "SK",
            AttributeValue::S(format!("STORY#{}#META", story.story_id)),
        )
        .update_expression(
            "SET 
            title = :title, 
            user_id = :user_id, 
            client_request_id = :client_request_id, 
            target_language = :target_language, 
            explain_language = :explain_language, 
            story_type = :story_type, 
            started_at = :started_at",
        )
        .expression_attribute_values(":title", AttributeValue::S(story.title.clone()))
        .expression_attribute_values(":user_id", AttributeValue::S(user_id.to_string()))
        .expression_attribute_values(
            ":client_request_id",
            AttributeValue::S(client_request_id.to_string()),
        )
        .expression_attribute_values(
            ":target_language",
            AttributeValue::S(story.target_language.to_string()),
        )
        .expression_attribute_values(
            ":explain_language",
            AttributeValue::S(story.explain_language.to_string()),
        )
        .expression_attribute_values(
            ":story_type",
            AttributeValue::S(story.story_type.to_string()),
        )
        .expression_attribute_values(
            ":started_at",
            AttributeValue::S(story.started_at.to_string()),
        )
        .condition_expression("attribute_not_exists(PK) OR client_request_id = :client_request_id")
        .build();

    // 2. add chapters
    // PK = USER#<user_id>
    // SK = STORY#<story_id>#CHAP#<chapter_id>
    let story_chapter = Update::builder()
        .table_name(&table_name)
        .key("PK", AttributeValue::S(format!("USER#{}", user_id)))
        .key(
            "SK",
            AttributeValue::S(format!(
                "STORY#{}#CHAP#{}",
                story.story_id, story.chapters[chapter_index].chapter_id
            )),
        )
        .update_expression(
            "SET 
            content = :content, 
            created_at = :created_at,
            placeholders = :placeholders,
            user_input = :user_input,
            template = :template,
            chapter_status = :chapter_status",
        )
        .expression_attribute_values(
            ":chapter_status",
            AttributeValue::S(story.chapters[chapter_index].status.to_string()),
        )
        .expression_attribute_values(
            ":content",
            AttributeValue::S(story.chapters[chapter_index].content.clone()),
        )
        .expression_attribute_values(
            ":created_at",
            AttributeValue::S(story.chapters[chapter_index].created_at.to_string()),
        )
        .expression_attribute_values(
            ":placeholders",
            AttributeValue::L(
                story.chapters[chapter_index]
                    .placeholders
                    .iter()
                    .map(|p| {
                        AttributeValue::M(
                            vec![
                                ("name".into(), AttributeValue::S(p.name.clone())),
                                ("text".into(), AttributeValue::S(p.text.clone())),
                            ]
                            .into_iter()
                            .collect(),
                        )
                    })
                    .collect(),
            ),
        )
        .expression_attribute_values(
            ":user_input",
            AttributeValue::L(
                story.chapters[chapter_index]
                    .user_input
                    .iter()
                    .map(|p| {
                        AttributeValue::M(
                            vec![
                                ("name".into(), AttributeValue::S(p.name.clone())),
                                ("text".into(), AttributeValue::S(p.text.clone())),
                            ]
                            .into_iter()
                            .collect(),
                        )
                    })
                    .collect(),
            ),
        )
        .expression_attribute_values(
            ":template",
            AttributeValue::S(story.chapters[chapter_index].template.clone()),
        )
        .condition_expression("attribute_not_exists(PK)")
        .build();

    let tx = client
        .transact_write_items()
        .set_transact_items(Some(vec![
            TransactWriteItem::builder()
                .update(user_story.unwrap())
                .build(),
            TransactWriteItem::builder()
                .update(story_chapter.unwrap())
                .build(),
        ]))
        .send()
        .await;

    match tx {
        Ok(_) => Ok(story),
        Err(e) => Err(StorageError(e.to_string())),
    }
}

// Just update the only user_input field of the chapter
// PK = USER#<user_id>
// SK = STORY#<story_id>#CHAP#<chapter_id>
pub async fn store_user_input_for_chapter(
    user_id: &User,
    story_id: &StoryId,
    chapter_id: &ChapterId,
    _client_request_id: &ClientRequestId,
    user_input: &Vec<UserInputValueInput>,
) -> Result<(), StorageError> {
    let client = dynamodb();
    let table_name = table_name();

    let sk = format!(
        "STORY#{}#CHAP#{}",
        story_id.0.to_string(),
        chapter_id.0.to_string()
    );

    let update = client
        .update_item()
        .table_name(&table_name)
        .key(
            "PK",
            AttributeValue::S(format!("USER#{}", user_id.to_string())),
        )
        .key("SK", AttributeValue::S(sk))
        .update_expression("SET user_input = :user_input, chapter_status = :chapter_status, completed_at = :completed_at")
        .expression_attribute_values(
            ":chapter_status",
            AttributeValue::S(ChapterStatus::Completed.to_string()),
        )
        .expression_attribute_values(
            ":completed_at",
            AttributeValue::S(chrono::Utc::now().to_rfc3339()),
        )
        .expression_attribute_values(
            ":user_input",
            AttributeValue::L(
                user_input
                    .iter()
                    .map(|p| {
                        AttributeValue::M(
                            vec![
                                ("name".into(), AttributeValue::S(p.name.clone())),
                                ("text".into(), AttributeValue::S(p.text.clone())),
                            ]
                            .into_iter()
                            .collect(),
                        )
                    })
                    .collect(),
            ),
        )
        .condition_expression("attribute_exists(PK) AND attribute_exists(SK)")
        .send()
        .await;

    match update {
        Ok(_) => Ok(()),
        Err(e) => Err(StorageError(e.to_string())),
    }
}

pub async fn store_chapter(user_id: &User, chapter: &Chapter) -> Result<(), StorageError> {
    let client = dynamodb();
    let table_name = table_name();

    let sk = format!(
        "STORY#{}#CHAP#{}",
        chapter.story_id.to_string(),
        chapter.chapter_id.to_string()
    );

    // PK = USER#<user_id>
    // SK = STORY#<story_id>#CHAP#<chapter_id>
    let put = client
        .put_item()
        .table_name(&table_name)
        .item("PK", AttributeValue::S(format!("USER#{}", user_id.to_string())))
        .item("SK", AttributeValue::S(sk))
        .item(
            "chapter_status",
            AttributeValue::S(chapter.status.to_string()),
        )
        .item("content", AttributeValue::S(chapter.content.clone()))
        .item(
            "created_at",
            AttributeValue::S(chapter.created_at.to_string()),
        )
        .item(
            "placeholders",
            AttributeValue::L(
                chapter
                    .placeholders
                    .iter()
                    .map(|p| {
                        AttributeValue::M(
                            vec![
                                ("name".into(), AttributeValue::S(p.name.clone())),
                                ("text".into(), AttributeValue::S(p.text.clone())),
                            ]
                            .into_iter()
                            .collect(),
                        )
                    })
                    .collect(),
            ),
        )
        .item(
            "user_input",
            AttributeValue::L(
                chapter
                    .user_input
                    .iter()
                    .map(|p| {
                        AttributeValue::M(
                            vec![
                                ("name".into(), AttributeValue::S(p.name.clone())),
                                ("text".into(), AttributeValue::S(p.text.clone())),
                            ]
                            .into_iter()
                            .collect(),
                        )
                    })
                    .collect(),
            ),
        )
        .item("template", AttributeValue::S(chapter.template.clone()))
        .item(
            "completed_at",
            match &chapter.completed_at {
                Some(val) => AttributeValue::S(val.to_string()),
                None => AttributeValue::Null(true),
            },
        )
        .condition_expression("attribute_not_exists(SK)")
        .send()
        .await;

    match put {
        Ok(_) => Ok(()),
        Err(e) => Err(StorageError(e.to_string())),
    }
}
