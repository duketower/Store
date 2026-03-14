// Type declarations for WebUSB and WebSerial browser APIs
// These APIs are not yet in the standard TypeScript DOM types

// ---- WebUSB ----
interface USBDeviceFilter {
  vendorId?: number
  productId?: number
  classCode?: number
  subclassCode?: number
  protocolCode?: number
  serialNumber?: string
}

interface USBDeviceRequestOptions {
  filters: USBDeviceFilter[]
}

interface USBEndpoint {
  endpointNumber: number
  direction: 'in' | 'out'
  type: 'bulk' | 'interrupt' | 'isochronous'
  packetSize: number
}

interface USBAlternateInterface {
  alternateSetting: number
  interfaceClass: number
  interfaceSubclass: number
  interfaceProtocol: number
  interfaceName?: string
  endpoints: USBEndpoint[]
}

interface USBInterface {
  interfaceNumber: number
  alternate: USBAlternateInterface
  alternates: USBAlternateInterface[]
  claimed: boolean
}

interface USBConfiguration {
  configurationValue: number
  configurationName?: string
  interfaces: USBInterface[]
}

interface USBDevice {
  vendorId: number
  productId: number
  deviceClass: number
  deviceSubclass: number
  deviceProtocol: number
  deviceVersionMajor: number
  deviceVersionMinor: number
  deviceVersionSubminor: number
  usbVersionMajor: number
  usbVersionMinor: number
  usbVersionSubminor: number
  manufacturerName?: string
  productName?: string
  serialNumber?: string
  configuration: USBConfiguration | null
  configurations: USBConfiguration[]
  opened: boolean
  open(): Promise<void>
  close(): Promise<void>
  selectConfiguration(configurationValue: number): Promise<void>
  claimInterface(interfaceNumber: number): Promise<void>
  releaseInterface(interfaceNumber: number): Promise<void>
  selectAlternateInterface(interfaceNumber: number, alternateSetting: number): Promise<void>
  controlTransferIn(setup: USBControlTransferParameters, length: number): Promise<USBInTransferResult>
  controlTransferOut(setup: USBControlTransferParameters, data?: BufferSource): Promise<USBOutTransferResult>
  transferIn(endpointNumber: number, length: number): Promise<USBInTransferResult>
  transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>
  clearHalt(direction: 'in' | 'out', endpointNumber: number): Promise<void>
  reset(): Promise<void>
}

interface USBControlTransferParameters {
  requestType: 'standard' | 'class' | 'vendor'
  recipient: 'device' | 'interface' | 'endpoint' | 'other'
  request: number
  value: number
  index: number
}

interface USBInTransferResult {
  data?: DataView
  status: 'ok' | 'stall' | 'babble'
}

interface USBOutTransferResult {
  bytesWritten: number
  status: 'ok' | 'stall'
}

interface USB {
  requestDevice(options: USBDeviceRequestOptions): Promise<USBDevice>
  getDevices(): Promise<USBDevice[]>
}

// ---- WebSerial ----
interface SerialPortFilter {
  usbVendorId?: number
  usbProductId?: number
}

interface SerialPortRequestOptions {
  filters?: SerialPortFilter[]
}

interface SerialOptions {
  baudRate: number
  dataBits?: 7 | 8
  stopBits?: 1 | 2
  parity?: 'none' | 'even' | 'odd'
  bufferSize?: number
  flowControl?: 'none' | 'hardware'
}

interface SerialPort {
  open(options: SerialOptions): Promise<void>
  close(): Promise<void>
  readable: ReadableStream<Uint8Array> | null
  writable: WritableStream<Uint8Array> | null
}

interface Serial {
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>
  getPorts(): Promise<SerialPort[]>
}

// Extend Navigator
interface Navigator {
  usb: USB
  serial: Serial
}
