module.exports = {
    env: {
        es6: true,
        node: true
    },
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2022
    },
    plugins: ['ghost'],
    extends: ['plugin:ghost/test']
};
