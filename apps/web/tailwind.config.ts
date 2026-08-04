import type { Config } from 'tailwindcss';

/**
 * Dizayn tokenlari — docs/design/.../README.md dan.
 * Radius hamma joyda 0, soya yo'q (telefon ramkasidan tashqari).
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantik ranglar globals.css dagi CSS o'zgaruvchilardan keladi
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-alt': 'var(--surface-alt)',
        desk: 'var(--desk)',
        /** Doim to'q yuza: hero, imtihon sarlavhasi, natija kartasi */
        panel: 'var(--panel)',
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
          4: 'var(--ink-4)',
          5: 'var(--ink-5)',
        },
        line: {
          DEFAULT: 'var(--line)',
          2: 'var(--line-2)',
          3: 'var(--line-3)',
          4: 'var(--line-4)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          dark: 'var(--accent-dark)',
          mid: 'var(--accent-mid)',
          soft: 'var(--accent-soft)',
          border: 'var(--accent-border)',
          50: 'var(--accent-50)',
        },
        success: {
          DEFAULT: 'var(--success)',
          bg: 'var(--success-bg)',
          border: 'var(--success-border)',
          dark: 'var(--success-dark)',
        },
        error: {
          DEFAULT: 'var(--error)',
          bg: 'var(--error-bg)',
          mark: 'var(--error-mark)',
          border: 'var(--error-border)',
          light: '#F08A8A',
        },
        warn: {
          DEFAULT: 'var(--warn)',
          bg: 'var(--warn-bg)',
          border: 'var(--warn-border)',
          text: 'var(--warn-text)',
          deep: 'var(--warn-deep)',
        },
        gold: {
          DEFAULT: 'var(--gold)',
          text: 'var(--gold-text)',
          ondark: '#E4C86A',
        },
        purple: {
          DEFAULT: 'var(--purple)',
          text: 'var(--purple-text)',
        },
        improved: {
          bg: 'var(--improved-bg)',
          border: 'var(--improved-border)',
        },
        telegram: '#229ED9',
        // To'q panellar ichidagi matn — ikkala temada ham bir xil
        'on-dark': {
          DEFAULT: '#F6F4F0',
          2: '#C9C6C0',
          3: '#B9B6B0',
          4: '#9A9791',
          5: '#6A6862',
        },
        'dark-line': {
          DEFAULT: '#2C3038',
          2: '#4B5058',
        },
      },
      fontFamily: {
        display: ['var(--font-archivo)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-plex-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '1.3' }],
        xs: ['11px', { lineHeight: '1.4' }],
        sm: ['12px', { lineHeight: '1.45' }],
        base: ['13px', { lineHeight: '1.5' }],
        ui: ['14px', { lineHeight: '1.5' }],
        md: ['15px', { lineHeight: '1.5' }],
        lg: ['16px', { lineHeight: '1.65' }],
        xl: ['17px', { lineHeight: '1.4' }],
        '2xl': ['19px', { lineHeight: '1.3' }],
        '3xl': ['22px', { lineHeight: '1.2' }],
        '4xl': ['25px', { lineHeight: '1.15' }],
        '5xl': ['27px', { lineHeight: '1.12' }],
        '6xl': ['30px', { lineHeight: '1.1' }],
        '7xl': ['34px', { lineHeight: '1.08' }],
        '8xl': ['42px', { lineHeight: '1.05' }],
      },
      letterSpacing: {
        tightest: '-0.03em',
        tighter: '-0.025em',
        tight: '-0.02em',
        label: '0.12em',
        wider: '0.14em',
        wide: '0.08em',
      },
      borderRadius: {
        none: '0',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'none' },
        },
        pop: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.25s ease-out',
        pop: 'pop 0.25s ease-out',
        popFast: 'pop 0.2s ease-out',
      },
      maxWidth: {
        phone: '430px',
      },
      boxShadow: {
        // Faqat desktopda ko'rinadigan yumshoq ramka soyasi
        frame: '0 26px 70px rgba(20, 22, 26, 0.10)',
      },
    },
  },
  plugins: [],
};

export default config;
