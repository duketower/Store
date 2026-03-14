import { PosDatabase } from './schema'

// Singleton DB instance — import this everywhere
export const db = new PosDatabase()

// Re-export schema class for type usage
export { PosDatabase } from './schema'
