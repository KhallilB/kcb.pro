import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import globals from "globals";

export default tseslint.config(
  // replaces .eslintignore
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "packages/eslint-config/**",
    ],
  },

  // Core JS
  eslint.configs.recommended,

  // TypeScript (flat, parser+plugin wired)
  tseslint.configs.recommended,

  // React (flat)
  {
    ...react.configs.flat.recommended,
    settings: { react: { version: "detect", jsxRuntime: "automatic" } },
  },

  // Global env + new JSX transform tweaks
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
    },
  }
);
