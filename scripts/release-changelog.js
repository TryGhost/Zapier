/**
 * Finalizes and reads CHANGELOG.md for the automated release flow
 * (.github/workflows/publish.yml).
 *
 * Between releases, unreleased work accumulates under a literal
 * `## Unreleased` heading (optionally suffixed, e.g. "## Unreleased (next
 * major)"). At release time the publish workflow runs:
 *
 *   node scripts/release-changelog.js finalize <version>
 *     Renames the Unreleased heading to `## <version>` in place. Idempotent:
 *     if `## <version>` already exists the file is left untouched, so a
 *     re-run of a partly-failed release converges instead of erroring.
 *     Fails loudly when neither heading exists — `zapier-platform promote`
 *     reads the `## <version>` section as the user-facing changelog, so
 *     releasing without one must never succeed silently.
 *
 *   node scripts/release-changelog.js extract <version>
 *     Prints the body of the `## <version>` section (used for the release
 *     summary). Fails when the section is missing.
 */
const fs = require('fs');
const path = require('path');

const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');
const UNRELEASED_HEADING = /^## Unreleased\b.*$/m;

// Mirrors the version shapes Zapier accepts (x.y.z, each part 0-999), minus
// the `-label` suffix: labeled versions cannot be promoted, so they are not
// valid release versions.
const RELEASE_VERSION = /^(?:0|[1-9]\d{0,2})\.(?:0|[1-9]\d{0,2})\.(?:0|[1-9]\d{0,2})$/;

/**
 * @param {string} changelog full CHANGELOG.md contents
 * @param {string} version release version, e.g. "3.0.0"
 * @returns {boolean} whether a `## <version>` heading line exists
 */
function hasVersionHeading(changelog, version) {
    return changelog.split('\n').includes(`## ${version}`);
}

/**
 * @param {string} version candidate version string
 * @throws when the version is not a plain, promotable x.y.z version
 */
function assertReleaseVersion(version) {
    if (!RELEASE_VERSION.test(version)) {
        throw new Error(
            `'${version}' is not a valid release version - expected x.y.z (labeled versions cannot be promoted)`,
        );
    }
}

/**
 * Renames the Unreleased heading to `## <version>`.
 *
 * @param {string} changelog full CHANGELOG.md contents
 * @param {string} version release version, e.g. "3.0.0"
 * @returns {{changelog: string, alreadyFinalized: boolean}} updated contents
 * @throws when neither the version heading nor an Unreleased heading exists
 */
function finalize(changelog, version) {
    assertReleaseVersion(version);
    if (hasVersionHeading(changelog, version)) {
        return { changelog, alreadyFinalized: true };
    }
    if (!UNRELEASED_HEADING.test(changelog)) {
        throw new Error(
            `CHANGELOG.md has neither an "## Unreleased" heading nor a "## ${version}" heading - add the release notes before releasing`,
        );
    }
    return {
        changelog: changelog.replace(UNRELEASED_HEADING, `## ${version}`),
        alreadyFinalized: false,
    };
}

/**
 * Extracts the body of the `## <version>` section.
 *
 * @param {string} changelog full CHANGELOG.md contents
 * @param {string} version release version, e.g. "3.0.0"
 * @returns {string} the section body, without the heading, trimmed
 * @throws when the section is missing
 */
function extract(changelog, version) {
    assertReleaseVersion(version);
    const lines = changelog.split('\n');
    const headingIndex = lines.indexOf(`## ${version}`);
    if (headingIndex === -1) {
        throw new Error(`CHANGELOG.md has no "## ${version}" section`);
    }
    const body = lines.slice(headingIndex + 1);
    const nextHeading = body.findIndex((line) => line.startsWith('## '));
    return (nextHeading === -1 ? body : body.slice(0, nextHeading)).join('\n').trim();
}

function main(command, version) {
    if (!version || !['finalize', 'extract'].includes(command)) {
        console.error('Usage: node scripts/release-changelog.js <finalize|extract> <version>');
        process.exit(1);
    }
    const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');
    if (command === 'finalize') {
        const result = finalize(changelog, version);
        if (result.alreadyFinalized) {
            console.log(`CHANGELOG.md already has a "## ${version}" heading - nothing to do`);
        } else {
            fs.writeFileSync(CHANGELOG_PATH, result.changelog);
            console.log(`Renamed the Unreleased heading to "## ${version}"`);
        }
    } else {
        console.log(extract(changelog, version));
    }
}

if (require.main === module) {
    try {
        main(process.argv[2], process.argv[3]);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

module.exports = { finalize, extract };
