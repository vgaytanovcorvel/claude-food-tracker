/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        glass: {
          white: 'rgba(255, 255, 255, 0.15)',
          border: 'rgba(255, 255, 255, 0.25)',
          text: 'rgba(255, 255, 255, 0.90)',
          muted: 'rgba(255, 255, 255, 0.55)',
        },
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['3.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
      },
      backdropBlur: {
        glass: '12px',
        'glass-xl': '24px',
      },
      boxShadow: {
        glass: '0 4px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.2)',
        'glass-lg': '0 8px 40px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.25)',
        'glass-float': '0 24px 64px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
        'input-focus': '0 0 0 3px rgba(14,165,233,0.25)',
        'btn-brand': '0 4px 20px rgba(14,165,233,0.35)',
      },
    },
  },
  plugins: [],
}
