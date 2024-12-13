/** @type {import("prettier").Config} */
const config = {
  plugins: ["prettier-plugin-packagejson", "prettier-plugin-organize-imports"],
  arrowParens: "always",
  bracketSpacing: true,
  printWidth: 80,
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "all",
  useTabs: false,
  proseWrap: "always",
};

export default config;
