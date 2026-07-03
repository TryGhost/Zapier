import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';

import zapier from 'zapier-platform-core';

// Use this to make test calls into your app:
import App from '../../index';
const appTester = zapier.createAppTester(App);

const sampleTier = {
    id: '6220aa04dd8021001c50e6e2',
    name: 'Premium',
    description: null,
    slug: 'premium',
    active: true,
    type: 'paid',
    welcome_page_url: null,
    created_at: '2022-03-03T11:16:52.000Z',
    updated_at: '2022-03-03T11:16:52.000Z',
    visibility: 'public',
    benefits: [],
    currency: 'USD',
    monthly_price: 500,
    yearly_price: 5000,
    trial_days: 0,
};

describe('Triggers', function () {
    describe('Tier Created', function () {
        let apiMock, authData;

        beforeEach(function () {
            // the grafted tiers resource sends `Zapier/x.y.z` on its own,
            // SDK-backed requests append ` GhostAdminSDK/x.y.z` - match both
            apiMock = nock('http://zapier-test.ghost.io', {
                reqheaders: {
                    'User-Agent': new RegExp(`Zapier/${App.version}`),
                },
            });
            authData = {
                adminApiUrl: 'http://zapier-test.ghost.io',
                adminApiKey:
                    '5c3e1182e79eace7f58c9c3b:7202e874ccae6f1ee6688bb700f356b672fb078d8465860852652037f7c7459ddbd2f2a6e9aa05a40b499ae20027d9f9ba2e5004aa9ab6510b90a5dac674cbc1',
            };
        });

        afterEach(function () {
            nock.cleanAll();
        });

        it('loads tier from webhook data', function () {
            let bundle = Object.assign(
                {},
                { authData },
                {
                    inputData: {},
                    cleanedRequest: {
                        tier: {
                            current: sampleTier,
                            previous: {},
                        },
                    },
                },
            );

            return appTester(App.triggers.tier_created.operation.perform, bundle).then(([tier]) => {
                expect(tier.id).toEqual('6220aa04dd8021001c50e6e2');
                expect(tier.name).toEqual('Premium');
                expect(tier.slug).toEqual('premium');
            });
        });

        it('loads the latest active paid tier from list', function () {
            let bundle = Object.assign(
                {},
                { authData },
                {
                    inputData: {},
                    meta: {
                        frontend: true,
                    },
                },
            );

            apiMock
                .get('/ghost/api/admin/tiers/')
                .query({
                    filter: 'type:paid+active:true',
                    order: 'created_at DESC',
                    limit: 1,
                })
                .reply(200, {
                    tiers: [sampleTier],
                    meta: {
                        pagination: {
                            page: 1,
                            limit: 1,
                            pages: 1,
                            total: 1,
                            next: null,
                            prev: null,
                        },
                    },
                });

            return appTester(App.triggers.tier_created.operation.performList, bundle).then(
                (results) => {
                    expect(apiMock.isDone()).toBe(true);
                    expect(results.length).toEqual(1);

                    let [firstTier] = results;
                    expect(firstTier.id).toEqual('6220aa04dd8021001c50e6e2');
                    expect(firstTier.name).toEqual('Premium');
                    expect(firstTier.type).toEqual('paid');
                },
            );
        });

        it('loads all active paid tiers when filling dynamic dropdown', function () {
            let bundle = Object.assign(
                {},
                { authData },
                {
                    inputData: {},
                    meta: {
                        isFillingDynamicDropdown: true,
                    },
                },
            );

            apiMock
                .get('/ghost/api/admin/tiers/')
                .query({
                    filter: 'type:paid+active:true',
                    order: 'name DESC',
                    limit: 'all',
                })
                .reply(200, {
                    tiers: [
                        sampleTier,
                        {
                            ...sampleTier,
                            id: '6220aa04dd8021001c50e6e3',
                            name: 'Gold',
                            slug: 'gold',
                            monthly_price: 1000,
                            yearly_price: 10000,
                        },
                    ],
                    meta: {
                        pagination: {
                            page: 1,
                            limit: 'all',
                            pages: 1,
                            total: 2,
                            next: null,
                            prev: null,
                        },
                    },
                });

            return appTester(App.triggers.tier_created.operation.performList, bundle).then(
                (results) => {
                    expect(apiMock.isDone()).toBe(true);
                    expect(results.length).toEqual(2);

                    let [firstTier, secondTier] = results;
                    expect(firstTier.name).toEqual('Premium');
                    expect(secondTier.name).toEqual('Gold');
                },
            );
        });

        it('subscribes to webhook', function () {
            let bundle = Object.assign(
                {},
                { authData },
                {
                    targetUrl: 'https://webooks.zapier.com/ghost/tier',
                },
            );

            apiMock
                .post('/ghost/api/admin/webhooks/', {
                    webhooks: [
                        {
                            integration_id: '5c3e1182e79eace7f58c9c3b',
                            target_url: 'https://webooks.zapier.com/ghost/tier',
                            event: 'tier.added',
                        },
                    ],
                })
                .reply(201, {
                    webhooks: [
                        {
                            id: '12345',
                            target_url: 'https://webooks.zapier.com/ghost/tier',
                            event: 'tier.added',
                        },
                    ],
                });

            return appTester(App.triggers.tier_created.operation.performSubscribe, bundle).then(
                () => {
                    expect(apiMock.isDone()).toBe(true);
                },
            );
        });

        it('unsubscribes from webhook', function () {
            let bundle = Object.assign(
                {},
                { authData },
                {
                    subscribeData: {
                        id: '12345',
                        target_url: 'https://webooks.zapier.com/ghost/tier',
                        event: 'tier.added',
                    },
                },
            );

            apiMock.delete('/ghost/api/admin/webhooks/12345/').reply(204);

            return appTester(App.triggers.tier_created.operation.performUnsubscribe, bundle).then(
                () => {
                    expect(apiMock.isDone()).toBe(true);
                },
            );
        });
    });
});
