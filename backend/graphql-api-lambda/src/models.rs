#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct UserId {
    pub id: String,
}

impl UserId {
    pub fn new(id: &str) -> Self {
        UserId { id: id.to_string() }
    }
}

impl core::fmt::Display for UserId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.id)
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