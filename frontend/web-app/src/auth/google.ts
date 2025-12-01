import { authConfig } from "./auth"

export const googleAuthUrl = () => {
    const domain = authConfig.domain
    const clientId = authConfig.client_id
    const redirectUri = encodeURIComponent(authConfig.redirect_uri)
    const responseType = "code"
    const scope = encodeURIComponent("openid email profile")

    const url = `${domain}/oauth2/authorize?` +
            `identity_provider=Google&redirect_uri=${redirectUri}` +
            `&response_type=${responseType}` +
            `&client_id=${clientId}` +
            `&scope=${scope}`

    window.location.assign(url)
}