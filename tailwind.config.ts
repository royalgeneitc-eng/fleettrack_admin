import type { Config } from 'tailwindcss';

// Colours come from CSS variables (src/app/globals.css) so light and dark themes
// share one set of class names. Values mirror the Android app's FT tokens.
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = (prefix: string, steps: number[]) => Object.fromEntries(steps.map((s) => [s, v(`${prefix}-${s}`)]));

export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: v('surface'),
        brand: scale('brand', [50, 100, 500, 600, 700, 900]),
        accent: scale('accent', [50, 600]),
        slate: scale('slate', [50, 100, 200, 300, 400, 500, 600, 700, 900]),
        red: scale('red', [50, 600, 700, 800]),
        green: scale('green', [50, 600, 700]),
        amber: scale('amber', [50, 600, 700]),
        blue: { ...scale('blue', [50, 900]), 100: '#dbeafe', 200: '#bfdbfe' },
        violet: scale('violet', [50, 800]),
      },
      borderRadius: { xl: '0.875rem', '2xl': '1rem' },
    },
  },
  plugins: [],
} satisfies Config;
