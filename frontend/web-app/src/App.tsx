import { HashRouter, Routes, Route } from 'react-router-dom'
import { FullChatApp } from '@/components/story'
import './App.css'

function App() {
    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={
                    <div
                        style={{
                            border: '1px solid #eee',
                            borderRadius: '16px',
                            padding: '4px',
                        }}
                    >
                        <FullChatApp />
                    </div>
                } />
                <Route path="/story/:storyId" element={
                    <div
                        style={{
                            border: '1px solid #eee',
                            borderRadius: '16px',
                            padding: '4px',
                        }}
                    >
                        <FullChatApp />
                    </div>
                } />
            </Routes>        
        </HashRouter>
    )
}

export default App
