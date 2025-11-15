import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { SetContextLink } from "@apollo/client/link/context";

const httpLink = new HttpLink({
    uri: '/graphql',
})

const authLink = new SetContextLink(({ headers }) => {
    const token = sessionStorage.getItem("jwt");

    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : "",
        },
    };
});

export const apolloClient = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
})
