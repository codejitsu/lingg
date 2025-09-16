import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { FullChatApp } from '@/components/story'
import './App.css'

function App() {
    const { storyId } = useParams<{ storyId: string }>()
    
    return (
        <BrowserRouter>
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
                        <FullChatApp currentStoryId={storyId} />
                    </div>
                } />
            </Routes>        
        </BrowserRouter>
    )
}

export default App
