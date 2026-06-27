// ESLint flat config (v9) — TypeScript estrito, mínimo e limpo na base.
// Mantemos uma config flat própria (em vez de eslint-config-expo) para evitar
// atrito de versão; cobre TS/TSX e ignora artefatos.
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'babel.config.js',
      'jest.config.js',
      'eslint.config.js',
      '**/*.d.ts',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
