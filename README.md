# lingg.ai

online AI based language learning project

# Explore API

- check out https://github.com/graphql/graphiql
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

# Backend

Building backend:
````
cargo lambda build --workspace --release
````

## Possible issues
- set -x OPENSSL_DIR (brew --prefix openssl)

# Infrastructure

- cd infrastructure/environments/dev
- terraform destroy
- terraform apply -auto-approve

# Frontend
- nvm install 22
- pnpm create vite@latest web-app -- --template react-ts
- opt for TypeScript (only)
- cd web-app
- pnpm install
- pnpm run dev

## libs
- https://ui.shadcn.com/docs/installation/vite
- pnpm dlx shadcn@latest add command popover
- pnpm add tailwindcss @tailwindcss/vite
- https://www.prompt-kit.com/docs/installation
- pnpm dlx shadcn add "https://prompt-kit.com/c/scroll-button.json"
- pnpm add -D prettier eslint eslint-config-prettier eslint-plugin-react eslint-plugin-react-hooks

## local development
- add api.endpoint.json to .gitignore
- store endpoint url and the auth key: ```terraform output -json > ../../../frontend/web-app/src/lib/api.endpoint.json```

## testing
- pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event @types/jest

## Auth
- pnpm add oidc-client-ts --save
- pnpm add react-oidc-context --save