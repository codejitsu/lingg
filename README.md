# lingg

online AI based language learning project

# development

- checkout https://github.com/graphql/graphiql
- change this line https://github.com/graphql/graphiql/blob/main/examples/graphiql-cdn/index.html#L70

````
      const fetcher = createGraphiQLFetcher({
        url: 'PUT-APPSYNC-URL-HERE',
        headers: {
            'x-api-key': 'PUT-TOKEN-HERE'
      }
      });
````

- Open index.html in the browser

# backend

Building backend:
````
cargo lambda build --workspace --release --compiler cargo
````
