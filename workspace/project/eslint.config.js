import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";
import importX from "eslint-plugin-import-x";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";

export const commonLintConfig = tseslint.config(
  {
    plugins: {
      ["@typescript-eslint"]: tseslint.plugin,
      "unused-imports": unusedImports,
      "import-x": importX,
      react: react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y
    }
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/*.graphql",
      "**/*.mustache",
      "**/*.md",
      "entities/**",
      "**/*.js",
      "**/*.cjs",
      "**/*.mjs"
    ]
  }
);

export const getLintModuleConfiguration = ({ files, tsConfigPath, extraRules }) =>
  tseslint.config({
    files,
    languageOptions: {
      sourceType: "module",
      parserOptions: {
        ecmaVersion: 2022,
        projectService: true,
        tsconfigRootDir: tsConfigPath,
        warnOnUnsupportedTypeScriptVersion: false
      }
    },
    settings: {
      "import-x/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"]
      },
      "import-x/resolver": {
        typescript: {
          project: tsConfigPath
        }
      }
    },
    rules: {
      // conflict with recommendation
      "no-useless-escape": 0,
      "no-empty": 0,
      "comma-dangle": 0,
      "consistent-return": 0,
      "no-param-reassign": 0,
      "no-useless-return": 0,
      "no-unsafe-finally": 2,
      "no-case-declarations": 0,
      "no-async-promise-executor": 0,
      "arrow-parens": ["error", "as-needed"],
      curly: ["error", "all"],

      // conflict ts
      // can open but too much work, later
      "@typescript-eslint/no-unused-vars": 0,
      "@typescript-eslint/no-explicit-any": 0,
      "@typescript-eslint/no-duplicate-enum-values": 0,
      "@typescript-eslint/ban-ts-comment": 0,
      "@typescript-eslint/ban-types": 0,
      "@typescript-eslint/no-unsafe-function-type": 0,
      "@typescript-eslint/no-unused-expressions": 0,

      // extra rules help
      "object-curly-newline": 2,
      "eol-last": 2,
      "no-return-assign": 2,
      "no-unneeded-ternary": 2,
      yoda: 2,
      "spaced-comment": 2,

      // typescript rules
      "@typescript-eslint/no-empty-object-type": 2,
      "@typescript-eslint/consistent-type-imports": 2,
      "@typescript-eslint/consistent-type-exports": 2,
      "@typescript-eslint/no-empty-interface": 2,
      // maybe 2 by default
      "@typescript-eslint/no-non-null-asserted-optional-chain": 2,

      // import rules
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "off",
        { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" }
      ],
      "import-x/no-cycle": [2, { ignoreExternal: true }],
      "import-x/no-duplicates": "error",
      "import-x/no-unresolved": "error",

      // react only
      "react/destructuring-assignment": 0,
      "react/jsx-boolean-value": 0,
      "react/no-children-prop": 0,
      "react/no-unescaped-entities": 0,
      "react/jsx-curly-brace-presence": 0,
      "react/no-array-index-key": 0,
      "react/jsx-props-no-spreading": 0,
      "react/jsx-wrap-multilines": 2,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": 0,
      // double check how to fix
      "jsx-a11y/anchor-is-valid": 0,

      // lodash
      "no-restricted-syntax": [
        "error",
        {
          message: "Avoid Decimal.sum with spread. Use sumDecimals for large arrays.",
          selector:
            'CallExpression[callee.object.name="Decimal"][callee.property.name="sum"] > SpreadElement'
        },
        {
          message:
            "Lodash chain() function is not allowed. Reference: https://github.com/lodash/lodash/issues/3298",
          selector: 'CallExpression[callee.name="chain"]'
        }
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "lodash-es",
              importNames: ["chain"],
              message:
                "Importing chain() from lodash is not allowed. Reference: https://github.com/lodash/lodash/issues/3298"
            },
            {
              name: "lodash-es/chain",
              message:
                "Importing chain from lodash is not allowed. Reference: https://github.com/lodash/lodash/issues/3298"
            }
          ]
        }
      ],
      ...(extraRules || {})
    }
  });

export default tseslint.config(
  ...commonLintConfig,
  ...getLintModuleConfiguration({ files: ["**/*.ts", "**/*.tsx"], extraRules: {} })
);
