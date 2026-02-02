// Minimal smoke-check for the compiled output in dist/.
// Keeps it side-effect free: only imports modules.

async function main() {
    // Initialize runtime globals first.
    // Initialize runtime globals first via foundation
    await import(new URL('../dist/src/foundation.js', import.meta.url) as any)

    await import(new URL('../dist/src/utils/sanitize.js', import.meta.url) as any)

    // These modules should be importable from dist without throwing.
    // http-validators removed

    await import(new URL('../dist/src/utils/sanitize.js', import.meta.url) as any)
    await import(new URL('../dist/src/utils/http-responses.js', import.meta.url) as any)

    await import(new URL('../dist/src/api/AppServer.js', import.meta.url) as any)
    await import(
        new URL('../dist/src/api/http/controllers/AuthController.js', import.meta.url) as any
    )
    await import(
        new URL('../dist/src/api/http/controllers/TransactionController.js', import.meta.url) as any
    )
    await import(new URL('../dist/src/services/SecurityService.js', import.meta.url) as any)
    await import(new URL('../dist/src/services/SessionService.js', import.meta.url) as any)

    console.log('dist smoke: ok')
}

main().catch((err) => {
    console.error('dist smoke: failed')
    console.error(err)
    process.exitCode = 1
})
