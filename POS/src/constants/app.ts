export const APP_NAME = 'Grocery Store POS'
export const DB_NAME = 'pos-db-3'
export const DB_VERSION = 1

// Store name, GSTIN, address — will move to Settings in IndexedDB later
export const STORE_CONFIG = {
  name: 'My Grocery Store',
  address: '123 Market Street',
  city: 'Mumbai, Maharashtra',
  phone: '+91 98765 43210',
  gstin: '27AAAAA0000A1Z5',
  upiVpa: 'store@upi',
  sheetsWebAppUrl: 'https://script.google.com/macros/s/AKfycbzgtgIrZJLiKMYGxWt7T9wH7hrJt4_9tCmd6BFu3D-Yj8UxULFFmyTH5xRPCheeoxa4/exec',
}

export const LOW_STOCK_BADGE_THRESHOLD = 0  // show badge when any product is at/below reorder
export const NEAR_EXPIRY_DAYS = 30          // alert window in days
export const PIN_LENGTH = 4
export const MAX_PIN_ATTEMPTS = 3
export const PIN_LOCKOUT_SECONDS = 30
export const BILL_PREFIX = 'INV'

export const CATEGORIES = [
  'Dairy', 'Grocery', 'Grains', 'Oil', 'Snacks', 'Vegetables', 'Fruits',
  'Household', 'Beverages', 'Bakery', 'Frozen', 'Personal Care', 'Other',
]

export const UNITS = ['pcs', 'kg', 'g', 'litre', 'ml', 'packet', 'box', 'dozen']
