import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,tsx,ts,jsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50:  '#eef4ff',
          100: '#ddeaff',
          200: '#c2d6ff',
          300: '#96b8f7',
          400: '#6B9FED',   // primary — cornflower, softer than electric blue
          500: '#4B80D9',   // hover
          600: '#3060B8',   // pressed
          700: '#214A96',
          800: '#183572',
          900: '#112250',
          950: '#080F2A',
        },
        // Replaces harsh neon amber — soft copper/terracotta for critical/urgency states
        amber: {
          300: '#E8AE82',   // very soft apricot (hover, subtle text)
          400: '#C8855A',   // soft copper — main critical color
          500: '#A86840',   // deeper copper (borders, dividers)
          600: '#8A5230',   // pressed / dark accent
        },
        // September 2026: rebuilt in OKLCH on the accent's own hue (258). The
        // old scale was a flat grey-navy with ink-200 and ink-300 barely apart,
        // and fog-600 (used for every item note) sat under 3:1 on a card.
        //   ink L: 12 / 16 / 20 / 23.5 / 27.5 / 33 / 40,  C 0.012-0.028
        //   fog L: 96 / 87 / 77 / 67 / 57 / 49 / 41
        ink: {
          0:   '#000000',
          50:  '#04060A',
          100: '#090D14',
          200: '#10161F',
          300: '#181E29',
          400: '#202834',
          500: '#2D3643',
          600: '#3E4857',
          700: '#505B6C',
          800: '#6B7892',
          900: '#94A0B8',
        },
        fog: {
          100: '#EEF2F7',   // primary text
          200: '#CCD5E2',   // secondary
          300: '#A9B5C8',   // tertiary, 8.8:1 on a card
          400: '#8996AB',   // metadata, 6.1:1
          500: '#6B788C',   // icons, placeholders
          600: '#556173',   // decorative only, never text
          700: '#404B5B',
          800: '#2B3446',
          900: '#20283A',
        },
        background: 'oklch(0% 0.002 260)',
        surface:    'oklch(7% 0.008 260)',
        overlay:    'oklch(11% 0.01 260)',
        border:     'oklch(19% 0.012 260)',
        muted:      'oklch(42% 0.015 260)',
        subtle:     'oklch(62% 0.015 260)',
        primary:    '#6B9FED',
      },
      fontFamily: {
        sans: ['SamsungOne', 'SamsungSharpSans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      // Shared with WearWise Wardrobe
      fontSize: {
        'oneui-hero':  ['32px', { lineHeight: '38px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'oneui-title': ['26px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'oneui-h':     ['20px', { lineHeight: '26px', fontWeight: '600' }],
        'oneui-body':  ['15px', { lineHeight: '21px', fontWeight: '400' }],
        'oneui-cap':   ['12px', { lineHeight: '17px', fontWeight: '500' }],
        'oneui-tab':   ['11px', { lineHeight: '14px', fontWeight: '600' }],
      },
      borderRadius: {
        'oneui-sm': '14px',
        oneui:      '20px',
        'oneui-lg': '26px',
        'oneui-xl': '32px',
        // Sibling-app aliases: same values, the names WearWise Wardrobe uses. Keeps the
        // two design systems on one shared radius vocabulary so components copy cleanly.
        'squircle-sm': '14px',
        squircle:      '20px',
        'squircle-lg': '26px',
        'squircle-xl': '32px',
      },
      boxShadow: {
        card:         '0 1px 0 rgba(255,255,255,0.04) inset',
        'oneui-raised': '0 -4px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'slide-down': {
          from: { transform: 'translateY(0)',    opacity: '1' },
          to:   { transform: 'translateY(100%)', opacity: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.97)', opacity: '0' },
          to:   { transform: 'scale(1)',    opacity: '1' },
        },
        // Shared with WearWise Wardrobe
        'oneui-pop': {
          '0%':   { transform: 'scale(0.97)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        'oneui-fade': {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'page-enter': {
          from: { opacity: '0', transform: 'translateY(10px) scale(0.992)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'slide-up':    'slide-up 0.24s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-down':  'slide-down 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-in':     'fade-in 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in':    'scale-in 0.18s cubic-bezier(0.22, 1, 0.36, 1)',
        'oneui-pop':   'oneui-pop 180ms cubic-bezier(0.22, 1, 0.36, 1)',
        'oneui-fade':  'oneui-fade 220ms ease-out',
        'page-enter':  'page-enter 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
        shimmer:       'shimmer 1.8s ease-in-out infinite',
      },
      backgroundImage: {
        shimmer: 'linear-gradient(90deg, transparent 0%, oklch(18% 0.012 260) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
