// Runs against a real Ghost instance - see test-e2e/setup/bootstrap.js
import { describe, it, expect, beforeAll } from 'vitest';

import { App, appTester, getAuthData, fixtures } from './helpers';
import { OWNER } from './setup/bootstrap';

describe('E2E Creates', function () {
    let authData;

    beforeAll(function () {
        authData = getAuthData();
    });

    // runs before 'Create Member' so fixtures.member stays the newest member
    // (the trigger specs assert on the latest member) - see helpers.js
    describe('Complimentary tiers', function () {
        let paidTier;

        beforeAll(async function () {
            // a fresh Ghost install ships with one active paid tier named
            // after the site, even without Stripe connected
            const tiers = await appTester(App.triggers.tier_created.operation.performList, {
                authData,
                meta: { isFillingDynamicDropdown: true },
            });

            expect(tiers).toHaveLength(1);
            expect(tiers[0].type).toBe('paid');
            expect(tiers[0].active).toBe(true);
            expect(tiers[0].name).toBe(OWNER.blogTitle);

            paidTier = tiers[0];
        });

        it('creates a comped member without Stripe connected', async function () {
            const member = await appTester(App.creates.create_member.operation.perform, {
                authData,
                inputData: {
                    name: fixtures.compedMember.name,
                    email: fixtures.compedMember.email,
                    comped_tier: paidTier.id,
                    send_email: false,
                },
            });

            expect(member.email).toBe(fixtures.compedMember.email);
            expect(member.status).toBe('comped');
            expect(member.tiers).toHaveLength(1);
            expect(member.tiers[0].id).toBe(paidTier.id);
        });

        it('removes complimentary subscriptions but Ghost keeps the comped status without Stripe', async function () {
            const [member] = await appTester(App.searches.member.operation.perform, {
                authData,
                inputData: { email: fixtures.compedMember.email },
            });

            const updated = await appTester(App.creates.update_member.operation.perform, {
                authData,
                inputData: {
                    id: member.id,
                    comped_remove: true,
                },
            });

            expect(updated.tiers).toHaveLength(0);
            // without Stripe, Ghost skips its member status recalculation on
            // edit (`needsProducts` is Stripe-gated in the member repository),
            // so the tier is detached but the status is left as it was
            expect(updated.status).toBe('comped');
        });

        it('attaches a tier on update but Ghost keeps the free status without Stripe', async function () {
            const created = await appTester(App.creates.create_member.operation.perform, {
                authData,
                inputData: {
                    name: fixtures.tieredMember.name,
                    email: fixtures.tieredMember.email,
                    send_email: false,
                },
            });
            expect(created.status).toBe('free');

            const updated = await appTester(App.creates.update_member.operation.perform, {
                authData,
                inputData: {
                    id: created.id,
                    comped_tier: paidTier.id,
                },
            });

            expect(updated.tiers).toHaveLength(1);
            expect(updated.tiers[0].id).toBe(paidTier.id);
            // the same Stripe-gated status recalculation as above: on a
            // Stripe-connected site this member would become 'comped'
            expect(updated.status).toBe('free');
        });

        it('rejects the deprecated comped flag without Stripe connected', async function () {
            await expect(
                appTester(App.creates.create_member.operation.perform, {
                    authData,
                    inputData: {
                        email: 'e2e-legacy-comped@example.com',
                        comped: true,
                        send_email: false,
                    },
                }),
            ).rejects.toMatchObject({
                name: 'HaltedError',
                message: expect.stringMatching(/Missing Stripe connection/),
            });
        });
    });

    describe('Create Member', function () {
        it('creates a member without sending an email', async function () {
            const member = await appTester(App.creates.create_member.operation.perform, {
                authData,
                inputData: {
                    name: fixtures.member.name,
                    email: fixtures.member.email,
                    note: fixtures.member.note,
                    newsletter_count: 'single',
                    subscribed: true,
                    // no mail transport is configured in CI, sending must stay off
                    send_email: false,
                },
            });

            expect(member.id).toBeTypeOf('string');
            expect(member.email).toBe(fixtures.member.email);
            expect(member.name).toBe(fixtures.member.name);
        });
    });

    describe('Update Member', function () {
        it('updates the member with explicit newsletter subscriptions', async function () {
            // the default newsletter every Ghost 5 site ships with
            const [newsletter] = await appTester(
                App.triggers.newsletter_created.operation.performList,
                {
                    authData,
                    meta: {},
                },
            );
            expect(newsletter.id).toBeTypeOf('string');

            const [member] = await appTester(App.searches.member.operation.perform, {
                authData,
                inputData: { email: fixtures.member.email },
            });

            const updated = await appTester(App.creates.update_member.operation.perform, {
                authData,
                inputData: {
                    id: member.id,
                    name: `${fixtures.member.name} Updated`,
                    newsletter_count: 'multiple',
                    newsletters_keepsame: false,
                    newsletters: [newsletter.id],
                },
            });

            expect(updated.id).toBe(member.id);
            expect(updated.name).toBe(`${fixtures.member.name} Updated`);
            expect(updated.newsletters).toHaveLength(1);
            expect(updated.newsletters[0].id).toBe(newsletter.id);
        });
    });

    describe('Create Post', function () {
        let ownerSlug;

        beforeAll(async function () {
            // the author input takes slugs - resolve the owner's real slug
            // rather than guessing what Ghost generated from the name
            const [owner] = await appTester(App.searches.author.operation.perform, {
                authData,
                inputData: { search_by: 'email', email: OWNER.email },
            });
            ownerSlug = owner.slug;
        });

        it('creates a published post from html source with a new tag', async function () {
            const post = await appTester(App.creates.create_post.operation.perform, {
                authData,
                inputData: {
                    title: fixtures.publishedPost.title,
                    status: 'published',
                    content_format: 'html',
                    html: fixtures.publishedPost.html,
                    tags: [fixtures.tagSlug],
                    authors: [ownerSlug],
                },
            });

            expect(post.id).toBeTypeOf('string');
            expect(post.title).toBe(fixtures.publishedPost.title);
            expect(post.status).toBe('published');
            expect(post.tags).toHaveLength(1);
            expect(post.tags[0].slug).toBe(fixtures.tagSlug);
            expect(post.primary_author.slug).toBe(ownerSlug);
        });

        it('creates a scheduled post with a future publish date', async function () {
            const oneHourAhead = new Date(Date.now() + 60 * 60 * 1000).toISOString();

            const post = await appTester(App.creates.create_post.operation.perform, {
                authData,
                inputData: {
                    title: fixtures.scheduledPost.title,
                    status: 'scheduled',
                    published_at: oneHourAhead,
                    content_format: 'html',
                    html: fixtures.scheduledPost.html,
                    authors: [ownerSlug],
                },
            });

            expect(post.status).toBe('scheduled');
            expect(post.title).toBe(fixtures.scheduledPost.title);
        });
    });
});
