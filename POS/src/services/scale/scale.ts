import { WeightStreamParser } from './parsers'

type WeightCallback = (kg: number) => void

let port: SerialPort | null = null
let reader: ReadableStreamDefaultReader<string> | null = null
let onWeightCallback: WeightCallback | null = null

export async function connectScale(onWeight: WeightCallback): Promise<void> {
  if (!navigator.serial) {
    throw new Error('WebSerial not supported. Use Chrome or Edge with --enable-experimental-web-platform-features.')
  }

  port = await navigator.serial.requestPort()
  onWeightCallback = onWeight

  await port.open({
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
  })

  const decoder = new TextDecoderStream()
  port.readable?.pipeTo(decoder.writable)
  reader = decoder.readable.getReader()

  const parser = new WeightStreamParser()

  // Read in background
  const readLoop = async () => {
    try {
      while (true) {
        const { value, done } = await reader!.read()
        if (done) break
        if (value) {
          const weight = parser.feed(value)
          if (weight !== null && onWeightCallback) {
            onWeightCallback(weight)
          }
        }
      }
    } catch {
      // Port closed or error
    }
  }

  readLoop()
}

export function isScaleConnected(): boolean {
  return port !== null
}

export async function disconnectScale(): Promise<void> {
  if (reader) {
    await reader.cancel()
    reader = null
  }
  if (port) {
    await port.close()
    port = null
  }
  onWeightCallback = null
}
