import type { Config } from 'tailwindcss';

/**
 * Dizayn tokenlari — docs/design/.../README.md dan.
 * Radius hamma joyda 0, soya yo'q (telefon ramkasidan tashqari).
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FBFAF7',
        surface: '#FFFFFF',
        'surface-alt': '#F1EFEA',
        desk: '#EDEAE4',
        ink: {
          DEFAULT: '#14161A',
          2: '#22262C',
          3: '#4B5058',
          4: '#82878F',
          5: '#9A9791',
        },
        line: {
          DEFAULT: '#E4E1DA',
          2: '#EDEAE4',
          3: '#D5D1C8',
          4: '#C9C6C0',
        },
        accent: {
          DEFAULT: '#1B3C73',
          dark: '#12294F',
          mid: '#3E567F',
          soft: '#EEF1F7',
          border: '#C7D2E3',
          50: '#6C87B0',
        },
        success: {
          DEFAULT: '#1E6B4F',
          bg: '#F1F7F3',
          border: '#A8C4B6',
          dark: '#155540',
        },
        error: {
          DEFAULT: '#A32B2B',
          bg: '#FCF1F1',
          mark: '#FCE9E9',
          border: '#E8C9C9',
          light: '#F08A8A',
        },
        warn: {
          DEFAULT: '#8A5A2B',
          bg: '#FDF7EF',
          border: '#E6D6BE',
          text: '#6B5334',
          deep: '#3C3629',
        },
        gold: {
          DEFAULT: '#9A7A20',
          text: '#7A5F14',
          ondark: '#E4C86A',
        },
        purple: {
          DEFAULT: '#6B5B8A',
          text: '#5B4C78',
        },
        telegram: '#229ED9',
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
    },
  },
  plugins: [],
};

export default config;
