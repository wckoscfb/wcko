// ESLint flat config for WCKO. Focus is on rules that catch real bugs we've
// seen — react-hooks/exhaustive-deps and no-use-before-define would both have
// flagged the TDZ blank-screen bug at lint time before deploy.
//
// Run with:  npm run lint

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  // Don't lint generated/vendored output or test scaffolding.
  { ignores: ['dist/**', 'node_modules/**', 'public/**', 'scripts/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      // Hooks rules — catches the entire class of "hook called conditionally"
      // and "useMemo missing a dep" bugs.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // Catches the TDZ bug we just shipped: a useMemo at line 138 read a
      // const declared at line 185. With { variables: true } ESLint flags any
      // reference to a variable before its declaration in the same scope —
      // including closure references that get evaluated synchronously.
      'no-use-before-define': 'off', // disable base rule; TS version is smarter
      '@typescript-eslint/no-use-before-define': [
        'error',
        { functions: false, classes: true, variables: true, allowNamedExports: true },
      ],

      // Soft rules — useful but not blocking.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],

      // The codebase uses non-null assertions in a few well-justified places.
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // Test files: relax the unused-vars rule (test setup often imports for side
  // effects or registers tests at module-load).
  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
