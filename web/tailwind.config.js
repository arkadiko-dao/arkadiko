const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.html',
    './src/**/*.tsx',
    './components/**/*.tsx',
    './public/html/*.html'
  ],
  safelist: [
    { pattern: /STX/ },
    { pattern: /xBTC/ },
    { pattern: /atAlex/ },
    { pattern: /stSTX/ },
  ],
  theme: {
    extend: {
      fontFamily: {
        headings: ['Kollektif', ...defaultTheme.fontFamily.sans],
        sans: ['Montserrat', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        'STX': '#FC6432',
        'xBTC': '#F7931A',
        'atAlex': '#A714FD',
        'stSTX': '#318d8b'
      }
    },
  },
  variants: {
    extend: {
      backgroundColor: ['checked'],
      borderColor: ['checked'],
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
