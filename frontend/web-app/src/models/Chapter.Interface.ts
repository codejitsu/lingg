import ChapterStatusInterface from './ChapterStatus.Interface'
import type { PlaceholderInterface } from './Placeholder.Interface'

export interface ChapterInterface {
    status: ChapterStatusInterface
    content: string
    template: string
    placeholders: PlaceholderInterface[]
}
