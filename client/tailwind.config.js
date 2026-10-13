/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FAFAFC',
        surface: '#FFFFFF',
        border: '#E2E8F0',
        text: {
          DEFAULT: '#1E293B',
          muted: '#6B7280',
        },
        primary: {
          DEFAULT: '#800020',
          hover: '#660019',
        },
        status: {
          draft: '#6B7280',
          review: '#F59E0B',
          approved: '#10B981',
          rejected: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        doc: ['"Times New Roman"', 'Times', 'serif'],
      },
    },
  },
  plugins: [],
};
