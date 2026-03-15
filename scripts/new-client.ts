/**
 * Scaffolds a new client folder from the _template.
 * Run this when a new client has been onboarded and their form has been filled.
 *
 * Usage: npm run client:new -- krishna-mart
 *
 * After running:
 * 1. Fill clients/client-<id>/.env with their Firebase credentials
 * 2. Fill clients/client-<id>/client.config.json with their store details
 * 3. Fill clients/client-<id>/deploy.config.json with their Firebase project ID
 * 4. Drop their logo into clients/client-<id>/assets/logo.png
 * 5. Run: npm run client:build -- <id>
 */

import { cpSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const clientId = process.argv[2]

if (!clientId) {
  console.error('Usage: npm run client:new -- <client-id>')
  console.error('Example: npm run client:new -- krishna-mart')
  process.exit(1)
}

if (!/^[a-z0-9-]+$/.test(clientId)) {
  console.error('Client ID must be kebab-case (lowercase letters, numbers, hyphens only)')
  console.error(`Got: "${clientId}"`)
  process.exit(1)
}

const templateDir = resolve(ROOT, 'clients/_template')
const targetDir   = resolve(ROOT, `clients/client-${clientId}`)

if (existsSync(targetDir)) {
  console.error(`Client folder already exists: ${targetDir}`)
  console.error('Delete it first if you want to start fresh.')
  process.exit(1)
}

// Copy template folder to new client directory
cpSync(templateDir, targetDir, { recursive: true })

// Pre-fill the clientId in client.config.json so it matches the folder name
const configPath = resolve(targetDir, 'client.config.json')
const config = JSON.parse(readFileSync(configPath, 'utf-8'))
config.clientId = clientId
writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n')

console.log(`\n✅ Scaffolded: clients/client-${clientId}/\n`)
console.log('Next steps:')
console.log(`  1. Create a Firebase project for this client`)
console.log(`  2. Fill in  clients/client-${clientId}/.env          (Firebase credentials)`)
console.log(`  3. Fill in  clients/client-${clientId}/client.config.json  (store details, plan, expiry)`)
console.log(`  4. Fill in  clients/client-${clientId}/deploy.config.json  (Firebase project ID, Gmail)`)
console.log(`  5. Add      clients/client-${clientId}/assets/logo.png`)
console.log(`  6. Run:     npm run client:build -- ${clientId}`)
console.log('')
