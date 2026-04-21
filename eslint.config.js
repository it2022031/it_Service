import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

/** Backend monorepo: TypeScript only (services + libraries). */
export default [
    {
        ignores: ['**/dist/**', '**/lib/**', '**/node_modules/**'],
    },
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 'latest',
        },
        plugins: {
            '@typescript-eslint': tsEslint,
        },
        rules: {
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/explicit-function-return-type': 'warn',
            '@typescript-eslint/no-explicit-any': 'error',
        },
    },
];
