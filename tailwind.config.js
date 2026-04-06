/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          light: '#93C5FD',
          dark: '#1D4ED8',
        },
        success: '#10B981',
        error: '#EF4444',
      },
    },
  },
  plugins: [],
};
