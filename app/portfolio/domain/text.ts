export const SHORT_LINE_MAX = 140

// Counts code points after trimming, as the schema's pattern does; any line break fails.
export function isShortLine(text: unknown): text is string {
  if (typeof text !== 'string' || /[\n\r]/.test(text)) return false
  const length = [...text.trim()].length
  return length >= 1 && length <= SHORT_LINE_MAX
}
