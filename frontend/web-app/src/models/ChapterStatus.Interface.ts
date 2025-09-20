const ChapterStatusInterface = {
    Created: 'Created',
    VerifiedNoMistakes: 'VerifiedNoMistakes',
    VerifiedWithMistakes: 'VerifiedWithMistakes',
    Completed: 'Completed',
} as const

type ChapterStatusInterface =
    (typeof ChapterStatusInterface)[keyof typeof ChapterStatusInterface]

export default ChapterStatusInterface
