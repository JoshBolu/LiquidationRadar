/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          cyan: '#13ecda',
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
        },
      },
    },
  },
  plugins: [],
};

