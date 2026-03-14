// Parse RS232 weight strings from common scale formats
// Returns weight in kg, or null if unstable/invalid

// Format: "ST,GS,+00.500kg" (most common — Stable/Gross/Net indicator)
export function parseRS232Weight(raw: string): number | null {
  const cleaned = raw.trim()

  // Check stability indicator — skip if unstable
  if (cleaned.startsWith('US') || cleaned.startsWith('OL')) return null

  // Match a decimal number optionally followed by unit
  const match = cleaned.match(/([\d]+\.[\d]+)\s*(kg|g|lb)?/i)
  if (!match) return null

  let value = parseFloat(match[1])
  const unit = (match[2] ?? 'kg').toLowerCase()

  if (isNaN(value) || value < 0) return null

  // Convert to kg
  if (unit === 'g') value /= 1000
  if (unit === 'lb') value *= 0.453592

  return Math.round(value * 1000) / 1000  // round to 3 decimal places
}

// Buffer incoming serial chunks and extract complete weight lines
export class WeightStreamParser {
  private buffer = ''

  feed(chunk: string): number | null {
    this.buffer += chunk
    const lines = this.buffer.split(/\r?\n/)
    this.buffer = lines.pop() ?? ''  // keep incomplete line in buffer

    for (const line of lines) {
      const weight = parseRS232Weight(line)
      if (weight !== null) return weight
    }

    return null
  }

  reset() {
    this.buffer = ''
  }
}
