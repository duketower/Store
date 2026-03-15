/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Injected by vite.config.ts via `define` — null in dev mode (no CLIENT env var set).
// Declared globally so TypeScript recognises them without explicit imports in every file.
declare const __CLIENT_CONFIG__: import('./types/clientConfig').ClientConfig | null
declare const __APP_BUILD__: import('./types/clientConfig').AppBuild | null
