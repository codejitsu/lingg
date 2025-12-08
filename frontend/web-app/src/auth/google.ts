import { authConfig } from "./auth"
import { 
    generateCodeVerifier, 
    generateCodeChallenge, 
    generateState, 
    storePKCEParams,
    retrieveAndClearPKCEParams
} from "./pkce"

/**
 * Redirects the user to the Google OAuth authorization page via AWS Cognito.
 * This initiates the OAuth 2.0 authorization code flow with PKCE.
 * 
 * Side effect: Navigates the browser to the Cognito authorization endpoint.
 */
export const googleAuthUrl = async () => {
    const domain = authConfig.domain
    const clientId = authConfig.client_id
    const redirectUri = authConfig.redirect_uri
    const responseType = "code"
    const scope = "openid email profile"

    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    const state = generateState()

    // Store PKCE parameters for later use
    storePKCEParams(codeVerifier, state)

    const params = new URLSearchParams({
        identity_provider: 'Google',
        redirect_uri: redirectUri,
        response_type: responseType,
        client_id: clientId,
        scope: scope,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state: state
    });
    const url = `${domain}/oauth2/authorize?${params.toString()}`
    
    window.location.assign(url)
}

export const exchangeGoogleAuthCode = async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const stateParam = urlParams.get('state')
    
    if (!code) {
        return null
    }

    const { codeVerifier, state } = retrieveAndClearPKCEParams()
    
    if (!codeVerifier) {
        return null
    }

    if (state !== stateParam) {
        console.error('State parameter mismatch')
        return null
    }

    const domain = authConfig.domain
    const clientId = authConfig.client_id
    const redirectUri = authConfig.redirect_uri

    const tokenUrl = `${domain}/oauth2/token`

    const body = new URLSearchParams()
    body.append('grant_type', 'authorization_code')
    body.append('client_id', clientId)
    body.append('code', code)
    body.append('redirect_uri', redirectUri)
    body.append('code_verifier', codeVerifier)

    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Token exchange failed:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            })
            return null
        }

        const tokens = await response.json()
        
        return tokens
    } catch (error) {
        console.error('Error during token exchange:', error)
        return null
    }
}