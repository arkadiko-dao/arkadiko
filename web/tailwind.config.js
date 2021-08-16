const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  purge: {
    content: [
      './src/**/*.html',
      './src/**/*.tsx',
      './components/**/*.tsx',
    ],
  },
  darkMode: false, // or 'media' or 'class'
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
      borderColor: ['checked']
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
}
