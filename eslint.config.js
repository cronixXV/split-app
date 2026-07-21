const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const reactHooks = require('eslint-plugin-react-hooks');
const prettier = require('eslint-config-prettier');

module.exports = [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      'cypress/screenshots/**',
      'cypress/videos/**',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],

    languageOptions: {
      parser: tsparser,
    },

    plugins: {
      '@typescript-eslint': tseslint,
    },

    rules: {
      ...tseslint.configs.recommended.rules,

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/no-explicit-any': 'warn',

      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  {
    files: ['client/**/*.{ts,tsx}'],

    plugins: {
      'react-hooks': reactHooks,
    },

    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    files: ['cypress/**/*.{ts,tsx}'],

    rules: {
      '@typescript-eslint/no-namespace': 'off',
    },
  },
  prettier,
];
