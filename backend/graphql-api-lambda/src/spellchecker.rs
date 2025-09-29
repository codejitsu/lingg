use languagetool_rust::api::{check::{self, Response}, server::ServerClient};
use crate::LanguageName;

pub async fn check_spelling(text: &str, language: &LanguageName) -> Result<Response, Box<dyn std::error::Error>> {
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
}
