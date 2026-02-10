/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      maxWidth: {
        content: '1440px'
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px rgba(15,23,42,0.12)'
      },
      spacing: {
        'content-safe': '70px'
      },
      fontFamily: {
        sans: ['"Source Sans 3"', '"Noto Sans SC"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
