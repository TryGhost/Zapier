import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['test/**/*.test.js'],
        coverage: {
            provider: 'v8',
            include: ['app/**/*.js', 'scripts/**/*.js', 'index.js'],
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
