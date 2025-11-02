import type { ChapterInterface } from "../Chapter.Interface"

export interface StartStoryResult {
    startStory: {
        errors: { message: string }[]
        story: {
            storyId: string
            title: string
            startedAt: string
            chapters: ChapterInterface[]
        }
    }
}