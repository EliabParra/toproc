import test from 'node:test'
import assert from 'node:assert/strict'

import {
    templateBO,
    templateSchemas,
    templateRepository,
    templateService,
    parseMethodsFromBO,
} from '../scripts/bo/templates/bo.ts'
import { templateTypes } from '../scripts/bo/templates/types.ts'
import { templateMessages } from '../scripts/bo/templates/messages.ts'
import { templateErrors } from '../scripts/bo/templates/errors.ts'

test('templateBO genera arquitectura 7 archivos con nomenclatura Name.Type.ts', () => {
    const out = templateBO('Order', ['getOrder'])
    assert.match(out, /extends BaseBO/)
    // New naming: Name.Schemas.js, Name.Messages.js, Name.Errors.js
    assert.match(out, /import { OrderSchemas } from '\.\/Order\.Schemas\.js'/)
    assert.match(out, /import { OrderMessages } from '\.\/Order\.Messages\.js'/)
    assert.match(out, /isOrderError, handleOrderError/)
    assert.match(out, /from '\.\/Order\.Errors\.js'/)
    assert.match(out, /this\.validate<z\.infer<typeof OrderSchemas\.getOrder>>/)
})

test('templateSchemas genera schemas con mensajes (nuevos imports)', () => {
    const out = templateSchemas('Product', ['get', 'create'])
    assert.match(out, /import { ProductMessages } from '\.\/Product\.Messages\.js'/)
    assert.match(out, /ProductSchemas/)
    assert.match(out, /get: z\.object/)
    assert.match(out, /create: z\.object/)
})

test('templateRepository genera repo con tipos (nuevos imports)', () => {
    const out = templateRepository('Product')
    assert.match(out, /import type { Product, ProductSummary } from '\.\/Product\.Types\.js'/)
    assert.match(out, /class ProductRepository/)
    assert.match(out, /findAll.*ProductSummary\[\]/)
    assert.match(out, /findById.*Product \| null/)
})

test('templateService genera service con errores (nuevos imports)', () => {
    const out = templateService('Product')
    assert.match(out, /import { ProductNotFoundError } from '\.\/Product\.Errors\.js'/)
    assert.match(out, /import type .* from '\.\/Product\.Types\.js'/)
    assert.match(out, /class ProductService/)
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

test('templateMessages genera mensajes en español', () => {
    const out = templateMessages('Product', ['get', 'create', 'delete'])
    assert.match(out, /ProductMessages/)
    assert.match(out, /GET:.*Obtenido exitosamente/)
    assert.match(out, /CREATE:.*Creado exitosamente/)
    assert.match(out, /DELETE:.*Eliminado exitosamente/)
    assert.match(out, /NOT_FOUND:.*no encontrado/)
})

test('templateErrors genera clases de error (nuevos imports)', () => {
    const out = templateErrors('Product', ['get'])
    // Import uses new naming
    assert.match(out, /import { ProductMessages } from '\.\/Product\.Messages\.js'/)
    assert.match(out, /class ProductError extends Error/)
    assert.match(out, /class ProductNotFoundError/)
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
