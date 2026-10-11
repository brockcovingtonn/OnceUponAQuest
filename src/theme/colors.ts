export const colors = {
  midnight: '#1B2340',
  storybookGold: '#E2B04A',
  parchment: '#FAF5EA',
  ink: '#2A2A33',
  rose: '#D9677A',
  /** Rose for text and error fills — passes WCAG AA (4.5:1) on parchment and with white text. */
  roseText: '#A8384D',
  fern: '#4F9D7A',
  /** Fern for text — passes WCAG AA on parchment and white. */
  fernText: '#2F6B4F',
  white: '#FFFFFF',
  inkMuted: '#6B6B76',
  border: '#E4DCC8',
} as const;

export type ColorName = keyof typeof colors;
