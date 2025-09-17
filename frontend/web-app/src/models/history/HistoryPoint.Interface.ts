// Allowed with erasableSyntaxOnly
export const HistoryPoint = {
    TODAY: 'Today',
    YESTERDAY: 'Yesterday',
    LAST_7_DAYS: 'Last 7 days',
    LAST_MONTH: 'Last month',
    EVERYTHING_ELSE: 'Older than a month',
} as const;

export type HistoryPoint = typeof HistoryPoint[keyof typeof HistoryPoint];