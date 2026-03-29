/**
 * Validates and builds the app for a specific client, then deploys to Firebase Hosting.
 *
 * Usage: npm run client:build -- sharma-grocery
 *
 * Steps:
 * 1. Validate the client folder (Zod schema check, .env check, logo check)
 * 2. Run `npm run build` inside POS/ with CLIENT env var set
 * 3. Output to deployments/client-<id>/dist/
 * 4. Deploy to Firebase Hosting using the project ID from deploy.config.json
 */

import { spawnSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { validateClient } from './validate-client.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const firebaseCommand = process.platform === 'win32' ? 'firebase.cmd' : 'firebase'

const clientId = process.argv[2]

if (!clientId) {
  console.error('Usage: npm run client:build -- <client-id>')
  console.error('Example: npm run client:build -- sharma-grocery')
  process.exit(1)
}

// Step 1: Validate — abort on any config errors
validateClient(clientId)

const clientDir  = resolve(ROOT, `clients/client-${clientId}`)
const outputDir  = resolve(ROOT, `deployments/client-${clientId}/dist`)
const posDir     = resolve(ROOT, '..')

// Read Firebase project ID from deploy.config.json
const deployConfig = JSON.parse(
  readFileSync(resolve(clientDir, 'deploy.config.json'), 'utf-8')
)
const { firebaseProjectId, hostingTarget, status } = deployConfig

if (status === 'inactive') {
  console.log(`⏭  Skipping inactive client: ${clientId}`)
  process.exit(0)
}

// Step 2: Build POS with client config injected
console.log(`🔨 Building client: ${clientId}`)
mkdirSync(outputDir, { recursive: true })

try {
  const buildResult = spawnSync(npmCommand, ['run', 'build', '--', '--outDir', outputDir, '--emptyOutDir'], {
    cwd: posDir,
    env: { ...process.env, CLIENT: clientId },
    stdio: 'inherit',
  })
  if (buildResult.status !== 0) {
    throw new Error(`build exited with code ${buildResult.status ?? 'unknown'}`)
  }
} catch {
  console.error(`\n❌ Build failed for "${clientId}"`)
  process.exit(1)
}

console.log(`\n✅ Build complete → ${outputDir}`)

// Step 3: Write firebase.json + .firebaserc into the deployment folder so the Firebase CLI
// knows which folder to serve and which project/target to deploy to.
const deployDir = resolve(ROOT, `deployments/client-${clientId}`)
const target = hostingTarget ?? firebaseProjectId

const firebaseJson = {
  hosting: {
    target,
    public: 'dist',
    ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
    rewrites: [{ source: '**', destination: '/index.html' }],
  },
}
const firebaseRc = {
  projects: { default: firebaseProjectId },
  targets: {
    [firebaseProjectId]: {
      hosting: { [target]: [target] },
    },
  },
}
writeFileSync(resolve(deployDir, 'firebase.json'), JSON.stringify(firebaseJson, null, 2))
writeFileSync(resolve(deployDir, '.firebaserc'), JSON.stringify(firebaseRc, null, 2))

// Step 4: Deploy to Firebase Hosting
console.log(`🚀 Deploying to Firebase project: ${firebaseProjectId} (target: ${target})`)

try {
  const deployResult = spawnSync(
    firebaseCommand,
    ['deploy', '--only', `hosting:${target}`, '--project', firebaseProjectId],
    { cwd: deployDir, stdio: 'inherit' }
  )
  if (deployResult.status !== 0) {
    throw new Error(`deploy exited with code ${deployResult.status ?? 'unknown'}`)
  }
} catch {
  console.error(`\n❌ Deploy failed for "${clientId}"`)
  console.error('   Ensure firebase-tools is installed: npm install -g firebase-tools')
  process.exit(1)
}

console.log(`\n🎉 Done: ${clientId} is live on Firebase Hosting\n`)
