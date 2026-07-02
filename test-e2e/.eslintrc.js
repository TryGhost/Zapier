module.exports = {
    env: {
        es6: true,
        node: true,
        mocha: true
    },
    plugins: ['ghost'],
    extends: ['plugin:ghost/test'],
    overrides: [
        {
            // the bootstrap script is a CLI tool, its output is its interface
            files: ['setup/bootstrap.js'],
            rules: {
                'no-console': 'off'
            }
        }
    ]
};
