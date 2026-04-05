import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-purple': '#6B2D8B',
        'brand-purple-dark': '#4A1D63',
        'brand-purple-deep': '#2D1140',
        'brand-orange': '#E8A030',
        'brand-orange-light': '#F0B850',
        'brand-orange-dark': '#C8841A',
        'brand-blue': '#5B8EC9',
        'brand-blue-light': '#7AA8D8',
        'brand-green': '#6AAD3D',
        'brand-teal': '#3BA5A5',
        'brand-cream': '#FAF8F6',
        'brand-warm': '#F3F0EC',
      },
      fontFamily: {
        serif: ['Arial', 'Helvetica', 'sans-serif'],
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #2D1140 0%, #6B2D8B 100%)',
        'contact-gradient': 'linear-gradient(135deg, #6B2D8B 0%, #4A1D63 100%)',
      },
      boxShadow: {
        'orange-glow': '0 0 40px rgba(232, 160, 48, 0.3)',
        'blue-glow': '0 0 40px rgba(91, 142, 201, 0.3)',
        'purple-glow': '0 0 40px rgba(107, 45, 139, 0.3)',
        'card': '0 4px 24px rgba(45, 17, 64, 0.08)',
        'card-hover': '0 12px 40px rgba(45, 17, 64, 0.16)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
