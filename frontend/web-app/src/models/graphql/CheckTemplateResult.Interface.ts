import type { ChapterInterface } from '@/models/Chapter.Interface'
import type { MistakeInterface } from '@/models/messages/Mistake.Interface'

export interface CheckTemplateResult {
    checkTemplate: {
        errors: { message: string }[]
        mistakes: MistakeInterface[]
        chapter: ChapterInterface
    }
}
