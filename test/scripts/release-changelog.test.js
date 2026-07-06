import fs from 'node:fs';

import { describe, it, expect } from 'vitest';

import { finalize, extract } from '../../scripts/release-changelog';

// The real changelog is the input the publish workflow will run against, so
// test against it directly: if its shape drifts (e.g. the Unreleased heading
// is renamed), these tests fail before a release does.
const realChangelog = fs.readFileSync(new URL('../../CHANGELOG.md', import.meta.url), 'utf8');

describe('finalize', () => {
    it('renames the Unreleased heading of the real CHANGELOG.md to the release version', () => {
        const { changelog, alreadyFinalized } = finalize(realChangelog, '3.0.0');

        expect(alreadyFinalized).toBe(false);
        expect(changelog).toMatch(/^## 3\.0\.0$/m);
        expect(changelog).not.toMatch(/^## Unreleased/m);
        // only the heading line changes
        expect(changelog).toBe(realChangelog.replace('## Unreleased (next major)', '## 3.0.0'));
    });

    it('is idempotent when the version heading already exists', () => {
        const finalized = finalize(realChangelog, '3.0.0').changelog;

        const rerun = finalize(finalized, '3.0.0');

        expect(rerun.alreadyFinalized).toBe(true);
        expect(rerun.changelog).toBe(finalized);
    });

    it('treats an already-released version as finalized without touching Unreleased', () => {
        const result = finalize(realChangelog, '2.6.3');

        expect(result.alreadyFinalized).toBe(true);
        expect(result.changelog).toBe(realChangelog);
    });

    it('fails loudly when neither the Unreleased nor the version heading exists', () => {
        expect(() => finalize('## 2.0.0\n\n* old release\n', '3.0.0')).toThrow(
            /neither an "## Unreleased" heading nor a "## 3\.0\.0" heading/,
        );
    });

    it('rejects labeled versions - they cannot be promoted on Zapier', () => {
        expect(() => finalize(realChangelog, '3.0.0-beta')).toThrow(/not a valid release version/);
    });

    it('rejects tag-shaped and malformed versions', () => {
        for (const version of ['v3.0.0', '3.0', '3.0.0.0', '03.0.0', '1000.0.0']) {
            expect(() => finalize(realChangelog, version)).toThrow(/not a valid release version/);
        }
    });
});

describe('extract', () => {
    it('returns the finalized Unreleased body as the release section', () => {
        const finalized = finalize(realChangelog, '3.0.0').changelog;

        const section = extract(finalized, '3.0.0');

        expect(section).toContain('Requires Ghost 6.0 or later to connect');
        expect(section).not.toMatch(/^## /m);
        // stops at the next release heading
        expect(section).not.toContain('Add `uuid` to Member Updated trigger');
    });

    it('extracts a historical release section from the real CHANGELOG.md', () => {
        expect(extract(realChangelog, '2.6.2')).toBe(
            '* Add `status` property to Member Updated trigger\n' +
                '* Fix Member Search action to return correct results when no member is found',
        );
    });

    it('extracts the final section when no later heading follows', () => {
        expect(extract(realChangelog, '1.0.3')).toBe('* Initial public release');
    });

    it('does not match versions that only appear as substrings of other versions', () => {
        // "## 2.6.0" must not be found inside "## 2.6.03" or list items
        expect(extract(realChangelog, '2.6.0')).toBe(
            '* (New) Allow multiple newsletters to be added to members',
        );
    });

    it('fails loudly when the section is missing', () => {
        expect(() => extract(realChangelog, '9.9.9')).toThrow(/no "## 9\.9\.9" section/);
    });
});
