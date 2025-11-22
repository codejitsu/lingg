import {
    //BrowserRouter,
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
import { Privacy } from '@/routes/Privacy'
import { Terms } from '@/routes/Terms'
import { apolloClient } from '@/lib/apollo'
import { useAuth } from '@/auth/authcontext'
import './App.css'

function App() {
    const auth = useAuth()

    const signOut = async () => {
        apolloClient.clearStore()
        auth.logout()
    }

    console.log('Auth state in App:', auth.isAuthenticated)

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
