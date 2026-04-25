/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      keyframes: {
        flashbad: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '35%': { backgroundColor: '#fecaca' },
        },
      },
      animation: {
        flashbad: 'flashbad 0.4s',
      },
    },
  },
  plugins: [],
};
