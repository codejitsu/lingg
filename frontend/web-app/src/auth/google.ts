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

/**
 * Exchanges the Google OAuth authorization code for tokens via AWS Cognito.
 *
 * This function is part of the OAuth 2.0 authorization code flow with PKCE.
 * It retrieves the authorization code and state from the URL, validates them,
 * and exchanges the code for tokens (ID, access, refresh) from Cognito.
 *
 * @returns {Promise<Object|null>} Resolves to the tokens object on success, or null on failure.
 *
 * Side effects:
 * - Displays alerts to the user on error or session expiry.
 * - Cleans up PKCE parameters from session storage.
 * - May redirect the user to the login page if the session has expired.
 */
export const exchangeGoogleAuthCode = async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const stateParam = urlParams.get('state')
    
    if (!code) {
        return null
    }

    const { codeVerifier, state } = retrieveAndClearPKCEParams()
    
    // TODO Using alert() and window.alert() for error handling provides a poor 
    // user experience and can be blocked by browsers. Consider implementing a 
    // proper error notification system (e.g., toast notifications, error banners) 
    // to display authentication errors to users.
    if (!codeVerifier) {
        alert("Your login session has expired. Please try logging in again.");
        await googleAuthUrl();
        return null;
    }

    if (state !== stateParam) {
        console.error('State parameter mismatch')
        // TODO Using alert() and window.alert() for error handling provides a poor 
        // user experience and can be blocked by browsers. Consider implementing a 
        // proper error notification system (e.g., toast notifications, error banners) 
        // to display authentication errors to users.        
        window.alert('Security error: State parameter mismatch detected. Please try logging in again.');
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

    // TODO When token exchange fails or returns null, the function silently 
    // returns without informing the user of the failure. After logging errors 
    // to the console, consider providing user-facing feedback 
    // (e.g., displaying an error message) so users understand that authentication 
    // failed and what they should do next. The current implementation leaves users 
    // uncertain about the authentication state.
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

        // Remove sensitive OAuth parameters from the URL
        if (window && window.history && window.location) {
            const url = new URL(window.location.href);
            url.searchParams.delete('code');
            url.searchParams.delete('state');
            window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
        }
        return tokens
    } catch (error) {
        console.error('Error during token exchange:', error)
        return null
    }
}