import type ChapterStatusInterface from '../ChapterStatus.Interface'
import type { PlaceholderInterface } from '../Placeholder.Interface'

export interface ChatMessage {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    template: string
    placeholders: PlaceholderInterface[]
    status?: ChapterStatusInterface
}
