import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#298FCE',
          'blue-accessible': '#186A9C',
          green: '#19A64F',
          'green-accessible': '#117838',
          gray: '#545454',
          ink: '#171A1F',
          canvas: '#F6F8FA',
          border: '#E4E8EE',
          gold: '#186A9C',
          navy: '#171A1F',
          ivory: '#EAF4FB',
          'gold-lt': '#EAF4FB',
        },
        status: {
          available: '#117838',
          pending: '#F59E0B',
          sold: '#EF4444',
          rented: '#3B82F6',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          300: '#D4D4D8',
          500: '#71717A',
          900: '#18181B',
        },
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
        arabic: ['var(--font-tajawal)', 'sans-serif'],
      },
      maxWidth: { container: '1280px' },
      borderRadius: {
        btn: '8px',
        card: '16px',
        modal: '20px',
        input: '10px',
        img: '12px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.08)',
        md: '0 4px 16px rgba(0,0,0,0.10)',
        lg: '0 8px 32px rgba(0,0,0,0.14)',
        gold: '0 4px 20px rgba(41,143,206,0.25)',
      },
    },
  },
  plugins: [],
};
export default config;
