export interface BookPalette {
  bg: string;
  accent: string;
}

/** Ten distinct cover themes — assigned by library index, not title hash. */
export const BOOK_PALETTES: BookPalette[] = [
  { bg: '#2C1810', accent: '#C9A84C' }, // walnut / gold
  { bg: '#1B2D3D', accent: '#6B9FB8' }, // navy / steel blue
  { bg: '#2A1F3D', accent: '#9B7DC4' }, // plum / lavender
  { bg: '#2D1F1F', accent: '#C4785A' }, // espresso / terracotta
  { bg: '#1A2030', accent: '#D4A574' }, // midnight / amber
  { bg: '#3D1F2A', accent: '#E8A0B4' }, // wine / rose
  { bg: '#1A2E2E', accent: '#5FB3A2' }, // deep teal / mint
  { bg: '#2A2418', accent: '#B8956B' }, // umber / antique gold
  { bg: '#1E1E3F', accent: '#A4C2E0' }, // indigo / powder blue
  { bg: '#2C1F2E', accent: '#C9A0DC' }, // aubergine / lilac
];

export const BOOK_PALETTE_COUNT = BOOK_PALETTES.length;

export function pickPaletteByIndex(index: number): BookPalette {
  const safe = ((index % BOOK_PALETTE_COUNT) + BOOK_PALETTE_COUNT) % BOOK_PALETTE_COUNT;
  return BOOK_PALETTES[safe];
}

export function applyPaletteIndex(index: number): BookPalette & { paletteIndex: number } {
  const paletteIndex =
    ((index % BOOK_PALETTE_COUNT) + BOOK_PALETTE_COUNT) % BOOK_PALETTE_COUNT;
  return { ...BOOK_PALETTES[paletteIndex], paletteIndex };
}
