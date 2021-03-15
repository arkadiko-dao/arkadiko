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
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
}
