use rand::Rng;
use std::collections::HashMap;

pub fn replace_parts_of_words(text: &str, ratio: f64) -> (String, HashMap<String, String>) {
    let mut rng = rand::rng();
    let mut placeholder_map: HashMap<String, String> = HashMap::new();
    let mut placeholder_count = 0;
    let mut result_tokens: Vec<String> = Vec::new();

    for token in text.split_whitespace() {
        let mut word_start = 0;
        let mut word_end = 0;

        if let Some(idx) = token.find(|c: char| c.is_alphanumeric()) {
            word_start = idx;
        }

        if let Some(idx) = token.rfind(|c: char| c.is_alphanumeric()) {
            word_end = idx + 1;
        }

        //println!("Token: '{}', word_start: {}, word_end: {}", token, word_start, word_end);

        let prefix_punct = &token[..word_start];
        let core_word = &token[word_start..word_end];
        let suffix_punct = &token[word_end..];

        if core_word.chars().count() < 2 {
            result_tokens.push(token.to_string());
            continue;
        }

        let replace = if ratio >= 1.0 {
            true
        } else if ratio <= 0.0 {
            false
        } else {
            rng.random_bool(ratio)
        };

        if !replace {
            result_tokens.push(token.to_string());
        } else {
            placeholder_count += 1;
            let placeholder_key = format!("ph-{}", placeholder_count);

            let word_len = core_word.len();
            let removed_part: String;
            let new_word: String;

            // Choose a replacement strategy: 0=Full, 1=Prefix, 2=Suffix, 3=Middle
            let strategy_choices = if word_len < 3 {
                0..3 // If word length is 2, skip the middle strategy
            } else {
                0..4
            };
            let choice = rng.random_range(strategy_choices);

            match choice {
                0 => {
                    removed_part = core_word.to_string();
                    new_word = format!("{{{}}}", placeholder_key);
                }
                1 => {
                    let cut_idx = rng.random_range(1..word_len);
                    removed_part = core_word[..cut_idx].to_string();
                    let remaining = &core_word[cut_idx..];
                    new_word = format!("{{{}}}{}", placeholder_key, remaining);
                }
                2 => {
                    let cut_idx = rng.random_range(1..word_len);
                    removed_part = core_word[cut_idx..].to_string();
                    let remaining = &core_word[..cut_idx];
                    new_word = format!("{}{{{}}}", remaining, placeholder_key);
                }
                3 => {
                    let start_idx = rng.random_range(1..word_len - 1);
                    let end_idx = rng.random_range(start_idx..(word_len - 1));
                    removed_part = core_word[start_idx..=end_idx].to_string();
                    let beginning = &core_word[..start_idx];
                    let ending = &core_word[(end_idx + 1)..];
                    new_word = format!("{}{{{}}}{}", beginning, placeholder_key, ending);
                }
                _ => unreachable!(),
            }

            placeholder_map.insert(placeholder_key, removed_part);
            let modified_token = format!("{}{}{}", prefix_punct, new_word, suffix_punct);
            result_tokens.push(modified_token);
        }
    }

    let result_text = result_tokens.join(" ");
    (result_text, placeholder_map)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn restore_text(result: &str, map: &std::collections::HashMap<String, String>) -> String {
        let mut restored = result.to_string();
        for (key, value) in map {
            let placeholder = format!("{{{}}}", key);
            restored = restored.replace(&placeholder, value);
        }
        restored
    }

    #[test]
    fn test_replace_parts_of_words_ratio_zero() {
        let text = "Hello, world!";
        let (result, map) = replace_parts_of_words(text, 0.0);
        assert_eq!(result, text);
        assert!(map.is_empty());
    }

    #[test]
    fn test_replace_parts_of_words_ratio_one() {
        let text = "Hello, world!";
        let (result, map) = replace_parts_of_words(text, 1.0);
        assert!(!result.contains("Hello"));
        assert!(!result.contains("world"));
        assert_eq!(map.len(), 2);
        if !map.is_empty() {
            let restored = restore_text(&result, &map);
            assert_eq!(restored, text);
        }
    }

    #[test]
    fn test_replace_parts_of_words_with_punctuation() {
        let text = "Hi! How's it going?";
        let (result, map) = replace_parts_of_words(text, 1.0);
        assert_eq!(result.split_whitespace().count(), 4);
        assert_eq!(map.len(), 4);
        if !map.is_empty() {
            let restored = restore_text(&result, &map);
            assert_eq!(restored, text);
        }
    }

    #[test]
    fn test_replace_parts_of_words_short_words() {
        let text = "A I O U";
        let (result, map) = replace_parts_of_words(text, 1.0);
        assert_eq!(result, text);
        assert!(map.is_empty());
    }

    #[test]
    fn test_replace_parts_of_words_mixed_ratio() {
        let text = "Testing mixed ratio";
        let (result, map) = replace_parts_of_words(text, 0.5);
        assert_eq!(result.split_whitespace().count(), 3);
        assert!(map.len() <= 3);
        if !map.is_empty() {
            let restored = restore_text(&result, &map);
            assert_eq!(restored, text);
        }
    }

    #[test]
    fn test_replace_parts_of_words_empty_string() {
        let text = "";
        let (result, map) = replace_parts_of_words(text, 1.0);
        assert_eq!(result, "");
        assert!(map.is_empty());
    }

    #[test]
    fn test_replace_parts_of_words_non_alphanumeric() {
        let text = "!!! ??? ...";
        let (result, map) = replace_parts_of_words(text, 1.0);
        assert_eq!(result, text);
        assert!(map.is_empty());
    }

    #[test]
    fn test_replace_parts_of_words_all_replaced_quick_brown_fox() {
        let text = "The quick brown fox jumps over the lazy dog";
        let (result, map) = replace_parts_of_words(text, 1.0);
        for word in text.split_whitespace() {
            assert!(!result.contains(word));
        }
        assert_eq!(map.len(), 9);
        assert_eq!(result.split_whitespace().count(), 9);
        if !map.is_empty() {
            let restored = restore_text(&result, &map);
            assert_eq!(restored, text);
        }
    }

    #[test]
    fn test_replace_parts_of_words_none_replaced_quick_brown_fox() {
        let text = "The quick brown fox jumps over the lazy dog";
        let (result, map) = replace_parts_of_words(text, 0.0);
        assert_eq!(result, text);
        assert!(map.is_empty());
    }

    #[test]
    fn test_replace_parts_of_words_partial_replacement_quick_brown_fox() {
        let text = "The quick brown fox jumps over the lazy dog";
        let (result, map) = replace_parts_of_words(text, 0.5);
        assert_eq!(result.split_whitespace().count(), 9);
        assert!(map.len() <= 9);
        assert!(map.len() >= 1);
        if !map.is_empty() {
            let restored = restore_text(&result, &map);
            assert_eq!(restored, text);
        }
    }

    #[test]
    fn test_replace_parts_of_words_with_punctuation_quick_brown_fox() {
        let text = "The, quick! brown? fox; jumps: over. the lazy dog.";
        let (result, map) = replace_parts_of_words(text, 1.0);
        assert_eq!(result.split_whitespace().count(), 9);
        assert_eq!(map.len(), 9);
        for token in text.split_whitespace() {
            let punct: String = token.chars().filter(|c| !c.is_alphanumeric()).collect();
            if !punct.is_empty() {
                assert!(result.contains(&punct));
            }
        }
        if !map.is_empty() {
            let restored = restore_text(&result, &map);
            assert_eq!(restored, text);
        }
    }

    #[test]
    fn test_replace_parts_of_words_mixed_case_quick_brown_fox() {
        let text = "The Quick BROWN fOx JuMpS oVeR tHe LaZy DoG";
        let (result, map) = replace_parts_of_words(text, 1.0);
        assert_eq!(result.split_whitespace().count(), 9);
        assert_eq!(map.len(), 9);
        if !map.is_empty() {
            let restored = restore_text(&result, &map);
            assert_eq!(restored, text);
        }
    }
}
