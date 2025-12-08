import React, { createContext, useContext, useState, useEffect } from 'react'
import type { AuthenticationResultType } from '@aws-sdk/client-cognito-identity-provider'

type AuthTokens = {
    accessToken: string
    idToken: string
    refreshToken?: string
    expiresAt: number
}

type AuthContextValue = {
    isAuthenticated: boolean
    isLoading: boolean
    tokens: AuthTokens | null
    user: any | null
    login: (authResult: AuthenticationResultType) => void
    logout: () => void
    accessToken: () => string | null
    // TODO introduce a proper type for tokens:
    // interface OAuthTokenResponse {
    //     access_token: string
    //     id_token: string
    //     refresh_token?: string
    //     expires_in: number
    //     token_type: string
    // }
    loginWithGoogle: (tokens: any) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = 'auth_tokens'

function decodeJwt(token: string): any {
    try {
        const payload = token.split('.')[1]
        const replaced = payload.replace(/-/g, '+').replace(/_/g, '/')
        const decoded = atob(replaced)
        return JSON.parse(decoded)
    } catch {
        return null
    }
}

function isExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [tokens, setTokens] = useState<AuthTokens | null>(null)
    const [user, setUser] = useState<any | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const storedTokens = window.localStorage.getItem(STORAGE_KEY)
        if (storedTokens) {
            const parsedTokens: AuthTokens = JSON.parse(storedTokens)
            if (!isExpired(parsedTokens.expiresAt)) {
                setTokens(parsedTokens)
                const decoded = decodeJwt(parsedTokens.idToken)
                setUser(decoded)
            } else {
                window.localStorage.removeItem(STORAGE_KEY)
            }
        }
        setIsLoading(false)
    }, [])

    const login = (authResult: AuthenticationResultType) => {
        const expiresIn = authResult.ExpiresIn ?? 3600
        const expiresAt = Date.now() + expiresIn * 1000

        const newTokens: AuthTokens = {
            accessToken: authResult.AccessToken ?? '',
            idToken: authResult.IdToken ?? '',
            refreshToken: authResult.RefreshToken,
            expiresAt,
        }

        setTokens(newTokens)

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newTokens))
        const decoded = decodeJwt(authResult.IdToken ?? '')

        setUser(decoded)
        setIsLoading(false)
    }

    const logout = () => {
        setTokens(null)
        setUser(null)
        window.localStorage.removeItem(STORAGE_KEY)
    }

    const accessToken = (): string | null => {
        if (tokens && !isExpired(tokens.expiresAt)) {
            return tokens.accessToken
        }

        return null
    }

    // TODO: The loginWithGoogle function parameter has type any, 
    // which bypasses TypeScript's type safety. Define a proper interface for the 
    // token response structure (e.g., GoogleAuthTokens or OAuthTokenResponse) 
    // with the expected fields: access_token, id_token, refresh_token, and expires_in.
    const loginWithGoogle = (tokens: any) => {
        // TODO The loginWithGoogle function duplicates significant logic from the existing 
        // login function (lines 63-81). Both functions perform similar token storage, 
        // JWT decoding, and state updates. Consider refactoring to extract a shared helper 
        // function (e.g., storeAuthTokens) that handles the common logic, accepting 
        // normalized token data regardless of the authentication method. This would improve 
        // maintainability and reduce the risk of inconsistencies between authentication flows.

        console.log('Logging in with Google tokens:', tokens)

        const expiresIn = tokens.expires_in ?? 3600
        const expiresAt = Date.now() + expiresIn * 1000

        // TODO The function should validate that required tokens exist before proceeding. 
        // If tokens.id_token or tokens.access_token are missing, the function should 
        // throw an error or handle the case gracefully rather than storing empty strings.
        const newTokens: AuthTokens = {
            accessToken: tokens.access_token ?? '',
            idToken: tokens.id_token ?? '',
            refreshToken: tokens.refresh_token ?? '',
            expiresAt,
        }

        setTokens(newTokens)

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newTokens))
        const decoded = decodeJwt(tokens.id_token ?? '')

        setUser(decoded)
        setIsLoading(false)
    }

    const value: AuthContextValue = {
        isAuthenticated: !!tokens && !isExpired(tokens.expiresAt),
        isLoading,
        tokens,
        user,
        login,
        logout,
        accessToken,
        loginWithGoogle
    }

    return React.createElement(AuthContext.Provider, { value }, children)
}

export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export { STORAGE_KEY }
export type { AuthTokens }
