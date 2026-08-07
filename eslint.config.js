import neostandard, { plugins } from 'newneostandard'

const tseslint = plugins['typescript-eslint']

export default [
    ...neostandard({
        ts: true,
        ignores: [
            'dist/**',
            'public/**',
            'test/*.js',
            'lib.es5.d.ts'
        ]
    }),

    ...tseslint.configs.recommended,

    {
        name: 'message/rules',
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_'
            }],
            '@stylistic/operator-linebreak': 'off',
            '@stylistic/multiline-ternary': 'off',
            '@typescript-eslint/consistent-type-imports': ['error', {
                prefer: 'type-imports'
            }],
            '@stylistic/no-multiple-empty-lines': ['error', {
                max: 1,
                maxEOF: 1
            }],
            '@stylistic/indent': ['error', 4, {
                SwitchCase: 1,
                ignoredNodes: ['TemplateLiteral *']
            }],
            '@stylistic/comma-dangle': 'off',
            // core `key-spacing` never looked at TS type members, but
            // the @stylistic version does. Keep it to object literals.
            '@stylistic/key-spacing': ['error', {
                beforeColon: false,
                afterColon: true,
                ignoredNodes: [
                    'TSTypeLiteral',
                    'TSInterfaceBody',
                    'ClassBody'
                ]
            }],
            '@stylistic/no-multi-spaces': ['error', {
                ignoreEOLComments: true
            }]
        }
    }
]
