use std::convert::TryFrom;
use crate::ChapterStatus;

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