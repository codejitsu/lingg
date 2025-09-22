use crate::placeholders::apply_template;
use crate::storage::{
    get_chapter_by_id, get_stories_by_user_id, get_story_with_chapters_by_id, save_story_to_db,
};

use crate::ai::{build_story_id, generate_new_story};

use lambda_appsync::{appsync_operation, AppsyncError, AppsyncEvent, ID};

use crate::{
    CheckTemplateError, CheckTemplateInput, CheckTemplatePayload, Operation, StartStoryInput, StartStoryPayload, Story
};

use uuid::Uuid;

#[appsync_operation(query(listStories), with_appsync_event)]
pub async fn list_stories(
    user_id: ID,
    _event: &AppsyncEvent<Operation>,
) -> Result<Vec<Story>, AppsyncError> {
    let stories = get_stories_by_user_id(&user_id)
        .await
        .map_err(|e| AppsyncError::new("StorageReadError", e.to_string()))?;
    Ok(stories)
}

#[appsync_operation(query(fetchStoryById), with_appsync_event)]
pub async fn fetch_story_by_id(
    user_id: ID,
    story_id: ID,
    _event: &AppsyncEvent<Operation>,
) -> Result<Option<Story>, AppsyncError> {
    let story_uuid = Uuid::parse_str(&story_id.to_string())
        .map_err(|e| AppsyncError::new("InvalidStoryID", e.to_string()))?;
    let story = get_story_with_chapters_by_id(&user_id, story_uuid)
        .await
        .map_err(|e| AppsyncError::new("StorageReadError", e.to_string()))?;
    Ok(story)
}

#[appsync_operation(mutation(startStory), with_appsync_event)]
pub async fn start_story(
    input: StartStoryInput,
    _event: &AppsyncEvent<Operation>,
) -> Result<StartStoryPayload, AppsyncError> {
    let story_id = build_story_id(&input.user_id, &input.client_request_id);
    let existing_story = get_story_with_chapters_by_id(&input.user_id, story_id).await;

    match existing_story {
        Ok(Some(story)) => {
            println!(
                "Story already exists, returning existing story: {:?} for user: {:?}",
                story.story_id, input.user_id
            );
            return Ok(StartStoryPayload {
                errors: vec![],
                story: Some(story),
            });
        }
        Ok(None) => {
            println!(
                "No existing story found, creating new story for user: {:?}",
                input.user_id
            );

            let story = generate_new_story(&input).await;

            match story {
                Ok(story) => {
                    let save_story_result =
                        save_story_to_db(story, input.user_id, input.client_request_id, 0).await;

                    match save_story_result {
                        Ok(saved_story) => {
                            println!(
                                "Story saved successfully: {:?} for user {:?}",
                                saved_story.story_id, input.user_id
                            );

                            Ok(StartStoryPayload {
                                errors: vec![],
                                story: Some(saved_story),
                            })
                        }
                        Err(e) => {
                            println!("Error saving story: {:?} for user {:?}", e, input.user_id);

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
    _event: &AppsyncEvent<Operation>,
) -> Result<CheckTemplatePayload, AppsyncError> {
    // check if there is a result for this request Id already - if so return it

    let chapter = get_chapter_by_id(&input.user_id, &input.story_id, &input.chapter_id).await;

    match chapter {
        Ok(Some(chap)) => {
            let template_applied = apply_template(&chap.template, &input.placeholders);

            return Ok(CheckTemplatePayload {
                errors: vec![],
                mistakes: vec![],
            });
        }
        Ok(None) => {
            println!(
                "No existing chapter found for story: {:?}, chapter: {:?}, for user: {:?}",
                input.story_id, input.chapter_id, input.user_id
            );

            return Ok(CheckTemplatePayload {
                errors: vec![CheckTemplateError {
                    message: "Chapter not found".to_string(),
                }],
                mistakes: vec![],
            });
        }
        Err(e) => {
            return Err(AppsyncError::new("StorageReadError", e.to_string()));
        }
        
    }
}
