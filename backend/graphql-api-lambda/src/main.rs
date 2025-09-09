mod placeholders;

use std::collections::HashMap;
use std::vec;

use aws_config::BehaviorVersion;
use aws_config::Region;
use aws_sdk_bedrockruntime::error::SdkError;
use aws_sdk_bedrockruntime::operation::converse::{ConverseError, ConverseOutput};
use aws_sdk_bedrockruntime::types::{ContentBlock, ConversationRole, Message};
use aws_sdk_bedrockruntime::Client;
use aws_sdk_dynamodb::types::AttributeValue;
use aws_sdk_dynamodb::types::TransactWriteItem;
use aws_sdk_dynamodb::types::Update;
use lambda_appsync::appsync_lambda_main;
use lambda_appsync::ID;
use lambda_appsync::{appsync_operation, AppsyncError, AppsyncEvent};
use placeholders::replace_parts_of_words;
use uuid::Uuid;

#[derive(Debug)]
struct BedrockConverseError(String);
impl std::fmt::Display for BedrockConverseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Can't invoke model. Reason: {}", self.0)
    }
}
impl std::error::Error for BedrockConverseError {}
impl From<&str> for BedrockConverseError {
    fn from(value: &str) -> Self {
        BedrockConverseError(value.to_string())
    }
}
impl From<&ConverseError> for BedrockConverseError {
    fn from(value: &ConverseError) -> Self {
        BedrockConverseError::from(match value {
            ConverseError::ModelTimeoutException(_) => "Model took too long",
            ConverseError::ModelNotReadyException(_) => "Model is not ready",
            _ => "Unknown",
        })
    }
}

// Generate types and runtime setup from schema
appsync_lambda_main!(
    "schema.graphql",
    // Initialize DynamoDB client if needed
    dynamodb() -> aws_sdk_dynamodb::Client,
    batch = false
);

#[appsync_operation(query(listStories), with_appsync_event)]
async fn list_stories(
    user_id: ID,
    _event: &AppsyncEvent<Operation>,
) -> Result<Vec<Story>, AppsyncError> {
    let stories = get_stories_by_user_id(&user_id)
        .await
        .map_err(|e| AppsyncError::new("StorageReadError", e.to_string()))?;
    Ok(stories)
}

#[appsync_operation(mutation(startStory), with_appsync_event)]
async fn start_story(
    args: StartStoryArguments,
    _event: &AppsyncEvent<Operation>,
) -> Result<Story, AppsyncError> {
    let aws_region = env::var("REGION").unwrap();
    let bedrock_model_id = env::var("BEDROCK_MODEL_ID").unwrap();

    let story_id = build_story_id(&args.user_id, &args.client_request_id);
    let existing_story = get_story_with_chapters_by_id(&args.user_id, story_id).await;

    match existing_story {
        Ok(Some(story)) => {
            println!("Story already exists, returning existing story");
            return Ok(story);
        }
        Ok(None) => {
            println!("No existing story found, creating new story");

            println!("Using Bedrock model ID: {}", bedrock_model_id);

            let sdk_config = aws_config::defaults(BehaviorVersion::latest())
                .region(Region::new(aws_region))
                .load()
                .await;

            let client = Client::new(&sdk_config);

            let message = format!(
                "Create a story in {}. The story should be about {}. The length of the story should be around 100 words.
                Don't use any swear words or adult content.
                The story should be not finalized, so we can iterate further. Don't include anyting like 'The End' or 'To be continued'.
                Dont include any new lines or line breaks. Return the story in the following format: <story-title>|<story-content>
                
                Example: My Adventure|Once upon a time...",
                args.target_language, args.story_type
            );

            let story = client
                .converse()
                .model_id(bedrock_model_id)
                .messages(
                    Message::builder()
                        .role(ConversationRole::User)
                        .content(ContentBlock::Text(message.to_string()))
                        .build()
                        .unwrap(),
                )
                .send()
                .await
                .and_then(|output| process_model_output(output, &args))
                .map_err(|e| AppsyncError::new("ModelError", e.to_string()));

            match story {
                Ok(story) => save_story_to_db(story, args.user_id, args.client_request_id, 0)
                    .await
                    .map_err(|e| AppsyncError::new("StorageWriteError", e.to_string())),
                Err(e) => Err(e),
            }
        }
        Err(e) => {
            return Err(AppsyncError::new("StorageReadError", e.to_string()));
        }
    }
}

fn process_model_output(
    output: ConverseOutput,
    args: &StartStoryArguments,
) -> Result<Story, SdkError<ConverseError>> {
    let text_with_title = get_converse_output_text(output).unwrap();

    let parts: Vec<&str> = text_with_title.splitn(2, '|').collect();
    let text = if parts.len() == 2 {
        parts[1].trim().to_string()
    } else {
        text_with_title.trim().to_string()
    };

    let title = if parts.len() == 2 {
        parts[0].trim().to_string()
    } else {
        "My Story".to_string()
    };

    let story_id = build_story_id(&args.user_id, &args.client_request_id);
    let chapter_id = Uuid::now_v7();

    let (template, placeholder_map) = replace_parts_of_words(&text, 0.3);

    let placeholders: Vec<Placeholder> = placeholder_map
        .iter()
        .map(|(key, value)| Placeholder {
            name: key.clone(),
            text: value.clone(),
        })
        .collect();

    let chapter = Chapter {
        chapter_id: ID::try_from(chapter_id.to_string()).unwrap(),
        story_id: ID::try_from(story_id.to_string()).unwrap(),
        content: text,
        template: template,
        created_at: chrono::Utc::now().to_rfc3339().into(),
        placeholders,
    };

    let story = Story {
        user_id: ID::try_from(args.user_id.to_string()).unwrap(),
        story_id: ID::try_from(story_id.to_string()).unwrap(),
        target_language: args.target_language,
        explain_language: args.explain_language,
        story_type: args.story_type,
        started_at: chrono::Utc::now().to_rfc3339().into(),
        title: title.into(),
        chapters: vec![chapter],
    };

    Ok(story)
}

fn build_story_id(user_id: &ID, client_request_id: &ID) -> Uuid {
    let namespace = Uuid::new_v5(&Uuid::NAMESPACE_OID, user_id.as_bytes());
    Uuid::new_v5(&namespace, client_request_id.as_bytes())
}

async fn get_stories_by_user_id(user_id: &ID) -> Result<Vec<Story>, BedrockConverseError> {
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
                                user_id: user_id.clone(),
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
                        let story_id = sk.split("#").nth(1).unwrap();
                        let chapter_id = sk.split("#").nth(3).unwrap();

                        let content = item.get("content").and_then(|v| v.as_s().ok()).unwrap();

                        let template = item.get("template").and_then(|v| v.as_s().ok()).unwrap();
                        let created_at =
                            item.get("created_at").and_then(|v| v.as_s().ok()).unwrap();

                        let placeholders = if let Some(attr) = item.get("placeholders") {
                            if let Ok(list) = attr.as_l() {
                                list.iter()
                                    .filter_map(|v| v.as_m().ok())
                                    .filter_map(|m| {
                                        let name = m.get("name").and_then(|v| v.as_s().ok())?;
                                        let text = m.get("text").and_then(|v| v.as_s().ok())?;
                                        Some(Placeholder {
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

                        let chapter = Chapter {
                            chapter_id: ID::try_from(chapter_id.to_string()).unwrap(),
                            story_id: ID::try_from(story_id.to_string()).unwrap(),
                            content: content.to_string().into(),
                            template: template.to_string().into(),
                            created_at: created_at.to_string().into(),
                            placeholders,
                        };

                        if let Some(chapters_for_story) = chapters.get_mut(&story_id.to_string()) {
                            chapters_for_story.push(chapter);
                        } else {
                            chapters.insert(story_id.to_string(), vec![chapter]);
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
        Err(e) => Err(BedrockConverseError(e.to_string())),
    }
}

fn get_converse_output_text(output: ConverseOutput) -> Result<String, BedrockConverseError> {
    let text = output
        .output()
        .ok_or("no output")?
        .as_message()
        .map_err(|_| "output not a message")?
        .content()
        .first()
        .ok_or("no content in message")?
        .as_text()
        .map_err(|_| "content is not text")?
        .to_string();
    Ok(text)
}

async fn get_story_with_chapters_by_id(
    user_id: &ID,
    story_id: Uuid,
) -> Result<Option<Story>, BedrockConverseError> {
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
            AttributeValue::S(format!("STORY#{}#", story_id.to_string())),
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

                let meta_sk = format!("STORY#{}#META", story_id.to_string());

                for item in items {
                    let sk = item.get("SK").and_then(|v| v.as_s().ok()).unwrap();

                    if *sk == meta_sk {
                        // This is the story metadata
                        let user_id = item.get("user_id").and_then(|v| v.as_s().ok()).unwrap();
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
                            user_id: ID::try_from(user_id.to_string()).unwrap(),
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
                        });
                    } else {
                        // This is a chapter
                        let chapter_id = sk.trim_start_matches(
                            format!("STORY#{}#CHAP#", story_id.to_string()).as_str(),
                        );
                        let content = item.get("content").and_then(|v| v.as_s().ok()).unwrap();
                        let template = item.get("template").and_then(|v| v.as_s().ok()).unwrap();
                        let created_at =
                            item.get("created_at").and_then(|v| v.as_s().ok()).unwrap();

                        let placeholders = if let Some(attr) = item.get("placeholders") {
                            if let Ok(list) = attr.as_l() {
                                list.iter()
                                    .filter_map(|v| v.as_m().ok())
                                    .filter_map(|m| {
                                        let name = m.get("name").and_then(|v| v.as_s().ok())?;
                                        let text = m.get("text").and_then(|v| v.as_s().ok())?;
                                        Some(Placeholder {
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

                        chapters.push(Chapter {
                            chapter_id: ID::try_from(chapter_id.to_string()).unwrap(),
                            story_id: ID::try_from(story_id.to_string()).unwrap(),
                            content: content.to_string(),
                            template: template.to_string(),
                            created_at: created_at.to_string().into(),
                            placeholders,
                        });
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
        Err(e) => Err(BedrockConverseError(e.to_string())),
    }
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
async fn save_story_to_db(
    story: Story,
    user_id: ID,
    client_request_id: ID,
    chapter_index: usize,
) -> Result<Story, BedrockConverseError> {
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
            template = :template",
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
        Err(e) => Err(BedrockConverseError(e.to_string())),
    }
}

pub fn table_name() -> String {
    let table_name = std::env::var("BACKEND_TABLE_NAME")
        .expect("Mandatory environment variable `BACKEND_TABLE_NAME` is not set");
    log::debug!("BACKEND_TABLE_NAME={table_name}");
    table_name
}
