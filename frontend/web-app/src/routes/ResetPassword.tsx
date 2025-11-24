import { useState } from 'react'
import { Button } from '@/components/landing/Button'
import { Container } from '@/components/landing/Container'
import { requestPasswordReset, confirmPasswordReset } from '@/auth/resetpassword'
import { Loader } from '@/components/prompt-kit/loader'
import { useNavigate } from 'react-router-dom'

export const ResetPassword = () => {
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [code, setCode] = useState('')
    const [codeRequested, setCodeRequested] = useState(false)
    const [password, setPassword] = useState('')
    const [passwordAgain, setPasswordAgain] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const navigate = useNavigate()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!email) {
            setError('Please fill in all fields')
            return
        }

        if (!codeRequested) {
            setIsLoading(true)

            requestPasswordReset(email)
                .then(() => {
                    setCodeRequested(true)
                    setIsLoading(false)
                })
                .catch((err) => {
                    console.error('Reset password error:', err)
                    setError('Something went wrong.')
                    setCodeRequested(true)
                    setIsLoading(false)
                })
        } else {
            if (!code || !password || !passwordAgain || password !== passwordAgain) {
                setError('Please fill in all fields')
                return
            }

            setIsLoading(true)
            confirmPasswordReset(email, code, password)
                .then(() => {
                    setIsLoading(false)
                    navigate('/login')
                })
                .catch((err) => {
                    console.error('Reset password error:', err)
                    setError('Something went wrong.')
                    setIsLoading(false)
                })
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex-col justify-center py-20 sm:px-6 lg:px-8">
            <Container className="max-w-md">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Welcome back
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Reset your password
                    </p>
                </div>

                <div className="mt-8 bg-white dark:bg-gray-800 py-8 px-6 shadow-lg rounded-xl sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                                <p className="text-sm text-red-800 dark:text-red-400">
                                    {error}
                                </p>
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div className={`${ codeRequested ? '' : 'hidden' }`}>
                            <label
                                htmlFor="code"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Code
                            </label>
                            <div className="mt-1">
                                <input
                                    id="code"
                                    name="code"
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="Enter the code"
                                />
                            </div>
                        </div>

                        <div className={`${ code !== '' ? '' : 'hidden' }`}>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className={`${ code !== '' ? '' : 'hidden' }`}>
                            <label
                                htmlFor="passwordConfirmation"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Enter password again
                            </label>
                            <div className="mt-1">
                                <input
                                    id="passwordConfirmation"
                                    name="passwordConfirmation"
                                    type="password"
                                    autoComplete="current-password"
                                    value={passwordAgain}
                                    onChange={(e) =>
                                        setPasswordAgain(e.target.value)
                                    }
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>                        

                        <div>
                            <Button type="submit" variant="primary" fullWidth>
                                Reset password
                            </Button>
                        </div>

                        <div className="text-sm justify-center gap-3 flex items-center min-h-5">
                            {isLoading && (
                                <>
                                    <Loader variant="circular" /> Sending code...
                                </>
                            )}
                        </div>
                    </form>
                </div>
            </Container>
        </div>
    )
}
