/** @type {import("prettier").Config} */
const config = {
    trailingComma: "none",
    tabWidth: 4,
    semi: true,
    singleQuote: false,
    arrowParens: "avoid",
    plugins: [],
    importOrderParserPlugins: ["typescript"],
};

module.exports = config;