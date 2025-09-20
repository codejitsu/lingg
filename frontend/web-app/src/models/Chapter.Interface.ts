import ChapterStatusInterface from './ChapterStatus.Interface'
import type { PlaceholderInterface } from './Placeholder.Interface'

export interface ChapterInterface {
    chapterId: string
    status: ChapterStatusInterface
    content: string
    template: string
    placeholders: PlaceholderInterface[]
}
