import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import nock from 'nock';

import zapier from 'zapier-platform-core';

// Use this to make test calls into your app:
import App from '../../index';
const appTester = zapier.createAppTester(App);

describe('Triggers', function () {
    describe('Member Updated', function () {
        let apiMock, authData;

        beforeEach(function () {
            apiMock = nock('http://zapier-test.ghost.io', {
                reqheaders: {
                    'User-Agent': new RegExp(`Zapier/${App.version} GhostAdminSDK/\\d+.\\d+.\\d+`)
                }
            });
            authData = {
                adminApiUrl: 'http://zapier-test.ghost.io',
                adminApiKey: '5c3e1182e79eace7f58c9c3b:7202e874ccae6f1ee6688bb700f356b672fb078d8465860852652037f7c7459ddbd2f2a6e9aa05a40b499ae20027d9f9ba2e5004aa9ab6510b90a5dac674cbc1'
            };
        });

        afterEach(function () {
            nock.cleanAll();
        });

        it('loads sample member data', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {},
                cleanedRequest: {
                    member: {
                        current: {
                            id: '5a01d3ecc8d50d0e606a7e7c',
                            name: 'New Member Name',
                            email: 'sample@example.com',
                            note: 'Updated sample member record.',
                            created_at: '2019-10-13T18:12:00.000Z',
                            updated_at: '2019-10-31T14:58:00.000Z'
                        },
                        previous: {
                            name: 'Old Member Name',
                            note: 'Just a sample member record.',
                            updated_at: '2019-10-13T18:12:00.000Z'
                        }
                    }
                }
            });

            return appTester(App.triggers.member_updated.operation.perform, bundle)
                .then(([member]) => {
                    expect(member.current.id).toEqual('5a01d3ecc8d50d0e606a7e7c');
                    expect(member.current.name).toEqual('New Member Name');
                    expect(member.current.email).toEqual('sample@example.com');
                    expect(member.previous.name).toEqual('Old Member Name');
                });
        });

        it('loads member from list', function () {
            return appTester(App.triggers.member_updated.operation.performList, {authData})
                .then(([member]) => {
                    expect(member.current).toBeTruthy();
                    expect(Object.keys(member.current).length).toEqual(11);
                    expect(member.previous).toBeTruthy();
                    expect(Object.keys(member.previous).length).toEqual(8);

                    expect(member.current.id).toEqual('5a01d3ecc8d50d0e606a7e7c');

                    expect(member.current.name).toEqual('New Member Name');
                    expect(member.previous.name).toEqual('Old Member Name');

                    expect(member.current.email).toEqual('sample@example.com');
                    expect(member.previous.email).toEqual('oldsample@example.com');

                    expect(member.current.note).toEqual('Updated sample member record.');
                    expect(member.previous.note).toEqual('Old sample member record.');

                    expect(member.current.labels).toBeTruthy();
                    expect(member.current.labels.length).toBe(2);
                    expect(member.current.labels[0].name).toEqual('Old label 1');
                    expect(member.current.labels[1].name).toEqual('New label');

                    expect(member.previous.labels).toBeTruthy();
                    expect(member.previous.labels.length).toEqual(2);
                    expect(member.previous.labels[0].name).toEqual('Old label 1');
                    expect(member.previous.labels[1].name).toEqual('Old label 2');
                });
        });

        it('subscribes to webhook', function () {
            let bundle = Object.assign({}, {authData}, {
                targetUrl: 'https://webooks.zapier.com/ghost/member'
            });

            apiMock.post('/ghost/api/admin/webhooks/', {
                webhooks: [{
                    integration_id: '5c3e1182e79eace7f58c9c3b',
                    target_url: 'https://webooks.zapier.com/ghost/member',
                    event: 'member.edited'
                }]
            }).reply(201, {
                webhooks: [{
                    id: '12345',
                    target_url: 'https://webooks.zapier.com/ghost/member',
                    event: 'member.edited'
                }]
            });

            return appTester(App.triggers.member_updated.operation.performSubscribe, bundle)
                .then(() => {
                    expect(apiMock.isDone()).toBe(true);
                });
        });

        it('unsubscribes from webhook', function () {
            let bundle = Object.assign({}, {authData}, {
                subscribeData: {
                    id: '12345',
                    target_url: 'https://webooks.zapier.com/ghost/member',
                    event: 'member.edited'
                }
            });

            apiMock.delete('/ghost/api/admin/webhooks/12345/')
                .reply(204);

            return appTester(App.triggers.member_updated.operation.performUnsubscribe, bundle)
                .then(() => {
                    expect(apiMock.isDone()).toBe(true);
                });
        });
    });
});
