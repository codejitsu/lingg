import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { SetContextLink } from "@apollo/client/link/context";
import { STORAGE_KEY } from '@/auth/authcontext'
import type { AuthTokens } from '@/auth/authcontext'

const httpLink = new HttpLink({
    uri: '/graphql',
})

const authLink = new SetContextLink(({ headers }) => {
    const tokens = window.localStorage.getItem(STORAGE_KEY) || '{}'

    const parsedTokens: AuthTokens = JSON.parse(tokens)

    console.log("Apollo Auth Tokens:", parsedTokens.accessToken)

    return {
        headers: {
            ...headers,
            authorization: parsedTokens.idToken ? `Bearer ${parsedTokens.idToken}` : "",
        },
    };
});

export const apolloClient = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
})
