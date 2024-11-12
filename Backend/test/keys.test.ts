import { describe, expect, it } from 'bun:test'
import app from '../src'

describe("Keys", () => {
    let key: string;

    it('Create Key - 201', async () => {
        const req = new Request('http://localhost/v1/keys', {
            method: 'POST',
            body: JSON.stringify({
                description: "Test key"
            }),
            headers: {
                "Authorization": `Bearer ${process.env.TEST_API_KEY}`,
                "Content-Type": "application/json"
            }
        })
        const response = await app
            .handle(req)

        if (response.status !== 201 && response.body) {
            const body = await response.json().catch(() => response.text);
            console.log(body);
        }

        expect(response.status).toBe(201)

        if (response.status === 201) {
            const responseBody = await response.json();
            key = responseBody.key;
        }
    }, { timeout: 1000 * 60 })

    it('Test key - 200', async () => {
        if (!key) {
            console.warn("No key found, test failed? Skipping...")
            return;
        }

        const req = new Request('http://localhost/', {
            headers: {
                "Authorization": `Bearer ${key}`
            }
        })
        const response = await app
            .handle(req)

        expect(response.status).toBe(200)
    })

    it('Delete Key - 200', async () => {
        if (!key) {
            console.warn("No key found, test failed? Skipping...")
            return;
        }

        const req = new Request(`http://localhost/v1/keys/${key}`, {
            method: 'DELETE',
            headers: {
                "Authorization": `Bearer ${process.env.TEST_API_KEY}`
            }
        })
        const response = await app
            .handle(req)
            .then((res) => res.status)

        expect(response).toBe(200)
    })
})