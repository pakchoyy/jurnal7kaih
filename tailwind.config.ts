import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1A5FBA',
          yellow: '#F5A623',
          teal: '#0EA5A0',
          green: '#22C55E',
          dark: '#1A1D2E',
        },
        habit: {
          'bangun-pagi': '#F5A623',
          beribadah: '#8B5CF6',
          berolahraga: '#22C55E',
          'makan-sehat': '#0EA5A0',
          'gemar-belajar': '#1A5FBA',
          bermasyarakat: '#EC4899',
          'tidur-cepat': '#5B6EC8',
        },
      },
      fontFamily: {
        display: ['var(--font-nunito)', 'Nunito', 'sans-serif'],
        body: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        btn: '14px',
        modal: '24px',
      },
    },
  },
  plugins: [],
}

export default config
