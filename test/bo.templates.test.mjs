import test from 'node:test'
import assert from 'node:assert/strict'

import {
    templateBO,
    templateSchemas,
    templateRepository,
    templateService,
    parseMethodsFromBO,
    templateLocales,
} from '../scripts/bo/templates/bo.ts'
import { templateTypes } from '../scripts/bo/templates/types.ts'
import { templateErrors } from '../scripts/bo/templates/errors.ts'

test('templateBO genera arquitectura 7 archivos con nomenclatura Name.Type.ts', () => {
    const out = templateBO('Order', ['getOrder'])
    assert.match(out, /extends BaseBO/)
    // New naming: Name.Schemas.js only, no Messages
    assert.match(out, /import \{ OrderSchemas.*\} from '\.\/Order\.Schemas\.js'/)
    // OrderMessages IS required for i18n.use
    assert.match(out, /OrderMessages/)
    // Error imports removed from templateBO
    assert.match(out, /this\.exec/)
    // Now uses exec and this.translate
    assert.match(out, /this\.translate\('bo\.order\.getOrder'\)/)
    assert.match(out, /OrderSchemas\.getOrder/)
})

test('templateSchemas genera schemas con mensajes (nuevos imports)', () => {
    const out = templateSchemas('Product', ['get', 'create'])
    // No messages import
    assert.doesNotMatch(out, /ProductMessages/)
    assert.match(out, /ProductSchemas/)
    assert.match(out, /get: z\.object/)
    assert.match(out, /create: z\.object/)
    assert.match(out, /bo\.product\.validation/)
})

test('templateRepository genera repo con tipos (nuevos imports)', () => {
    const out = templateRepository('Product')
    assert.match(out, /import type { .*Product.*ProductSummary.* } from '\.\/Product\.Types\.js'/)
    assert.match(out, /class ProductRepository/)
    assert.match(out, /findAll.*ProductSummary\[\]/)
    assert.match(out, /findById.*Product \| null/)
})

test('templateService genera service con errores (nuevos imports)', () => {
    const out = templateService('Product')
    assert.match(out, /import { ProductNotFoundError } from '\.\/Product\.Errors\.js'/)
    assert.match(out, /import type .* from '\.\/Product\.Types\.js'/)
    assert.match(out, /class ProductService extends BOService/)
    assert.match(out, /throw new ProductNotFoundError/)
})

test('templateTypes genera interfaces', () => {
    const out = templateTypes('Product', ['get', 'create', 'delete'])
    assert.match(out, /export interface Product \{/)
    assert.match(out, /export interface ProductSummary \{/)
    assert.match(out, /export interface GetProductInput/)
    assert.match(out, /export interface CreateProductInput/)
    assert.match(out, /export interface DeleteProductInput/)
})

test('templateLocales genera TS object', () => {
    const out = templateLocales('Product', ['get', 'create', 'delete'])
    assert.match(out, /export const ProductMessages = \{/)
    assert.match(out, /es: \{/)
    assert.match(out, /en: \{/)
    assert.match(out, /get: 'Obtenido exitosamente'/)
    assert.match(out, /create: 'Creado exitosamente'/)
    assert.match(out, /validation: \{/)
    assert.match(out, /notFound: 'Product no encontrado'/)
})

test('templateErrors genera clases de error (nuevos imports)', () => {
    const out = templateErrors('Product', ['get'])
    // Import uses new naming - No Messages
    assert.doesNotMatch(out, /ProductMessages/)
    assert.match(out, /import { BOError } from/)
    assert.match(out, /class ProductError extends BOError/)
    assert.match(out, /class ProductNotFoundError/)
    assert.match(out, /bo\.product\.notFound/)
    assert.match(out, /class ProductAlreadyExistsError/)
    assert.match(out, /class ProductValidationError/)
    assert.match(out, /function handleProductError/)
    assert.match(out, /function isProductError/)
})

test('parseMethodsFromBO extrae métodos async', () => {
    const code = `
    export class TestBO {
        async get() {}
        async create() {}
        private async _internal() {}
        constructor() {}
    }
    `
    const methods = parseMethodsFromBO(code)
    assert.deepEqual(methods, ['get', 'create'])
})
