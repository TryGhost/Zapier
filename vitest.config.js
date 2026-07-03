const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
    test: {
        include: ['test/**/*.test.js'],
        coverage: {
            provider: 'v8',
            include: ['app/**/*.js', 'index.js'],
            reporter: ['text', 'lcov'],
            // the suite genuinely covers everything; keep the gates at the
            // actual level so coverage can only stay put or improve
            thresholds: {
                lines: 100,
                statements: 100,
                branches: 100,
                functions: 100,
            },
        },
    },
});
