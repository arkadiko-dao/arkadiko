const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.html',
    './src/**/*.tsx',
    './components/**/*.tsx',
    './public/html/*.html'
  ],
  theme: {
    extend: {
      fontFamily: {
        headings: ['Kollektif', ...defaultTheme.fontFamily.sans],
        sans: ['Montserrat', ...defaultTheme.fontFamily.sans],
      },
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
