use std::collections::HashMap;

use crate::LanguageName;
use languagetool_rust::api::{
    check::{self, Response},
    server::ServerClient,
};
use unicode_segmentation::UnicodeSegmentation;
#[derive(Debug)]
pub struct Mistake {
    pub related_placeholder: String,
    pub mistake_type: String,
    pub mistake_description: String,
}

impl Mistake {
    pub fn new(
        related_placeholder: String,
        mistake_type: String,
        mistake_description: String,
    ) -> Self {
        Self {
            related_placeholder,
            mistake_type,
            mistake_description,
        }
    }
}

async fn check_spelling(
    text: &str,
    language: &LanguageName,
) -> Result<Response, Box<dyn std::error::Error>> {
    let client = ServerClient::from_env_or_default();

    let language_code = match language {
        LanguageName::English => "en-US".to_string(),
        LanguageName::Spanish => "es".to_string(),
        LanguageName::French => "fr".to_string(),
        LanguageName::German => "de-DE".to_string(),
        LanguageName::Russian => "ru-RU".to_string(),
        LanguageName::Ukrainian => "uk-UA".to_string(),
    };

    let req = check::Request::default()
        .with_text(text)
        .with_language(language_code);

    let resp = client.check(&req).await;

    match resp {
        Ok(result) => Ok(result),
        Err(err) => {
            eprintln!("Error checking spelling: {}", err);
            Err(Box::new(err))
        }
    }
}

pub async fn check_spelling_with_template(
    template: &str,
    template_applied: &str,
    target_language: &LanguageName,
) -> Result<HashMap<String, Mistake>, Box<dyn std::error::Error>> {
    let resp = check_spelling(template_applied, target_language).await?;

    let mut placeholder_mistakes: HashMap<String, Mistake> = HashMap::new();

    // Split template and template_applied into grapheme clusters (words)
    let template_words: Vec<&str> = template.split_whitespace().collect();
    let applied_words: Vec<&str> = template_applied.split_whitespace().collect();

    // Map index to (chunk, is_placeholder) for template
    let mut index_to_chunk: HashMap<usize, (&str, bool)> = HashMap::new();
    for (i, chunk) in template_words.iter().enumerate() {
        let is_placeholder = chunk.contains('{') && chunk.contains('}') && chunk.contains("ph-");
        index_to_chunk.insert(i, (*chunk, is_placeholder));
    }

    // Map index to chunk for template_applied
    let mut index_to_chunk_applied: HashMap<usize, &str> = HashMap::new();
    for (i, chunk) in applied_words.iter().enumerate() {
        index_to_chunk_applied.insert(i, *chunk);
    }

    // Build a vector of (start_offset, end_offset) for each word in template_applied
    let mut word_offsets = Vec::new();
    let mut offset = 0;
    for word in &applied_words {
        let word_len = word.graphemes(true).count();
        let start = offset;
        let end = offset + word_len;
        word_offsets.push((start, end));
        offset = end + 1; // +1 for the space (assume single space between words)
    }

    for m in resp.matches {
        // Find which word in template_applied overlaps with the mistake
        let mut found_index = None;
        for (idx, (start, end)) in word_offsets.iter().enumerate() {
            if m.offset < *end && (m.offset + m.length) > *start {
                found_index = Some(idx);
                break;
            }
        }

        if let Some(idx) = found_index {
            // Check if this chunk corresponds to a placeholder in the template
            if let Some((ph_chunk, true)) = index_to_chunk.get(&idx) {
                // Extract placeholder name, e.g., "{ph-1}" -> "ph-1"
                if let Some(start) = ph_chunk.find('{') {
                    if let Some(end) = ph_chunk.find('}') {
                        let placeholder_name = &ph_chunk[start + 1..end];

                        placeholder_mistakes.insert(
                            placeholder_name.to_string(),
                            Mistake::new(
                                placeholder_name.to_string(),
                                m.rule.issue_type.clone(),
                                m.rule.description.clone(),
                            ),
                        );
                    }
                }
            }
        }
    }

    Ok(placeholder_mistakes)
}

#[cfg(test)]
mod tests {
    use lambda_appsync::tokio;

    use super::*;

    // English tests

    #[tokio::test]
    async fn test_check_spelling_correct_text() {
        let text = "This is a correct sentence.";
        let language = LanguageName::English;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.matches.is_empty());
    }

    #[tokio::test]
    async fn test_check_spelling_incorrect_text_1() {
        let text = "Ths is an incorrect sentence."; // 'Ths' is misspelled

        let language = LanguageName::English;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();

        assert!(!response.matches.is_empty());

        let first_match = &response.matches[0];
        assert_eq!(first_match.message, "Possible spelling mistake found.");
        assert_eq!(first_match.offset, 0);
        assert_eq!(first_match.length, 3);
        assert_eq!(first_match.context.text, text);
        assert_eq!(first_match.context.offset, 0);
        assert_eq!(first_match.context.length, 3);
        assert_eq!(first_match.rule.id, "MORFOLOGIK_RULE_EN_US");
        assert_eq!(first_match.rule.description, "Possible spelling mistake");
        assert_eq!(first_match.rule.issue_type, "misspelling");
        assert_eq!(first_match.rule.category.id, "TYPOS");
        assert_eq!(first_match.rule.category.name, "Possible Typo");
    }

    #[tokio::test]
    async fn test_check_spelling_incorrect_text_2() {
        let text = "This is a incorrect sentence."; // 'a' should be 'an'

        let language = LanguageName::English;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();

        assert!(!response.matches.is_empty());

        let first_match = &response.matches[0];
        assert_eq!(first_match.message, "Use “an” instead of ‘a’ if the following word starts with a vowel sound, e.g.\u{a0}‘an article’, ‘an hour’.");
        assert_eq!(first_match.offset, 8);
        assert_eq!(first_match.length, 1);
        assert_eq!(first_match.context.text, text);
        assert_eq!(first_match.context.offset, 8);
        assert_eq!(first_match.context.length, 1);
        assert_eq!(first_match.rule.id, "EN_A_VS_AN");
        assert_eq!(first_match.rule.description, "Use of 'a' vs. 'an'");
        assert_eq!(first_match.rule.issue_type, "misspelling");
        assert_eq!(first_match.rule.category.id, "MISC");
        assert_eq!(first_match.rule.category.name, "Miscellaneous");
    }

    #[tokio::test]
    async fn test_check_spelling_incorrect_text_3() {
        let text = "This is an incorect sentence."; // 'incorect' is misspelled

        let language = LanguageName::English;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();

        assert!(!response.matches.is_empty());

        let first_match = &response.matches[0];
        assert_eq!(first_match.message, "Possible spelling mistake found.");
        assert_eq!(first_match.offset, 11);
        assert_eq!(first_match.length, 8);
        assert_eq!(first_match.context.text, text);
        assert_eq!(first_match.context.offset, 11);
        assert_eq!(first_match.context.length, 8);
        assert_eq!(first_match.rule.id, "MORFOLOGIK_RULE_EN_US");
        assert_eq!(first_match.rule.description, "Possible spelling mistake");
        assert_eq!(first_match.rule.issue_type, "misspelling");
        assert_eq!(first_match.rule.category.id, "TYPOS");
        assert_eq!(first_match.rule.category.name, "Possible Typo");
    }

    #[tokio::test]
    async fn test_check_spelling_incorrect_text_4() {
        let text = "This is an incorrect sentnce."; // 'sentnce' is misspelled

        let language = LanguageName::English;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();

        assert!(!response.matches.is_empty());

        let first_match = &response.matches[0];
        assert_eq!(first_match.message, "Possible spelling mistake found.");
        assert_eq!(first_match.offset, 21);
        assert_eq!(first_match.length, 7);
        assert_eq!(first_match.context.text, text);
        assert_eq!(first_match.context.offset, 21);
        assert_eq!(first_match.context.length, 7);
        assert_eq!(first_match.rule.id, "MORFOLOGIK_RULE_EN_US");
        assert_eq!(first_match.rule.description, "Possible spelling mistake");
        assert_eq!(first_match.rule.issue_type, "misspelling");
        assert_eq!(first_match.rule.category.id, "TYPOS");
        assert_eq!(first_match.rule.category.name, "Possible Typo");
    }

    #[tokio::test]
    async fn test_check_spelling_incorrect_text_5() {
        let text = "Tis is a incorect sentnce."; // 'This', 'incorrect', and 'sentence' are misspelled

        let language = LanguageName::English;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();

        assert!(!response.matches.is_empty());

        assert_eq!(response.matches.len(), 4);
    }

    #[tokio::test]
    async fn test_check_spelling_empty_text() {
        let text = "";
        let language = LanguageName::English;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();

        assert!(response.matches.is_empty());
    }

    // Russian tests

    #[tokio::test]
    async fn test_check_spelling_correct_text_russian() {
        let text = "Это правильное предложение.";
        let language = LanguageName::Russian;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.matches.is_empty());
    }

    #[tokio::test]
    async fn test_check_spelling_incorrect_text_1_russian() {
        let text = "Эт правильное предложение."; // 'Эт' is misspelled
        let language = LanguageName::Russian;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(!response.matches.is_empty());

        let first_match = &response.matches[0];
        assert_eq!(first_match.offset, 0);
        assert_eq!(first_match.context.text, text);
        assert_eq!(first_match.context.offset, 0);
        assert_eq!(first_match.context.length, 2);
        assert_eq!(first_match.rule.id, "MORFOLOGIK_RULE_RU_RU");
        assert_eq!(
            first_match.rule.description,
            "Проверка орфографии с исправлениями"
        );
        assert_eq!(first_match.rule.issue_type, "misspelling");
        assert_eq!(first_match.rule.category.id, "TYPOS");
        assert_eq!(first_match.rule.category.name, "Проверка орфографии");
    }

    #[tokio::test]
    async fn test_check_spelling_incorrect_text_2_russian() {
        let text = "Это неправилное предложение."; // 'неправилное' is misspelled
        let language = LanguageName::Russian;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(!response.matches.is_empty());

        let first_match = &response.matches[0];
        assert_eq!(first_match.offset, 4);
        assert_eq!(first_match.length, 11);
        assert_eq!(first_match.context.text, text);
        assert_eq!(first_match.rule.id, "MORFOLOGIK_RULE_RU_RU");
        assert_eq!(
            first_match.rule.description,
            "Проверка орфографии с исправлениями"
        );
        assert_eq!(first_match.rule.issue_type, "misspelling");
        assert_eq!(first_match.rule.category.id, "TYPOS");
        assert_eq!(first_match.rule.category.name, "Проверка орфографии");
    }

    #[tokio::test]
    async fn test_check_spelling_incorrect_text_3_russian() {
        let text = "Это правильное предлоджение."; // 'предлоджение' is misspelled
        let language = LanguageName::Russian;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(!response.matches.is_empty());

        let first_match = &response.matches[0];
        assert_eq!(first_match.offset, 15);
        assert_eq!(first_match.length, 12);
        assert_eq!(first_match.context.text, text);
        assert_eq!(first_match.context.offset, 15);
        assert_eq!(first_match.context.length, 12);
        assert_eq!(first_match.rule.id, "MORFOLOGIK_RULE_RU_RU");
        assert_eq!(
            first_match.rule.description,
            "Проверка орфографии с исправлениями"
        );
        assert_eq!(first_match.rule.issue_type, "misspelling");
        assert_eq!(first_match.rule.category.id, "TYPOS");
        assert_eq!(first_match.rule.category.name, "Проверка орфографии");
    }

    #[tokio::test]
    async fn test_check_spelling_multiple_mistakes_russian() {
        let text = "Эт неправилное предлоджение."; // 3 mistakes
        let language = LanguageName::Russian;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(!response.matches.is_empty());
        assert!(response.matches.len() == 3);
    }

    #[tokio::test]
    async fn test_check_spelling_empty_text_russian() {
        let text = "";
        let language = LanguageName::Russian;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.matches.is_empty());
    }

    // Ukrainian tests

    #[tokio::test]
    async fn test_check_spelling_correct_text_ukrainian() {
        let text = "Це правильне речення.";
        let language = LanguageName::Ukrainian;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.matches.is_empty());
    }

    #[tokio::test]
    async fn test_check_spelling_incorrect_text_1_ukrainian() {
        let text = "Цц правильне речення."; // 'Цц' is misspelled
        let language = LanguageName::Ukrainian;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();

        assert!(!response.matches.is_empty());

        let first_match = &response.matches[0];
        assert_eq!(first_match.offset, 0);
        assert_eq!(first_match.context.text, text);
        assert_eq!(first_match.context.offset, 0);
        assert_eq!(first_match.context.length, 2);
        assert_eq!(first_match.rule.id, "MORFOLOGIK_RULE_UK_UA");
        assert_eq!(first_match.rule.issue_type, "misspelling");
        assert_eq!(first_match.rule.category.id, "TYPOS");
    }

    #[tokio::test]
    async fn test_check_spelling_incorrect_text_2_ukrainian() {
        let text = "Це неправилне речення."; // 'неправилне' is misspelled
        let language = LanguageName::Ukrainian;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(!response.matches.is_empty());

        let first_match = &response.matches[0];
        assert_eq!(first_match.offset, 3);
        assert_eq!(first_match.length, 10);
        assert_eq!(first_match.context.text, text);
        assert_eq!(first_match.rule.id, "MORFOLOGIK_RULE_UK_UA");
        assert_eq!(first_match.rule.issue_type, "misspelling");
        assert_eq!(first_match.rule.category.id, "TYPOS");
    }

    #[tokio::test]
    async fn test_check_spelling_incorrect_text_3_ukrainian() {
        let text = "Це правильне реченя."; // 'реченя' is misspelled
        let language = LanguageName::Ukrainian;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(!response.matches.is_empty());

        let first_match = &response.matches[0];
        assert_eq!(first_match.offset, 13);
        assert_eq!(first_match.length, 6);
        assert_eq!(first_match.context.text, text);
        assert_eq!(first_match.rule.id, "MORFOLOGIK_RULE_UK_UA");
        assert_eq!(first_match.rule.issue_type, "misspelling");
        assert_eq!(first_match.rule.category.id, "TYPOS");
    }

    #[tokio::test]
    async fn test_check_spelling_multiple_mistakes_ukrainian() {
        // TODO fix: currently languagetool-rust
        // returns only 2 mistakes instead of 3 for the sentence with "Цц неправилне реченя."
        // checked with LanguageTool online - it also finds just 2 mistakes correctly

        let text = "Цц неправилне реченя."; // 3 mistakes
        let language = LanguageName::Ukrainian;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(!response.matches.is_empty());
        assert_eq!(response.matches.len(), 3);
    }

    #[tokio::test]
    async fn test_check_spelling_empty_text_ukrainian() {
        let text = "";
        let language = LanguageName::Ukrainian;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.matches.is_empty());
    }

    // German tests

    #[tokio::test]
    async fn test_check_spelling_correct_text_german() {
        let text = "Das ist ein korrekter Satz.";
        let language = LanguageName::German;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.matches.is_empty());
    }

    #[tokio::test]
    async fn test_check_spelling_incorrect_text_1_german() {
        let text = "Ds ist ein korrekter Satz."; // 'Ds' is misspelled
        let language = LanguageName::German;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(!response.matches.is_empty());

        let first_match = &response.matches[0];
        assert_eq!(first_match.offset, 0);
        assert_eq!(first_match.length, 2);
        assert_eq!(first_match.context.text, text);
        assert_eq!(first_match.context.offset, 0);
        assert_eq!(first_match.context.length, 2);
        assert_eq!(first_match.rule.id, "GERMAN_SPELLER_RULE");
        assert_eq!(first_match.rule.issue_type, "misspelling");
        assert_eq!(first_match.rule.category.id, "TYPOS");
    }

    #[tokio::test]
    async fn test_check_spelling_incorrect_text_2_german() {
        let text = "Das ist ein korrekter Sat."; // 'Sat' is misspelled
        let language = LanguageName::German;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(!response.matches.is_empty());

        let first_match = &response.matches[0];
        assert_eq!(first_match.offset, 22);
        assert_eq!(first_match.length, 3);
        assert_eq!(first_match.context.text, text);
        assert_eq!(first_match.context.offset, 22);
        assert_eq!(first_match.context.length, 3);
        assert_eq!(first_match.rule.id, "GERMAN_SPELLER_RULE");
        assert_eq!(first_match.rule.issue_type, "misspelling");
        assert_eq!(first_match.rule.category.id, "TYPOS");
    }

    #[tokio::test]
    async fn test_check_spelling_incorrect_text_3_german() {
        let text = "Das ist ein inkorekter Satz."; // 'inkorekter' is misspelled
        let language = LanguageName::German;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(!response.matches.is_empty());

        let first_match = &response.matches[0];
        assert_eq!(first_match.offset, 12);
        assert_eq!(first_match.length, 10);
        assert_eq!(first_match.context.text, text);
        assert_eq!(first_match.context.offset, 12);
        assert_eq!(first_match.context.length, 10);
        assert_eq!(first_match.rule.id, "GERMAN_SPELLER_RULE");
        assert_eq!(first_match.rule.issue_type, "misspelling");
        assert_eq!(first_match.rule.category.id, "TYPOS");
    }

    #[tokio::test]
    async fn test_check_spelling_multiple_mistakes_german() {
        let text = "Ds ist ein inkorekter Sat."; // 3 mistakes
        let language = LanguageName::German;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(!response.matches.is_empty());
        assert!(response.matches.len() == 3);
    }

    #[tokio::test]
    async fn test_check_spelling_empty_text_german() {
        let text = "";
        let language = LanguageName::German;
        let result = check_spelling(text, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.matches.is_empty());
    }

    // test with template

    #[tokio::test]
    async fn test_check_spelling_with_template() {
        let template = "Это прос{ph-1} пред{ph-2}ние.";
        let template_applied = "Это простф предлоние."; // 'прост' and 'предлоние' are misspelled
        let language = LanguageName::Russian;
        let result = check_spelling_with_template(template, template_applied, &language).await;

        assert!(result.is_ok());

        let response = result.unwrap();

        assert!(response.contains_key("ph-1"));
        assert!(response.contains_key("ph-2"));

        assert_eq!(response.get("ph-1").unwrap().mistake_type, "misspelling");
        assert_eq!(response.get("ph-2").unwrap().mistake_type, "misspelling");
    }

    #[tokio::test]
    async fn test_check_spelling_with_template_no_mistakes() {
        let template = "This is a {ph-1} sentence.";
        let template_applied = "This is a correct sentence.";
        let language = LanguageName::English;
        let result = check_spelling_with_template(template, template_applied, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.is_empty());
    }

    #[tokio::test]
    async fn test_check_spelling_with_template_one_mistake() {
        let template = "This is a {ph-1} sentence.";
        let template_applied = "This is a incorect sentence."; // 'incorect' is misspelled
        let language = LanguageName::English;
        let result = check_spelling_with_template(template, template_applied, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.contains_key("ph-1"));
        assert_eq!(response.get("ph-1").unwrap().mistake_type, "misspelling");
    }

    #[tokio::test]
    async fn test_check_spelling_with_template_multiple_mistakes() {
        let template = "Das ist ein {ph-1} {ph-2}.";
        let template_applied = "Das ist ein inkorekter Sat."; // both 'inkorekter' and 'Sat' are misspelled
        let language = LanguageName::German;
        let result = check_spelling_with_template(template, template_applied, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.contains_key("ph-1"));
        assert!(response.contains_key("ph-2"));
        assert_eq!(response.get("ph-1").unwrap().mistake_type, "misspelling");
        assert_eq!(response.get("ph-2").unwrap().mistake_type, "misspelling");
    }

    #[tokio::test]
    async fn test_check_spelling_with_template_placeholder_not_misspelled() {
        let template = "Это {ph-1} предложение.";
        let template_applied = "Это простое предложение."; // no mistakes
        let language = LanguageName::Russian;
        let result = check_spelling_with_template(template, template_applied, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.is_empty());
    }

    #[tokio::test]
    async fn test_check_spelling_with_template_empty_template() {
        let template = "";
        let template_applied = "";
        let language = LanguageName::English;
        let result = check_spelling_with_template(template, template_applied, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.is_empty());
    }

    #[tokio::test]
    async fn test_check_spelling_with_template_placeholder_at_end() {
        let template = "Correct sentence {ph-1}";
        let template_applied = "Correct sentence sentnce"; // 'sentnce' is misspelled
        let language = LanguageName::English;
        let result = check_spelling_with_template(template, template_applied, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.contains_key("ph-1"));
        assert_eq!(response.get("ph-1").unwrap().mistake_type, "misspelling");
    }

    #[tokio::test]
    async fn test_check_spelling_with_template_adjacent_placeholders() {
        let template = "{ph-1} {ph-2}";
        let template_applied = "incorect sentnce"; // both are misspelled
        let language = LanguageName::English;
        let result = check_spelling_with_template(template, template_applied, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();

        assert!(response.contains_key("ph-1"));
        assert!(response.contains_key("ph-2"));
        assert_eq!(response.get("ph-1").unwrap().mistake_type, "misspelling");
        assert_eq!(response.get("ph-2").unwrap().mistake_type, "misspelling");
    }

    #[tokio::test]
    async fn test_check_spelling_with_template_real_text_russian() {
        let template = "{ph-1}илетний Максим нашёл на чердаке бабушкиного дома старинную карту с загадочными символ{ph-2}. На ней был изображён л{ph-3}с за их деревней и {ph-4}к, отмечающий какое-{ph-5} ме{ph-6}то. П{ph-7}в ка{ph-8} своему лучшему другу Артёму, мальчики {ph-9} отправиться на поиски кл{ph-10}а. Взяв рюкзаки с бутербродами и компа{ph-11}ом, они вошли в густой лес. Следуя указаниям кар{ph-12}, друзья {ph-13}реодолели ру{ph-14}ей по упавшему дереву и {ph-15} на небо{ph-16} холм. Вдруг Артём заметил странные резные камни, расположенные в форме круга";
        let template_applied = "филетний Максим нашёл на чердаке бабушкиного дома старинную карту с загадочными символф. На ней был изображён лфффффс за их деревней и фк, отмечающий какое-ф мефто. Пфв каф своему лучшему другу Артёму, мальчики ф отправиться на поиски клфа. Взяв рюкзаки с бутербродами и компафом, они вошли в густой лес. Следуя указаниям карф, друзья фреодолели руфей по упавшему дереву и ф на небоф холм. Вдруг Артём заметил странные резные камни, расположенные в форме круга";
        let language = LanguageName::Russian;
        let result = check_spelling_with_template(template, template_applied, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();

        assert!(response.contains_key("ph-1"));
        assert!(response.contains_key("ph-2"));
        assert!(response.contains_key("ph-3"));
        assert!(response.contains_key("ph-4"));
        assert!(response.contains_key("ph-5"));
        assert!(response.contains_key("ph-6"));
        assert!(response.contains_key("ph-7"));
        // assert!(response.contains_key("ph-8"));
        // assert!(response.contains_key("ph-9"));
        assert!(response.contains_key("ph-10"));
        assert!(response.contains_key("ph-11"));
        assert!(response.contains_key("ph-12"));
        assert!(response.contains_key("ph-13"));
        assert!(response.contains_key("ph-14"));
        // assert!(response.contains_key("ph-15"));
        assert!(response.contains_key("ph-16"));
        // assert_eq!(response.get("ph-1").unwrap().mistake_type, "misspelling");
        // assert_eq!(response.get("ph-2").unwrap().mistake_type, "misspelling");
    }

    // TODO Emma bemerkte merkwürdig Symbole an den Felsen, während Max einen versteckten Pfad in den Dschungel fand.
    // merkwürdig -> merkwürdige
}
