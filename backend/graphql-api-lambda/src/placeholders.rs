use rand::Rng;
use std::collections::HashMap;
use unicode_segmentation::UnicodeSegmentation;

use crate::UserInputValue;

pub fn replace_parts_of_words(text: &str, ratio: f64) -> (String, HashMap<String, String>) {
    let mut rng = rand::rng();
    let mut placeholder_map: HashMap<String, String> = HashMap::new();
    let mut placeholder_count = 0;

    let segments = UnicodeSegmentation::split_word_bounds(text).collect::<Vec<_>>();

    let mut out = String::with_capacity(text.len());

    for seg in segments {
        let is_word = seg.chars().any(|c| c.is_alphanumeric());

        if !is_word {
            out.push_str(seg);
            continue;
        }

        let g = UnicodeSegmentation::graphemes(seg, true).collect::<Vec<&str>>();
        let g_len = g.len();

        if g_len < 2 {
            out.push_str(seg);
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
            out.push_str(seg);
            continue;
        }

        let max_strategy = if g_len >= 3 { 4 } else { 3 };
        let strategy = rng.random_range(0..max_strategy);

        placeholder_count += 1;
        let key = format!("ph-{}", placeholder_count);
        let token = format!("{{{}}}", key);

        let (prefix_slice, removed_slice, suffix_slice): (Vec<&str>, Vec<&str>, Vec<&str>) =
            match strategy {
                0 => (Vec::new(), g.clone(), Vec::new()),
                1 => {
                    let cut = rng.random_range(1..g_len);
                    (Vec::new(), g[0..cut].to_vec(), g[cut..].to_vec())
                }
                2 => {
                    let cut = rng.random_range(1..g_len);
                    (g[0..cut].to_vec(), g[cut..].to_vec(), Vec::new())
                }
                3 => {
                    let start = rng.random_range(1..(g_len - 1));
                    let end = rng.random_range(start..(g_len - 1));
                    (
                        g[0..start].to_vec(),
                        g[start..=end].to_vec(),
                        g[(end + 1)..].to_vec(),
                    )
                }
                _ => unreachable!(),
            };

        let removed = removed_slice.concat();
        let new_word = {
            let mut s = String::new();
            s.push_str(&prefix_slice.concat());
            s.push_str(&token);
            s.push_str(&suffix_slice.concat());
            s
        };

        placeholder_map.insert(key, removed);
        out.push_str(&new_word);
    }

    (out, placeholder_map)
}

pub fn apply_template(
    template: &str,
    placeholders: &Vec<UserInputValue>,
) -> String {
    let mut result = template.to_string();
    let placeholder_map: HashMap<String, String> = placeholders
        .iter()
        .map(|ph| (ph.name.clone(), ph.text.clone()))
        .collect();

    for (key, value) in &placeholder_map {
        let placeholder = format!("{{{}}}", key);
        result = result.replace(&placeholder, value);
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    // apply_template

    #[test]
    fn test_apply_template_basic() {
        let template = "Hello, {name}!";
        let placeholders = vec![
            UserInputValue { name: "name".to_string(), text: "Alice".to_string() }
        ];
        let result = apply_template(template, &placeholders);
        assert_eq!(result, "Hello, Alice!");
    }

    #[test]
    fn test_apply_template_multiple_placeholders() {
        let template = "{greeting}, {name}! Today is {day}.";
        let placeholders = vec![
            UserInputValue { name: "greeting".to_string(), text: "Hi".to_string() },
            UserInputValue { name: "name".to_string(), text: "Bob".to_string() },
            UserInputValue { name: "day".to_string(), text: "Monday".to_string() },
        ];
        let result = apply_template(template, &placeholders);
        assert_eq!(result, "Hi, Bob! Today is Monday.");
    }

    #[test]
    fn test_apply_template_missing_placeholder() {
        let template = "Hello, {name}! Welcome to {place}.";
        let placeholders = vec![
            UserInputValue { name: "name".to_string(), text: "Charlie".to_string() }
        ];
        let result = apply_template(template, &placeholders);
        assert_eq!(result, "Hello, Charlie! Welcome to {place}.");
    }

    #[test]
    fn test_apply_template_empty_template() {
        let template = "";
        let placeholders = vec![
            UserInputValue { name: "name".to_string(), text: "Dana".to_string() }
        ];
        let result = apply_template(template, &placeholders);
        assert_eq!(result, "");
    }

    #[test]
    fn test_apply_template_empty_placeholders() {
        let template = "Hello, {name}!";
        let placeholders = vec![];
        let result = apply_template(template, &placeholders);
        assert_eq!(result, "Hello, {name}!");
    }

    #[test]
    fn test_apply_template_placeholder_with_braces_in_text() {
        let template = "Value: {key}";
        let placeholders = vec![
            UserInputValue { name: "key".to_string(), text: "{42}".to_string() }
        ];
        let result = apply_template(template, &placeholders);
        assert_eq!(result, "Value: {42}");
    }

    #[test]
    fn test_apply_template_multiple_occurrences() {
        let template = "{word} is a {word}.";
        let placeholders = vec![
            UserInputValue { name: "word".to_string(), text: "test".to_string() }
        ];
        let result = apply_template(template, &placeholders);
        assert_eq!(result, "test is a test.");
    }

    #[test]
    fn test_apply_template_unicode_placeholder_names() {
        let template = "Привіт, {ім'я}!";
        let placeholders = vec![
            UserInputValue { name: "ім'я".to_string(), text: "Олег".to_string() }
        ];
        let result = apply_template(template, &placeholders);
        assert_eq!(result, "Привіт, Олег!");
    }

    // replace_parts_of_words

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

    #[test]
    fn test_replace_parts_of_words_ukrainian_sentence() {
        let text = "Привіт, як справи?";
        let (result, map) = replace_parts_of_words(text, 1.0);
        assert_eq!(result.split_whitespace().count(), 3);
        assert_eq!(map.len(), 3);
        if !map.is_empty() {
            let restored = restore_text(&result, &map);
            assert_eq!(restored, text);
        }
    }

    #[test]
    fn test_replace_parts_of_words_ukrainian_short_words() {
        let text = "Я є ти ми ви";
        let (result, map) = replace_parts_of_words(text, 1.0);
        assert_eq!(result.split_whitespace().count(), 5);
        assert_eq!(map.len(), 3);
        if !map.is_empty() {
            let restored = restore_text(&result, &map);
            assert_eq!(restored, text);
        }
    }

    #[test]
    fn test_replace_parts_of_words_ukrainian_with_punctuation() {
        let text = "Доброго дня! Як ти?";
        let (result, map) = replace_parts_of_words(text, 1.0);
        assert_eq!(result.split_whitespace().count(), 4);
        assert_eq!(map.len(), 4);
        if !map.is_empty() {
            let restored = restore_text(&result, &map);
            assert_eq!(restored, text);
        }
    }

    #[test]
    fn test_replace_parts_of_words_ukrainian_mixed_ratio() {
        let text = "Це тестова фраза для перевірки";
        let (result, map) = replace_parts_of_words(text, 0.5);
        assert_eq!(result.split_whitespace().count(), 5);
        assert!(map.len() <= 5);
        if !map.is_empty() {
            let restored = restore_text(&result, &map);
            assert_eq!(restored, text);
        }
    }
}
