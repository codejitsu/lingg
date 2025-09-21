use std::convert::TryFrom;
use crate::{ChapterStatus, Placeholder};

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