use crate::{ChapterStatus, CheckTemplateInput, CheckTemplatePayload, Placeholder, UserInputValue, CheckTemplateError, MistakeExplanation, Chapter};
use std::convert::TryFrom;

impl TryFrom<&str> for ChapterStatus {
    type Error = ();

    fn try_from(s: &str) -> Result<Self, Self::Error> {
        match s {
            "Created" => Ok(ChapterStatus::Created),
            "VerifiedNoMistakes" => Ok(ChapterStatus::VerifiedNoMistakes),
            "VerifiedWithMistakes" => Ok(ChapterStatus::VerifiedWithMistakes),
            "Completed" => Ok(ChapterStatus::Completed),

            _ => Err(()),
        }
    }
}

impl Placeholder {
    pub fn new(name: &str, text: &str) -> Self {
        Placeholder {
            name: name.to_string().into(),
            text: text.to_string().into(),
        }
    }
}

impl UserInputValue {
    pub fn new(name: &str, text: &str) -> Self {
        UserInputValue {
            name: name.to_string().into(),
            text: text.to_string().into(),
        }
    }
}

impl CheckTemplateInput {
    pub fn placeholder_as_inputs(&self) -> Vec<UserInputValue> {
        self.placeholders
            .iter()
            .map(|ph| UserInputValue::new(&ph.name, &ph.text))
            .collect()
    }
}

impl CheckTemplatePayload {
    pub fn new(
        errors: Vec<CheckTemplateError>,
        mistakes: Vec<MistakeExplanation>,
        chapter: Option<Chapter>,
    ) -> Self {
        CheckTemplatePayload {
            errors,
            mistakes,
            chapter,
        }
    }
}