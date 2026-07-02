// Runs against a real Ghost instance - see test-e2e/setup/bootstrap.js
require('should');

const {App, appTester, getAuthData, fixtures} = require('./helpers');
const {OWNER} = require('./setup/bootstrap');

describe('E2E Searches', function () {
    let authData;

    before(function () {
        authData = getAuthData();
    });

    describe('Find a Member', function () {
        it('finds the member seeded by the creates spec', async function () {
            const results = await appTester(App.searches.member.operation.perform, {
                authData,
                inputData: {email: fixtures.member.email}
            });

            results.should.have.length(1);
            results[0].email.should.equal(fixtures.member.email);
            results[0].name.should.equal(`${fixtures.member.name} Updated`);
        });

        it('returns an empty array for an unknown email', async function () {
            const results = await appTester(App.searches.member.operation.perform, {
                authData,
                inputData: {email: fixtures.missingEmail}
            });

            results.should.be.an.Array().and.have.length(0);
        });
    });

    describe('Find an Author', function () {
        it('finds the owner by email and again by the returned slug', async function () {
            const byEmail = await appTester(App.searches.author.operation.perform, {
                authData,
                inputData: {search_by: 'email', email: OWNER.email}
            });

            byEmail.should.have.length(1);
            byEmail[0].email.should.equal(OWNER.email);
            byEmail[0].slug.should.be.a.String();

            const bySlug = await appTester(App.searches.author.operation.perform, {
                authData,
                inputData: {search_by: 'slug', slug: byEmail[0].slug}
            });

            bySlug.should.have.length(1);
            bySlug[0].email.should.equal(OWNER.email);
        });

        it('returns an empty array for an unknown email', async function () {
            const results = await appTester(App.searches.author.operation.perform, {
                authData,
                inputData: {search_by: 'email', email: fixtures.missingEmail}
            });

            results.should.be.an.Array().and.have.length(0);
        });

        it('returns an empty array for an unknown slug', async function () {
            const results = await appTester(App.searches.author.operation.perform, {
                authData,
                inputData: {search_by: 'slug', slug: fixtures.missingSlug}
            });

            results.should.be.an.Array().and.have.length(0);
        });
    });
});
