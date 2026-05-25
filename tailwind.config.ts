import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Expedition Teal — primary brand scale
        teal: {
          50:  '#f0fdfc',
          100: '#ccfbf8',
          200: '#99f6f0',
          300: '#5eece4',
          400: '#18B7A6', // brand primary
          500: '#129889', // hover state
          600: '#0C6F66', // pressed state
          700: '#095950',
          800: '#064540',
          900: '#043530',
          950: '#021f1d',
        },
        // AMOLED ink scale — near-blacks with teal tint
        ink: {
          0:   '#000000',
          50:  '#080c0c',
          100: '#0d1413',
          200: '#111a19',
          300: '#162120',
          400: '#1c2b2a',
          500: '#223534',
          600: '#2d4543',
          700: '#3a5755',
          800: '#4f706e',
          900: '#6e8f8d',
        },
        // Fog — light neutrals with teal tint
        fog: {
          100: '#f0fafa',
          200: '#daf4f2',
          300: '#b8e8e5',
          400: '#8dd4d0',
          500: '#68bfba',
          600: '#4da8a3',
          700: '#3a8f8a',
          800: '#2d7470',
          900: '#235c59',
        },
        // Semantic aliases
        background: 'oklch(0% 0.002 195)',
        surface:    'oklch(6% 0.005 195)',
        overlay:    'oklch(10% 0.007 195)',
        border:     'oklch(18% 0.008 195)',
        muted:      'oklch(40% 0.01  195)',
        subtle:     'oklch(60% 0.01  195)',
        primary:    '#18B7A6',
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
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      borderRadius: {
        'oneui-sm': '12px',
        'oneui':    '20px',
        'oneui-lg': '28px',
        'oneui-xl': '36px',
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
          from: { transform: 'scale(0.95)', opacity: '0' },
          to:   { transform: 'scale(1)',    opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
      animation: {
        'slide-up':   'slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 0.25s cubic-bezier(0.7, 0, 0.84, 0)',
        'fade-in':    'fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in':   'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        shimmer:      'shimmer 1.8s ease-in-out infinite',
      },
      backgroundImage: {
        shimmer: 'linear-gradient(90deg, transparent 0%, oklch(18% 0.01 195) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
