/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./app/**/*.{js,jsx,ts,tsx}",
      "./components/**/*.{js,jsx,ts,tsx}",
    ],
    presets: [require("nativewind/preset")],
    theme: {
      extend: {
        fontFamily:{
          rubik: ['Rubik-Regular', 'sans-serif'],
          rubikBold: ['Rubik-Bold', 'sans-serif'],
          rubikExtraBold: ['Rubik-ExtraBold', 'sans-serif'],
          rubikMedium: ['Rubik-Medium', 'sans-serif'],
          rubikSemiBold: ['Rubik-SemiBold', 'sans-serif'],            
          rubikLight: ['Rubik-Light', 'sans-serif'],
        },
        colors: {
          primary: {
            50: '#e0f7f6',   
            100: '#b3ebe8',  
            200: '#80dfd9',  
            300: '#4dd3ca', 
            400: '#2ac7bc',   
            500: '#14b8ad',  
            600: '#119e95',  
            700: '#0e847d',  
            800: '#0a6a65',  
            900: '#07504d',  
          },

          secondary: {
            50: '#e6f2ff',   
            100: '#b3dbff',  
            200: '#80c4ff',  
            300: '#4dacff',  
            400: '#2a9aff',  
            500: '#1a8cff',  
            600: '#1676d9',  
            700: '#1260b3',  
            800: '#0e4a8c',  
            900: '#0a3466', 
          },

          accent:{
            100: '#FBFBFD',  
            green: '#10b981', 
            yellow: '#f59e0b',
          },

          surface: {
            DEFAULT: '#ffffff',     
            secondary: '#FBFBFD',  
            tertiary: '#f3f4f6',    
          },

          black: {
            DEFAULT: "#000000",
            100: "#8C8E98",
            200: "#666876",
            300: "#191D31",
          },
         
          danger: "#F75555"
        },

          spacing: {
            'safe': '16',
            'card': '20',
          },
          borderRadius: {
            'card': '16px',
            'button': '12px',
            'full': '9999px',
          },
          boxShadow: {
            'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            'card-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }
      },
    },
    plugins: [],
  };