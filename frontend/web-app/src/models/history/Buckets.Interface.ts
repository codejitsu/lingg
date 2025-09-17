import type { PeriodInterface } from '@/models/history/Period.Interface'

export interface BucketsInterface {
    today: PeriodInterface
    yesterday: PeriodInterface
    last7days: PeriodInterface
    lastMonth: PeriodInterface
    everythingElse: PeriodInterface
}
