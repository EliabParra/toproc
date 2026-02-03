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

test('templateBO genera arquitectura 9 archivos con nomenclatura NameType.ts', () => {
    const out = templateBO('Order', ['getOrder'])
    assert.match(out, /extends BaseBO/)
    assert.match(
        out,
        /import \{ OrderRepository, OrderService, OrderMessages, createOrderSchemas, Schemas \} from '\.\/OrderModule\.js'/
    )
    assert.match(out, /OrderMessages/)
    assert.match(out, /this\.exec/)
    assert.match(out, /this\.orderMessages\.getOrder/)
    assert.match(out, /this\.orderSchemas\.getOrder/)
})

test('templateSchemas genera schemas con mensajes (nuevos imports)', () => {
    const out = templateSchemas('Product', ['get', 'create'])
    assert.match(out, /ProductMessages/)
    assert.match(out, /createProductSchemas/)
    assert.match(out, /get: z\.object/)
    assert.match(out, /create: z\.object/)
    assert.match(out, /validation/)
})

test('templateRepository genera repo con tipos (nuevos imports)', () => {
    const out = templateRepository('Product')
    assert.match(out, /import \{ ProductQueries, Types \} from '\.\/ProductModule\.js'/)
    assert.match(out, /class ProductRepository/)
    assert.match(out, /findAll.*ProductSummary\[\]/)
    assert.match(out, /findById.*Product \| null/)
})

test('templateService genera service con errores (nuevos imports)', () => {
    const out = templateService('Product')
    assert.match(out, /import \{ ProductRepository, Errors, Types \} from '\.\/ProductModule\.js'/)
    assert.match(out, /class ProductService extends BOService implements Types\.IProductService/)
    assert.match(out, /throw new Errors\.ProductNotFoundError/)
})

test('templateTypes genera interfaces', () => {
    const out = templateTypes('Product', ['get', 'create', 'delete'])
    assert.match(out, /export namespace Product/)
    assert.match(out, /export interface Entity \{/)
    assert.match(out, /export interface Summary \{/)
    assert.match(out, /export type GetProductInput/)
    assert.match(out, /export type CreateProductInput/)
    assert.match(out, /export type DeleteProductInput/)
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
    assert.match(out, /ProductMessages/)
    assert.match(
        out,
        /import \{ BOError, TxKey \} from '\.\.\/\.\.\/src\/core\/business-objects\/index\.js'/
    )
    assert.match(out, /class ProductError extends BOError/)
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
