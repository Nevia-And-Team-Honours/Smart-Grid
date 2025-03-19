// tailwind.config.js
module.exports = {
    // Mode can be 'jit' (Just-In-Time) or undefined for standard compilation
    mode: 'jit',
    // Control which files Tailwind should scan for class names
    content: [
      './pages/**/*.{js,ts,jsx,tsx}',
      './components/**/*.{js,ts,jsx,tsx}',
    ],
    // Dark mode strategy: 'media' uses system preferences, 'class' uses a class on HTML element
    darkMode: 'class',
    // Theme customization
    theme: {
      extend: {
        colors: {
          primary: {
            light: '#4da6ff',
            DEFAULT: '#0074D9',
            dark: '#004d8c',
          },
          secondary: '#FF851B',
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
          heading: ['Montserrat', 'sans-serif'],
        },
        spacing: {
          '128': '32rem',
        },
        borderRadius: {
          'xl': '1rem',
        },
      },
    },
    // Plugin configuration
    plugins: [
      require('@tailwindcss/forms'),
      require('@tailwindcss/typography'),
    ],
    // Force Tailwind to use the JS compiler instead of Oxide
    future: {
      useJsPrecompiler: true
    }
  }