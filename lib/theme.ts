import type { CSSProperties } from 'react'

export const THEME_COLORS: Record<string, { name: string; hex: string }> = {
  blue: { name: 'Biru', hex: '#1A5FBA' },
  green: { name: 'Hijau', hex: '#047857' },
  teal: { name: 'Tosca', hex: '#0E7490' },
  purple: { name: 'Ungu', hex: '#6D28D9' },
  red: { name: 'Merah', hex: '#B91C1C' },
  orange: { name: 'Oranye', hex: '#C2410C' },
  pink: { name: 'Merah Muda', hex: '#BE185D' },
  navy: { name: 'Biru Tua', hex: '#1E3A8A' },
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const mix = (c: [number, number, number], t: number, target: number) =>
  c.map((v) => Math.round(v + (target - v) * t)).join(' ')

/** CSS variable warna sekolah untuk dipasang di style pembungkus layout. */
export function themeVars(key: string | null | undefined): CSSProperties {
  const color = THEME_COLORS[key ?? 'blue'] ?? THEME_COLORS.blue
  const c = rgb(color.hex)
  return {
    '--brand-rgb': c.join(' '),
    '--brand-dark-rgb': mix(c, 0.3, 0),
    '--brand-light-rgb': mix(c, 0.9, 255),
  } as CSSProperties
}
