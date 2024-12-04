import react from "npm:eslint-plugin-react@7.37.1";
import eslint from "npm:@eslint/js@9.12.0";
import tseslint from "npm:typescript-eslint@8.8.1";
import importPlugin from "npm:eslint-plugin-import@2.31.0";
import globals from "npm:globals@15.10.0";

function merge(...configs) {
  return configs.reduce((acc, config) => {
    const ob = {
      ...acc,
      ...config,
    };
    Object.keys(acc).forEach((key) => {
      if (Array.isArray(acc[key]) && Array.isArray(config[key])) {
        ob[key] = [...acc[key], ...config[key]];
        return;
      }
      if (typeof acc[key] === "object" && typeof config[key] === "object") {
        ob[key] = merge(acc[key], config[key]);
        return;
      }
    });
    return ob;
  }, {});
}

const config = [
  merge(
    eslint.configs.recommended,
    tseslint.configs.recommended[0],
    {
      files: [
        "app/src/sw.[jt]s",
      ],
      ignores: [
        "app/dist/**/*",
        "app/src-tauri/**/*",
        "app/.storybook/**/*",
      ],
      languageOptions: {
          ecmaVersion: 2022,
          sourceType: "module",
          globals: {
              ...globals.serviceworker,
          }
      },
      rules: {
        "no-restricted-globals": ["off"],
        "import/extensions": ["off"],
      },
    },
  ),
  merge(
    eslint.configs.recommended,
    tseslint.configs.recommended[0],
    importPlugin.flatConfigs.recommended,
    {
      files: [
        "app/tests/**/*.js",
        "app/**/*.spec.js",
      ],
      ignores: [
        "app/dist/**/*",
        "app/src-tauri/**/*",
        "app/.storybook/**/*",
      ],
      languageOptions: {
          ecmaVersion: 2022,
          sourceType: "module",
          globals: {
            ...globals.chai,
            ...globals.mocha,
            ...globals.browser,
          }
      },
      rules: {
        "import/extensions": ["off"],
        "no-unused-expressions": "off",
      },
    },
  ),
  merge(
    eslint.configs.recommended,
    react.configs.flat.recommended,
    tseslint.configs.recommended[0],
    importPlugin.flatConfigs.recommended,
    {
      languageOptions: {
          ecmaVersion: 2022,
          sourceType: "module",
          globals: {
              ...globals.browser,
              React: "readonly",
              API_URL: "readonly",
              APP_VERSION: "readonly",
          }
      },
      files: [
        "app/**/*.{ts,tsx}",
      ],
      ignores: [
        "app/dist/**/*",
        "app/src-tauri/**/*",
        "app/.storybook/**/*",
      ],
      rules: {
        "import/no-named-as-default": "off",
        "react/react-in-jsx-scope": "off",
        "no-useless-constructor": "off",
        "import/no-unresolved": "off",
        "no-redeclare": "off",
        "no-unused-vars": "off",
      },
    },
  ),
  merge(
    eslint.configs.recommended,
    react.configs.flat.recommended,
    tseslint.configs.recommended[0],
    importPlugin.flatConfigs.recommended,
    {
      files: [
        "app/**/*.{js,jsx}",
      ],
      ignores: [
        "app/src/sw.[jt]s",
        "app/dist/**/*",
        "app/src-tauri/**/*",
        "app/.storybook/**/*",
      ],
      rules: {
        "@typescript-eslint/no-empty-function": "warn",
        "@typescript-eslint/no-var-requires": "off",
        "import/no-unresolved": "off",
        //"import/no-unresolved": [2, { commonjs: true }],
      },
    },
  ),
];

export default config;
