import { APIRequestContext } from '@playwright/test';

export async function getAuthToken(request: APIRequestContext): Promise<string> {
    const response = await request.post('/auth', {
        data: {
            username: 'admin',
            password: 'password123'
        }
    });

    const body = await response.json();
    console.log('Auth response:', JSON.stringify(body, null, 2));

    return body.token;
}