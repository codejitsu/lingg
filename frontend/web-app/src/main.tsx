import { ApolloProvider } from '@apollo/client/react'
import { apolloClient } from '@/lib/apollo.ts'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from '@/auth/authcontext.ts'

import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider>
            <ApolloProvider client={apolloClient}>
                <App />
            </ApolloProvider>
        </AuthProvider>
    </StrictMode>,
)
