import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import vitePluginJavascriptObfuscator from 'vite-plugin-javascript-obfuscator'
import basicSsl from '@vitejs/plugin-basic-ssl'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  return {
    plugins: [
      basicSsl(),
      react()
    ],
    server: {
      port: 6000,
      https: true,
      proxy: {
        '/api': {
          target: 'https://localhost:6001',
          changeOrigin: true,
          secure: false // Since the backend has a self-signed or invalid cert locally
        }
      }
    },
    build: {
      sourcemap: false
    }
  }
})
