/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // NextGen WOM Brand Colors
                'deep-navy': {
                    DEFAULT: '#0e2640', // Primary brand color - headers, key elements
                    light: '#1a3a5c',
                    dark: '#081a2d',
                },
                'nextgen-green': {
                    DEFAULT: '#8bc63b', // Secondary brand color - accents, calls-to-action
                    light: '#a5d662',
                    dark: '#6fa52a',
                },
                'rich-black': {
                    DEFAULT: '#010308', // Body text, high contrast elements
                    light: '#1a1d23',
                    dark: '#000000',
                },
                'pure-white': {
                    DEFAULT: '#ffffff', // Backgrounds, negative space
                },

                // Semantic color mappings
                primary: {
                    DEFAULT: '#0e2640', // Deep Navy
                    light: '#1a3a5c',
                    dark: '#081a2d',
                },
                secondary: {
                    DEFAULT: '#8bc63b', // NextGen Green
                    light: '#a5d662',
                    dark: '#6fa52a',
                },

                // Keep legacy colors for backward compatibility during transition
                vwblue: {
                    DEFAULT: '#0075bf',
                    light: '#3c96d3',
                    dark: '#005d99',
                },
                vworange: {
                    DEFAULT: '#F26522',
                    light: '#ff8548',
                    dark: '#d14d0c',
                },
                vw: {
                    green: {
                        DEFAULT: '#99ca3f',
                        light: '#b1da65',
                        dark: '#7ba32d',
                    },
                    dark: {
                        DEFAULT: '#231f20',
                        light: '#3d3739',
                        dark: '#0f0d0e',
                    },
                }
            },
        },
    },
    plugins: [],
}