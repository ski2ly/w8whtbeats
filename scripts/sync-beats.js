import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT_DIR = path.resolve(__dirname, '..')
const BEATS_DIR = path.resolve(ROOT_DIR, 'beats')
const PUBLIC_BEATS_DIR = path.resolve(ROOT_DIR, 'public/beats')
const MANIFEST_PATH = path.resolve(ROOT_DIR, 'public/beats.json')
const SRC_MANIFEST_PATH = path.resolve(ROOT_DIR, 'src/data/beatsManifest.json')

const ALLOWED_EXTS = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'])

// Pure Node.js MP3 duration extractor
function getMp3Duration(buf) {
  let offset = 0
  if (buf.length > 10 && buf.toString('ascii', 0, 3) === 'ID3') {
    const size = (buf[6] << 21) | (buf[7] << 14) | (buf[8] << 7) | buf[9]
    offset = 10 + size
  }
  let totalSamples = 0
  let sampleRate = 44100
  let foundFrame = false
  while (offset < buf.length - 4) {
    if (buf[offset] === 0xff && (buf[offset + 1] & 0xe0) === 0xe0) {
      const b1 = buf[offset + 1]
      const b2 = buf[offset + 2]
      const version = (b1 >> 3) & 3 // 3 = MPEG1, 2 = MPEG2
      const layer = (b1 >> 1) & 3 // 1 = Layer III
      if (version === 1 || layer === 0) {
        offset++
        continue
      }
      const bitrateIdx = (b2 >> 4) & 0xf
      const srateIdx = (b2 >> 2) & 3
      const padding = (b2 >> 1) & 1
      if (bitrateIdx === 0 || bitrateIdx === 15 || srateIdx === 3) {
        offset++
        continue
      }

      const srates = version === 3 ? [44100, 48000, 32000] : [22050, 24000, 16000]
      sampleRate = srates[srateIdx] || 44100

      const bitrates = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0]
      const bitrate = bitrates[bitrateIdx] * 1000
      const samplesPerFrame = version === 3 ? 1152 : 576
      const frameLen = Math.floor(((samplesPerFrame / 8) * bitrate) / sampleRate) + padding
      if (frameLen <= 0) {
        offset++
        continue
      }

      totalSamples += samplesPerFrame
      offset += frameLen
      foundFrame = true
    } else {
      offset++
    }
  }
  return foundFrame && sampleRate > 0 ? +(totalSamples / sampleRate).toFixed(2) : 0
}

// Pure Node.js WAV duration extractor
function getWavDuration(buf) {
  if (buf.length < 44) return 0
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') return 0
  let offset = 12
  let byteRate = 0
  let dataSize = 0
  while (offset < buf.length - 8) {
    const chunkId = buf.toString('ascii', offset, offset + 4)
    const chunkSize = buf.readUInt32LE(offset + 4)
    if (chunkId === 'fmt ') {
      byteRate = buf.readUInt32LE(offset + 16)
    } else if (chunkId === 'data') {
      dataSize = chunkSize
      break
    }
    offset += 8 + chunkSize
  }
  return byteRate > 0 && dataSize > 0 ? +(dataSize / byteRate).toFixed(2) : 0
}

function getAudioDuration(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase()
    const buf = fs.readFileSync(filePath)
    if (ext === '.mp3') return getMp3Duration(buf)
    if (ext === '.wav') return getWavDuration(buf)
  } catch {}
  return 0
}

export function syncBeats() {
  console.log('[SYNC] Синхронизация битов...')

  if (!fs.existsSync(BEATS_DIR)) {
    fs.mkdirSync(BEATS_DIR, { recursive: true })
  }
  if (!fs.existsSync(PUBLIC_BEATS_DIR)) {
    fs.mkdirSync(PUBLIC_BEATS_DIR, { recursive: true })
  }

  // 1. Читаем все валидные аудиофайлы из папки beats/
  const sourceFiles = fs
    .readdirSync(BEATS_DIR)
    .filter((file) => ALLOWED_EXTS.has(path.extname(file).toLowerCase()))

  const sourceFileSet = new Set(sourceFiles)

  // 2. Очищаем public/beats/ от всех файлов, которых НЕТ в beats/
  const existingPublicFiles = fs
    .readdirSync(PUBLIC_BEATS_DIR)
    .filter((file) => ALLOWED_EXTS.has(path.extname(file).toLowerCase()))

  let removedCount = 0
  for (const pubFile of existingPublicFiles) {
    if (!sourceFileSet.has(pubFile)) {
      const toDelete = path.join(PUBLIC_BEATS_DIR, pubFile)
      try {
        fs.unlinkSync(toDelete)
        console.log(`[SYNC] Удален тестовый/удаленный бит: ${pubFile}`)
        removedCount++
      } catch (err) {
        console.error(`[SYNC] Ошибка удаления ${pubFile}:`, err)
      }
    }
  }

  // 3. Копируем/обновляем файлы из beats/ в public/beats/
  const beatsList = []

  // Сортировка по естественному алфавиту
  const sortedFiles = [...sourceFiles].sort((a, b) =>
    a.localeCompare(b, 'ru', { numeric: true, sensitivity: 'base' })
  )

  for (const file of sortedFiles) {
    const srcPath = path.join(BEATS_DIR, file)
    const destPath = path.join(PUBLIC_BEATS_DIR, file)

    // Копируем если файл не существует или размер отличается
    let needCopy = true
    if (fs.existsSync(destPath)) {
      const srcStat = fs.statSync(srcPath)
      const destStat = fs.statSync(destPath)
      if (srcStat.size === destStat.size) {
        needCopy = false
      }
    }

    if (needCopy) {
      fs.copyFileSync(srcPath, destPath)
      console.log(`[SYNC] Скопирован бит: ${file}`)
    }

    // Определяем точную длительность трека
    const duration = getAudioDuration(srcPath)

    beatsList.push({
      filename: file,
      url: `/beats/${encodeURIComponent(file)}`,
      duration: duration || 0,
    })
  }

  // 4. Записываем public/beats.json и src/data/beatsManifest.json
  const jsonContent = JSON.stringify(beatsList, null, 2)
  fs.writeFileSync(MANIFEST_PATH, jsonContent, 'utf-8')
  try {
    fs.writeFileSync(SRC_MANIFEST_PATH, jsonContent, 'utf-8')
  } catch {}

  console.log(`[SYNC] Готово! На витрине битов: ${beatsList.length}`)
  beatsList.forEach((b, i) => {
    console.log(`  ${i + 1}. ${b.filename} (${b.duration > 0 ? `${b.duration}s` : 'длина определится в браузере'})`)
  })

  return beatsList
}

// Запуск напрямую из CLI
if (process.argv[1] && process.argv[1].endsWith('sync-beats.js')) {
  syncBeats()
}
