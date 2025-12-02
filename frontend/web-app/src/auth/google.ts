import { authConfig } from "./auth"

export const googleAuthUrl = () => {
    const domain = authConfig.domain
    const clientId = authConfig.client_id
    const redirectUri = authConfig.redirect_uri
    const responseType = "code"
    const scope = "openid email profile"

    const url = `${domain}/oauth2/authorize?` +
            `identity_provider=Google` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=${responseType}` +
            `&client_id=${clientId}` +
            `&scope=${encodeURIComponent(scope)}`

    console.log('Google Auth URL:', url)
    console.log('Redirect URI being used:', redirectUri)
    
    window.location.assign(url)
}

export const exchangeGoogleAuthCode = async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    
    if (!code) {
        return null
    }

    const domain = authConfig.domain
    const clientId = authConfig.client_id
    const clientSecret = authConfig.client_secret
    const redirectUri = authConfig.redirect_uri

    const tokenUrl = `${domain}/oauth2/token`

    const body = new URLSearchParams()
    body.append('grant_type', 'authorization_code')
    body.append('client_id', clientId)
    body.append('code', code)
    body.append('redirect_uri', redirectUri)
    body.append('client_secret', clientSecret)

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
                error: errorText,
                url: tokenUrl,
                requestBody: body.toString()
            })
            
            // Try to parse error response for more details
            try {
                const errorJson = JSON.parse(errorText)
                console.error('Parsed error details:', errorJson)
            } catch {
                console.error('Raw error response:', errorText)
            }
            
            return null
        }

        const tokens = await response.json()
        console.log('Token exchange successful:', Object.keys(tokens))
        return tokens
    } catch (error) {
        console.error('Error during token exchange:', error)
        return null
    }
}