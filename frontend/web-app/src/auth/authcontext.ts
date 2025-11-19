import React, { createContext, useContext, useState, useEffect} from 'react'

type AuthTokens = {
    accessToken: string
    idToken: string
    refreshToken?: string
    expiresAt: number
}

type AuthContextValue = {
    isAuthenticated: boolean
    tokens: AuthTokens | null
    user: any | null
    login: (authResult: any) => void
    logout: () => void
    accessToken: () => string | null
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tokens, setTokens] = useState<AuthTokens | null>(null)
    const [user, setUser] = useState<any | null>(null)

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
    }, [])

    const login = (authResult: any) => {
        const expiresAt = Date.now() + authResult.ExpiresIn * 1000
        const newTokens: AuthTokens = {
            accessToken: authResult.AccessToken,
            idToken: authResult.IdToken,
            refreshToken: authResult.RefreshToken,
            expiresAt
        }
        setTokens(newTokens)
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newTokens))
        const decoded = decodeJwt(authResult.IdToken)
        setUser(decoded)
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

    const value: AuthContextValue = {
        isAuthenticated: !!tokens && !isExpired(tokens.expiresAt),
        tokens,
        user,
        login,
        logout,
        accessToken
    }

    return React.createElement(
        AuthContext.Provider,
        { value },
        children
    )
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