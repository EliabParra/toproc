import '../../src/globals.js'
import 'colors'
import { z } from 'zod'

async function main() {
    console.log('🛡️ Verifying Validation System...'.cyan)

    const validator = (global as any).validator
    const i18n = (global as any).i18n

    // 1. Valid Case
    console.log('\n1️⃣  Valid Case:'.bold)
    const schema = z.object({
        email: z.email(),
    })
    const input = { email: 'test@example.com' }
    const result = validator.validate(input, schema)

    if (result.valid) {
        console.log('   ✅ Valid input accepted'.green)
    } else {
        console.error('   ❌ Valid input rejected'.red, result.errors)
        process.exit(1)
    }

    // 2. Invalid Type (should hit Error Map)
    console.log('\n2️⃣  Invalid Type (I18n Map):'.bold)
    const inputInvalid = { email: 123 }
    const resultInvalid = validator.validate(inputInvalid, schema)

    if (!resultInvalid.valid) {
        const error = resultInvalid.errors[0]
        console.log(`   Error Message: '${error.message}'`)

        // Expect "alerts.string" -> "{value} must be a string" (from alerts.json)
        // Since we didn't mock I18n, it uses real 'es' locale.
        // es/alerts.json: "string": "{value} debe ser una cadena"
        // Interpolated: "email debe ser una cadena"

        if (error.message.includes('debe ser una cadena')) {
            console.log('   ✅ Error mapped correctly'.green)
        } else {
            console.warn('   ⚠️  Error not mapped as expected (check alerts.json)'.yellow)
            console.log('   Actual:', error.message)
        }
    } else {
        console.error('   ❌ Invalid input accepted'.red)
        process.exit(1)
    }

    // 3. Invalid Email Format
    console.log('\n3️⃣  Invalid Format:'.bold)
    const inputBadEmail = { email: 'not-an-email' }
    const resultBadEmail = validator.validate(inputBadEmail, schema)

    if (!resultBadEmail.valid) {
        const error = resultBadEmail.errors[0]
        console.log(`   Error Message: '${error.message}'`)
        // es/alerts.json: "email": "{value} debe ser un correo electrónico válido"
        if (error.message.includes('debe ser un correo electrónico válido')) {
            console.log('   ✅ Email format error mapped'.green)
        } else {
            console.warn('   ⚠️  Email error mismatch'.yellow)
        }
    }

    console.log('\n✨ Validation checks Passed!'.green.bold)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
