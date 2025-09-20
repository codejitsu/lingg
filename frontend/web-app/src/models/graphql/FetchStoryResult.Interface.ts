import type { ChapterInterface } from '../Chapter.Interface'

export interface FetchStoryResult {
    storyId: string
    title: string
    chapters: ChapterInterface[]
}
