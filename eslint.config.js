import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default [
  { ignores: ["node_modules/**", "frontend/**", "uploads/**", "design/**"] },
  js.configs.recommended,
  {
    files: ["backend/**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_|^next$" }],
      "no-console": "off",
    },
  },
  {
    files: ["backend/__tests__/**/*.js"],
    languageOptions: { globals: { ...globals.node } },
  },
  prettier,
];
