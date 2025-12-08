import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { FullChatApp } from '@/components/story'
import { Header } from '@/components/landing/Header'
import { Footer } from '@/components/landing/Footer'
import { Landing } from '@/routes/Landing'
import { Login } from '@/routes/Login'
import { Register } from '@/routes/Register'
import { ResetPassword } from '@/routes/ResetPassword'
import { Privacy } from '@/routes/Privacy'
import { Terms } from '@/routes/Terms'
import { apolloClient } from '@/lib/apollo'
import { useAuth } from '@/auth/authcontext'
import { exchangeGoogleAuthCode } from '@/auth/google'
import './App.css'

function App() {
    const auth = useAuth()
    const [hasAttemptedGoogleAuth, setHasAttemptedGoogleAuth] = useState(false)

    const signOut = async () => {
        apolloClient.clearStore()
        auth.logout()
    }

    // Extract specific auth properties to prevent unnecessary re-renders
    const { isAuthenticated, loginWithGoogle, isLoading } = auth

    useEffect(() => {
        // Only process Google auth callback once per session
        if (isAuthenticated || hasAttemptedGoogleAuth) {
            return
        }

        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')

        if (!code) {
            return
        }

        setHasAttemptedGoogleAuth(true)

        const googleAuth = async () => {
            try {
                const tokens = await exchangeGoogleAuthCode()
                
                if (tokens && tokens.id_token) {
                    loginWithGoogle(tokens)
                } else {
                    console.error('Google authentication failed - no tokens received')
                }
            } catch (error) {
                console.error('Error during Google authentication:', error)
            }
        }

        googleAuth()
    }, [isAuthenticated, loginWithGoogle, hasAttemptedGoogleAuth])

    // Show loading spinner while auth state is being determined
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <HashRouter>
            <div className="min-h-screen flex flex-col">
                <Header signOut={signOut} />
                <main className="flex-grow">
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                            path="/reset-password"
                            element={<ResetPassword />}
                        />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route
                            path="/my-stories"
                            element={
                                isAuthenticated ? (
                                    <FullChatApp />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />
                        <Route
                            path="/story/:storyId"
                            element={
                                isAuthenticated ? (
                                    <FullChatApp />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />
                    </Routes>
                </main>
                <Footer />
            </div>
        </HashRouter>
    )
}

export default App
