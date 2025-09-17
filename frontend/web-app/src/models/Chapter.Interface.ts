import type { PlaceholderInterface } from './Placeholder.Interface'

export interface ChapterInterface {
    content: string
    template: string
    placeholders: PlaceholderInterface[]
}
