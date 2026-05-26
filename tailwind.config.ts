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
          50: '#eef5ff',
          100: '#d9e9ff',
          200: '#bfd7ff',
          300: '#8db7ff',
          400: '#4B8DFF',
          500: '#2F6FEB',
          600: '#1D4ED8',
          700: '#173DA8',
          800: '#142F7A',
          900: '#111F4F',
          950: '#080F2A',
        },
        ink: {
          0: '#000000',
          50: '#080A0F',
          100: '#10131A',
          200: '#171A22',
          300: '#1E232D',
          400: '#252B37',
          500: '#303848',
          600: '#3D4659',
          700: '#505B72',
          800: '#6B7892',
          900: '#94A0B8',
        },
        fog: {
          100: '#F3F6FF',
          200: '#DDE7FA',
          300: '#BAC8E2',
          400: '#91A0BA',
          500: '#6F7D97',
          600: '#535F76',
          700: '#3E485B',
          800: '#2B3446',
          900: '#20283A',
        },
        background: 'oklch(0% 0.002 260)',
        surface: 'oklch(7% 0.008 260)',
        overlay: 'oklch(11% 0.01 260)',
        border: 'oklch(19% 0.012 260)',
        muted: 'oklch(42% 0.015 260)',
        subtle: 'oklch(62% 0.015 260)',
        primary: '#4B8DFF',
      },
      fontFamily: {
        sans: [
          'SamsungOne',
          'SamsungSharpSans',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        'oneui-sm': '14px',
        oneui: '20px',
        'oneui-lg': '26px',
        'oneui-xl': '32px',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          from: { transform: 'translateY(0)', opacity: '1' },
          to: { transform: 'translateY(100%)', opacity: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.97)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.24s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-down': 'slide-down 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-in': 'fade-in 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in': 'scale-in 0.18s cubic-bezier(0.22, 1, 0.36, 1)',
        shimmer: 'shimmer 1.8s ease-in-out infinite',
      },
      backgroundImage: {
        shimmer: 'linear-gradient(90deg, transparent 0%, oklch(18% 0.012 260) 50%, transparent 100%)',
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.04) inset',
      },
    },
  },
  plugins: [],
};

export default config;
