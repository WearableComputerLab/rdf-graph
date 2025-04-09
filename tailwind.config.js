/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            keyframes: {
                flash: {
                    "0%": {
                        backgroundColor: "rgba(255, 255, 255, 0.5)"
                    },
                    "100%": {
                        backgroundColor: "rgba(255, 255, 255, 0.25)"
                    }
                }
            },
            animation: {
                "flash-once": "0.25s ease-out 1 flash"
            }
        }
    },
    plugins: []
};
