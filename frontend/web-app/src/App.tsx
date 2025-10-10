import { BrowserRouter, 
    // HashRouter, 
    Routes, Route } from 'react-router-dom'
// import { FullChatApp } from '@/components/story'
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Landing } from '@/routes/Landing';
import { Login } from '@/routes/Login';
import { Register } from '@/routes/Register';
import { Privacy } from '@/routes/Privacy';
import { Terms } from '@/routes/Terms';
import './App.css'

function App() {
    return (
        <BrowserRouter>
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
            </Routes>
            </main>
            <Footer />
        </div>
        </BrowserRouter>        
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
