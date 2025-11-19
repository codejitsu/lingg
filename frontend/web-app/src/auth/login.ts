import { InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import type { AuthenticationResultType } from "@aws-sdk/client-cognito-identity-provider";
import { authConfig, client } from "./auth"

export const login = async (
    username: string,
    password: string,
    loginFn: (authResult: AuthenticationResultType) => void
) => {
    const command = new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: authConfig.client_id,
        AuthParameters: {
            USERNAME: username,
            PASSWORD: password,
        },
    })

    const response = await client.send(command);
    if (!response.AuthenticationResult) {
        throw new Error("No authentication result");
    }
    loginFn(response.AuthenticationResult)
};
