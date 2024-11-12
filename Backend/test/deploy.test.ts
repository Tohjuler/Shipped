import { describe, expect, it } from 'bun:test'
import app from '../src'

describe("Deploy Compose", () => {
    let repoId: number;

    it('Deploy - 200', async () => {
        const req = new Request('http://localhost/v1/repositories', {
            method: 'POST',
            body: JSON.stringify({
                url: 'https://github.com/ChristianLempa/boilerplates.git',
                cloneDepth: -1,
                composeFile: "docker-compose/nginx/compose.yaml"
            }),
            headers: {
                "Authorization": `Bearer ${process.env.TEST_API_KEY}`,
                "Content-Type": "application/json"
            }
        })
        const response = await app
            .handle(req)

        if (response.status !== 200 && response.body) {
            const body = await response.json().catch(() => response.text);
            console.log(body);
        }

        expect(response.status).toBe(200)

        if (response.status === 200) {
            const responseBody = await response.json();
            repoId = responseBody.id;
        }
    }, { timeout: 1000 * 60 })

    it('Status - 200', async () => {
        if (!repoId) {
            console.warn("No repository id found, test failed? Skipping...")
            return;
        }

        const req = new Request(`http://localhost/v1/repositories/${repoId}/status`, {
            headers: {
                "Authorization": `Bearer ${process.env.TEST_API_KEY}`
            }
        })
        const response = await app
            .handle(req)
            .then((res) => res.json())

        expect(response.status).toBe("ACTIVE")
    })

    it('Takedown - 200', async () => {
        if (!repoId) {
            console.warn("No repository id found, test failed? Skipping...")
            return;
        }

        const req = new Request(`http://localhost/v1/repositories/${repoId}`, {
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