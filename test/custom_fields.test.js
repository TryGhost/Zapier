import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';

import zapier from 'zapier-platform-core';

import { FIELD_TYPE_IDS, typesOfShape } from '@tryghost/metafield-types/structure';

import App from '../index';
const appTester = zapier.createAppTester(App);

// Reached through the app's operations, so the tests also prove each step includes them.
const customFieldInputsOf = (operation) =>
    operation.inputFields.find((field) => field.name === 'customFieldInputs');
const customFieldOutputsOf = (operation) => operation.outputFields[0];

const SITE = 'http://zapier-test.ghost.io';
const DEFINITIONS = '/ghost/api/admin/members/metafields/custom/';
const MEMBER_ID = '5c9c9c8d51b5bf974afad2a4';

const definition = (key, name, type, settings) => ({
    namespace: 'custom',
    key,
    name,
    type,
    ...(settings && { settings }),
    status: 'active',
});

const definitions = [
    definition('company', 'Company', 'short_text'),
    definition('bio', 'Bio', 'long_text'),
    definition('shipping', 'Shipping', 'address'),
    definition('plan', 'Plan', 'list', { options: ['Gold', 'Silver'], multiple: false }),
    definition('topics', 'Topics', 'list', {
        options: ['News', 'Sport', 'Culture'],
        multiple: true,
    }),
    // A type from a newer Ghost than this app's version of the types package.
    definition('birthday', 'Birthday', 'date'),
];

const SET_TYPES = typesOfShape('set');

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
                ['metafields__custom__plan', 'Plan', 'string'],
                ['metafields__custom__topics', 'Topics', 'string'],
            ]);
            expect(inputs.every((input) => input.required === false)).toBe(true);
            // A country is picked from Ghost's own list rather than typed.
            expect(
                inputs.find(({ key }) => key === 'metafields__custom__shipping__country').choices,
            ).toContainEqual({
                value: 'GB',
                label: 'United Kingdom',
                sample: 'GB',
            });
        });

        // A list's answers are always a list, so every list field's input takes several
        // picks, even when the field takes one. Ghost refuses a second pick for such a field.
        it("offers a list field's own options, saying when the field takes only one", async function () {
            site.get(DEFINITIONS).reply(200, { members_metafields: definitions });

            const inputs = await appTester(
                customFieldInputsOf(App.creates.update_member.operation),
                bundle,
            );
            const inputFor = (key) => inputs.find((input) => input.key === key);

            expect(inputFor('metafields__custom__plan')).toMatchObject({
                choices: ['Gold', 'Silver'],
                list: true,
                helpText: 'Pick one option. Leave blank to keep what the member already has.',
            });
            expect(inputFor('metafields__custom__topics')).toMatchObject({
                choices: ['News', 'Sport', 'Culture'],
                list: true,
                helpText: 'Leave blank to keep what the member already has.',
            });
        });

        // Ghost falls back to no options when it can't read a list field's settings, and
        // then refuses every answer, so an input could never succeed.
        it('offers no input for a list field Ghost has no options for', async function () {
            site.get(DEFINITIONS).reply(200, {
                members_metafields: [
                    definition('company', 'Company', 'short_text'),
                    definition('plan', 'Plan', 'list', { options: [], multiple: false }),
                ],
            });

            const inputs = await appTester(
                customFieldInputsOf(App.creates.update_member.operation),
                bundle,
            );

            expect(inputs.map(({ key }) => key)).toEqual(['metafields__custom__company']);
        });

        // Every type in the package this app is built with gets inputs, so updating the
        // package is all a new type built from existing building blocks needs.
        it('offers inputs for every type Ghost has', async function () {
            site.get(DEFINITIONS).reply(200, {
                members_metafields: FIELD_TYPE_IDS.map((type) =>
                    definition(
                        type,
                        type,
                        type,
                        SET_TYPES.includes(type)
                            ? { options: ['One', 'Two'], multiple: false }
                            : undefined,
                    ),
                ),
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
            // Each dropdown has choices, so an update that adds a source of choices fails here
            // until the app has its choices. One that adds a kind of leaf or a shape fails
            // above, since the app has no handler for it.
            for (const input of inputs.filter((input) => 'choices' in input)) {
                expect(input.choices?.length, input.key).toBeGreaterThan(0);
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
            site.get(DEFINITIONS).reply(200, {
                members_metafields: [
                    definition('company', 'Company', 'short_text'),
                    definition('topics', 'Topics', 'list', { options: [], multiple: true }),
                ],
            });

            // A list field Ghost has no options for still labels the answers members hold.
            expect(
                await appTester(customFieldOutputsOf(App.searches.member.operation), bundle),
            ).toEqual([
                { key: 'metafields__custom__company', label: 'Company' },
                { key: 'metafields__custom__topics', label: 'Topics' },
            ]);
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

        it('sends the options a Zap picked as a list, without its blank entries', async function () {
            bundle.inputData = {
                id: MEMBER_ID,
                metafields__custom__plan: ['Gold'],
                metafields__custom__topics: ['News', '', 'Culture'],
            };

            site.put(`/ghost/api/admin/members/${MEMBER_ID}/`, (body) => {
                expect(body.members[0].metafields).toEqual({
                    custom: { plan: ['Gold'], topics: ['News', 'Culture'] },
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
                metafields__custom__plan: '',
                metafields__custom__topics: ['', ' '],
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
