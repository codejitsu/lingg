#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct User {
    pub id: String,
}

impl User {
    pub fn new(id: &str) -> Self {
        User { id: id.to_string() }
    }
}

impl core::fmt::Display for User {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.id)
    }
}

#[cfg(test)]
mod tests {
    use super::User;

    #[test]
    fn test_user_id_to_string() {
        let user = User::new("user123");
        assert_eq!(user.to_string(), "user123");
    }
}