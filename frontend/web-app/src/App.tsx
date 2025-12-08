import { useState, useEffect } from 'react'
import {
    HashRouter,
    Routes,
    Route,
    Navigate,
} from 'react-router-dom'
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

    useEffect(() => {
        const googleAuth = async () => {
            const tokens = await exchangeGoogleAuthCode()
            
            // TODO handle errors appropriately:
            // const tokens = await exchangeGoogleAuthCode()
            // if (tokens && tokens.id_token) {
            //     auth.loginWithGoogle(tokens)
            // } else if (code) {
            //     // Show error to user - authentication failed
            //     console.error('Google authentication failed')
            //     // Optionally redirect to login page with error message
            // }

            if (tokens && tokens.id_token) {
                auth.loginWithGoogle(tokens)
            }
        }

        if (!auth.isAuthenticated && !hasAttemptedGoogleAuth) {
            const urlParams = new URLSearchParams(window.location.search)
            const code = urlParams.get('code')
            
            if (code) {
                setHasAttemptedGoogleAuth(true)
                googleAuth()
            }
            // TODO After successful Google authentication, the user remains on the 
            // callback URL with the authorization code in the query parameters. 
            // Consider redirecting the user to a more appropriate page (e.g., /my-stories or /) 
            // and cleaning up the URL by replacing the history state to remove the 
            // authorization code from the browser's address bar. This improves user 
            // experience and prevents potential issues if the user refreshes the page.
        }
    // TODO The useEffect has auth in its dependency array, 
    // but only uses auth.isAuthenticated and auth.loginWithGoogle. 
    // This could cause unnecessary re-renders. Consider destructuring these 
    // specific properties outside the effect or using a more specific dependency array.        
    }, [auth, hasAttemptedGoogleAuth])

    // Show loading spinner while auth state is being determined
    if (auth.isLoading) {
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
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route
                            path="/my-stories"
                            element={
                                auth.isAuthenticated ? (
                                    <FullChatApp />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />
                        <Route
                            path="/story/:storyId"
                            element={
                                auth.isAuthenticated ? (
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
