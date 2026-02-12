import { execSync } from 'child_process'
import { rmSync } from 'fs'

try {
  console.log('Removing .next cache...')
  rmSync('.next', { recursive: true, force: true })
  console.log('Removed .next')
} catch (e) {
  console.log('No .next to remove')
}

try {
  console.log('Removing ai package from node_modules...')
  execSync('pnpm remove ai 2>/dev/null || true', { stdio: 'inherit' })
  console.log('Done')
} catch (e) {
  console.log('ai package already removed')
}

console.log('Cache cleared successfully!')
