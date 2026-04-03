/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // WTF LivePulse dark palette
        bg: {
          primary: '#0D0D1A',
          card: '#1A1A2E',
          elevated: '#252540',
        },
        accent: {
          teal: '#14B8A6',
          red: '#EF4444',
          yellow: '#F59E0B',
          green: '#22C55E',
          orange: '#F97316',
        },
        text: {
          primary: '#E2E8F0',
          secondary: '#64748B',
          muted: '#475569',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
