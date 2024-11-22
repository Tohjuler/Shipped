import { describe, expect, it } from 'bun:test'
import app from '../src'

describe("Deploy Compose", () => {
    it('Deploy - 201', async () => {
        const req = new Request('http://localhost/v1/stacks/git', {
            method: 'POST',
            body: JSON.stringify({
                name: 'test-git-stack',
                url: 'https://github.com/Tohjuler/shipped.git',
                cloneDepth: 3,
                composePath: "Backend/test/docker-compose.yml"
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
            console.log(body instanceof Object ? JSON.stringify(body, null, 2) : body);
        }

        expect(response.status).toBe(201)
    }, { timeout: 1000 * 60 })

    it('Status - 200', async () => {
        const req = new Request('http://localhost/v1/stacks/test-git-stack', {
            headers: {
                "Authorization": `Bearer ${process.env.TEST_API_KEY}`
            }
        })
        const response = await app
            .handle(req);

        expect(response.status).toBe(200)

        const json = await response.json().catch(() => response.text);
        if (json.status !== "ACTIVE") console.log(json instanceof Object ? JSON.stringify(json, null, 2) : json);
        expect(json.status).toBe("ACTIVE")
    })

    it('Nginx - 200', async () => {
        fetch('http://localhost:80')
            .then(res => {
                expect(res.status).toBe(200)
            })
            .catch(err => {
                console.log(err)
                expect(err).toBe(null)
            })
    })

    it('Takedown - 200', async () => {
        const req = new Request('http://localhost/v1/stacks/test-git-stack', {
            method: 'DELETE',
            headers: {
                "Authorization": `Bearer ${process.env.TEST_API_KEY}`
            }
        })
        const response = await app
            .handle(req)

        if (response.status !== 200 && response.body) {
            const body = await response.json().catch(() => response.text);
            console.log(body instanceof Object ? JSON.stringify(body, null, 2) : body);
        }

        expect(response.status).toBe(200)
    })
})