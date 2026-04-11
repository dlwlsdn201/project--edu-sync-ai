/** @type {import('tailwindcss').Config} */
module.exports = {
  // 웹: react-native-css-interop가 class 기반 다크모드와 동기화합니다(media면 런타임 에러).
  darkMode: 'class',
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
