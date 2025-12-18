use std::collections::HashMap;

use crate::models::{UserId, StoryId};
use crate::placeholders::{apply_template, validate_user_input_values};
use crate::spellchecker::check_spelling_with_template;
use crate::storage::{
    get_chapter_by_id, get_stories_by_user_id, get_story_with_chapters_by_id, store_chapter,
    store_story, store_user_input_for_chapter,
};

use crate::ai::{build_story_id, generate_new_chapter, generate_new_story};

use lambda_appsync::{appsync_operation, AppsyncError, AppsyncEvent, AppsyncIdentity, ID};
use unicode_segmentation::UnicodeSegmentation;

use crate::{
    Chapter, ChapterStatus, CheckTemplateError, CheckTemplateInput, CheckTemplatePayload,
    MistakeExplanation, Operation, Placeholder, StartStoryInput, StartStoryPayload, Story,
};

use uuid::Uuid;

#[appsync_operation(query(listStories), with_appsync_event)]
pub async fn list_stories(event: &AppsyncEvent<Operation>) -> Result<Vec<Story>, AppsyncError> {
    let user_id = extract_user_id(&event)?;
    let stories = get_stories_by_user_id(&user_id)
        .await
        .map_err(|e| AppsyncError::new("StorageReadError", e.to_string()))?;
    Ok(stories)
}

#[appsync_operation(query(fetchStoryById), with_appsync_event)]
pub async fn fetch_story_by_id(
    story_id: ID,
    event: &AppsyncEvent<Operation>,
) -> Result<Option<Story>, AppsyncError> {
    let user_id = extract_user_id(&event)?;

    Uuid::parse_str(&story_id.to_string())
        .map_err(|e| AppsyncError::new("InvalidStoryID", e.to_string()))?;

    let story = get_story_with_chapters_by_id(&user_id, &story_id.into())
        .await
        .map_err(|e| AppsyncError::new("StorageReadError", e.to_string()))?;
    Ok(story)
}

#[appsync_operation(mutation(startStory), with_appsync_event)]
pub async fn start_story(
    input: StartStoryInput,
    event: &AppsyncEvent<Operation>,
) -> Result<StartStoryPayload, AppsyncError> {
    let user_id = extract_user_id(&event)?;

    let story_id = build_story_id(&user_id, &input.client_request_id);
    let existing_story =
        get_story_with_chapters_by_id(&user_id, &StoryId(story_id.to_string().try_into().unwrap_or_default()))
            .await;

    match existing_story {
        Ok(Some(story)) => {
            println!(
                "Story already exists, returning existing story: {:?} for user: {:?}",
                story.story_id,
                user_id.to_string()
            );
            return Ok(StartStoryPayload {
                errors: vec![],
                story: Some(story),
            });
        }
        Ok(None) => {
            println!(
                "No existing story found, creating new story for user: {:?}",
                user_id.to_string()
            );

            let story = generate_new_story(&user_id, &input).await;

            match story {
                Ok(story) => {
                    let save_story_result =
                        store_story(story, &user_id, input.client_request_id, 0).await;

                    match save_story_result {
                        Ok(saved_story) => {
                            println!(
                                "Story saved successfully: {:?} for user {:?}",
                                saved_story.story_id,
                                user_id.to_string()
                            );

                            Ok(StartStoryPayload {
                                errors: vec![],
                                story: Some(saved_story),
                            })
                        }
                        Err(e) => {
                            println!(
                                "Error saving story: {:?} for user {:?}",
                                e,
                                user_id.to_string()
                            );

                            Err(AppsyncError::new("StorageWriteError", e.to_string()))
                        }
                    }
                }
                Err(e) => Err(AppsyncError::new("ModelError", e.to_string())),
            }
        }
        Err(e) => {
            return Err(AppsyncError::new("StorageReadError", e.to_string()));
        }
    }
}

#[appsync_operation(mutation(checkTemplate), with_appsync_event)]
pub async fn check_template(
    input: CheckTemplateInput,
    event: &AppsyncEvent<Operation>,
) -> Result<CheckTemplatePayload, AppsyncError> {
    let user_id = extract_user_id(&event)?;

    // check if there is a result for this request Id already - if so return it

    // 1. validate input values
    let validation_result = validate_user_input_values(&input.placeholders);

    if let Err(errors) = validation_result {
        let mistakes = errors
            .iter()
            .map(|e| MistakeExplanation {
                placeholder: Placeholder::new(&e.name, &e.text),
                explanation: e.message.clone(),
                hint: "".to_string(), // TODO add hint field to validation error
            })
            .collect();

        return Ok(CheckTemplatePayload::new(
            vec![CheckTemplateError {
                message: "Validation error".into(),
            }],
            mistakes,
            None,
        ));
    }

    // 2. get chapter by id, return error if not found
    let chapter = get_chapter_by_id(&user_id, &input.story_id, &input.chapter_id)
        .await
        .map_err(|e| AppsyncError::new("StorageReadError", e.to_string()))?;

    if chapter.is_none() {
        println!(
            "No existing chapter found for story: {:?}, chapter: {:?}, for user: {:?}",
            input.story_id, input.chapter_id, user_id
        );

        return Ok(CheckTemplatePayload::new(
            vec![CheckTemplateError {
                message: "Chapter not found".to_string(),
            }],
            vec![],
            None,
        ))
    }

    let chap = chapter.unwrap(); // safe unwrap after checking is_none above

    // 3. check if chapter is already completed
    if chap.status == ChapterStatus::Completed {
        return Ok(CheckTemplatePayload::new(
            vec![CheckTemplateError {
                message: "Chapter already completed".to_string(),
            }],
            vec![],
            None,
        ))
    }

    // 4. apply template with user input values
    let template_applied =
        apply_template(&chap.template, &input.placeholder_as_inputs());

    let story_opt =
        get_story_with_chapters_by_id(&user_id, &StoryId(input.story_id))
            .await
            .map_err(|e| AppsyncError::new("StorageReadError", e.to_string()))?;

    if story_opt.is_none() {
        println!(
            "No existing story found for story id: {:?} and user id: {:?}", input.story_id, user_id
        );
                
        return Ok(CheckTemplatePayload::new(
            vec![CheckTemplateError {
                message: "Story not found".to_string(),
            }],
            vec![],
            None,
        ));
    }

    let story = story_opt.unwrap(); // safe unwrap after checking is_none above

    // 5. check spelling with default checker first
    let spelling_errors = check_spelling_with_template(
        &chap.template,
        &template_applied,
        &story.target_language,
    )
    .await
    .map_err(|e| AppsyncError::new("SpellCheckError", e.to_string()))?;

    // TODO check if the text does make sense in the target language with a model call

    let placeholder_map: HashMap<String, String> = chap
        .placeholders
        .iter()
        .map(|p| (p.name.clone(), p.text.clone()))
        .collect();

    let mistakes: Vec<MistakeExplanation> = spelling_errors
        .into_iter()
        .map(|(ph, mistake)| MistakeExplanation {
            placeholder: input
                .placeholders
                .iter()
                .find(|p| p.name == ph)
                .map(|p| Placeholder {
                    name: p.name.clone(),
                    text: p.text.clone(),
                })
                .unwrap(),
            // TODO this has to be in the explain language
            // TODO add hint for the expected word with number of letters
            explanation: mistake.mistake_type,
            // TODO it could also be part of the word - have to think about that (change message)
            hint: format!(
                "Expected word with {} letters",
                placeholder_map
                    .get(ph.as_str())
                    .map(|v| UnicodeSegmentation::graphemes(v.as_str(), true).count())
                    .unwrap_or(0)
            ),
        })
        .collect();

    // 6. if no mistakes, store user input and generate next chapter for the story
    let next_chapter: Option<Chapter> = if mistakes.is_empty() {
        // TODO think about partial failure handling here (transaction or saga pattern)
        let input_stored = store_user_input_for_chapter(
            &user_id,
            &input.story_id.into(),
            &input.chapter_id.into(),
            &input.client_request_id.into(),
            &input.placeholders,
        )
        .await;

        match input_stored {
            Ok(_) => {
                println!("Stored final placeholders for chapter: {:?} of story: {:?} for user: {:?}", 
                    input.chapter_id, input.story_id, user_id);

                // iterate over all chapters and apply the user input placeholders to each chapter content
                // then merge all chapter contents into one string

                let chapters_merged: String = story
                    .chapters
                    .iter()
                    .map(|c| apply_template(&c.template, &c.user_input))
                    .collect::<Vec<String>>()
                    .join(" ");

                let next_chapter = generate_new_chapter(
                    &chapters_merged,
                    &story.target_language,
                    &story.story_id,
                )
                .await
                .map_err(|e| AppsyncError::new("ModelError", e.to_string()))?;

                println!(
                    "Generated next chapter for story: {:?}, chapter: {:?}",
                    story.story_id, next_chapter.chapter_id
                );

                store_chapter(&user_id, &next_chapter).await.map_err(|e| {
                    AppsyncError::new("StorageWriteError", e.to_string())
                })?;

                println!(
                    "Stored next chapter for story: {:?}, chapter: {:?}",
                    story.story_id, next_chapter.chapter_id
                );
                Some(next_chapter)
            }
            Err(e) => {
                println!("Error storing final placeholders for chapter: {:?} of story: {:?} for user: {:?}, error: {:?}", 
                    input.chapter_id, input.story_id, user_id, e);
                None
            }
        }
    } else {
        None
    };

    Ok(CheckTemplatePayload::new(vec![], mistakes, next_chapter))
}

// Cannot use ID here because of Google auth specific ID format.
fn extract_user_id(event: &AppsyncEvent<Operation>) -> Result<UserId, AppsyncError> {
    match &event.identity {
        AppsyncIdentity::Cognito(appsync_identity_cognito) => {
            Ok(appsync_identity_cognito.sub.clone().into())
        }
        _ => Err(AppsyncError::new("Unauthorized", "Invalid identity")),
    }
}
