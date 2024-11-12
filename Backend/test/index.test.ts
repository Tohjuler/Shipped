import { describe, expect, it } from 'bun:test'
import app from '../src'

describe('Elysia', () => {
    it('Bearer - 400', async () => {
        const response = await app
            .handle(new Request('http://localhost/'))
            .then((res) => res.status)

        expect(response).toBe(400)
    })
    it('Bearer - 401', async () => {
        const req = new Request('http://localhost/')
        req.headers.set('Authorization', 'Bearer invalid')
        const response = await app
            .handle(req)
            .then((res) => res.status)

        expect(response).toBe(401)
    })
    it('Bearer - 200', async () => {
        const req = new Request('http://localhost/')
        req.headers.set('Authorization', `Bearer ${process.env.TEST_API_KEY}`)
        const response = await app
            .handle(req)
            .then((res) => res.status)

        expect(response).toBe(200)
    })
})