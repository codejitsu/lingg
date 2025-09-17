import type { StoryInterface } from '@/models/Story.Interface'
import { HistoryPoint } from './HistoryPoint.Interface'

export interface PeriodInterface {
    period: HistoryPoint
    stories: StoryInterface[]
}
