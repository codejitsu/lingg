import type ChapterStatusInterface from '../ChapterStatus.Interface'
import type { PlaceholderInterface } from '../Placeholder.Interface'
import type { MistakeInterface } from './Mistake.Interface'

export interface ChatMessage {
    id: string
    role: 'user' | 'assistant' | 'system' | 'error'
    content: string
    finalizedContent?: string
    template: string
    placeholders: PlaceholderInterface[]
    status?: ChapterStatusInterface
    mistakes: MistakeInterface[]
}
