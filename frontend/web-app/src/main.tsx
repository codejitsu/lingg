import { ApolloProvider } from '@apollo/client/react'
import { apolloClient } from './lib/apollo.ts'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ApolloProvider client={apolloClient}>
            <App />
        </ApolloProvider>
    </StrictMode>,
)
