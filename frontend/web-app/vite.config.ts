/// <reference types="vitest" />
/// <reference types="vite/client" />

import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// TODO fix this for production environment
import creds from './src/lib/api.endpoint.json'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/graphql': {
        target: creds.appsync_api_url.value,
        changeOrigin: true,
        secure: true,
        headers: {
          'x-api-key': creds.aws_appsync_api_key.value,
        },
        rewrite: (path) => path.replace(/^\/graphql/, ''),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: ['node_modules'],
  },
})
