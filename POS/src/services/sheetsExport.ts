/**
 * Google Sheets export — fire-and-forget.
 * Posts shift summary to a Google Apps Script web app URL after shift close.
 * Uses no-cors mode to avoid CORS preflight with Apps Script.
 * Never throws — a sync failure must never block the shift close flow.
 */

export interface ShiftExportPayload {
  date: string           // YYYY-MM-DD
  cashierName: string
  totalBills: number
  totalSales: number
  cashTotal: number
  upiTotal: number
  creditTotal: number
  openingFloat: number
  closingCash: number
  expectedCash: number
  variance: number
  varianceNote: string
  gstTotal: number
}

export async function exportShiftToSheets(
  payload: ShiftExportPayload,
  webAppUrl: string
): Promise<void> {
  if (!webAppUrl) return
  try {
    await fetch(webAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    })
    console.log('[Sheets] Shift export sent')
  } catch (err) {
    console.warn('[Sheets] Export failed (offline?):', err)
  }
}
