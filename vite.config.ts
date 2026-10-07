import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { syncBeats } from './scripts/sync-beats.js'

function beatsFolderPlugin(): Plugin {
  return {
    name: 'beats-folder-plugin',
    configureServer(server) {
      // Sync on server start
      syncBeats()

      server.middlewares.use('/api/beats', (_req, res) => {
        const beats = syncBeats()
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        res.end(JSON.stringify(beats))
      })
    },
    buildStart() {
      syncBeats()
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    beatsFolderPlugin(),
  ],
})
