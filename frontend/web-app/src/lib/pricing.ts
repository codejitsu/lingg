export interface PricingTier {
    id: string
    title: string
    priceMonthly: number
    priceAnnual: number
    features: string[]
    ctaLabel: string
    ctaHref: string
    popular?: boolean
    stripeMonthlyPriceId?: string
    stripeAnnualPriceId?: string
}

export const pricingTiers: PricingTier[] = [
    {
        id: 'free',
        title: 'Free',
        priceMonthly: 0,
        priceAnnual: 0,
        features: [
            '1 story per day',
            'Basic grammar feedback',
            'Community support',
            'Access to core features',
        ],
        ctaLabel: 'Get started',
        ctaHref: '/register',
    },
    {
        id: 'pro',
        title: 'Pro',
        priceMonthly: 15,
        priceAnnual: 144,
        features: [
            '5 stories per day',
            'Advanced grammar feedback',
            'Progress reports',
            'Priority support',
            'Export stories as PDF',
            'Custom story templates',
        ],
        ctaLabel: 'Start Pro',
        ctaHref: '/register?plan=pro',
        popular: true,
        stripeMonthlyPriceId: 'price_xxxxxxxxxxxxx',
        stripeAnnualPriceId: 'price_yyyyyyyyyyyyy',
    },
    {
        id: 'family',
        title: 'Family',
        priceMonthly: 25,
        priceAnnual: 240,
        features: [
            'Up to 4 child profiles',
            'Everything in Pro',
            'Shared progress dashboard',
            'Family activity reports',
            'Priority support',
            'Multiple languages per child',
        ],
        ctaLabel: 'Start Family',
        ctaHref: '/register?plan=family',
        stripeMonthlyPriceId: 'price_zzzzzzzzzzzzz',
        stripeAnnualPriceId: 'price_aaaaaaaaaaaaa',
    },
]

export const calculateSavings = (monthlyPrice: number, annualPrice: number) => {
    const savings = monthlyPrice * 12 - annualPrice
    const savingsPercent = Math.round((savings / (monthlyPrice * 12)) * 100)
    return { savings, savingsPercent }
}
