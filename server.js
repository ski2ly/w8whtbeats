import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = Number(process.env.PORT) || 3000
const DIST_DIR = path.resolve(__dirname, 'dist')
const BEATS_DIR = path.resolve(__dirname, 'public/beats')

// Ensure beats folder exists
if (!fs.existsSync(BEATS_DIR)) {
  fs.mkdirSync(BEATS_DIR, { recursive: true })
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.flac': 'audio/flac',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const ALLOWED_AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'])

// Set production HTTP security headers
const setSecurityHeaders = (res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
}

const server = http.createServer((req, res) => {
  setSecurityHeaders(res)

  // Only allow GET and HEAD requests for a static showcase
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' })
    return res.end('Method Not Allowed')
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  let pathname = '/'
  try {
    pathname = decodeURIComponent(url.pathname)
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain' })
    return res.end('Bad Request')
  }

  // 1. Healthcheck endpoint for Railway uptime checks
  if (pathname === '/health' || pathname === '/api/health') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    })
    return res.end(JSON.stringify({ status: 'ok', uptime: Math.round(process.uptime()) }))
  }

  // 2. Dynamic Live Container API: /api/beats
  if (pathname === '/api/beats') {
    try {
      const manifestPath = path.resolve(__dirname, 'public/beats.json')
      if (fs.existsSync(manifestPath)) {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        })
        return res.end(fs.readFileSync(manifestPath, 'utf-8'))
      }

      const files = fs
        .readdirSync(BEATS_DIR)
        .filter((file) => {
          const ext = path.extname(file).toLowerCase()
          return ALLOWED_AUDIO_EXTENSIONS.has(ext)
        })
        .sort((a, b) => a.localeCompare(b, 'ru', { numeric: true, sensitivity: 'base' }))

      const beats = files.map((file) => ({
        filename: file,
        url: `/beats/${encodeURIComponent(file)}`,
      }))

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      })
      return res.end(JSON.stringify(beats))
    } catch {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
      return res.end(JSON.stringify({ error: 'Failed to read beats directory' }))
    }
  }

  // 3. Stream audio strictly from beats folder with Directory Traversal Protection: /beats/*
  if (pathname.startsWith('/beats/')) {
    const rawFilename = pathname.slice('/beats/'.length)
    const safeFilePath = path.resolve(BEATS_DIR, rawFilename)

    // Security check: must reside inside BEATS_DIR and have an allowed audio extension
    const isInsideBeatsDir =
      safeFilePath.startsWith(BEATS_DIR + path.sep) || safeFilePath.startsWith(BEATS_DIR + '/')
    const ext = path.extname(safeFilePath).toLowerCase()

    if (!isInsideBeatsDir || !ALLOWED_AUDIO_EXTENSIONS.has(ext)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' })
      return res.end('Forbidden')
    }

    if (fs.existsSync(safeFilePath) && fs.statSync(safeFilePath).isFile()) {
      const contentType = MIME_TYPES[ext] || 'audio/mpeg'
      const stat = fs.statSync(safeFilePath)
      const fileSize = stat.size
      const range = req.headers.range

      // Support HTTP range requests for smooth audio playback/seeking
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-')
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1

        if (isNaN(start) || start >= fileSize || (parts[1] && end >= fileSize)) {
          res.writeHead(416, {
            'Content-Range': `bytes */${fileSize}`,
          })
          return res.end()
        }

        const chunksize = end - start + 1
        const file = fs.createReadStream(safeFilePath, { start, end })

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        })
        return file.pipe(res)
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=86400',
        })
        return fs.createReadStream(safeFilePath).pipe(res)
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      return res.end('Track Not Found')
    }
  }

  // 4. Serve Static dist files with Directory Traversal Protection
  // Strip leading slash for proper resolution
  const relativePath = pathname.startsWith('/') ? pathname.slice(1) : pathname
  const safeDistPath = path.resolve(DIST_DIR, relativePath)
  const isInsideDist =
    safeDistPath === DIST_DIR ||
    safeDistPath.startsWith(DIST_DIR + path.sep) ||
    safeDistPath.startsWith(DIST_DIR + '/')

  if (!isInsideDist) {
    res.writeHead(403, { 'Content-Type': 'text/plain' })
    return res.end('Forbidden')
  }

  if (fs.existsSync(safeDistPath) && fs.statSync(safeDistPath).isFile()) {
    const ext = path.extname(safeDistPath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    // Immutable caching for hashed assets, revalidate for others
    const isImmutableAsset = pathname.startsWith('/assets/')
    const cacheControl = isImmutableAsset
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=3600'

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    })
    return fs.createReadStream(safeDistPath).pipe(res)
  }

  // 5. SPA Fallback: index.html (never aggressively cached)
  const indexPath = path.join(DIST_DIR, 'index.html')
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    })
    return fs.createReadStream(indexPath).pipe(res)
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('Not Found')
})

// Graceful shutdown handling for container platforms like Railway
const shutdown = (signal) => {
  console.log(`[BEAT4SALE] Received ${signal}, shutting down gracefully...`)
  server.close(() => {
    console.log('[BEAT4SALE] All connections closed. Exiting process.')
    process.exit(0)
  })
  setTimeout(() => {
    console.error('[BEAT4SALE] Forced shutdown after timeout.')
    process.exit(1)
  }, 5000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[BEAT4SALE] Server running on http://0.0.0.0:${PORT}`)
  console.log(`[BEAT4SALE] Live Beats Folder: ${BEATS_DIR}`)
})
