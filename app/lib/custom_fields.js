import { FIELD_PARTS, FIELD_TYPE_IDS } from '@tryghost/metafield-types/structure';
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

const KNOWN_TYPES = new Set(FIELD_TYPE_IDS);

// A code it has no name for is shown as the code itself.
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });
const COUNTRY_CHOICES = COUNTRY_CODES.map((code) => ({
    value: code,
    label: countryNames.of(code),
    sample: code,
}));

// How the Zap editor takes a value of each type that isn't a single line of text.
// Any other type, including one added to Ghost later, is a single line of text,
// which Ghost validates.
const INPUTS = {
    long_text: { type: 'text' },
    country_code: { type: 'string', choices: COUNTRY_CHOICES },
};

const inputFor = (valueType) => INPUTS[valueType] ?? { type: 'string' };

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

// A field of a type this app's version of the types package doesn't know yet, which
// happens when the site runs a newer Ghost, is skipped until the package is updated.
const fieldsFor = (definitions) =>
    definitions.flatMap(({ namespace, key, name, type }) => {
        if (!KNOWN_TYPES.has(type)) {
            return [];
        }

        const parts = FIELD_PARTS[type];
        if (!parts) {
            return [{ key: keyFor(namespace, key), label: name, ...inputFor(type) }];
        }

        return Object.entries(parts).map(([part, partType]) => ({
            key: keyFor(namespace, key, part),
            label: `${name}: ${partLabel(part)}`,
            ...inputFor(partType),
        }));
    });

// An input for each metafield the site defines. Zapier caches these per
// connection, so a new field appears after refreshing fields in the editor.
const customFieldInputs = async (z, bundle) =>
    fieldsFor(await listCustomFields(z, bundle)).map((field) => ({
        ...field,
        required: false,
        helpText: KEEP_HELP,
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

// Metafields from a step's inputs, in the member payload's shape, or undefined if
// none are set. Blank inputs are skipped: Zapier sends '' for an empty mapped
// value, and Ghost treats '' as clearing the field.
const customFieldValuesFrom = (inputData) => {
    const metafields = {};

    for (const [inputKey, value] of Object.entries(inputData)) {
        if (!inputKey.startsWith(PREFIX) || isBlank(value)) {
            continue;
        }

        const [namespace, key, part] = inputKey.slice(PREFIX.length).split(SEPARATOR);
        const values = (metafields[namespace] ??= {});

        values[key] = part ? { ...values[key], [part]: value } : value;
    }

    return Object.keys(metafields).length > 0 ? metafields : undefined;
};

export { customFieldInputs, customFieldOutputs, customFieldValuesFrom, editedCustomFieldOutputs };
