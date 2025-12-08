import { Link } from 'react-router-dom'
import { SquareLibraryIcon } from 'lucide-react'
import { Container } from './Container'
import { HashLink } from 'react-router-hash-link'

export const Footer = () => {
    const quickLinks = [
        { name: 'Features', href: '/#features' },
        { name: 'How it works', href: '/#how-it-works' },
        { name: 'Pricing', href: '/#pricing' },
        { name: 'FAQ', href: '/#faq' },
        { name: 'Privacy', href: '/privacy' },
        { name: 'Terms', href: '/terms' },
    ]

    return (
        <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <Container>
                <div className="py-12 md:py-16">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center space-x-2 mb-4">
                                <SquareLibraryIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                                <span className="text-xl font-bold text-gray-900 dark:text-white">
                                    spelli.ai
                                </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
                                Create stories and keep your child's native
                                language alive through interactive,
                                collaborative storytelling with grammar
                                feedback.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                                Quick Links
                            </h3>
                            <ul className="space-y-3">
                                {quickLinks.slice(0, 4).map((link) => (
                                    <li key={link.name}>
                                        <HashLink
                                            to={link.href}
                                            className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                                        >
                                            {link.name}
                                        </HashLink>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                                Legal
                            </h3>
                            <ul className="space-y-3">
                                {quickLinks.slice(4).map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            to={link.href}
                                            className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
                            © {new Date().getFullYear()} spelli.ai. All rights
                            reserved.
                        </p>
                    </div>
                </div>
            </Container>
        </footer>
    )
}
