const {defineConfig} = require('vitest/config');

module.exports = defineConfig({
    test: {
        include: ['test/**/*.test.js'],
        coverage: {
            provider: 'v8',
            include: ['app/**/*.js', 'index.js'],
            reporter: ['text', 'lcov'],
            thresholds: {
                lines: 80,
                statements: 80,
                branches: 80,
                functions: 80
            }
        }
    }
});
