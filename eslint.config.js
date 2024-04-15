import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';

export default [
    {
        ignores: [
            './client.js',
            './server.js',
        ],
    },
    js.configs.recommended,
    stylistic.configs.customize({
        indent: 4,
        quotes: 'single',
        semi: true,
        jsx: false,
    }),
    {
        rules: {
            '@stylistic/operator-linebreak': ['error', 'after'],
            '@stylistic/brace-style': ['error', '1tbs'],
        },
    },
    {
        rules: {
            'eqeqeq': ['error', 'always'],
            'curly': ['error', 'all'],
            'no-unused-vars': ["error", { "argsIgnorePattern": "^_" }],
            'no-use-before-define': 'error',
            'prefer-spread': 'error',
        },
    },
    {
        languageOptions: {
            globals: {
                'console': 'readonly',
                'document': 'readonly',
                'Image': 'readonly',
                'setInterval': 'readonly',
                'WebSocket': 'readonly',
            },
        },
    },
];
