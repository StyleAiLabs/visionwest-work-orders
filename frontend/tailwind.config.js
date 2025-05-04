/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                vwblue: {
                    DEFAULT: '#0075bf', // VisionWest primary blue
                    light: '#3c96d3',
                    dark: '#005d99',
                },
                vworange: {
                    DEFAULT: '#F26522', // VisionWest orange accent
                    light: '#ff8548',
                    dark: '#d14d0c',
                },
                vw: {
                    green: {
                        DEFAULT: '#99ca3f', // VisionWest primary green
                        light: '#b1da65',
                        dark: '#7ba32d',
                    },
                    dark: {
                        DEFAULT: '#231f20', // VisionWest secondary dark
                        light: '#3d3739',
                        dark: '#0f0d0e',
                    },
                }
            },
        },
    },
    plugins: [],
}