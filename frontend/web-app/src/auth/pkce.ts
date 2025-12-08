/**
 * PKCE (Proof Key for Code Exchange) utilities for secure OAuth flows in SPAs
 * RFC 7636: https://tools.ietf.org/html/rfc7636
 */

/**
 * Generates a cryptographically random string for PKCE code verifier
 * @param length The length of the code verifier (43-128 characters)
 * @returns A URL-safe random string
 */
export const generateCodeVerifier = (length: number = 128): string => {
    if (length < 43 || length > 128) {
        throw new Error('Code verifier length must be between 43 and 128 characters')
    }

    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
    const values = crypto.getRandomValues(new Uint8Array(length))
    return Array.from(values)
        .map(x => possible[x % possible.length])
        .join('')
}

/**
 * Creates a SHA256 hash of the code verifier and base64url encodes it
 * @param codeVerifier The code verifier string
 * @returns Promise that resolves to the code challenge
 */
export const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(codeVerifier)
    const digest = await crypto.subtle.digest('SHA-256', data)

    // Convert to base64url encoding
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
}

/**
 * Stores PKCE parameters in sessionStorage for the duration of the auth flow
 */
export const storePKCEParams = (codeVerifier: string, state: string): void => {
    sessionStorage.setItem('pkce_code_verifier', codeVerifier)
    sessionStorage.setItem('oauth_state', state)
}

/**
 * Retrieves and clears PKCE parameters from sessionStorage
 */
export const retrieveAndClearPKCEParams = (): { codeVerifier: string | null; state: string | null } => {
    const codeVerifier = sessionStorage.getItem('pkce_code_verifier')
    const state = sessionStorage.getItem('oauth_state')

    // Clean up
    sessionStorage.removeItem('pkce_code_verifier')
    sessionStorage.removeItem('oauth_state')
    
    return { codeVerifier, state }
}

/**
 * Generates a random state parameter for OAuth security
 */
export const generateState = (): string => {
    return generateCodeVerifier(32)
}