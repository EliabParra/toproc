import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

/**
 * Script para generar automáticamente el índice de Business Objects y Transacciones.
 * Lee `src/config/queries.json` para extraer los permisos y mapeos.
 */
async function main() {
    const rootDir = process.cwd()
    const queriesPath = path.join(rootDir, 'src/config/queries.json')
    const boDir = path.join(rootDir, 'BO')
    const outputPath = path.join(rootDir, 'docs/05-Guides/BO_INDEX.md')

    console.log(`🔍 Scanning queries from: ${queriesPath}`)

    if (!fs.existsSync(queriesPath)) {
        console.error('❌ src/config/queries.json not found!')
        process.exit(1)
    }

    const queries = require(queriesPath)

    // queries.json usually contains SQL queries, but in our architecture,
    // we also rely on DB data for permissions.
    // However, since we can't connect to DB here easily without credentials,
    // we will scan the BO directory structure to list available objects.

    console.log(`📂 Scanning BO directory: ${boDir}`)

    if (!fs.existsSync(boDir)) {
        console.error('❌ BO directory not found!')
        process.exit(1)
    }

    const objects = fs
        .readdirSync(boDir)
        .filter((f) => fs.statSync(path.join(boDir, f)).isDirectory())

    let mdContent = `# Business Objects Index\n\n`
    mdContent += `This document is **AUTO-GENERATED** by \`pnpm run docs:bo\`. Do not edit manually.\n\n`
    mdContent += `Total Business Objects: **${objects.length}**\n\n`
    mdContent += `| Object Name | Description | Path |\n`
    mdContent += `| :--- | :--- | :--- |\n`

    for (const objName of objects) {
        const objPath = `BO/${objName}/${objName}BO.ts`
        const fullPath = path.join(boDir, objName, `${objName}BO.ts`)
        let desc = 'No description'

        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf-8')
            // Simple regex to extract JSDoc description
            const match = content.match(/\/\*\*\s*\n\s*\*\s*(.*?)\n/s)
            if (match && match[1]) {
                desc = match[1].replace(/\*/g, '').trim().split('\n')[0]
            }
        }

        mdContent += `| **${objName}** | ${desc} | [\`${objPath}\`](../../${objPath}) |\n`
    }

    mdContent += `\n\n## Transactions (TX)\n\n`
    mdContent += `Valid transactions are defined in the database \`security.methods\` table.\n`
    mdContent += `Use \`pnpm run bo list\` to see the active runtime mapping.\n`

    fs.writeFileSync(outputPath, mdContent)
    console.log(`✅ Documentation generated at: ${outputPath}`)
}

main().catch(console.error)
