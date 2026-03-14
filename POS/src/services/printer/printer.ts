import { buildReceiptBytes, type ReceiptTemplateData } from './printTemplates'

export type { ReceiptTemplateData as ReceiptData }

// ESC/POS thermal printer identifiers (common vendors)
const PRINTER_FILTERS: USBDeviceFilter[] = [
  { vendorId: 0x0416 },  // Winbond / generic thermal
  { vendorId: 0x04b8 },  // Epson
  { vendorId: 0x067b },  // Prolific
  { vendorId: 0x0dd4 },  // Custom Engineering
  { vendorId: 0x1504 },  // Sewoo
]

let device: USBDevice | null = null

export async function connectPrinter(): Promise<void> {
  if (!navigator.usb) {
    throw new Error('WebUSB not supported in this browser. Use Chrome or Edge.')
  }

  device = await navigator.usb.requestDevice({ filters: PRINTER_FILTERS })
  await device.open()

  if (device.configuration === null) {
    await device.selectConfiguration(1)
  }

  // Find and claim the first bulk-out interface
  for (const iface of device.configuration?.interfaces ?? []) {
    try {
      await device.claimInterface(iface.interfaceNumber)
      break
    } catch {
      // Interface already claimed or not available
    }
  }
}

export function isPrinterConnected(): boolean {
  return device !== null && device.opened
}

export async function printReceipt(data: ReceiptTemplateData): Promise<void> {
  if (!device || !device.opened) {
    throw new Error('Printer not connected')
  }

  const bytes = buildReceiptBytes(data)

  // Find bulk-out endpoint
  let endpointNumber: number | null = null
  for (const iface of device.configuration?.interfaces ?? []) {
    for (const alt of iface.alternates) {
      for (const ep of alt.endpoints) {
        if (ep.type === 'bulk' && ep.direction === 'out') {
          endpointNumber = ep.endpointNumber
          break
        }
      }
      if (endpointNumber !== null) break
    }
    if (endpointNumber !== null) break
  }

  if (endpointNumber === null) {
    throw new Error('No bulk-out endpoint found on printer')
  }

  await device.transferOut(endpointNumber, bytes)
}

export async function disconnectPrinter(): Promise<void> {
  if (device) {
    await device.close()
    device = null
  }
}
