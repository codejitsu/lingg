use lambda_appsync::ID;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct UserId {
    pub id: String,
}

impl UserId {
    pub fn new(id: &str) -> Self {
        UserId { id: id.to_string() }
    }
}

impl From<String> for UserId {
    fn from(id: String) -> Self {
        UserId { id }
    }
}

impl core::fmt::Display for UserId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.id)
    }
}

pub struct StoryId(pub ID);

impl From<ID> for StoryId {
    fn from(id: ID) -> Self {
        StoryId(id)
    }
}

pub struct ChapterId(pub ID);

impl From<ID> for ChapterId {
    fn from(id: ID) -> Self {
        ChapterId(id)
    }
}

pub struct ClientRequestId(pub ID);

impl From<ID> for ClientRequestId {
    fn from(id: ID) -> Self {
        ClientRequestId(id)
    }
}

#[cfg(test)]
mod tests {
    use super::UserId;

    #[test]
    fn test_user_id_to_string() {
        let user = UserId::new("user123");
        assert_eq!(user.to_string(), "user123");
    }
}
