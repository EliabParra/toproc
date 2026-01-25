import '../../src/globals.js' // bootstraps globals including i18n
import 'colors'

async function main() {
    console.log('🌍 Verifying I18n System...'.cyan)

    const i18n = (global as any).i18n
    const msgs = (global as any).msgs

    // 1. Verify Modern Access
    console.log('\n1️⃣  Modern Access (i18n.t):'.bold)
    const modernVal = i18n.t('errors.server.notFound.msg')
    console.log(`   Key: 'errors.server.notFound.msg'`)
    console.log(`   Value: '${modernVal}'`)

    if (modernVal === 'Recurso no encontrado') {
        console.log('   ✅ Success'.green)
    } else {
        console.error('   ❌ Failed'.red)
        process.exit(1)
    }

    // 2. Verify Interpolation
    console.log('\n2️⃣  Interpolation:'.bold)
    const interpolated = i18n.t('errors.server.txNotFound.msg', { tx: '12345' })
    console.log(`   Key: 'errors.server.txNotFound.msg' params: { tx: '12345' }`)
    console.log(`   Value: '${interpolated}'`)

    if (interpolated.includes('12345')) {
        console.log('   ✅ Success'.green)
    } else {
        console.error('   ❌ Failed'.red)
        process.exit(1)
    }

    // 3. Verify Legacy Access
    console.log('\n3️⃣  Legacy Access (g.msgs):'.bold)
    // Legacy structure expected: msgs[lang].errors.server...
    // But we access it directly via msgs nested structure if lang is implicit?
    // Wait, globals.ts sets g.msgs = i18n.getLegacyObject() -> returns { es: { ... }, en: { ... } }
    // So g.msgs.es.errors.server.notFound.msg should exist.

    const lang = (global as any).config.app.lang || 'es'
    const legacyVal = msgs[lang]?.errors?.server?.notFound?.msg

    console.log(`   Path: g.msgs.${lang}.errors.server.notFound.msg`)
    console.log(`   Value: '${legacyVal}'`)

    if (legacyVal === 'Recurso no encontrado') {
        console.log('   ✅ Success'.green)
    } else {
        console.error('   ❌ Failed'.red)
        process.exit(1)
    }

    console.log('\n✨ All I18n checks passed!'.green.bold)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
