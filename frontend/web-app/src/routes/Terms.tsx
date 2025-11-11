import { Container } from '@/components/landing/Container'

export const Terms = () => {
    return (
        <div className="bg-white dark:bg-gray-900 py-16 sm:py-24">
            <Container className="max-w-4xl">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
                        Terms and Conditions
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Last updated:{' '}
                        {new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Agreement to Terms
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            By accessing or using Lingg.ai, you agree to be
                            bound by these Terms and Conditions. If you disagree
                            with any part of these terms, you may not access the
                            service. Parents or legal guardians must be 18 years
                            or older to create an account.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Account Registration
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                            When you create an account with us, you must provide
                            accurate, complete, and current information. You are
                            responsible for:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                            <li>
                                Maintaining the confidentiality of your account
                                and password
                            </li>
                            <li>Restricting access to your account</li>
                            <li>
                                Accepting responsibility for all activities
                                under your account
                            </li>
                            <li>Supervising your child's use of the service</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Subscription and Billing
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                            Lingg.ai offers both free and paid subscription
                            plans:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                            <li>
                                Free plans have limited features as described on
                                our pricing page
                            </li>
                            <li>
                                Paid subscriptions are billed monthly or
                                annually based on your selection
                            </li>
                            <li>
                                All fees are in Euros (EUR) unless otherwise
                                stated
                            </li>
                            <li>
                                You will be billed at the start of each billing
                                cycle
                            </li>
                            <li>
                                Subscriptions automatically renew unless
                                canceled before the renewal date
                            </li>
                            <li>We offer a 7-day free trial for paid plans</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Cancellation and Refunds
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            You may cancel your subscription at any time from
                            your account settings. Cancellations take effect at
                            the end of the current billing period. You will
                            continue to have access to paid features until the
                            end of your billing period. We do not offer refunds
                            for partial months or years. If you cancel during
                            your free trial, you will not be charged.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Acceptable Use
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                            You agree not to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                            <li>Use the service for any unlawful purpose</li>
                            <li>
                                Attempt to gain unauthorized access to our
                                systems
                            </li>
                            <li>Interfere with or disrupt the service</li>
                            <li>
                                Share inappropriate content through story
                                creation
                            </li>
                            <li>Impersonate another person or entity</li>
                            <li>Violate any applicable laws or regulations</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Intellectual Property
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            The service and its original content, features, and
                            functionality are owned by Lingg.ai and are
                            protected by international copyright, trademark, and
                            other intellectual property laws. The stories
                            created by your child remain your property, and we
                            claim no ownership over user-generated content.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Content Monitoring
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            While we strive to provide a safe environment for
                            children, we cannot monitor all user-generated
                            content in real-time. Parents are responsible for
                            supervising their child's use of the service. We
                            reserve the right to remove any content that
                            violates our policies or is deemed inappropriate.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Limitation of Liability
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            Lingg.ai is provided "as is" without warranties of
                            any kind. We do not guarantee that the service will
                            be uninterrupted, secure, or error-free. To the
                            maximum extent permitted by law, we shall not be
                            liable for any indirect, incidental, special,
                            consequential, or punitive damages resulting from
                            your use of the service.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Changes to Terms
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            We reserve the right to modify these terms at any
                            time. We will notify users of any material changes
                            by email or through a notice on our website. Your
                            continued use of the service after such changes
                            constitutes acceptance of the new terms.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Termination
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            We may terminate or suspend your account and access
                            to the service immediately, without prior notice,
                            for conduct that we believe violates these Terms or
                            is harmful to other users, us, or third parties, or
                            for any other reason at our sole discretion.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Governing Law
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            These Terms shall be governed by and construed in
                            accordance with the laws of [Your Jurisdiction],
                            without regard to its conflict of law provisions.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Contact Us
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            If you have any questions about these Terms and
                            Conditions, please contact us at:
                        </p>
                        <ul className="list-none mt-4 space-y-2 text-gray-600 dark:text-gray-300">
                            <li>Email: legal@lingg.ai</li>
                            <li>Address: [Your Company Address]</li>
                        </ul>
                    </section>
                </div>
            </Container>
        </div>
    )
}
