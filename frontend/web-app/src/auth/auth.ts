export interface AuthConfig {
    authority: string
    client_id: string
    redirect_uri: string
    response_type: string
    scope: string
}

export const authConfig: AuthConfig = {
    authority: import.meta.env.VITE_AUTH_AUTHORITY,
    client_id: import.meta.env.VITE_AUTH_CLIENT_ID,
    redirect_uri: import.meta.env.VITE_AUTH_REDIRECT_URI,
    response_type: import.meta.env.VITE_AUTH_RESPONSE_TYPE,
    scope: import.meta.env.VITE_AUTH_SCOPE,
}