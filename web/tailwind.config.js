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
    extend: {
      backgroundColor: ['checked'],
      borderColor: ['checked']
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
}
