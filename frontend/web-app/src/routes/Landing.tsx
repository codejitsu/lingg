import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
    BookOpenIcon,
    SparklesIcon,
    CheckBadgeIcon,
    ChartBarIcon,
    GlobeAltIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { Container } from '@/components/landing/Container'
import { Button } from '@/components/landing/Button'
import { SectionHeading } from '@/components/landing/SectionHeading'
import { FeatureCard } from '@/components/landing/FeatureCard'
import { PriceCard } from '@/components/landing/PriceCard'
import { FAQItem } from '@/components/landing/FAQItem'
import { pricingTiers } from '@/lib/pricing'
import { HashLink } from 'react-router-hash-link'

export const Landing = () => {
    const [isAnnual, setIsAnnual] = useState(false)

    const features = [
        {
            icon: <BookOpenIcon className="w-6 h-6" />,
            title: 'Story Builder with Blanks',
            description:
                'Children fill in the blanks to create unique stories, practicing vocabulary and grammar in context.',
        },
        {
            icon: <SparklesIcon className="w-6 h-6" />,
            title: 'Automatic Grammar Checks',
            description:
                'Real-time feedback helps kids learn from mistakes without frustration, building confidence naturally.',
        },
        {
            icon: <CheckBadgeIcon className="w-6 h-6" />,
            title: 'Kid-Friendly Challenges',
            description:
                'Fun, age-appropriate exercises that make language practice feel like play, not homework.',
        },
        {
            icon: <ChartBarIcon className="w-6 h-6" />,
            title: 'Parent Dashboard',
            description:
                'Track progress, celebrate achievements, and understand where your child excels or needs support.',
        },
        {
            icon: <GlobeAltIcon className="w-6 h-6" />,
            title: 'Multi-Language Support',
            description:
                'Support for dozens of languages, perfect for bilingual families keeping heritage languages alive.',
        },
        {
            icon: <ShieldCheckIcon className="w-6 h-6" />,
            title: 'Safe & Private by Design',
            description:
                'Child-safe environment with no ads and strict privacy controls.',
        },
    ]

    const steps = [
        {
            number: '01',
            title: 'Pick a Topic',
            description:
                'Choose from animals, adventures, daily life, or let your child suggest their own story theme.',
        },
        {
            number: '02',
            title: 'Fill the Story Blanks',
            description:
                'Kids type words in their native language to complete sentences, making each story unique.',
        },
        {
            number: '03',
            title: 'Get Feedback & Progress',
            description:
                'Instant grammar tips and progress tracking help children improve while having fun.',
        },
    ]

    const testimonials = [
        {
            quote: "My daughter looks forward to story time every day now. She doesn't even realize she's practicing Spanish!",
            author: 'Maria S.',
            role: 'Parent of 7-year-old',
            avatar: '👩',
        },
        {
            quote: "As a busy parent, I love seeing my son's progress without having to quiz him. The dashboard shows me everything.",
            author: 'James L.',
            role: 'Parent of 9-year-old',
            avatar: '👨',
        },
        {
            quote: 'Finally, a fun way to keep our heritage language alive! My kids actually ask to use Lingg.ai.',
            author: 'Priya K.',
            role: 'Parent of two',
            avatar: '👩‍💼',
        },
    ]

    const faqs = [
        {
            question: 'How does billing work?',
            answer: 'You can choose monthly or annual billing. Annual plans save you 20%. All plans include a 7-day free trial, and you can cancel anytime with no fees.',
        },
        {
            question: 'Can I cancel my subscription anytime?',
            answer: 'Yes, absolutely. You can cancel your subscription at any time from your account settings. Your access continues until the end of your billing period.',
        },
        {
            question: 'What languages are supported?',
            answer: 'We currently support over 30 languages including Spanish, French, German, Italian, Portuguese, Mandarin, Japanese, Korean, Arabic, and many more. New languages are added regularly based on user requests.',
        },
        {
            question: "How do you protect my child's data?",
            answer: 'We take privacy seriously. Lingg.ai is COPPA compliant, uses encryption for all data, never shows ads, and never sells user data. We collect only the minimum information needed to provide the service.',
        },
        {
            question: 'What age range is Lingg.ai designed for?',
            answer: "Lingg.ai works best for children ages 5-12. Younger children may need parent assistance, while older kids can use it independently. Content difficulty adjusts based on the child's level.",
        },
        {
            question: 'Can I use Lingg.ai for classroom teaching?',
            answer: 'Yes! We offer special classroom licenses for teachers and schools. Contact us at education@lingg.ai for bulk pricing and features designed for classroom use.',
        },
    ]

    return (
        <div className="bg-white dark:bg-gray-900">
            <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-primary-900/20 pt-20 pb-16 sm:pt-24 sm:pb-20">
                <Container>
                    <div className="flex flex-col items-center justify-center text-center gap-12">
                        <div>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
                                Create stories. Keep your child's native language alive.
                            </h1>
                            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                                <span className="text-primary-600 dark:text-primary-400">spelli.ai</span> turns language practice into
                                collaborative stories with grammar feedback and
                                fun challenges.
                            </p>
                        </div>
                    </div>
                </Container>
            </section>
            
            <section id="features" className="py-20 sm:py-24">
                <Container>
                    <SectionHeading
                        eyebrow="Features"
                        title="Everything your child needs to practice language"
                        description="Powerful tools designed to make language learning natural, fun, and effective."
                        centered
                    />
                    <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <FeatureCard key={index} {...feature} />
                        ))}
                    </div>
                </Container>
            </section>

            <section id="how-it-works" className="py-20 sm:py-24 bg-gray-50 dark:bg-gray-800/50">
                <Container>
                    <SectionHeading
                        eyebrow="How it works"
                        title="Three simple steps to language practice"
                        description="Get started in minutes. No complicated setup required."
                        centered
                    />
                    <div className="mt-16 grid md:grid-cols-3 gap-12">
                        {steps.map((step, index) => (
                            <div key={index} className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold text-2xl mb-6">
                                    {step.number}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </Container>
            </section>

            <section id="pricing" className="py-20 sm:py-24 scroll-mt-20">
                <Container>
                    <SectionHeading
                        eyebrow="Pricing"
                        title="Choose the plan that fits your family"
                        description="All plans include a 7-day free trial. No credit card required."
                        centered
                    />

                    <div className="mt-8 flex justify-center">
                        <div className="inline-flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <button
                                onClick={() => setIsAnnual(false)}
                                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                                    !isAnnual
                                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400'
                                }`}
                                aria-pressed={!isAnnual}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setIsAnnual(true)}
                                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                                    isAnnual
                                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400'
                                }`}
                                aria-pressed={isAnnual}
                            >
                                Annual
                                <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-semibold">
                                    Save 20%
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-16 grid md:grid-cols-3 gap-8">
                        {pricingTiers.map((tier) => (
                            <PriceCard
                                key={tier.id}
                                {...tier}
                                isAnnual={isAnnual}
                            />
                        ))}
                    </div>
                </Container>
            </section>

            <section className="py-20 sm:py-24 bg-gray-50 dark:bg-gray-800/50">
                <Container>
                    <SectionHeading
                        eyebrow="Testimonials"
                        title="Loved by families around the world"
                        centered
                    />
                    <div className="mt-16 grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm"
                            >
                                <div className="flex items-center mb-4">
                                    <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-2xl">
                                        {testimonial.avatar}
                                    </div>
                                    <div className="ml-4">
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {testimonial.author}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {testimonial.role}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 italic">
                                    "{testimonial.quote}"
                                </p>
                            </div>
                        ))}
                    </div>
                </Container>
            </section>

            <section id="faq" className="py-20 sm:py-24 scroll-mt-20">
                <Container>
                    <SectionHeading
                        eyebrow="FAQ"
                        title="Frequently asked questions"
                        description="Have a different question? Contact us at support@lingg.ai"
                        centered
                    />
                    <div className="mt-16 max-w-3xl mx-auto">
                        {faqs.map((faq, index) => (
                            <FAQItem key={index} {...faq} />
                        ))}
                    </div>
                </Container>
            </section>

            <section className="py-20 sm:py-24 bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800">
                <Container>
                    <div className="text-center">
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                            Ready to start a story?
                        </h2>
                        <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
                            Join thousands of families keeping their languages
                            alive through the joy of storytelling.
                        </p>
                        <Link to="/register">
                            <Button
                                variant="secondary"
                                className="text-lg px-8 py-4 bg-white hover:bg-gray-50 text-primary-600"
                            >
                                Start your free trial
                            </Button>
                        </Link>
                    </div>
                </Container>
            </section>
        </div>
    )
}
