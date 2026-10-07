import { execSync } from 'child_process'
import { syncBeats } from './sync-beats.js'

try {
  console.log('=== [1/3] Синхронизация битов с витриной ===')
  const beats = syncBeats()

  console.log('\n=== [2/3] Индексация файлов для репозитория ===')
  execSync('git add -A', { stdio: 'inherit' })

  // Проверяем наличие изменений перед коммитом
  const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim()
  if (status) {
    const commitMsg = `Update beats (${beats.length} tracks in catalog)`
    execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' })
    console.log(`[GIT] Зафиксирован коммит: ${commitMsg}`)
  } else {
    console.log('[GIT] Нет новых изменений для коммита.')
  }

  console.log('\n=== [3/3] Отправка на удаленный сервер (git push) ===')
  execSync('git push', { stdio: 'inherit' })
  console.log('\n✅ ВСЕ БИТЫ УСПЕШНО ЗАДЕПЛОЕНЫ НА ВИТРИНУ!')
} catch (error) {
  console.error('\n❌ Ошибка при выполнении deploy:', error.message)
  process.exit(1)
}
