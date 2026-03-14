// ESC/POS byte command constants and builders
// No cash drawer (DRAWER_KICK) — this POS has no electronic cash drawer

export const ESC = 0x1b
export const GS = 0x1d

export const CMD: Record<string, number[]> = {
  INIT:         [ESC, 0x40],
  BOLD_ON:      [ESC, 0x45, 0x01],
  BOLD_OFF:     [ESC, 0x45, 0x00],
  ALIGN_LEFT:   [ESC, 0x61, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_RIGHT:  [ESC, 0x61, 0x02],
  FONT_NORMAL:  [ESC, 0x21, 0x00],
  FONT_DOUBLE:  [ESC, 0x21, 0x30],  // double height + width
  LINE_FEED:    [0x0a],
  CUT:          [GS, 0x56, 0x42, 0x00],  // Full cut
}

// Encode a text string to bytes (ASCII-safe for thermal printers)
export function textBytes(text: string): number[] {
  const bytes: number[] = []
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    bytes.push(code < 256 ? code : 0x3f)  // '?' for non-ASCII
  }
  return bytes
}

// Pad a string to a fixed width
export function padRight(text: string, width: number): string {
  return text.substring(0, width).padEnd(width, ' ')
}

export function padLeft(text: string, width: number): string {
  return text.substring(0, width).padStart(width, ' ')
}

// Two-column row: left text + right-aligned text, total width
export function twoCol(left: string, right: string, width = 42): string {
  const maxLeft = width - right.length - 1
  return padRight(left, maxLeft) + ' ' + right
}

// Separator line
export function separator(width = 42, char = '-'): string {
  return char.repeat(width)
}

// Build a complete ESC/POS byte array from command segments
export function buildDocument(...segments: (number[] | string)[]): Uint8Array {
  const allBytes: number[] = []
  for (const segment of segments) {
    if (typeof segment === 'string') {
      allBytes.push(...textBytes(segment))
    } else {
      allBytes.push(...segment)
    }
  }
  return new Uint8Array(allBytes)
}
