// Minimal smoke-check for the compiled output in dist/.
// Keeps it side-effect free: only imports modules.

async function main() {
    // Initialize runtime globals first.
    await import(new URL('../dist/src/globals.js', import.meta.url) as any)

    await import(new URL('../dist/src/helpers/sanitize.js', import.meta.url) as any)

    // These modules should be importable from dist without throwing.
    // These modules should be importable from dist without throwing.
    await import(new URL('../dist/src/helpers/http-validators.js', import.meta.url) as any)
    await import(new URL('../dist/src/helpers/sanitize.js', import.meta.url) as any)
    await import(new URL('../dist/src/helpers/http-responses.js', import.meta.url) as any)

    await import(new URL('../dist/src/api/dispatcher/Dispatcher.js', import.meta.url) as any)
    await import(new URL('../dist/src/core/security/SecurityService.js', import.meta.url) as any)
    await import(new URL('../dist/src/session/SessionManager.js', import.meta.url) as any)

    console.log('dist smoke: ok')
}

main().catch((err) => {
    console.error('dist smoke: failed')
    console.error(err)
    process.exitCode = 1
})
