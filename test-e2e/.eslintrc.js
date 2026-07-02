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
    extends: ['plugin:ghost/test'],
    overrides: [
        {
            // the bootstrap script is a CLI tool run directly by node, so it
            // stays CommonJS; its console output is its interface
            files: ['setup/bootstrap.js'],
            parserOptions: {
                sourceType: 'script'
            },
            rules: {
                'no-console': 'off'
            }
        }
    ]
};
