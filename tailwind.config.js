/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      backgroundSize: {
        '400': '400% 400%',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.gray[800]'),
            '--tw-prose-headings': theme('colors.gray[900]'),
            '--tw-prose-invert-body': theme('colors.gray[300]'),
            '--tw-prose-invert-headings': theme('colors.gray[100]'),
          },
        },
      }),
      keyframes: {
        'animated-gradient': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'border-blob-spin': {
          'from': {
            transform: 'rotate(0deg)',
            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
          },
          '50%': {
            borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%',
          },
          'to': {
            transform: 'rotate(360deg)',
            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
          },
        },
        'blob-pulse': {
          '0%': {
            transform: 'translate(-50%, -50%) rotate(0deg) scale(1)',
            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
          },
          '50%': {
            transform: 'translate(-45%, -55%) rotate(180deg) scale(1.3)',
            borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%',
            opacity: 0.5,
          },
          '100%': {
            transform: 'translate(-50%, -50%) rotate(360deg) scale(1)',
            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
          },
        },
        'shimmer-effect': {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.7, transform: 'scale(0.9)' },
        },
      },
      animation: {
        'animated-gradient': 'animated-gradient 10s ease infinite',
        'border-blob-spin': 'border-blob-spin 8s linear infinite',
        'blob-pulse': 'blob-pulse 20s cubic-bezier(0.45, 0, 0.55, 1) infinite',
        'shimmer-effect': 'shimmer-effect 2s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
