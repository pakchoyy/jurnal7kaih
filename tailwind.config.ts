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
        bg: '#EEF2FA',
        ink: {
          DEFAULT: '#111827',
          2: '#6B7280',
          3: '#9CA3AF',
        },
        line: '#E5E7EB',
        brand: {
          blue: '#1A5FBA',
          'blue-dark': '#133F80',
          'blue-light': '#E8EFFE',
          yellow: '#F5A623',
          teal: '#0EA5A0',
          green: '#10B981',
          dark: '#1A1D2E',
        },
        habit: {
          'bangun-pagi': '#F59E0B',
          beribadah: '#8B5CF6',
          berolahraga: '#10B981',
          'makan-sehat': '#06B6D4',
          'gemar-belajar': '#3B82F6',
          bermasyarakat: '#EC4899',
          'tidur-cepat': '#6366F1',
        },
        slatehead: {
          DEFAULT: '#0F172A',
          2: '#1E293B',
        },
      },
      fontFamily: {
        display: ['var(--font-nunito)', 'Nunito', 'sans-serif'],
        body: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '18px',
        btn: '14px',
        modal: '24px',
        pill: '40px',
      },
      boxShadow: {
        soft: '0 2px 12px rgba(26,95,186,.10)',
        lift: '0 8px 32px rgba(26,95,186,.18)',
        row: '0 1px 4px rgba(0,0,0,.05)',
      },
      backgroundImage: {
        'grad-blue': 'linear-gradient(160deg, #1A5FBA 0%, #133F80 100%)',
        'grad-green': 'linear-gradient(160deg, #10B981, #059669)',
        'grad-dark': 'linear-gradient(160deg, #0F172A, #1E293B)',
        'grad-yellow': 'linear-gradient(160deg, #F59E0B, #D97706)',
        'grad-purple': 'linear-gradient(160deg, #8B5CF6, #6D28D9)',
        'grad-teal': 'linear-gradient(160deg, #06B6D4, #0891B2)',
      },
    },
  },
  plugins: [],
}

export default config
