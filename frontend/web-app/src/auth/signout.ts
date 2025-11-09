export interface SignoutConfig {
    client_id: string
    logout_uri: string
    domain: string
}

export const signoutConfig: SignoutConfig = {
    client_id: import.meta.env.VITE_AUTH_CLIENT_ID,
    logout_uri: import.meta.env.VITE_AUTH_LOGOUT_URI,
    domain: import.meta.env.VITE_AUTH_DOMAIN,
}