// Runs against a real Ghost instance - see test-e2e/setup/bootstrap.js
import {describe, it, expect, beforeAll} from 'vitest';

import {App, appTester, getAuthData, fixtures} from './helpers';
import {OWNER} from './setup/bootstrap';

describe('E2E Searches', function () {
    let authData;

    beforeAll(function () {
        authData = getAuthData();
    });

    describe('Find a Member', function () {
        it('finds the member seeded by the creates spec', async function () {
            const results = await appTester(App.searches.member.operation.perform, {
                authData,
                inputData: {email: fixtures.member.email}
            });

            expect(results).toHaveLength(1);
            expect(results[0].email).toBe(fixtures.member.email);
            expect(results[0].name).toBe(`${fixtures.member.name} Updated`);
        });

        it('returns an empty array for an unknown email', async function () {
            const results = await appTester(App.searches.member.operation.perform, {
                authData,
                inputData: {email: fixtures.missingEmail}
            });

            expect(Array.isArray(results)).toBe(true);
            expect(results).toHaveLength(0);
        });
    });

    describe('Find an Author', function () {
        it('finds the owner by email and again by the returned slug', async function () {
            const byEmail = await appTester(App.searches.author.operation.perform, {
                authData,
                inputData: {search_by: 'email', email: OWNER.email}
            });

            expect(byEmail).toHaveLength(1);
            expect(byEmail[0].email).toBe(OWNER.email);
            expect(byEmail[0].slug).toBeTypeOf('string');

            const bySlug = await appTester(App.searches.author.operation.perform, {
                authData,
                inputData: {search_by: 'slug', slug: byEmail[0].slug}
            });

            expect(bySlug).toHaveLength(1);
            expect(bySlug[0].email).toBe(OWNER.email);
        });

        it('returns an empty array for an unknown email', async function () {
            const results = await appTester(App.searches.author.operation.perform, {
                authData,
                inputData: {search_by: 'email', email: fixtures.missingEmail}
            });

            expect(Array.isArray(results)).toBe(true);
            expect(results).toHaveLength(0);
        });

        it('returns an empty array for an unknown slug', async function () {
            const results = await appTester(App.searches.author.operation.perform, {
                authData,
                inputData: {search_by: 'slug', slug: fixtures.missingSlug}
            });

            expect(Array.isArray(results)).toBe(true);
            expect(results).toHaveLength(0);
        });
    });
});
