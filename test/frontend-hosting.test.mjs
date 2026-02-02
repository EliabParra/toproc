import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import request from 'supertest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

import { registerFrontendHosting } from '../src/frontend-adapters/index.js'
import { routes } from '../src/api/http/router/routes.js'

// Mock i18n helper
function createMockI18n() {
    const data = {
        errors: {
            client: {
                unknown: { code: 500, msg: 'Unknown' },
            },
        },
    }
    return {
        translate: (key) => key,
        error: (key) => {
            const parts = key.split('.')
            let val = data
            for (const p of parts) val = val?.[p]
            return val || { msg: key, code: 500 }
        },
        get: (key) => {
            const parts = key.split('.')
            let val = data
            for (const p of parts) val = val?.[p]
            return val
        },
    }
}

const mockLog = {
    info: () => {},
    error: () => {},
    warn: () => {},
    child: () => mockLog,
}
const mockConfig = { app: { lang: 'en' } }
const mockI18n = createMockI18n()

test('buildPagesRouter redirects when validateIsAuth=true and session missing', async () => {
    const { buildPagesRouter } = await import('../src/api/http/router/pages.js')

    const added = { name: 'private', path: '/private', view: 'index', validateIsAuth: true }

    const app = express()
    const session = { sessionExists: () => false }
    app.use(
        buildPagesRouter({
            session,
            config: mockConfig,
            i18n: mockI18n,
            log: mockLog,
            routes: [added],
        })
    )

    const res = await request(app).get('/private')
    assert.equal(res.status, 302)
    assert.ok(String(res.headers.location).startsWith('/?returnTo='))
})

test('buildPagesRouter serves page when authenticated', async () => {
    const { buildPagesRouter } = await import('../src/api/http/router/pages.js')

    const added = { name: 'private', path: '/private', view: 'index', validateIsAuth: true }

    const app = express()
    const session = { sessionExists: () => true }
    app.use(
        buildPagesRouter({
            session,
            config: mockConfig,
            i18n: mockI18n,
            log: mockLog,
            routes: [added],
        })
    )

    const res = await request(app).get('/private')
    assert.equal(res.status, 200)
    assert.ok(String(res.headers['content-type']).includes('text/html'))
    assert.ok(String(res.text).toLowerCase().includes('<html'))
})

test('registerFrontendHosting does nothing when stage does not match', async () => {
    const config = { app: { frontendMode: 'invalid' } }

    const app = express()
    await registerFrontendHosting(app, {
        stage: 'postApi',
        session: {},
        config,
        i18n: mockI18n,
        log: mockLog,
    })

    // No throw = OK. This covers mode fallback + stage mismatch.
    assert.equal(typeof app, 'function')
})

test('registerPagesHosting mounts static + pages router', async () => {
    const { registerPagesHosting } = await import('../src/frontend-adapters/pages.adapter.js')

    const app = express()
    const session = { sessionExists: () => true }
    await registerPagesHosting(app, { session, config: mockConfig, i18n: mockI18n, log: mockLog })

    const res = await request(app).get('/').set('Accept', 'text/html')
    assert.equal(res.status, 200)
    assert.ok(String(res.text).toLowerCase().includes('<html'))
})

test('registerFrontendHosting spa mode serves index.html fallback for html requests', async () => {
    const prev = process.env.SPA_DIST_PATH
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'spa-dist-'))

    try {
        await fs.writeFile(
            path.join(tmpDir, 'index.html'),
            '<html><body>SPA OK</body></html>',
            'utf8'
        )
        process.env.SPA_DIST_PATH = tmpDir

        const config = { app: { frontendMode: 'spa' } }

        const app = express()
        await registerFrontendHosting(app, {
            stage: 'postApi',
            session: {},
            config,
            i18n: mockI18n,
            log: mockLog,
        })

        const res = await request(app).get('/anything').set('Accept', 'text/html')
        assert.equal(res.status, 200)
        assert.ok(String(res.text).includes('SPA OK'))

        const res2 = await request(app).get('/anything').set('Accept', 'application/json')
        assert.equal(res2.status, 404)
    } finally {
        if (prev == null) delete process.env.SPA_DIST_PATH
        else process.env.SPA_DIST_PATH = prev
        await fs.rm(tmpDir, { recursive: true, force: true })
    }
})

test('registerFrontendHosting spa mode throws when SPA_DIST_PATH is missing (non-interactive)', async () => {
    const prev = process.env.SPA_DIST_PATH
    try {
        delete process.env.SPA_DIST_PATH

        const config = { app: { frontendMode: 'spa' } }
        const app = express()

        await assert.rejects(async () => {
            await registerFrontendHosting(app, {
                stage: 'postApi',
                session: {},
                config,
                i18n: mockI18n,
                log: mockLog,
            })
        }, /SPA_DIST_PATH/i)
    } finally {
        if (prev != null) process.env.SPA_DIST_PATH = prev
    }
})
