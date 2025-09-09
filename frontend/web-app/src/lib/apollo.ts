import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'

// TODO - import creds from secure config file
const httpLink = new HttpLink({
    //uri: creds.appsync_api_url.value,
    uri: '/graphql',
    credentials: 'include',
})

export const apolloClient = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
})