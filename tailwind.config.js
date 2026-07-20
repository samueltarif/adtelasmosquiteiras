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
        'facebook-dark': '#166FE5',
        // Cores do painel Admin do Stitch
        admin: {
          primary: '#091e48',
          'primary-container': '#22345f',
          surface: '#f8f9ff',
          'surface-dim': '#cbdbf5',
          'surface-bright': '#f8f9ff',
          'surface-container': '#e5eeff',
          'surface-container-low': '#eff4ff',
          'surface-container-lowest': '#ffffff',
          'surface-container-high': '#dce9ff',
          'surface-container-highest': '#d3e4fe',
          'on-surface': '#0b1c30',
          'on-surface-variant': '#44464f',
          'outline-variant': '#c5c6d0',
          'outline': '#757780',
          'secondary-fixed-dim': '#ffb868',
          'secondary-fixed': '#ffddbb',
          'tertiary-fixed': '#66ff8e',
          'on-tertiary-fixed-variant': '#005322',
          'primary-fixed-dim': '#b4c5f9',
          'surface-tint': '#4c5d8b'
        }
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
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        },
        ping: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '75%, 100%': { transform: 'scale(1.5)', opacity: '0' }
        }
      },
      height: {
        '46': '11.5rem', // 184px
        '60': '15rem'    // 240px
      }
    }
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' }
        }
      })
    }
  ]
}
