// Runs against a real Ghost instance - see test-e2e/setup/bootstrap.js
import {describe, it, expect, beforeAll} from 'vitest';

import {App, appTester, getAuthData, fixtures} from './helpers';
import {OWNER} from './setup/bootstrap';

describe('E2E Creates', function () {
    let authData;

    beforeAll(function () {
        authData = getAuthData();
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
                    send_email: false
                }
            });

            expect(member.id).toBeTypeOf('string');
            expect(member.email).toBe(fixtures.member.email);
            expect(member.name).toBe(fixtures.member.name);
        });
    });

    describe('Update Member', function () {
        it('updates the member with explicit newsletter subscriptions', async function () {
            // the default newsletter every Ghost 5 site ships with
            const [newsletter] = await appTester(App.triggers.newsletter_created.operation.performList, {
                authData,
                meta: {}
            });
            expect(newsletter.id).toBeTypeOf('string');

            const [member] = await appTester(App.searches.member.operation.perform, {
                authData,
                inputData: {email: fixtures.member.email}
            });

            const updated = await appTester(App.creates.update_member.operation.perform, {
                authData,
                inputData: {
                    id: member.id,
                    name: `${fixtures.member.name} Updated`,
                    newsletter_count: 'multiple',
                    newsletters_keepsame: false,
                    newsletters: [newsletter.id]
                }
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
                inputData: {search_by: 'email', email: OWNER.email}
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
                    authors: [ownerSlug]
                }
            });

            expect(post.id).toBeTypeOf('string');
            expect(post.title).toBe(fixtures.publishedPost.title);
            expect(post.status).toBe('published');
            expect(post.tags).toHaveLength(1);
            expect(post.tags[0].slug).toBe(fixtures.tagSlug);
            expect(post.primary_author.slug).toBe(ownerSlug);
        });

        it('creates a scheduled post with a future publish date', async function () {
            const oneHourAhead = new Date(Date.now() + (60 * 60 * 1000)).toISOString();

            const post = await appTester(App.creates.create_post.operation.perform, {
                authData,
                inputData: {
                    title: fixtures.scheduledPost.title,
                    status: 'scheduled',
                    published_at: oneHourAhead,
                    content_format: 'html',
                    html: fixtures.scheduledPost.html,
                    authors: [ownerSlug]
                }
            });

            expect(post.status).toBe('scheduled');
            expect(post.title).toBe(fixtures.scheduledPost.title);
        });
    });
});
