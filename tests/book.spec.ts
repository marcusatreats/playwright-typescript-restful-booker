import { test, expect } from '@playwright/test';
import { getAuthToken } from '../helpers/auth';

test.describe.serial('Booking API', () => {

    let bookingId: number;
    let token: string;

    test.beforeAll(async ({ request }) => {
        token = await getAuthToken(request);

        const response = await request.post('/booking', {
            data: {
                firstname: 'Mark',
                lastname: 'Canning',
                totalprice: 150,
                depositpaid: true,
                bookingdates: {
                    checkin: '2026-07-01',
                    checkout: '2026-07-07'
                },
                additionalneeds: 'Breakfast'
            }
        });

        const body = await response.json();
        bookingId = body.bookingid;
        console.log(`Created booking ID: ${bookingId}`);
    });

    test.afterAll(async ({ request }) => {
        const response = await request.delete(`/booking/${bookingId}`, {
            headers: {
                'Cookie': `token=${token}`
            }
        });
        console.log(`Deleted booking ID: ${bookingId} - Status: ${response.status()}`);
    });

    test('GET - get all bookings', async ({ request }) => {
        const response = await request.get('/booking');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);
    });

    test('GET - get booking by ID', async ({ request }) => {
        const response = await request.get(`/booking/${bookingId}`);
        expect(response.status()).toBe(200);
        const body = await response.json();
        console.log(JSON.stringify(body, null, 2));
        expect(body.firstname).toBe('Mark');
        expect(body.lastname).toBe('Canning');
        expect(body.totalprice).toBe(150);
        expect(body.depositpaid).toBe(true);
        expect(body).toHaveProperty('bookingdates');
    });

    test('PUT - update a booking', async ({ request }) => {
        const response = await request.put(`/booking/${bookingId}`, {
            headers: {
                'Cookie': `token=${token}`
            },
            data: {
                firstname: 'Mark',
                lastname: 'Updated',
                totalprice: 999,
                depositpaid: false,
                bookingdates: {
                    checkin: '2026-08-01',
                    checkout: '2026-08-07'
                },
                additionalneeds: 'Dinner'
            }
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        console.log(JSON.stringify(body, null, 2));
        expect(body.lastname).toBe('Updated');
        expect(body.totalprice).toBe(999);
    });

    test('PATCH - partially update a booking', async ({ request }) => {
        const response = await request.patch(`/booking/${bookingId}`, {
            headers: {
                'Cookie': `token=${token}`
            },
            data: {
                firstname: 'Marcus',
                totalprice: 500
            }
        });

        expect(response.status()).toBe(200);

        const body = await response.json();
        console.log(JSON.stringify(body, null, 2));

        expect(body.firstname).toBe('Marcus');
        expect(body.totalprice).toBe(500);
        expect(body.lastname).toBe('Updated');
    });

    test('GET - booking not found returns 404', async ({ request }) => {
        const response = await request.get('/booking/999999');

        expect(response.status()).toBe(404);
    });

    test('PUT - unauthorized request returns 403', async ({ request }) => {
        const response = await request.put(`/booking/${bookingId}`, {
            headers: {
                'Cookie': 'token=invalidtoken123'
            },
            data: {
                firstname: 'Hacker',
                lastname: 'Test',
                totalprice: 0,
                depositpaid: false,
                bookingdates: {
                    checkin: '2026-01-01',
                    checkout: '2026-01-02'
                }
            }
        });

        expect(response.status()).toBe(403);
    });

    test('POST - invalid date format returns error', async ({ request }) => {
        const response = await request.post('/booking', {
            data: {
                firstname: 'Mark',
                lastname: 'Canning',
                totalprice: 150,
                depositpaid: true,
                bookingdates: {
                    checkin: 'not-a-date',
                    checkout: 'also-not-a-date'
                },
                additionalneeds: 'Breakfast'
            }
        });



        console.log(`Status: ${response.status()}`);
        const body = await response.json();
        console.log(JSON.stringify(body, null, 2));
        // BUG: API should return 400 for invalid date formats
        // Raised: https://github.com/mwinteringham/restful-booker/issues/55
        expect(response.status()).toBe(200);
        expect(body.booking.bookingdates.checkin).toBe('0NaN-aN-aN');

    });

    test('DELETE - delete a booking', async ({ request }) => {
        // Create a booking specifically for this delete test
        const createResponse = await request.post('/booking', {
            data: {
                firstname: 'Delete',
                lastname: 'Me',
                totalprice: 100,
                depositpaid: false,
                bookingdates: {
                    checkin: '2026-09-01',
                    checkout: '2026-09-07'
                },
                additionalneeds: 'None'
            }
        });

        const createBody = await createResponse.json();
        const deleteId = createBody.bookingid;
        console.log(`Created booking to delete: ${deleteId}`);

        // Now delete it
        const deleteResponse = await request.delete(`/booking/${deleteId}`, {
            headers: {
                'Cookie': `token=${token}`
            }
        });

        console.log(`Delete status: ${deleteResponse.status()}`);
        expect(deleteResponse.status()).toBe(201);

        // Verify it's gone
        const getResponse = await request.get(`/booking/${deleteId}`);
        expect(getResponse.status()).toBe(404);
        console.log(`Booking ${deleteId} confirmed deleted`);
    });

});