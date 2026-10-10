export const colors = {
  midnight: '#1B2340',
  storybookGold: '#E2B04A',
  parchment: '#FAF5EA',
  ink: '#2A2A33',
  rose: '#D9677A',
  fern: '#4F9D7A',
  white: '#FFFFFF',
  inkMuted: '#6B6B76',
  border: '#E4DCC8',
} as const;

export type ColorName = keyof typeof colors;
