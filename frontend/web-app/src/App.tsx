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
import { useAuth } from 'react-oidc-context'
import { signoutConfig } from '@/auth/signout'
import { apolloClient } from '@/lib/apollo'
import './App.css'
import { useEffect } from 'react'

function App() {
    const auth = useAuth()

    const signOut = async () => {
        await auth.removeUser()

        apolloClient.clearStore()
        sessionStorage.removeItem("jwt")

        window.location.href = `${signoutConfig.domain}/logout?client_id=${signoutConfig.client_id}&logout_uri=${encodeURIComponent(signoutConfig.logout_uri)}`
    }

    useEffect(() => {
        if (auth.isAuthenticated) {
            sessionStorage.setItem("jwt", auth?.user?.access_token || "")
        }
    }, [auth.isAuthenticated, auth?.user?.access_token])

    switch (auth.activeNavigator) {
        case 'signinSilent':
            return <div>Signing you in...</div>
        case 'signoutRedirect':
            return <div>Signing you out...</div>
    }

    if (auth.isLoading) {
        return <div>Loading...</div>
    }

    if (auth.error) {
        return <div>Oops... {auth.error.message}</div>
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
                            path="/story"
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
        // <HashRouter>
        //     <Routes>
        //         <Route
        //             path="/"
        //             element={
        //                 <div
        //                     style={{
        //                         border: '1px solid #eee',
        //                         borderRadius: '16px',
        //                         padding: '4px',
        //                     }}
        //                 >
        //                     <FullChatApp />
        //                 </div>
        //             }
        //         />
        //         <Route
        //             path="#"
        //             element={
        //                 <div
        //                     style={{
        //                         border: '1px solid #eee',
        //                         borderRadius: '16px',
        //                         padding: '4px',
        //                     }}
        //                 >
        //                     <FullChatApp />
        //                 </div>
        //             }
        //         />
        //         <Route
        //             path="/story/:storyId"
        //             element={
        //                 <div
        //                     style={{
        //                         border: '1px solid #eee',
        //                         borderRadius: '16px',
        //                         padding: '4px',
        //                     }}
        //                 >
        //                     <FullChatApp />
        //                 </div>
        //             }
        //         />
        //     </Routes>
        // </HashRouter>
    )
}

export default App
