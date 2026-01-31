import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function parseArgs(argv: string[]) {
    const outIndex = argv.indexOf('--out')
    const out = outIndex >= 0 ? argv[outIndex + 1] : undefined
    return {
        out: out && !out.startsWith('--') ? out : undefined,
    }
}

async function ensureEmptyDir(dirPath: string) {
    await fs.rm(dirPath, { recursive: true, force: true })
    await fs.mkdir(dirPath, { recursive: true })
}

async function copyDir(
    src: string,
    dest: string,
    { filter }: { filter?: (source: string) => boolean } = {}
) {
    await fs.cp(src, dest, {
        recursive: true,
        filter: filter ? (source) => filter(source) : undefined,
    })
}

function createPathFilter({ repoRoot }: { repoRoot: string }) {
    const ignoredPrefixes = [
        path.join(repoRoot, 'node_modules') + path.sep,
        path.join(repoRoot, '.git') + path.sep,
        path.join(repoRoot, 'BO') + path.sep,
        path.join(repoRoot, 'docs', 'api') + path.sep,
        path.join(repoRoot, '.tmp-starterpack') + path.sep,
    ]

    const ignoredExact = new Set([
        path.join(repoRoot, '.env'),
        path.join(repoRoot, 'package-lock.json'),
    ])

    return function filter(source: string) {
        const normalized = path.resolve(source)

        if (ignoredExact.has(normalized)) return false

        for (const prefix of ignoredPrefixes) {
            if (normalized.startsWith(prefix)) return false
        }

        return true
    }
}

async function main() {
    const repoRoot = path.resolve(__dirname, '..')
    const { out } = parseArgs(process.argv.slice(2))

    const outDir = path.resolve(repoRoot, out ?? '.tmp-starterpack')

    console.log(`[export-starter] repo: ${repoRoot}`)
    console.log(`[export-starter] out:  ${outDir}`)

    await ensureEmptyDir(outDir)

    const filter = createPathFilter({ repoRoot })

    const allowList = [
        'src',
        'scripts',
        'docs',
        'public',
        'test',
        // .env will be created from .env or .env.example content below
        '.gitignore',
        'package.json',
        'jsdoc.json',
        'tsconfig.json',
        'tsconfig.build.json',
        'tsconfig.build.ts.json',
        '.vscode',
        '.editorconfig',
        '.prettierrc.json',
        '.prettierignore',
        'README.md',
    ]

    for (const rel of allowList) {
        const srcPath = path.join(repoRoot, rel)
        const destPath = path.join(outDir, rel)

        try {
            const stat = await fs.stat(srcPath)
            if (stat.isDirectory()) {
                await copyDir(srcPath, destPath, { filter })
            } else {
                await fs.mkdir(path.dirname(destPath), { recursive: true })
                await fs.copyFile(srcPath, destPath)
            }
        } catch {
            // Optional file/folder does not exist in some setups.
        }
    }

    // Create .env in the starter output from either .env or .env.example
    await writeEnvFile(repoRoot, outDir)

    // Create an empty BO folder so developers have a clear place to start.
    const boDir = path.join(outDir, 'BO')
    await fs.mkdir(boDir, { recursive: true })
    await fs.writeFile(path.join(boDir, '.gitkeep'), '')
    await fs.writeFile(
        path.join(boDir, 'README.md'),
        [
            '# BO (Business Objects)',
            '',
            'This folder is intentionally empty in the starter template.',
            '',
            '- Add your domain BOs here (e.g. `BO/ObjectName/ObjectNameBO.ts`).',
            '- The dispatcher resolves `tx -> (object_na, method_na)` and `Security` dynamically imports BO modules.',
            '',
            'Tip: use the BO CLI (`pnpm run bo -- new ...`) to scaffold a BO.',
            '',
        ].join('\n')
    )

    console.log('[export-starter] done')
}

async function writeEnvFile(repoRoot: string, outDir: string) {
    const envPath = path.join(repoRoot, '.env')
    const envExamplePath = path.join(repoRoot, '.env.example')
    const destEnvPath = path.join(outDir, '.env')

    try {
        if (await exists(envPath)) {
            await fs.copyFile(envPath, destEnvPath)
            return
        }
    } catch {}

    try {
        if (await exists(envExamplePath)) {
            const content = await fs.readFile(envExamplePath, 'utf8')
            await fs.writeFile(destEnvPath, content)
            return
        }
    } catch {}
}

async function exists(p: string) {
    try {
        await fs.stat(p)
        return true
    } catch {
        return false
    }
}

main().catch((err) => {
    console.error('[export-starter] failed:', err)
    process.exitCode = 1
})
