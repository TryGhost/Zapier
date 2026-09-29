// Runs against a real Ghost instance - see test-e2e/setup/bootstrap.js
import { createRequire } from 'node:module';

import { describe, it, expect, beforeAll } from 'vitest';

import { App, appTester, getAuthData, fixtures } from './helpers';

const require = createRequire(import.meta.url);
const generateToken = require('@tryghost/admin-api/lib/token');

// The app has no step for defining fields, so the spec uses the Admin API directly.
const defineCustomField = async ({ adminApiUrl, adminApiKey }, field) => {
    const response = await fetch(`${adminApiUrl}/ghost/api/admin/members/metafields/custom/`, {
        method: 'POST',
        headers: {
            Authorization: `Ghost ${generateToken(adminApiKey, '/admin/')}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ members_metafields: [field] }),
    });
    const body = await response.json();

    if (response.status !== 201) {
        throw new Error(`Defining ${field.name} failed: ${JSON.stringify(body)}`);
    }

    return body.members_metafields[0].key;
};

describe('E2E Custom fields', function () {
    let authData, company, shipping;

    beforeAll(async function () {
        authData = getAuthData();
        company = await defineCustomField(authData, { name: 'Company', type: 'short_text' });
        shipping = await defineCustomField(authData, { name: 'Shipping', type: 'address' });
    });

    it("offers an input for each of the site's fields", async function () {
        const customFieldInputs = App.creates.create_member.operation.inputFields.find(
            (field) => field.name === 'customFieldInputs',
        );

        const inputs = await appTester(customFieldInputs, { authData, inputData: {} });

        expect(inputs.map((input) => input.label)).toEqual([
            'Company',
            'Shipping: Line 1',
            'Shipping: Line 2',
            'Shipping: City',
            'Shipping: State',
            'Shipping: Postal code',
            'Shipping: Country',
        ]);
    });

    it('creates a member holding the values a Zap set', async function () {
        const member = await appTester(App.creates.create_member.operation.perform, {
            authData,
            inputData: {
                email: fixtures.customFieldsMember.email,
                send_email: false,
                [`metafields__custom__${company}`]: 'Ghost',
                [`metafields__custom__${shipping}__city`]: 'Dublin',
                [`metafields__custom__${shipping}__country`]: 'IE',
            },
        });

        expect(member.metafields.custom).toEqual({
            [company]: 'Ghost',
            [shipping]: { city: 'Dublin', country: 'IE' },
        });
    });

    it('changes the values a Zap set, and keeps the ones it left blank', async function () {
        const [found] = await appTester(App.searches.member.operation.perform, {
            authData,
            inputData: { email: fixtures.customFieldsMember.email },
        });

        const member = await appTester(App.creates.update_member.operation.perform, {
            authData,
            inputData: {
                id: found.id,
                [`metafields__custom__${company}`]: 'Ghost Foundation',
                [`metafields__custom__${shipping}__city`]: '',
            },
        });

        expect(member.metafields.custom).toEqual({
            [company]: 'Ghost Foundation',
            [shipping]: { city: 'Dublin', country: 'IE' },
        });
    });

    it('finds a member together with their values', async function () {
        const [member] = await appTester(App.searches.member.operation.perform, {
            authData,
            inputData: { email: fixtures.customFieldsMember.email },
        });

        expect(member.metafields.custom[company]).toBe('Ghost Foundation');
    });

    it('shows the newest member with their values when setting up a Member Created Zap', async function () {
        const [member] = await appTester(App.triggers.member_created.operation.performList, {
            authData,
            inputData: {},
        });

        expect(member.email).toBe(fixtures.customFieldsMember.email);
        expect(member.metafields.custom[company]).toBe('Ghost Foundation');
    });
});
