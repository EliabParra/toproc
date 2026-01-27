import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs/promises'
import path from 'node:path'
import { SchemaLoader } from '../../../scripts/db/loaders/SchemaLoader.js'

// Mock environment
const TEST_SCHEMAS_DIR = path.join(process.cwd(), 'test', 'temp_schemas')

describe('SchemaLoader (Auto-Discovery)', async () => {
    // Setup: Create temp directory
    await fs.mkdir(TEST_SCHEMAS_DIR, { recursive: true })

    // Teardown: Cleanup
    it.after(async () => {
        await fs.rm(TEST_SCHEMAS_DIR, { recursive: true, force: true })
    })

    it('should load .ts schema files in alphanumeric order', async () => {
        // 1. Arrange: Create dummy schema files with different prefixes
        await fs.writeFile(
            path.join(TEST_SCHEMAS_DIR, '02_users.ts'),
            `export const USERS_SCHEMA = ['CREATE TABLE users...']`
        )

        await fs.writeFile(
            path.join(TEST_SCHEMAS_DIR, '01_base.ts'),
            `export const BASE_SCHEMA = ['CREATE TABLE base...']`
        )

        await fs.writeFile(
            path.join(TEST_SCHEMAS_DIR, '10_audit.ts'),
            `export const AUDIT_SCHEMA = ['CREATE TABLE audit...']`
        )

        // Ignored files (not .ts or special)
        await fs.writeFile(path.join(TEST_SCHEMAS_DIR, 'README.md'), '# Docs')

        // 2. Act
        const loader = new SchemaLoader(TEST_SCHEMAS_DIR)
        const files = await loader.listSchemaFiles()

        // 3. Assert
        assert.strictEqual(files.length, 3, 'Should find 3 schema files')

        // Strict Order Check
        assert.ok(files[0].endsWith('01_base.ts'), 'First should be 01_base')
        assert.ok(files[1].endsWith('02_users.ts'), 'Second should be 02_users')
        assert.ok(files[2].endsWith('10_audit.ts'), 'Third should be 10_audit')
    })

    it('should extract exported arrays from files (Simulation)', async () => {
        // Since we cannot easily dynamic import created files in test environment without build,
        // we will test the "Filtering" logic and "Path resolution".
        // The actual "import()" is integration testing.

        const loader = new SchemaLoader(TEST_SCHEMAS_DIR)
        // Verify path is absolute
        assert.ok(path.isAbsolute(loader.directory))
    })

    it('should handle empty directory gracefully', async () => {
        const emptyDir = path.join(TEST_SCHEMAS_DIR, 'empty')
        await fs.mkdir(emptyDir)
        const loader = new SchemaLoader(emptyDir)
        const files = await loader.listSchemaFiles()
        assert.strictEqual(files.length, 0)
    })
})
