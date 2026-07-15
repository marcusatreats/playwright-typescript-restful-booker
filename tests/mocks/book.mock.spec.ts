import { test, expect } from '@playwright/test';

// Route-mocked tests. Unlike book.spec.ts (which uses the `request` fixture and
// always hits the live Heroku API), these tests use a `page` and page.route()
// so every request - including the initial navigation - is intercepted and
// faked. No network traffic ever leaves the machine, and these tests don't
// share any state or bookingId with book.spec.ts.

test.describe('Booking API (mocked)', () => {

    test.beforeEach(async ({ page }) => {
        // Fake the root page so page.goto() doesn't hit the real site.
        await page.route('**/', route => {
            return route.fulfill({ status: 200, contentType: 'text/html', body: '<html></html>' });
        });
        await page.goto('/');
    });

    test('GET - booking by ID returns mocked data', async ({ page }) => {
        await page.route('**/booking/1', route => {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    firstname: 'Mocked',
                    lastname: 'User',
                    totalprice: 250,
                    depositpaid: true,
                    bookingdates: { checkin: '2026-07-01', checkout: '2026-07-07' },
                    additionalneeds: 'Breakfast'
                })
            });
        });

        const result = await page.evaluate(async () => {
            const res = await fetch('/booking/1');
            return { status: res.status, body: await res.json() };
        });

        expect(result.status).toBe(200);
        expect(result.body.firstname).toBe('Mocked');
        expect(result.body.totalprice).toBe(250);
    });

    test('GET - booking API returns 500', async ({ page }) => {
        await page.route('**/booking/1', route => {
            return route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Internal Server Error' })
            });
        });

        const result = await page.evaluate(async () => {
            const res = await fetch('/booking/1');
            return { status: res.status, body: await res.json() };
        });

        expect(result.status).toBe(500);
        expect(result.body.error).toBe('Internal Server Error');
    });

    test('GET - booking API returns malformed JSON', async ({ page }) => {
        await page.route('**/booking/1', route => {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: '{ "firstname": "Broken", '
            });
        });

        const result = await page.evaluate(async () => {
            const res = await fetch('/booking/1');
            const text = await res.text();
            try {
                JSON.parse(text);
                return { parsed: true };
            } catch {
                return { parsed: false, text };
            }
        });

        expect(result.parsed).toBe(false);
    });

    test('POST - create booking times out', async ({ page }) => {
        await page.route('**/booking', route => {
            // Never resolve - simulates a hung request.
            return new Promise(() => {});
        });

        let timedOut = false;
        try {
            await page.evaluate(async () => {
                const controller = new AbortController();
                setTimeout(() => controller.abort(), 500);
                await fetch('/booking', { method: 'POST', signal: controller.signal });
            });
        } catch {
            timedOut = true;
        }

        expect(timedOut).toBe(true);
    });

});
