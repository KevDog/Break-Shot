// Break Shot - Join Code Generator
// Generates word-based codes like "blue-tiger-42" per requirements

// Word lists for generating memorable codes
const ADJECTIVES = [
  'red', 'blue', 'green', 'gold', 'silver', 'black', 'white', 'purple',
  'orange', 'yellow', 'pink', 'brown', 'gray', 'dark', 'light', 'bright',
  'swift', 'quick', 'fast', 'slow', 'wild', 'calm', 'cool', 'warm',
  'bold', 'shy', 'big', 'tiny', 'tall', 'small', 'grand', 'mini',
  'happy', 'lucky', 'brave', 'noble', 'royal', 'magic', 'super', 'mega',
]

const NOUNS = [
  'tiger', 'lion', 'eagle', 'hawk', 'wolf', 'bear', 'fox', 'deer',
  'shark', 'whale', 'dolphin', 'dragon', 'phoenix', 'falcon', 'cobra', 'panther',
  'rocket', 'comet', 'star', 'moon', 'sun', 'storm', 'thunder', 'lightning',
  'ocean', 'river', 'mountain', 'forest', 'desert', 'valley', 'canyon', 'island',
  'knight', 'king', 'queen', 'wizard', 'ninja', 'samurai', 'viking', 'pirate',
]

/**
 * Generate a random word-based join code
 * Format: adjective-noun-number (e.g., "blue-tiger-42")
 */
export function generateJoinCode(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const number = Math.floor(Math.random() * 100) // 0-99

  return `${adjective}-${noun}-${number.toString().padStart(2, '0')}`
}

/**
 * Validate join code format
 */
export function isValidJoinCodeFormat(code: string): boolean {
  const pattern = /^[a-z]+-[a-z]+-\d{2}$/
  return pattern.test(code.toLowerCase())
}

/**
 * Normalize join code (lowercase, trim whitespace)
 */
export function normalizeJoinCode(code: string): string {
  return code.toLowerCase().trim()
}

/**
 * Calculate approximate uniqueness
 * With current word lists: 40 adjectives * 40 nouns * 100 numbers = 160,000 combinations
 * Sufficient for concurrent sessions, not meant for permanent unique IDs
 */
export function getJoinCodeCombinations(): number {
  return ADJECTIVES.length * NOUNS.length * 100
}
