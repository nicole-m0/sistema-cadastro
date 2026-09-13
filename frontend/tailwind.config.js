/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta extraída da logo da Associação Asafe
        gold: {
          50: '#FEF9EC',
          100: '#FCF0CB',
          200: '#F9E093',
          300: '#F5CB5C',
          400: '#F0B92E',
          500: '#E0A812',
          600: '#C2900C',
          700: '#9A700D',
          800: '#7D5A12',
          900: '#684B14',
        },
        garnet: {
          50: '#FBEAEC',
          100: '#F3C6CB',
          200: '#E296A0',
          300: '#C85F6E',
          400: '#A63A48',
          500: '#7E2530',
          600: '#671E27',
          700: '#4F181F',
          800: '#3A1217',
          900: '#240B0D',
        },
        forest: {
          50: '#EAF4EE',
          100: '#C7E2D1',
          200: '#96C8A9',
          300: '#5FA878',
          400: '#3A8956',
          500: '#236B3B',
          600: '#1C5A32',
          700: '#164628',
          800: '#12351F',
          900: '#0C2415',
        },
        amethyst: {
          50: '#F4EEF6',
          100: '#E1CEE9',
          200: '#C7A6D6',
          300: '#AC7EC2',
          400: '#9660AF',
          500: '#83519B',
          600: '#6C4180',
          700: '#523164',
          800: '#3B2249',
          900: '#261730',
        },
        ink: '#221B1A',
        cream: '#FFFCF5',
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(34, 27, 26, 0.08), 0 1px 2px rgba(34, 27, 26, 0.06)',
      },
    },
  },
  plugins: [],
};
