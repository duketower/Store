/**
 * Builds and deploys all active clients in sequence.
 * Run this after making changes to POS/src/ to push updates to all clients.
 *
 * Usage: npm run client:build-all
 *
 * Skips clients with "status": "inactive" in deploy.config.json.
 * Prints a summary table at the end: client, status, duration.
 */

import { readdirSync, existsSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const clientsDir = resolve(ROOT, 'clients')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

// ---- Collect all client folders (client-* prefix) ----------------------

const allDirs = readdirSync(clientsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith('client-'))
  .map((d) => d.name.replace('client-', ''))

if (allDirs.length === 0) {
  console.log('No client folders found in clients/. Nothing to build.')
  process.exit(0)
}

// ---- Check for upcoming license renewals (warn if < 30 days) -----------

const WARN_DAYS = 30
const now = new Date()

for (const id of allDirs) {
  const configPath = resolve(clientsDir, `client-${id}/client.config.json`)
  if (!existsSync(configPath)) continue
  try {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'))
    const expiry = new Date(config.licenseExpiresAt)
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysLeft <= 0) {
      console.warn(`⚠  EXPIRED: ${id} — license expired ${Math.abs(daysLeft)} days ago`)
    } else if (daysLeft <= WARN_DAYS) {
      console.warn(`⚠  RENEWAL: ${id} — license expires in ${daysLeft} days (${config.licenseExpiresAt})`)
    }
  } catch { /* skip */ }
}

// ---- Build each active client ------------------------------------------

type BuildResult = { clientId: string; status: 'ok' | 'skipped' | 'failed'; durationMs: number }
const results: BuildResult[] = []

for (const clientId of allDirs) {
  const deployConfigPath = resolve(clientsDir, `client-${clientId}/deploy.config.json`)
  if (existsSync(deployConfigPath)) {
    try {
      const deployConfig = JSON.parse(readFileSync(deployConfigPath, 'utf-8'))
      if (deployConfig.status === 'inactive') {
        console.log(`⏭  Skipping inactive: ${clientId}`)
        results.push({ clientId, status: 'skipped', durationMs: 0 })
        continue
      }
    } catch { /* treat as active */ }
  }

  const start = Date.now()
  try {
    const result = spawnSync(npmCommand, ['run', 'client:build', '--', clientId], {
      cwd: ROOT,
      stdio: 'inherit',
    })
    if (result.status !== 0) {
      throw new Error(`client build exited with code ${result.status ?? 'unknown'}`)
    }
    results.push({ clientId, status: 'ok', durationMs: Date.now() - start })
  } catch {
    results.push({ clientId, status: 'failed', durationMs: Date.now() - start })
  }
}

// ---- Summary -----------------------------------------------------------

console.log('\n─────────────────────────────────────────')
console.log(' Build All Summary')
console.log('─────────────────────────────────────────')
for (const r of results) {
  const icon = r.status === 'ok' ? '✅' : r.status === 'skipped' ? '⏭ ' : '❌'
  const time = r.durationMs > 0 ? ` (${(r.durationMs / 1000).toFixed(1)}s)` : ''
  console.log(`  ${icon}  ${r.clientId}${time}`)
}
console.log('─────────────────────────────────────────')
const ok      = results.filter((r) => r.status === 'ok').length
const failed  = results.filter((r) => r.status === 'failed').length
const skipped = results.filter((r) => r.status === 'skipped').length
console.log(`  ${ok} built, ${skipped} skipped, ${failed} failed`)
console.log('')

if (failed > 0) process.exit(1)
