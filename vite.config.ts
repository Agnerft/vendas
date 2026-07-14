import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createBestPanelTrial, sendJson } from './server/bestPanelProxy.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'best-panel-dev-proxy',
      configureServer(server) {
        server.middlewares.use('/api/create-trial', async (request, response) => {
          if (request.method === 'OPTIONS') {
            sendJson(response, 204, {})
            return
          }

          if (request.method !== 'POST') {
            sendJson(response, 405, { message: 'Metodo nao permitido.' })
            return
          }

          try {
            const result = await createBestPanelTrial(request)
            sendJson(response, result.status, result.body)
          } catch (error) {
            sendJson(response, 500, {
              message: error instanceof Error ? error.message : 'Erro inesperado no proxy.',
            })
          }
        })
      },
    },
  ],
})
