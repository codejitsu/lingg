import { gql } from '@apollo/client'

// GraphQL query to list all stories for a user
export const LIST_ALL_STORIES = gql`
    query ListAllStories($userId: ID!) {
        listStories(userId: $userId) {
            startedAt
            storyId
            title
        }
    }
`

// GraphQL query to fetch a story by ID
export const FETCH_STORY_BY_ID = gql`
    query FetchStoryById($userId: ID!, $storyId: ID!) {
        fetchStoryById(userId: $userId, storyId: $storyId) {
            explainLanguage
            startedAt
            storyId
            storyType
            targetLanguage
            title
            userId
            chapters {
                chapterId
                status
                content
                finalizedContent
                createdAt
                completedAt
                storyId
                template
                placeholders {
                    name
                    text
                }
            }
        }
    }
`

// GraphQL mutation to start a new story
export const START_STORY = gql`
    mutation StartStory(
        $userId: ID!
        $clientRequestId: ID!
        $targetLanguage: LanguageName!
        $explainLanguage: LanguageName!
        $storyType: StoryType!
    ) {
        startStory(
            input: {
                userId: $userId
                clientRequestId: $clientRequestId
                targetLanguage: $targetLanguage
                explainLanguage: $explainLanguage
                storyType: $storyType
            }
        ) {
            errors {
                message
            }
            story {
                explainLanguage
                startedAt
                storyId
                storyType
                targetLanguage
                title
                userId
                chapters {
                    chapterId
                    status
                    content
                    createdAt
                    storyId
                    template
                    placeholders {
                        name
                        text
                    }
                }
            }
        }
    }
`

// GraphQL mutation to apply values to a template and check its validity
export const CHECK_TEMPLATE = gql`
    mutation CheckTemplate(
        $userId: ID!
        $storyId: ID!
        $chapterId: ID!
        $clientRequestId: ID!
        $targetLanguage: LanguageName!
        $explainLanguage: LanguageName!        
        $placeholders: [UserInputValueInput!]!
    ) {
        checkTemplate(input: { userId: $userId, storyId: $storyId, chapterId: $chapterId, clientRequestId: $clientRequestId, targetLanguage: $targetLanguage, explainLanguage: $explainLanguage, placeholders: $placeholders }) {
            chapter {
                    chapterId
                    content
                    createdAt
                    placeholders {
                        name
                        text
                    }
                    status
                    storyId
                    template
                    userInput {
                        name
                        text
                    }
                    completedAt
                }
                errors {
                    message
                }
                mistakes {
                    explanation
                    hint
                    placeholder {
                        name
                        text
                    }
                }
            }
        }
`