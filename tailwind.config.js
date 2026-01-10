/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/components/**/*.{js,vue,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/composables/**/*.{js,ts}',
    './app/app.vue'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0891b2',
          dark: '#0e7490',
          light: '#06b6d4'
        },
        surface: '#ffffff',
        background: '#f8fafc',
        'text-primary': '#1e293b',
        'text-secondary': '#64748b',
        success: '#16a34a',
        warning: '#ea580c',
        danger: '#dc2626',
        border: '#e2e8f0',
        whatsapp: '#25d366',
        'whatsapp-dark': '#1fa952',
        instagram: '#E4405F',
        'instagram-dark': '#C13584',
        facebook: '#1877F2',
        'facebook-dark': '#166FE5'
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px rgba(0, 0, 0, 0.15)'
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out'
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: []
}
