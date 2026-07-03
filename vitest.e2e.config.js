const {defineConfig} = require('vitest/config');
const {BaseSequencer} = require('vitest/node');

// The e2e specs share state (02-creates seeds the fixtures the later specs
// assert on), so files must run one at a time in filename order - the same
// order mocha used to load them in.
class FilenameOrderSequencer extends BaseSequencer {
    async sort(files) {
        return [...files].sort((a, b) => a.moduleId.localeCompare(b.moduleId));
    }
}

module.exports = defineConfig({
    test: {
        include: ['test-e2e/**/*.test.js'],
        testTimeout: 30000,
        fileParallelism: false,
        sequence: {
            sequencer: FilenameOrderSequencer
        }
    }
});
