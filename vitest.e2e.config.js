import { defineConfig } from 'vitest/config';
import { BaseSequencer } from 'vitest/node';

// The e2e specs share state (02-creates seeds the fixtures the later specs
// assert on), so files must run one at a time in filename order - the same
// order mocha used to load them in.
class FilenameOrderSequencer extends BaseSequencer {
    async sort(files) {
        return files.toSorted((a, b) => a.moduleId.localeCompare(b.moduleId));
    }
}

export default defineConfig({
    test: {
        include: ['test-e2e/**/*.test.js'],
        testTimeout: 30000,
        fileParallelism: false,
        sequence: {
            sequencer: FilenameOrderSequencer,
        },
    },
});
