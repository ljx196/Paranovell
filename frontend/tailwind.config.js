/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Design System Colors - Dark Theme
        dark: {
          'bg-primary': '#1A1A1A',
          'bg-secondary': '#262626',
          'bg-tertiary': '#2A2A2A',
          'sidebar-bg': '#1F1F1F',
          'sidebar-hover': '#2A2A2A',
          'text-primary': '#EAE6DF',
          'text-secondary': '#A8A29E',
          'text-muted': '#6B6560',
          'accent': '#D4836A',
          'accent-hover': '#E09478',
          'border': '#333333',
          'msg-user-bg': '#242424',
          'input-bg': '#262626',
          'input-border': '#3D3D3D',
          'input-focus-border': '#4D4D4D',
        },
        // Design System Colors - Light Theme
        light: {
          'bg-primary': '#FAFAF9',
          'bg-secondary': '#FFFFFF',
          'bg-tertiary': '#F5F5F4',
          'sidebar-bg': '#F5F5F4',
          'sidebar-hover': '#E7E5E4',
          'text-primary': '#1C1917',
          'text-secondary': '#57534E',
          'text-muted': '#A8A29E',
          'accent': '#C4704F',
          'accent-hover': '#B5614A',
          'border': '#E7E5E4',
          'msg-user-bg': '#F5F5F4',
          'input-bg': '#FFFFFF',
          'input-border': '#D6D3D1',
          'input-focus-border': '#C4C4C4',
        },
        // Brand accent color
        accent: {
          DEFAULT: '#D4836A',
          hover: '#E09478',
          light: '#C4704F',
        },
      },
      spacing: {
        'sidebar': '260px',
        'content': '768px',
        'header': '48px',
      },
      maxWidth: {
        'content': '768px',
      },
      width: {
        'sidebar': '260px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      fontSize: {
        'page-title': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'section-title': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-large': ['16px', { lineHeight: '1.6' }],
        'body': ['15px', { lineHeight: '1.8' }],
        'auxiliary': ['14px', { lineHeight: '1.5' }],
        'small': ['12px', { lineHeight: '1.4', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
};
