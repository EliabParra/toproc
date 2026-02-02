import test from 'node:test'
import assert from 'node:assert/strict'
import { I18nService } from '../../src/services/I18nService.js'

// --- Setup ---
test('I18nService constructor and registration', () => {
    const i18n = new I18nService('es')

    // Test initial state
    assert.equal(i18n.currentLocale, 'es')
    assert.deepEqual(i18n.messages, {})

    // Register messages
    i18n.register('es', {
        greeting: 'Hola',
        nested: { value: 'Valor Anidado' },
    })

    assert.equal(i18n.translate('greeting'), 'Hola')
    assert.equal(i18n.translate('nested.value'), 'Valor Anidado')
})

// --- Translation & Interpolation ---
test('I18nService translation with interpolation', () => {
    const i18n = new I18nService('en')
    i18n.register('en', {
        welcome: 'Welcome {name}',
        fallback: 'This is a fallback',
    })

    assert.equal(i18n.translate('welcome', { name: 'User' }), 'Welcome User')
    // Missing param should show placeholder
    assert.equal(i18n.translate('welcome'), 'Welcome {name}')
})

test('I18nService fallbacks to default locale', () => {
    const i18n = new I18nService('es') // default es
    i18n.register('es', { hello: 'Hola' })
    i18n.register('en', { hello: 'Hello' })

    i18n.currentLocale = 'fr' // Switch to non-existent

    // Should fallback to 'es'
    assert.equal(i18n.translate('hello'), 'Hola')
})

test('I18nService use() method', () => {
    const i18n = new I18nService('es')
    i18n.currentLocale = 'en'

    const messages = {
        es: { msg: 'Español' },
        en: { msg: 'English' },
    }

    const selected = i18n.use(messages)
    assert.deepEqual(selected, { msg: 'English' })

    i18n.currentLocale = 'fr' // fallback case
    const fallback = i18n.use(messages)
    assert.deepEqual(fallback, { msg: 'Español' }) // defaults to 'es' in use() implementation if defaultLocale not matched
})

// --- Intl Formatting ---
test('I18nService formatDate', () => {
    const i18n = new I18nService('en-US')
    const date = new Date('2023-01-01T12:00:00Z')

    // Basic check - implementation depends on Node environment locales
    const formatted = i18n.formatDate(date)
    assert.ok(formatted.includes('2023') || formatted.includes('1/1/2023'))

    i18n.currentLocale = 'es-ES'
    const formattedEs = i18n.formatDate(date)
    assert.ok(formattedEs.includes('1/1/2023') || formattedEs.includes('2023'))
})

test('I18nService formatCurrency', () => {
    const i18n = new I18nService('en-US')
    const amount = 1234.56

    const usd = i18n.formatCurrency(amount, 'USD')
    assert.ok(usd.includes('$1,234.56'))

    i18n.currentLocale = 'es-ES'
    // Euro formatting might be 1.234,56 € or similar
    const eur = i18n.formatCurrency(amount, 'EUR')
    assert.ok(eur.includes('1.234,56') || eur.includes('1234,56'))
})

// --- Error Handling ---
test('I18nService error() method', () => {
    const i18n = new I18nService('es')
    i18n.register('es', {
        errors: {
            server: {
                notFound: { msg: 'No encontrado', code: 404 },
            },
        },
    })

    const err = i18n.error((e) => e.server.notFound)
    assert.deepEqual(err, { msg: 'No encontrado', code: 404 })

    // Interpolation in errors
    i18n.register('es', {
        errors: {
            auth: {
                invalid: { msg: 'Invalido: {reason}', code: 400 },
            },
        },
    })

    const errParams = i18n.error(
        // @ts-ignore - Dynamic property test
        (e) => e.auth.invalid,
        { reason: 'Token' }
    )
    assert.deepEqual(errParams, { msg: 'Invalido: Token', code: 400 })
})
