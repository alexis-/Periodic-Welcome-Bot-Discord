module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'airbnb-typescript/base',
  ],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    'array-bracket-spacing': 0,
    'class-methods-use-this': 0,
    'function-paren-newline': 0,
    'import/no-cycle': 0,
    'lines-between-class-members': 0,
    'no-confusing-arrow': 0,
    'no-multi-assign': 0,
    'no-param-reassign': ['error', { props: false }],
    'no-plusplus': 0,
    'no-unused-vars': 0,
    'no-useless-constructor': 'off',
    'prefer-destructuring': 0,
    '@typescript-eslint/no-useless-constructor': 'error',
    '@typescript-eslint/no-var-requires': 0,
    'max-len': [
      'error',
      {
        code: 150,
        ignoreComments: true,
        ignoreUrls: true,
      },
    ],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@', './src/'],
        ],
        extensions: ['.js', '.ts'],
      },
    },
  },
};
