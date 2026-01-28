import readline from 'node:readline'
import { AppValidator } from '../src/core/validation/AppValidator.js'
// @ts-ignore - Dynamic import path for BOs is fine in scripts
import { AuthSchemas } from '../BO/Auth/Auth.Schemas.js'
import { ZodObject } from 'zod'

console.log('⚡ Initializing Playground...')

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

// Mock I18nService because AppValidator requires it
const mockI18n = {
    t: (key: string, params?: any) => {
        if (params?.value) return `${key} (${params.value})`
        return key
    },
    locale: () => 'dev',
}

const validator = new AppValidator(mockI18n as any)

const colorObj = (obj: any) => JSON.stringify(obj, null, 2)

const SCHEMAS: Record<string, ZodObject> = {
    'auth.register': AuthSchemas.register,
    'auth.login': AuthSchemas.login,
    'auth.verifyEmail': AuthSchemas.verifyEmail,
    'auth.resetPassword': AuthSchemas.resetPassword,
    'auth.changePassword': AuthSchemas.changePassword,
}

function printHelp() {
    console.log('\n📚 Available Schemas:')
    Object.keys(SCHEMAS).forEach((k) => console.log(`  - ${k}`))
    console.log('\nCommands:')
    console.log('  <schema_name> <json_payload>   Test validation')
    console.log('  list                         List schemas')
    console.log('  exit                         Quit')
    console.log('\nExample: auth.login {"email":"bad","password":"123"}')
}

function handleInput(line: string) {
    const trimmed = line.trim()
    if (!trimmed) return prompt()
    if (trimmed === 'exit') {
        process.exit(0)
    }
    if (trimmed === 'list' || trimmed === 'help') {
        printHelp()
        return prompt()
    }

    // Split first space
    const firstSpace = trimmed.indexOf(' ')
    if (firstSpace === -1) {
        console.log('❌ Invalid format. Use: <schema> <json>')
        return prompt()
    }

    const schemaName = trimmed.slice(0, firstSpace)
    const jsonStr = trimmed.slice(firstSpace + 1)

    const schema = SCHEMAS[schemaName]
    if (!schema) {
        console.log(`❌ Unknown schema: ${schemaName}`)
        return prompt()
    }

    let payload
    try {
        payload = JSON.parse(jsonStr)
    } catch (e: any) {
        console.log(`❌ Invalid JSON: ${e.message}`)
        return prompt()
    }

    console.log(`\n🔍 Validating against [${schemaName}]...`)
    const result = validator.validate(payload, schema)

    if (result.valid) {
        console.log('✅ PASS')
        console.log('Sanitized Data:', colorObj(result.data))
    } else {
        console.log('❌ FAIL')
        console.log('Errors:', colorObj(result.errors))
    }
    prompt()
}

function prompt() {
    rl.question('\nplayground> ', handleInput)
}

printHelp()
prompt()
