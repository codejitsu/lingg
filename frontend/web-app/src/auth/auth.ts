import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider'

export interface AuthConfig {
    authority: string
    client_id: string
    client_secret: string
    redirect_uri: string
    response_type: string
    scope: string
    domain: string
}

export const authConfig: AuthConfig = {
    authority: import.meta.env.VITE_AUTH_AUTHORITY,
    client_id: import.meta.env.VITE_AUTH_CLIENT_ID,
    client_secret: import.meta.env.VITE_AUTH_CLIENT_SECRET,
    redirect_uri: import.meta.env.VITE_AUTH_REDIRECT_URI,
    response_type: import.meta.env.VITE_AUTH_RESPONSE_TYPE,
    scope: import.meta.env.VITE_AUTH_SCOPE,
    domain: import.meta.env.VITE_AUTH_DOMAIN,
}

export const client: CognitoIdentityProviderClient =
    new CognitoIdentityProviderClient({
        region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    })
