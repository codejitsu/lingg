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
cargo lambda build --workspace --release
````

# infrastructure

- cd infrastructure/environments/dev
- terraform destroy
- terraform apply -auto-approve

# frontend
- nvm install 22
- pnpm create vite@latest web-app -- --template react-ts
- opt for TypeScript (only)
- cd web-app
- pnpm install
- pnpm run dev

## libs
- https://ui.shadcn.com/docs/installation/vite
- pnpm add tailwindcss @tailwindcss/vite
- https://www.prompt-kit.com/docs/installation