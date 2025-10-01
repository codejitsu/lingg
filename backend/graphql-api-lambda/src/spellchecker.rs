use std::collections::HashMap;

use languagetool_rust::api::{check::{self, Response}, server::ServerClient};
use unicode_segmentation::UnicodeSegmentation;
use crate::LanguageName;

async fn check_spelling(text: &str, language: &LanguageName) -> Result<Response, Box<dyn std::error::Error>> {
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

pub async fn check_spelling_with_template(template: &str, template_applied: &str, target_language: &LanguageName) -> Result<HashMap<String, String>, Box<dyn std::error::Error>> {
    let resp = check_spelling(template_applied, target_language).await?;

    let mut placeholder_mistakes: HashMap<String, String> = HashMap::new();

    // Find all placeholders in the template and their grapheme offsets
    let mut placeholder_offsets: Vec<(usize, usize, String)> = Vec::new();
    let mut idx = 0;
    let template_graphemes: Vec<&str> = UnicodeSegmentation::graphemes(template, true).collect();
    while idx < template_graphemes.len() {
        if template_graphemes[idx] == "{" {
            let mut end_idx = idx + 1;
            while end_idx < template_graphemes.len() && template_graphemes[end_idx] != "}" {
                end_idx += 1;
            }
            if end_idx < template_graphemes.len() {
                let name = template_graphemes[idx + 1..end_idx].concat();
                placeholder_offsets.push((idx, end_idx + 1, name));
                idx = end_idx + 1;
            } else {
                break;
            }
        } else {
            idx += 1;
        }
    }

    // Map template grapheme offsets to template_applied grapheme offsets
    let template_applied_graphemes: Vec<&str> = UnicodeSegmentation::graphemes(template_applied, true).collect();
    let mut template_to_applied: Vec<(usize, usize, String)> = Vec::new();
    let mut a_idx = 0;
    let mut last_end = 0;
    for (ph_start, ph_end, ph_name) in &placeholder_offsets {
        // Copy up to the placeholder
        let before = template_graphemes[last_end..*ph_start].concat();
        let before_len = before.graphemes(true).count();
        a_idx += before_len;
        // Find the corresponding substring in template_applied
        let next_ph_start = if let Some((next_start, _, _)) = placeholder_offsets.iter().find(|(s, _, _)| *s > *ph_start) {
            *next_start
        } else {
            template_graphemes.len()
        };
        let after = template_graphemes[*ph_end..next_ph_start].concat();
        let after_len = after.graphemes(true).count();
        // Find the substring in template_applied that matches 'after'
        let applied_slice = template_applied_graphemes[a_idx..].concat();
        let mut applied_ph_end = a_idx;
        if after_len > 0 && !after.is_empty() {
            if let Some(pos) = applied_slice.find(&after) {
                let grapheme_pos = UnicodeSegmentation::graphemes(&applied_slice[..pos], true).count();
                applied_ph_end = a_idx + grapheme_pos;
            } else {
                applied_ph_end = template_applied_graphemes.len();
            }
        } else {
            applied_ph_end = template_applied_graphemes.len();
        }
        template_to_applied.push((a_idx, applied_ph_end, ph_name.clone()));
        a_idx = applied_ph_end + after_len;
        last_end = *ph_end;
    }

    // For each mistake, find which placeholder range it falls into (using grapheme offsets)
    for m in &resp.matches {
        // Convert byte offsets to grapheme offsets
        let mut byte_count = 0;
        let mut m_start_grapheme = 0;
        let mut m_end_grapheme = 0;
        for (i, g) in template_applied_graphemes.iter().enumerate() {
            if byte_count == m.offset {
                m_start_grapheme = i;
            }
            if byte_count == m.offset + m.length {
                m_end_grapheme = i;
                break;
            }
            byte_count += g.len();
        }
        // If m_end_grapheme wasn't set, set it to the end
        if m_end_grapheme == 0 {
            m_end_grapheme = template_applied_graphemes.len();
        }
        for (ph_start, ph_end, ph_name) in &template_to_applied {
            if m_start_grapheme < *ph_end && m_end_grapheme > *ph_start {
                placeholder_mistakes.insert(ph_name.clone(), m.rule.issue_type.clone());
            }
        }
    }

    Ok(placeholder_mistakes)
}

#[cfg(test)]
mod tests {
    use lambda_appsync::tokio;
use unicode_segmentation::UnicodeSegmentation;

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
        assert_eq!(first_match.rule.description, "Проверка орфографии с исправлениями");
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
        assert_eq!(first_match.rule.description, "Проверка орфографии с исправлениями");
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
        assert_eq!(first_match.rule.description, "Проверка орфографии с исправлениями");
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
        let template_applied = "Это прост предлоние."; // 'прост' and 'предлоние' are misspelled
        let language = LanguageName::Russian;
        let result = check_spelling_with_template(template, template_applied, &language).await;
        
        assert!(result.is_ok());
        
        let response = result.unwrap();

        assert!(response.contains_key("ph-1"));
        assert!(response.contains_key("ph-2"));

        assert_eq!(response.get("ph-1").unwrap(), "misspelling");
        assert_eq!(response.get("ph-2").unwrap(), "misspelling");
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
        assert_eq!(response.get("ph-1").unwrap(), "misspelling");
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
        assert_eq!(response.get("ph-1").unwrap(), "misspelling");
        assert_eq!(response.get("ph-2").unwrap(), "misspelling");
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
        assert_eq!(response.get("ph-1").unwrap(), "misspelling");
    }

    #[tokio::test]
    async fn test_check_spelling_with_template_adjacent_placeholders() {
        let template = "{ph-1} {ph-2}";
        let template_applied = "incorect sentnce"; // both are misspelled
        let language = LanguageName::English;
        let result = check_spelling_with_template(template, template_applied, &language).await;
        assert!(result.is_ok());
        let response = result.unwrap();

        println!("Response: {:?}", response);

        assert!(response.contains_key("ph-1"));
        assert!(response.contains_key("ph-2"));
        assert_eq!(response.get("ph-1").unwrap(), "misspelling");
        assert_eq!(response.get("ph-2").unwrap(), "misspelling");
    }
}
