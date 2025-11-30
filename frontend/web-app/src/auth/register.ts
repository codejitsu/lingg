import { SignUpCommand, ConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider'
import { authConfig, client } from './auth'

export const register = async (name: string, email: string, password: string) => {
    const command = new SignUpCommand({
        ClientId: authConfig.client_id,
        Username: email,
        Password: password,
        UserAttributes: [
            {
                Name: 'email',
                Value: email,
            },
            {
                Name: 'name',
                Value: name,
            },
        ],
    })

    await client.send(command)
}

export const confirmRegistration = async (
    username: string,
    code: string
) => {
    const command = new ConfirmSignUpCommand({
        ClientId: authConfig.client_id,
        Username: username,
        ConfirmationCode: code,
    })

    await client.send(command)
}