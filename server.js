import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3000
const DIST_DIR = path.resolve(__dirname, 'dist')
const BEATS_DIR = path.resolve(__dirname, 'public/beats')

// Ensure beats folder exists
if (!fs.existsSync(BEATS_DIR)) {
  fs.mkdirSync(BEATS_DIR, { recursive: true })
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  const pathname = decodeURIComponent(url.pathname)

  // 1. Dynamic Live Container API: /api/beats
  if (pathname === '/api/beats') {
    try {
      const files = fs
        .readdirSync(BEATS_DIR)
        .filter((file) => /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file))
        .sort((a, b) => a.localeCompare(b, 'ru', { numeric: true, sensitivity: 'base' }))

      const beats = files.map((file) => ({
        filename: file,
        url: `/beats/${encodeURIComponent(file)}`,
      }))

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      })
      return res.end(JSON.stringify(beats))
    } catch {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ error: 'Failed to read beats directory' }))
    }
  }

  // 2. Stream audio directly from container beats folder: /beats/*
  if (pathname.startsWith('/beats/')) {
    const filename = pathname.replace('/beats/', '')
    const filePath = path.join(BEATS_DIR, filename)

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase()
      const contentType = MIME_TYPES[ext] || 'audio/mpeg'
      const stat = fs.statSync(filePath)
      const fileSize = stat.size
      const range = req.headers.range

      // Support HTTP range requests for smooth audio playback/seeking
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-')
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
        const chunksize = end - start + 1
        const file = fs.createReadStream(filePath, { start, end })

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': contentType,
        })
        return file.pipe(res)
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
        })
        return fs.createReadStream(filePath).pipe(res)
      }
    }
  }

  // 3. Serve Static dist files
  let safePath = path.normalize(path.join(DIST_DIR, pathname))
  if (!safePath.startsWith(DIST_DIR)) {
    res.writeHead(403)
    return res.end('Forbidden')
  }

  if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    const ext = path.extname(safePath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': contentType })
    return fs.createReadStream(safePath).pipe(res)
  }

  // 4. SPA Fallback: index.html
  const indexPath = path.join(DIST_DIR, 'index.html')
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    return fs.createReadStream(indexPath).pipe(res)
  }

  res.writeHead(404)
  res.end('Not Found')
})

server.listen(PORT, () => {
  console.log(`[BEAT4SALE] Server running on http://localhost:${PORT}`)
  console.log(`[BEAT4SALE] Live Beats Folder: ${BEATS_DIR}`)
})
