import { ForgotPasswordCommand, ConfirmForgotPasswordCommand } from '@aws-sdk/client-cognito-identity-provider'
import { authConfig, client } from './auth'

export const requestPasswordReset = async (
    username: string
) => {
    const command = new ForgotPasswordCommand({
        ClientId: authConfig.client_id,
        Username: username,
    })

    const response = await client.send(command)
    if (!response.CodeDeliveryDetails) {
        throw new Error('No code delivery details')
    }

    return response.CodeDeliveryDetails
}

export const confirmPasswordReset = async (
    username: string,
    code: string,
    password: string
) => {
    const command = new ConfirmForgotPasswordCommand({
        ClientId: authConfig.client_id,
        Username: username,
        ConfirmationCode: code,
        Password: password
    })

    await client.send(command)
}
