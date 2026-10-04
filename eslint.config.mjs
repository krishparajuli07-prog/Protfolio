import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['dist/**', '.astro/**', 'node_modules/**']
  },
  {
    files: ['**/*.mjs', '**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    }
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser
    }
  }
];
