import { isFieldType, matchLeaf, matchShape } from '@tryghost/metafield-types/structure';
import { COUNTRY_CODES } from '@tryghost/metafield-types/countries';
import { CUSTOM_NAMESPACE, QUALIFIER } from '@tryghost/metafield-types/identity';
import { initAdminApi, isNotFoundHaltedError, RequestError } from './utils.js';

// The namespaces whose fields a Zap offers: today only the fields the publisher
// defines. Ghost decides what an integration may read and write, so when it can
// say which namespaces that is, this list comes from Ghost instead.
const NAMESPACES = [CUSTOM_NAMESPACE];

// Input and output keys are the value's path in the member payload,
// `metafields.<namespace>.<key>[.<part>]`, joined with `__`, which is how Zapier
// flattens nested output. Ghost namespaces and keys never contain `__`.
const SEPARATOR = '__';
const PREFIX = `${QUALIFIER}${SEPARATOR}`;
const keyFor = (...segments) => `${PREFIX}${segments.join(SEPARATOR)}`;

const KEEP_HELP = 'Leave blank to keep what the member already has.';

// A code it has no name for is shown as the code itself.
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

// The choices for each source a choice leaf picks from, such as the countries.
const SOURCE_CHOICES = {
    countries: COUNTRY_CODES.map((code) => ({
        value: code,
        label: countryNames.of(code),
        sample: code,
    })),
};

// How the Zap editor takes a leaf, one value stored as one string: long text in a
// multi-line box, any other text on one line, and a choice as a dropdown of its
// source. Ghost validates what is sent. A package update that adds a kind of leaf
// needs a handler here, without which this throws, and one that adds a source
// needs its choices above, without which its dropdown has none. The test that
// offers inputs for every type fails on either.
const inputForLeaf = (leaf) =>
    matchLeaf(leaf, {
        text: ({ size }) => ({ type: size === 'long' ? 'text' : 'string' }),
        choice: ({ from }) => ({ type: 'string', choices: SOURCE_CHOICES[from] }),
    });

// A part's key as words, such as "Postal code" for postal_code or "Line 1" for line1.
const partLabel = (part) => {
    const words = part.replace(/_/g, ' ').replace(/([a-z])(\d)/g, '$1 $2');
    return words.charAt(0).toUpperCase() + words.slice(1);
};

const listNamespace = async (z, bundle, namespace) => {
    try {
        return await initAdminApi(z, bundle.authData).memberMetafields.browse(namespace);
    } catch (err) {
        // 404: Ghost without metafields. 403: Ghost that refuses integration keys here.
        // Either way there are no fields to offer.
        if (isNotFoundHaltedError(err) || (err instanceof RequestError && err.res.status === 403)) {
            return [];
        }
        throw err;
    }
};

const listCustomFields = async (z, bundle) =>
    (await Promise.all(NAMESPACES.map((namespace) => listNamespace(z, bundle, namespace)))).flat();

// The site's fields as Zap editor fields, laid out by what each type is composed
// of: one for a single value, one per part of a record, and a dropdown of a set
// field's own options, such as a list's. Each has the `input` the editor shows,
// or none when no value could be stored, and a `hint` to add to its help. A field
// of a type this app's version of the types package doesn't know yet, which
// happens when the site runs a newer Ghost, is skipped until the package is
// updated. A package update that adds a shape needs a handler here, without which
// this throws.
const fieldsFor = (definitions) =>
    definitions
        .filter(({ type }) => isFieldType(type))
        .flatMap(({ namespace, key, name, type, settings }) =>
            matchShape(type, {
                scalar: ({ leaf }) => [
                    { key: keyFor(namespace, key), label: name, input: inputForLeaf(leaf) },
                ],
                record: ({ parts }) =>
                    Object.entries(parts).map(([part, leaf]) => ({
                        key: keyFor(namespace, key, part),
                        label: `${name}: ${partLabel(part)}`,
                        input: inputForLeaf(leaf),
                    })),
                // A set's answers are the text of each option picked, even when its field
                // takes one. Zapier only sends a dropdown's picks as a list when the input
                // takes several, so every set field's input takes several, even when the
                // field takes one. Ghost refuses a second pick for such a field, and the
                // input's hint says so. Ghost falls back to no options when it can't read a
                // field's settings, and then refuses every answer, so that field has no
                // input, only its answers as output.
                set: () => [
                    {
                        key: keyFor(namespace, key),
                        label: name,
                        input:
                            settings.options.length > 0
                                ? { type: 'string', choices: settings.options, list: true }
                                : undefined,
                        hint: settings.multiple ? undefined : 'Pick one option.',
                    },
                ],
            }),
        );

// An input for each of the site's fields a value can be given for. Zapier caches
// these per connection, so a new field appears after refreshing fields in the editor.
const customFieldInputs = async (z, bundle) =>
    fieldsFor(await listCustomFields(z, bundle))
        .filter(({ input }) => input)
        .map(({ key, label, input, hint }) => ({
            key,
            label,
            ...input,
            required: false,
            helpText: hint ? `${hint} ${KEEP_HELP}` : KEEP_HELP,
        }));

// Labels for a member's metafield outputs.
const customFieldOutputs = async (z, bundle) =>
    fieldsFor(await listCustomFields(z, bundle)).map(({ key, label }) => ({ key, label }));

// Labels for an edit payload's metafield outputs: the member's values under `current`,
// and under `previous` what the edit replaced, when it changed any.
const editedCustomFieldOutputs = async (z, bundle) => {
    const fields = fieldsFor(await listCustomFields(z, bundle));

    return [
        ...fields.map(({ key, label }) => ({ key: `current${SEPARATOR}${key}`, label })),
        ...fields.map(({ key, label }) => ({
            key: `previous${SEPARATOR}${key}`,
            label: `${label} (before)`,
        })),
    ];
};

const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

// What a step gave one input, without the blanks Zapier sends for an empty mapped
// value: '' for text, and blank entries in a list. Undefined if nothing is left.
const givenValue = (value) => {
    const kept = Array.isArray(value) ? value.filter((entry) => !isBlank(entry)) : value;
    const blank = Array.isArray(kept) ? kept.length === 0 : isBlank(kept);

    return blank ? undefined : kept;
};

// Metafields from a step's inputs, in the member payload's shape, or undefined if
// none are given. Blank inputs are skipped, so they leave the member's value alone:
// Ghost clears a value only when sent null, and refuses '' and [], which would stop
// the Zap.
const customFieldValuesFrom = (inputData) => {
    const metafields = {};

    for (const [inputKey, value] of Object.entries(inputData)) {
        const given = inputKey.startsWith(PREFIX) ? givenValue(value) : undefined;
        if (given === undefined) {
            continue;
        }

        const [namespace, key, part] = inputKey.slice(PREFIX.length).split(SEPARATOR);
        const values = (metafields[namespace] ??= {});

        values[key] = part ? { ...values[key], [part]: given } : given;
    }

    return Object.keys(metafields).length > 0 ? metafields : undefined;
};

export { customFieldInputs, customFieldOutputs, customFieldValuesFrom, editedCustomFieldOutputs };
