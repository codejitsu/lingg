import ChapterStatusInterface from './ChapterStatus.Interface'
import type { PlaceholderInterface } from './Placeholder.Interface'

export interface ChapterInterface {
    chapterId: string
    status: ChapterStatusInterface
    content: string
    finalizedContent?: string
    template: string
    placeholders: PlaceholderInterface[]
    score?: number | null
    maxPossibleScore?: number | null
}
