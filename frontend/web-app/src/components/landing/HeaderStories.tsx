import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { SquareLibraryIcon, LogOutIcon } from 'lucide-react'
import { Container } from './Container'
import { Button } from './Button'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '@/auth/authcontext'

export const HeaderStories = ({ signOut }: { signOut: () => Promise<void> }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const auth = useAuth()

    return (
        <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
            <Container>
                <nav
                    className="flex items-center justify-between py-4"
                    aria-label="Global"
                >
                    <div className="flex lg:flex-1">
                        <Link
                            to="/"
                            className="-m-1.5 p-1.5 flex items-center space-x-2"
                        >
                            <SquareLibraryIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                                spelli.ai
                            </span>
                        </Link>
                    </div>

                    <div className="flex lg:hidden items-center space-x-2">
                        <ThemeToggle />
                        <button
                            type="button"
                            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-300"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <span className="sr-only">Open main menu</span>
                            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                        </button>
                    </div>

                    <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:space-x-4">
                        <ThemeToggle />
                        {auth.isAuthenticated ? (
                            <div className="flex items-center space-x-2">
                                <Link to="/login" onClick={() => signOut()}>
                                    <Button variant="ghost">
                                        <LogOutIcon
                                            className="h-6 w-6 mr-2"
                                            aria-hidden="true"
                                        />
                                        Log out
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Link to="/login">
                                    <Button variant="ghost">Log in</Button>
                                </Link>
                                <Link to="/register">
                                    <Button variant="primary">
                                        Get started
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </nav>

                {mobileMenuOpen && (
                    <div className="lg:hidden fixed inset-0 z-50">
                        <div
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white dark:bg-gray-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
                            <div className="flex items-center justify-between">
                                <Link
                                    to="/"
                                    className="-m-1.5 p-1.5 flex items-center space-x-2"
                                >
                                    <SquareLibraryIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                                        spelli.ai
                                    </span>
                                </Link>
                                <button
                                    type="button"
                                    className="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-300"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <span className="sr-only">Close menu</span>
                                    <XMarkIcon
                                        className="h-6 w-6"
                                        aria-hidden="true"
                                    />
                                </button>
                            </div>
                            <div className="mt-6 flow-root">
                                <div className="-my-6 divide-y divide-gray-500/10">
                                    <div className="py-6 space-y-3">
                                        {auth.isAuthenticated ? (
                                            <Link
                                                to="/login"
                                                onClick={() => signOut()}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    fullWidth
                                                >
                                                    Log out
                                                </Button>
                                            </Link>
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                <Link to="/login">
                                                    <Button
                                                        variant="ghost"
                                                        fullWidth
                                                    >
                                                        Log in
                                                    </Button>
                                                </Link>
                                                <Link
                                                    to="/register"
                                                    onClick={() =>
                                                        setMobileMenuOpen(false)
                                                    }
                                                >
                                                    <Button
                                                        variant="primary"
                                                        fullWidth
                                                    >
                                                        Get started
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Container>
        </header>
    )
}
