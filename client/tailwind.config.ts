import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}', 
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'pixel': ['font-04b', 'monospace'],
      },
      backgroundImage: {
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      colors: {
        'gold': {
          50: '#fffef0',
          100: '#fffce0',
          200: '#fff8c1',
          300: '#fff382',
          400: '#ffeb43',
          500: '#ffd700', // Основной золотой
          600: '#e6c200',
          700: '#ccad00',
          800: '#b39900',
          900: '#998500',
        },
        'app': {
          dark: '#1F1F1F',      // Основной фон редактора (Activity Bar / Editor)
          darker: '#181818',    // Фон боковой панели (чуть глубже)
          card: '#252526',      // Цвет карточек (как фон выделения или Input)
          cardLight: '#2D2D30', // Цвет при наведении (Hover)
          border: '#3C3C3C',    // Тонкие границы, которые разделяют панели
          accent: '#007ACC',    // Фирменный синий VS Code (или ваше золото #ffd700)
        },
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      }
       
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
