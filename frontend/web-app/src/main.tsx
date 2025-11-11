import { ApolloProvider } from '@apollo/client/react'
import { apolloClient } from '@/lib/apollo.ts'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context'
import { authConfig } from '@/auth/auth.ts'

import './index.css'
import App from './App.tsx'

const authConfigWithSignin = {
    ...authConfig,
    onSigninCallback: (user) => {
        window.history.replaceState({}, document.title, window.location.pathname);
    },
};

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider {...authConfigWithSignin}>
            <ApolloProvider client={apolloClient}>
                <App />
            </ApolloProvider>
        </AuthProvider>
    </StrictMode>,
)
