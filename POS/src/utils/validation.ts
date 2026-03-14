export function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s+/g, ''))
}

export function isValidGstin(gstin: string): boolean {
  return /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(gstin)
}

export function isValidBarcode(barcode: string): boolean {
  return barcode.trim().length >= 4
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin)
}
