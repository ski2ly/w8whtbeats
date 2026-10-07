import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

function getBeatsFiles(): Array<{ filename: string; url: string }> {
  const publicBeatsDir = path.resolve(process.cwd(), 'public/beats')
  if (!fs.existsSync(publicBeatsDir)) {
    fs.mkdirSync(publicBeatsDir, { recursive: true })
  }

  const rootBeatsDir = path.resolve(process.cwd(), 'beats')
  if (!fs.existsSync(rootBeatsDir)) {
    fs.mkdirSync(rootBeatsDir, { recursive: true })
  }

  const seen = new Set<string>()
  const result: Array<{ filename: string; url: string }> = []

  // Check root beats/ and sync to public/beats/
  if (fs.existsSync(rootBeatsDir)) {
    const files = fs.readdirSync(rootBeatsDir).filter((file) => /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file))
    for (const file of files) {
      const src = path.join(rootBeatsDir, file)
      const dest = path.join(publicBeatsDir, file)
      if (!fs.existsSync(dest)) {
        try { fs.copyFileSync(src, dest) } catch {}
      }
    }
  }

  // Scan all audio files in public/beats/
  const allFiles = fs.readdirSync(publicBeatsDir).filter((file) => /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file))
  for (const file of allFiles) {
    if (!seen.has(file)) {
      seen.add(file)
      result.push({
        filename: file,
        url: `/beats/${encodeURIComponent(file)}`,
      })
    }
  }

  return result
}

function beatsFolderPlugin(): Plugin {
  return {
    name: 'beats-folder-plugin',
    configureServer(server) {
      server.middlewares.use('/api/beats', (_req, res) => {
        const beats = getBeatsFiles()
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        res.end(JSON.stringify(beats))
      })
    },
    buildStart() {
      const beats = getBeatsFiles()
      fs.writeFileSync(
        path.resolve(process.cwd(), 'public/beats.json'),
        JSON.stringify(beats, null, 2)
      )
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
