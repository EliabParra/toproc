import { describe, it, mock } from 'node:test'
import assert from 'node:assert'
import { Introspector } from '../../../scripts/db/core/introspector.js'

// Mock Database
const mockDb = {
    exeRaw: mock.fn(async (sql: string, params?: any[]) => {
        if (sql.includes('information_schema.tables')) {
            return {
                rows: [
                    { table_schema: 'public', table_name: 'products' },
                    { table_schema: 'security', table_name: 'users' },
                ],
                rowCount: 2,
            }
        }
        if (sql.includes('information_schema.columns')) {
            return {
                rows: [
                    {
                        column_name: 'id',
                        data_type: 'bigint',
                        is_nullable: 'NO',
                        column_default: null,
                    },
                    {
                        column_name: 'name',
                        data_type: 'text',
                        is_nullable: 'NO',
                        column_default: null,
                    },
                ],
                rowCount: 2,
            }
        }
        return { rows: [], rowCount: 0 }
    }),
}

describe('Introspector', () => {
    it('should list tables from information_schema', async () => {
        const introspector = new Introspector(mockDb as any, '/tmp')
        const tables = await introspector.listTables()

        assert.strictEqual(tables.length, 2)
        assert.strictEqual(tables[0].table_name, 'products')
        assert.strictEqual(tables[1].table_schema, 'security')
    })

    it('should generate valid CREATE TABLE SQL', async () => {
        const introspector = new Introspector(mockDb as any, '/tmp')
        const columns = await introspector.getColumns('public', 'products')
        const content = introspector.generateSchemaFile('public', 'products', columns)

        assert.ok(content.includes('create table if not exists public.products'))
        assert.ok(content.includes('PRODUCTS_SCHEMA'))
        assert.ok(content.includes('id bigint not null'))
    })

    it('should detect new tables not in known list', async () => {
        const introspector = new Introspector(mockDb as any, '/tmp')
        const newTables = await introspector.detectNewTables(['public.products'])

        assert.strictEqual(newTables.length, 1)
        assert.strictEqual(newTables[0].table_name, 'users')
    })
})
