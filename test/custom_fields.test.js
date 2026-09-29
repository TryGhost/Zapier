import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';

import zapier from 'zapier-platform-core';

import { FIELD_TYPE_IDS } from '@tryghost/metafield-types/structure';

import App from '../index';
const appTester = zapier.createAppTester(App);

// Reached through the app's operations, so the tests also prove each step includes them.
const customFieldInputsOf = (operation) =>
    operation.inputFields.find((field) => field.name === 'customFieldInputs');
const customFieldOutputsOf = (operation) => operation.outputFields[0];

const SITE = 'http://zapier-test.ghost.io';
const DEFINITIONS = '/ghost/api/admin/members/metafields/custom/';
const MEMBER_ID = '5c9c9c8d51b5bf974afad2a4';

const definition = (key, name, type) => ({
    namespace: 'custom',
    key,
    name,
    type,
    status: 'active',
});

const definitions = [
    definition('company', 'Company', 'short_text'),
    definition('bio', 'Bio', 'long_text'),
    definition('shipping', 'Shipping', 'address'),
    // A type from a newer Ghost than this app's version of the types package.
    definition('birthday', 'Birthday', 'date'),
];

describe('Custom fields', function () {
    let site, bundle;

    beforeEach(function () {
        site = nock(SITE);
        bundle = {
            authData: {
                adminApiUrl: SITE,
                adminApiKey:
                    '5c3e1182e79eace7f58c9c3b:7202e874ccae6f1ee6688bb700f356b672fb078d8465860852652037f7c7459ddbd2f2a6e9aa05a40b499ae20027d9f9ba2e5004aa9ab6510b90a5dac674cbc1',
            },
            inputData: {},
        };
    });

    afterEach(function () {
        nock.cleanAll();
    });

    describe('inputs', function () {
        it("offers an input for each of the site's fields, and one per part of an address", async function () {
            site.get(DEFINITIONS).reply(200, { members_metafields: definitions });

            const inputs = await appTester(
                customFieldInputsOf(App.creates.create_member.operation),
                bundle,
            );

            expect(inputs.map(({ key, label, type }) => [key, label, type])).toEqual([
                ['metafields__custom__company', 'Company', 'string'],
                ['metafields__custom__bio', 'Bio', 'text'],
                ['metafields__custom__shipping__line1', 'Shipping: Line 1', 'string'],
                ['metafields__custom__shipping__line2', 'Shipping: Line 2', 'string'],
                ['metafields__custom__shipping__city', 'Shipping: City', 'string'],
                ['metafields__custom__shipping__state', 'Shipping: State', 'string'],
                ['metafields__custom__shipping__postal_code', 'Shipping: Postal code', 'string'],
                ['metafields__custom__shipping__country', 'Shipping: Country', 'string'],
            ]);
            expect(inputs.every((input) => input.required === false)).toBe(true);
            // A country is picked from Ghost's own list rather than typed.
            expect(inputs.at(-1).choices).toContainEqual({
                value: 'GB',
                label: 'United Kingdom',
                sample: 'GB',
            });
        });

        // Every type in the package this app is built with gets inputs, so updating the
        // package is all a new type needs.
        it('offers inputs for every type Ghost has', async function () {
            site.get(DEFINITIONS).reply(200, {
                members_metafields: FIELD_TYPE_IDS.map((type) => definition(type, type, type)),
            });

            const inputs = await appTester(
                customFieldInputsOf(App.creates.create_member.operation),
                bundle,
            );

            for (const type of FIELD_TYPE_IDS) {
                expect(
                    inputs.some(({ key }) => key.startsWith(`metafields__custom__${type}`)),
                    type,
                ).toBe(true);
            }
        });

        it('offers none on a Ghost from before custom fields', async function () {
            site.get(DEFINITIONS).reply(404, {
                errors: [{ type: 'NotFoundError', message: 'Resource not found' }],
            });

            expect(
                await appTester(customFieldInputsOf(App.creates.update_member.operation), bundle),
            ).toEqual([]);
        });

        it('offers none on a Ghost that refuses integrations its custom fields', async function () {
            site.get(DEFINITIONS).reply(403, {
                errors: [
                    {
                        type: 'NoPermissionError',
                        message: 'API tokens do not have permission to access this endpoint',
                    },
                ],
            });

            expect(
                await appTester(customFieldInputsOf(App.creates.update_member.operation), bundle),
            ).toEqual([]);
        });

        it('fails loudly when Ghost fails for any other reason', async function () {
            site.get(DEFINITIONS).reply(500, {
                errors: [{ type: 'InternalServerError', message: 'Something went wrong' }],
            });

            await expect(
                appTester(customFieldInputsOf(App.creates.update_member.operation), bundle),
            ).rejects.toThrow('Something went wrong');
        });
    });

    describe('outputs', function () {
        it("labels a member's values with the names the site gave its fields", async function () {
            site.get(DEFINITIONS).reply(200, { members_metafields: definitions.slice(0, 1) });

            expect(
                await appTester(customFieldOutputsOf(App.searches.member.operation), bundle),
            ).toEqual([{ key: 'metafields__custom__company', label: 'Company' }]);
        });

        it("labels an edited member's values, and the values the edit replaced", async function () {
            site.get(DEFINITIONS).reply(200, { members_metafields: definitions.slice(0, 1) });

            expect(
                await appTester(
                    customFieldOutputsOf(App.triggers.member_updated.operation),
                    bundle,
                ),
            ).toEqual([
                { key: 'current__metafields__custom__company', label: 'Company' },
                { key: 'previous__metafields__custom__company', label: 'Company (before)' },
            ]);
        });
    });

    describe('Update Member', function () {
        it('sends the values a Zap set, nesting the parts of an address', async function () {
            bundle.inputData = {
                id: MEMBER_ID,
                metafields__custom__company: 'Ghost',
                metafields__custom__shipping__city: 'Dublin',
                metafields__custom__shipping__country: 'IE',
            };

            site.put(`/ghost/api/admin/members/${MEMBER_ID}/`, (body) => {
                expect(body.members[0].metafields).toEqual({
                    custom: { company: 'Ghost', shipping: { city: 'Dublin', country: 'IE' } },
                });
                return true;
            }).reply(200, { members: [{ id: MEMBER_ID }] });

            await appTester(App.creates.update_member.operation.perform, bundle);
            expect(site.isDone()).toBe(true);
        });

        it("leaves blank values out, so a Zap never clears a member's answer", async function () {
            bundle.inputData = {
                id: MEMBER_ID,
                metafields__custom__company: '',
                metafields__custom__bio: '   ',
                metafields__custom__shipping__city: null,
                metafields__custom__shipping__country: undefined,
            };

            site.put(`/ghost/api/admin/members/${MEMBER_ID}/`, (body) => {
                expect(body.members[0]).not.toHaveProperty('metafields');
                return true;
            }).reply(200, { members: [{ id: MEMBER_ID }] });

            await appTester(App.creates.update_member.operation.perform, bundle);
            expect(site.isDone()).toBe(true);
        });
    });

    describe('Create Member', function () {
        beforeEach(function () {
            bundle.inputData = {
                email: 'member@example.com',
                metafields__custom__company: 'Ghost',
            };
        });

        it('creates the member with the values a Zap set', async function () {
            site.post('/ghost/api/admin/members/', (body) => {
                expect(body.members[0].metafields).toEqual({ custom: { company: 'Ghost' } });
                return true;
            })
                .query(true)
                .reply(201, {
                    members: [{ id: MEMBER_ID, metafields: { custom: { company: 'Ghost' } } }],
                });

            const member = await appTester(App.creates.create_member.operation.perform, bundle);

            expect(member.metafields.custom.company).toBe('Ghost');
        });

        it('stops the Zap when Ghost created the member without the values it was sent', async function () {
            site.post('/ghost/api/admin/members/')
                .query(true)
                .reply(201, { members: [{ id: MEMBER_ID }] });

            await expect(
                appTester(App.creates.create_member.operation.perform, bundle),
            ).rejects.toThrow(/created without their custom fields \(company\).*Update Ghost/);
        });
    });
});
