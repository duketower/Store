import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// ---------------------------------------------------------------------------
// Multi-client build support
//
// Set the CLIENT env var to build for a specific client:
//   CLIENT=sharma-grocery npm run build
//
// Without CLIENT, this builds in dev/default mode using STORE_CONFIG fallbacks.
// Client configs live at: ./platform/clients/client-<CLIENT>/
// ---------------------------------------------------------------------------

function loadClientEnv(clientId: string): void {
  // Manually parse and inject the client's .env file into process.env
  // so Vite's import.meta.env picks up their Firebase credentials.
  const envPath = resolve(__dirname, `./platform/clients/client-${clientId}/.env`)
  if (!existsSync(envPath)) {
    throw new Error(`[client-build] Missing .env for client "${clientId}" at ${envPath}`)
  }
  const content = readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const match = line.match(/^([^=\s#][^=]*)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^['"]|['"]$/g, '') // strip optional quotes
      process.env[key] = value
    }
  }
}

function loadClientConfig(clientId: string): object | null {
  const configPath = resolve(__dirname, `./platform/clients/client-${clientId}/client.config.json`)
  if (!existsSync(configPath)) {
    throw new Error(`[client-build] Missing client.config.json for "${clientId}" at ${configPath}`)
  }
  return JSON.parse(readFileSync(configPath, 'utf-8'))
}

function getGitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: __dirname }).toString().trim()
  } catch {
    return 'unknown'
  }
}

export default defineConfig(() => {
  const clientId = process.env.CLIENT ?? null

  let clientConfig: object | null = null
  if (clientId) {
    loadClientEnv(clientId)
    clientConfig = loadClientConfig(clientId)
  }

  // PWA manifest values — dynamic per client, or defaults for dev
  const appName    = (clientConfig as any)?.brand?.appName    ?? 'Grocery Store POS'
  const shortName  = (clientConfig as any)?.brand?.shortName  ?? 'POS'
  const themeColor = (clientConfig as any)?.brand?.themeColor ?? '#1e40af'

  // Build metadata baked into every bundle for support/diagnostics
  const appBuild = {
    version:   process.env.npm_package_version ?? '0.0.0',
    gitCommit: getGitCommit(),
    builtAt:   new Date().toISOString(),
    clientId:  clientId ?? 'dev',
  }

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/*.png'],
        manifest: {
          name:             appName,
          short_name:       shortName,
          description:      'Offline-first Grocery Store Point of Sale',
          theme_color:      themeColor,
          background_color: '#ffffff',
          display:          'standalone',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
      }),
    ],
    define: {
      // Freeze client config and build metadata into the bundle at compile time.
      // The app reads these via CLIENT_CONFIG and APP_BUILD from constants/clientConfig.ts.
      // null in dev mode → clientConfig.ts falls back to STORE_CONFIG defaults.
      __CLIENT_CONFIG__: JSON.stringify(clientConfig),
      __APP_BUILD__:     JSON.stringify(appBuild),
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
  }
})
