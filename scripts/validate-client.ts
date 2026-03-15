/**
 * Validates a client folder before building.
 * Uses Zod to enforce all required fields are present and correctly typed.
 *
 * Usage (standalone):  npx tsx scripts/validate-client.ts sharma-grocery
 * Usage (from build):  called automatically by build-client.ts
 */

import { z } from 'zod'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ---- Zod schema --------------------------------------------------------

const ClientConfigSchema = z.object({
  store: z.object({
    name:            z.string().min(1, 'Store name is required'),
    address:         z.string().min(1, 'Address is required'),
    city:            z.string().min(1, 'City is required'),
    phone:           z.string().min(1, 'Phone is required'),
    gstin:           z.string(),
    upiVpa:          z.string().min(1, 'UPI VPA is required'),
    sheetsWebAppUrl: z.string(),
  }),
  brand: z.object({
    themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'themeColor must be a 6-digit hex (e.g. #1e40af)'),
    appName:    z.string().min(1, 'App name is required'),
    shortName:  z.string().min(1, 'Short name is required'),
  }),
  plan:             z.enum(['free', 'pro', 'enterprise']),
  clientId:         z.string().regex(/^[a-z0-9-]+$/, 'clientId must be kebab-case (lowercase letters, numbers, hyphens)'),
  licenseExpiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'licenseExpiresAt must be YYYY-MM-DD'),
})

const DeployConfigSchema = z.object({
  firebaseProjectId: z.string().min(1, 'Firebase project ID is required'),
  hostingTarget:     z.string().min(1),
  dedicatedGmail:    z.string().email('dedicatedGmail must be a valid email'),
  status:            z.enum(['active', 'inactive', 'trial']),
})

const REQUIRED_ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

// ---- Validation logic --------------------------------------------------

export function validateClient(clientId: string): void {
  const clientDir = resolve(ROOT, `clients/client-${clientId}`)
  const errors: string[] = []

  console.log(`\n🔍 Validating client: ${clientId}`)

  if (!existsSync(clientDir)) {
    throw new Error(`Client folder not found: ${clientDir}`)
  }

  // 1. client.config.json
  const configPath = resolve(clientDir, 'client.config.json')
  if (!existsSync(configPath)) {
    errors.push('Missing client.config.json')
  } else {
    try {
      const raw = JSON.parse(readFileSync(configPath, 'utf-8'))
      const result = ClientConfigSchema.safeParse(raw)
      if (!result.success) {
        result.error.errors.forEach((e) =>
          errors.push(`client.config.json → ${e.path.join('.')}: ${e.message}`)
        )
      } else if (result.data.clientId !== clientId) {
        errors.push(`clientId in config ("${result.data.clientId}") must match folder name ("${clientId}")`)
      }
    } catch {
      errors.push('client.config.json is not valid JSON')
    }
  }

  // 2. .env file
  const envPath = resolve(clientDir, '.env')
  if (!existsSync(envPath)) {
    errors.push('Missing .env (copy from .env.template and fill in Firebase credentials)')
  } else {
    const envContent = readFileSync(envPath, 'utf-8')
    for (const key of REQUIRED_ENV_KEYS) {
      const match = envContent.match(new RegExp(`^${key}=(.+)$`, 'm'))
      if (!match || !match[1].trim()) {
        errors.push(`.env → ${key} is missing or empty`)
      }
    }
  }

  // 3. deploy.config.json
  const deployPath = resolve(clientDir, 'deploy.config.json')
  if (!existsSync(deployPath)) {
    errors.push('Missing deploy.config.json')
  } else {
    try {
      const raw = JSON.parse(readFileSync(deployPath, 'utf-8'))
      const result = DeployConfigSchema.safeParse(raw)
      if (!result.success) {
        result.error.errors.forEach((e) =>
          errors.push(`deploy.config.json → ${e.path.join('.')}: ${e.message}`)
        )
      }
    } catch {
      errors.push('deploy.config.json is not valid JSON')
    }
  }

  // 4. assets/logo.png
  const logoPath = resolve(clientDir, 'assets/logo.png')
  if (!existsSync(logoPath)) {
    errors.push('Missing assets/logo.png')
  }

  // Report
  if (errors.length > 0) {
    console.error(`\n❌ Validation failed for "${clientId}":\n`)
    errors.forEach((e) => console.error(`   • ${e}`))
    console.error('')
    process.exit(1)
  }

  console.log(`✅ Validation passed for "${clientId}"\n`)
}

// ---- CLI entrypoint ----------------------------------------------------

const clientId = process.argv[2]
if (!clientId) {
  console.error('Usage: npx tsx scripts/validate-client.ts <client-id>')
  console.error('Example: npx tsx scripts/validate-client.ts sharma-grocery')
  process.exit(1)
}

validateClient(clientId)
