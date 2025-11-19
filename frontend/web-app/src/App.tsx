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
import  { useAuth } from '@/auth/authcontext'
import './App.css'

function App() {    
    const auth = useAuth()

    const signOut = async () => {
        apolloClient.clearStore()
        auth.logout()
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
