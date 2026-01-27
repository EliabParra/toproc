import 'dotenv/config'
import '../src/globals.js'

import fs from 'node:fs/promises'
import path from 'node:path'
import readline from 'node:readline/promises'
import { pathToFileURL } from 'node:url'

import {
    authMethods as presetAuthMethods,
    templateAuthSuccessMsgs as presetTemplateAuthSuccessMsgs,
    templateAuthErrorMsgs as presetTemplateAuthErrorMsgs,
    templateAuthAlertsLabels as presetTemplateAuthAlertsLabels,
    templateAuthErrorHandler as presetTemplateAuthErrorHandler,
    templateAuthValidate as presetTemplateAuthValidate,
    templateAuthRepo as presetTemplateAuthRepo,
    templateAuthBO as presetTemplateAuthBO,
} from './bo-auth-preset.js'

const repoRoot = process.cwd()

import 'colors'

// Basic styling helpers
const style = {
    header: (t: string) => t.cyan.bold,
    cmd: (t: string) => t.yellow,
    opt: (t: string) => t.green,
    err: (t: string) => t.red.bold,
    success: (t: string) => t.green.bold,
    info: (t: string) => t.blue,
    dim: (t: string) => t.gray,
}

const symbols = {
    check: '✅',
    cross: '❌',
    info: 'ℹ️',
    warn: '⚠️',
    ques: '❓',
    arrow: '➜',
}

type BoOptValue = string | boolean
type BoOpts = Record<string, BoOptValue>

async function promptYesNo(rl: any, question: string, defaultYes = false) {
    const suffix = defaultYes ? ' [Y/n] '.dim : ' [y/N] '.dim
    const q = `${symbols.ques} ${question.white.bold}${suffix}`
    const ans = String(await rl.question(q))
        .trim()
        .toLowerCase()
    if (!ans) return defaultYes
    return ['y', 'yes'].includes(ans)
}

async function promptChoice(rl: any, question: string, choices: string[], defaultValue: string) {
    const normalized = choices.map((c) => String(c).trim().toLowerCase())
    const def = defaultValue != null ? String(defaultValue).trim().toLowerCase() : undefined
    const suffix = def != null ? ` (${def})`.dim + ' ' : ' '
    const options = choices
        .map((c) => (c === def ? c.green.underline : c.cyan))
        .join(style.dim('|'))

    while (true) {
        const q = `${symbols.ques} ${question.white.bold} ${style.dim('[')}${options}${style.dim(']')}${suffix}${symbols.arrow} `
        const ans = String(await rl.question(q))
            .trim()
            .toLowerCase()
        const value = ans.length > 0 ? ans : def
        if (value && normalized.includes(value)) return value
        console.log(
            `${symbols.warn} ${'Invalid choice. Please choose one of:'.red} ${normalized.join(', ')}`
        )
    }
}

async function promptText(rl: any, question: string, defaultValue: string) {
    const suffix = defaultValue != null ? ` (${defaultValue})`.dim + ' ' : ' '
    const q = `${symbols.ques} ${question.white.bold}${suffix}${symbols.arrow} `
    const ans = String(await rl.question(q)).trim()
    return ans.length > 0 ? ans : defaultValue
}

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath)
        return true
    } catch {
        return false
    }
}

function formatError(err: unknown): string {
    if (err && typeof err === 'object' && 'message' in err) {
        return String((err as { message?: unknown }).message)
    }
    return String(err)
}

function isMainModule() {
    const entry = process.argv?.[1]
    if (!entry) return false
    return import.meta.url === pathToFileURL(path.resolve(entry)).href
}

function printHelp() {
    console.log(`
${style.header('BO CLI Helper')} ${style.dim('v1.0')}

${style.header('Usage:')}
  ${style.cmd('npm run bo')} -- <command> [args] [options]

${style.header('Commands:')}
  ${style.cmd('new')}  <ObjectName>           ${style.dim('Create BO folder + files (Architecture 2.0)')}
        ${style.opt('auth')}                        Create Auth BO preset
  ${style.cmd('sync')} [ObjectName]           ${style.dim('Read BO methods and upsert to DB')}
  ${style.cmd('list')}                        ${style.dim('List objects/methods/tx from DB')}
  ${style.cmd('perms')}                       ${style.dim('Grant/revoke permissions (interactive)')}

${style.header('Options:')}
  ${style.opt('--yes')}                       Non-interactive
  ${style.opt('--methods')} <m1,m2>           Methods to scaffold (new)
  ${style.opt('--crud')}                      Scaffold CRUD-style methods
  ${style.opt('--force')}                     Overwrite existing files
  ${style.opt('--db')}                        Upsert to DB immediately
  ${style.opt('--tx')} <n1,n2>                Explicit tx mapping
  ${style.opt('--txStart')} <n>               Starting tx
  ${style.opt('--dry')}                       Dry run
  ${style.opt('--all')}                       Sync all BOs
  ${style.opt('--prune')}                     Delete stale DB methods

${style.header('Interactive mode:')}
- Run without args in a TTY to choose commands.
`)
}

function isTty() {
    return Boolean(process.stdin.isTTY && process.stdout.isTTY)
}

function isInteractive(opts: any): boolean {
    return isTty() && opts?.yes !== true
}

export function parseArgs(argv: string[]): { args: string[]; opts: BoOpts } {
    const args: string[] = []
    const opts: BoOpts = {}
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i]
        if (a.startsWith('--')) {
            const key = a.slice(2)
            const next = argv[i + 1]
            if (next == null || next.startsWith('--')) {
                opts[key] = true
            } else {
                opts[key] = next
                i++
            }
        } else {
            args.push(a)
        }
    }
    return { args, opts }
}

function validateObjectName(name: unknown): asserts name is string {
    if (!name || typeof name !== 'string') throw new Error('ObjectName is required')
    if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
        throw new Error('ObjectName must be PascalCase (e.g. Person, OrderItem)')
    }
}

function parseCsv(value: unknown): string[] {
    if (!value) return []
    return String(value)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
}

function crudMethods(objectName: string): string[] {
    return [`get${objectName}`, `create${objectName}`, `update${objectName}`, `delete${objectName}`]
}

function escapeTemplateBraces(s: string): string {
    return s.replaceAll('{', '\\{').replaceAll('}', '\\}')
}

async function writeFileSafe(filePath: string, content: string, force: boolean): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    if (!force) {
        await fs.writeFile(filePath, content, { flag: 'wx' })
    } else {
        await fs.writeFile(filePath, content)
    }
}

async function resolveBoSourceFile(objectName: string): Promise<string> {
    const baseDir = path.join(repoRoot, 'BO', objectName)
    const tsPath = path.join(baseDir, `${objectName}BO.ts`)
    const jsPath = path.join(baseDir, `${objectName}BO.js`)
    try {
        await fs.access(tsPath)
        return tsPath
    } catch {
        try {
            await fs.access(jsPath)
            return jsPath
        } catch {
            throw new Error(
                `BO source file not found for ${objectName} (expected ${tsPath} or ${jsPath})`
            )
        }
    }
}

// --- Dynamic DB Helpers (Security Tx) ---
async function ensureDbQueries() {
    const required = [
        'getNextTx',
        'ensureObject',
        'upsertMethodTx',
        'listObjects',
        'listMethodsByObject',
        'listMethods',
        'resolveMethodId',
        'grantPermission',
        'revokePermission',
        'listPermissionsByProfile',
        'deleteMethodByName',
        'deleteObjectIfNoMethods',
        'listProfiles',
    ]
    const apps = (globalThis as any).queries
    const missing = required.filter((k) => !apps?.security?.[k])
    if (missing.length > 0) {
        throw new Error(`Missing security queries: ${missing.join(', ')}`)
    }
}

async function getNextTx() {
    const r = await (globalThis as any).db.exe('security', 'getNextTx', null)
    return Number(r.rows?.[0]?.next_tx)
}

async function upsertMethodsToDb(objectName: string, methods: string[], opts: any) {
    if (!opts.dry) await ensureDbQueries()

    if (!opts.dry && !opts.tx && opts.txStart == null && isInteractive(opts)) {
        const nextTx = await getNextTx()
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
        try {
            console.log('Methods:', methods.join(', '))
            const mode = await promptChoice(rl, 'TX mapping mode', ['auto', 'explicit'], 'auto')

            if (mode === 'explicit') {
                const ans = String(
                    await rl.question(
                        `Enter comma-separated tx numbers (same count=${methods.length}): `
                    )
                ).trim()
                if (ans.length === 0) {
                    throw new Error('Explicit tx mapping selected but no tx list was provided')
                }
                opts.tx = ans
            } else {
                const start = await promptText(rl, 'txStart', String(nextTx))
                opts.txStart = String(start)
            }
        } finally {
            rl.close()
        }
    }

    const explicitTx = parseCsv(opts.tx).map((n) => Number(n))
    if (explicitTx.length > 0 && explicitTx.length !== methods.length) {
        throw new Error('--tx must have same amount as --methods')
    }

    let txStart = opts.txStart != null ? Number(opts.txStart) : undefined
    if (!Number.isFinite(txStart)) txStart = undefined

    let next = txStart ?? (opts.dry ? 1 : await getNextTx())
    const mapping = []

    for (let i = 0; i < methods.length; i++) {
        const method = methods[i]
        const tx = explicitTx.length > 0 ? explicitTx[i] : next++
        mapping.push({ method, tx })
    }

    if (opts.dry) {
        console.log('DRY RUN: would upsert methods:', mapping)
        return mapping
    }

    await (globalThis as any).db.exe('security', 'ensureObject', [objectName])

    for (const m of mapping) {
        await (globalThis as any).db.exe('security', 'upsertMethodTx', [objectName, m.method, m.tx])
    }

    return mapping
}

// --- NEW TEMPLATES (Clean Architecture) ---

function templateTypes(objectName: string) {
    return `
export type ${objectName}Row = {
    ${objectName.toLowerCase()}_id: number
    // TODO: Add fields
}

export type Create${objectName}DTO = {
    // TODO: Add fields
}

export type Update${objectName}DTO = Partial<Create${objectName}DTO>
`
}

function templateRepo(objectName: string) {
    return `import { IDatabaseService } from '../../src/core/interfaces/services.js'
import { ${objectName}Row } from './${objectName}Types.js'

export class ${objectName}Repository {
    constructor(private readonly db: IDatabaseService) {}

    async getById(id: number): Promise<${objectName}Row | null> {
        const r = await this.db.exe('domain', 'TODO_getById', [id])
        return r.rows?.[0] ?? null
    }

    async create(params: Record<string, unknown>): Promise<{ id: number }> {
        const r = await this.db.exe('domain', 'TODO_create', [params])
        return { id: r.rows?.[0]?.id }
    }
}
`
}

function templateService(objectName: string) {
    return `import { ILogger } from '../../src/core/interfaces/services.js'
import { ${objectName}Repository } from './${objectName}Repository.js'
import { Create${objectName}DTO } from './${objectName}Types.js'

export class ${objectName}Service {
    constructor(
        private readonly repo: ${objectName}Repository,
        private readonly log: ILogger
    ) {}

    async create(dto: Create${objectName}DTO) {
        this.log.show({ type: this.log.TYPE_INFO, msg: 'Creating ${objectName}' })
        return await this.repo.create(dto as any)
    }

    async getById(id: number) {
        return await this.repo.getById(id)
    }
}
`
}

export function templateBO(objectName: string, methods: string[]) {
    const methodBodies = methods
        .map((m) => {
            const isCreate =
                m.toLowerCase().includes('create') || m.toLowerCase().includes('register')
            return `    async ${m}(params: unknown): Promise<ApiResponse> {
        try {
            const vRes = this.validate<z.infer<typeof ${objectName}Schemas.${m}>>(
                params,
                ${objectName}Schemas.${m}
            )
            if (!vRes.ok) return this.validationError(vRes.alerts)

            // const { ...args } = vRes.data
            // const result = await this.service.${m}(vRes.data)
            
            // if (!result.success) return this.error('Error')

            return this.${isCreate ? 'created' : 'success'}(null, this.successMsgs.${m} ?? 'OK')
        } catch (err) {
            this.log.show({ type: this.log.TYPE_ERROR, msg: \`${objectName}BO.${m}: \${err}\` })
            return this.error('Unknown Error')
        }
    }`
        })
        .join('\n\n')

    return `import { createRequire } from 'node:module'
import { BaseBO, BODependencies } from '../../src/core/base/BaseBO.js'
import { ApiResponse } from '../../src/core/response/ApiResponse.js'
import { ${objectName}Repository } from './${objectName}Repository.js'
import { ${objectName}Service } from './${objectName}Service.js'
import { ${objectName}Schemas } from './schemas.js'
import { z } from 'zod'

const require = createRequire(import.meta.url)
// TODO: Typed messages
const successMsgsRaw = require('./messages/${objectName.toLowerCase()}SuccessMsgs.json')
const getLang = () => (globalThis as any).config?.app?.lang ?? 'en'

export class ${objectName}BO extends BaseBO {
    private service: ${objectName}Service

    constructor(deps?: BODependencies) {
        const d = deps ?? {
            db: (globalThis as any).db,
            log: (globalThis as any).log,
            v: (globalThis as any).validator, // Native AppValidator (Zod)
            config: (globalThis as any).config,
        }
        super(d)
        const repo = new ${objectName}Repository(this.db)
        this.service = new ${objectName}Service(repo, this.log)
    }

    private get successMsgs() {
        return successMsgsRaw[getLang()]
    }

${methodBodies}
}
`
}

function templateSuccessMsgs(objectName: string, methods: string[]): string {
    const es: Record<string, string> = {}
    const en: Record<string, string> = {}
    for (const m of methods) {
        es[m] = `${objectName} ${m} OK`
        en[m] = `${objectName} ${m} OK`
    }
    return JSON.stringify({ es, en }, null, 2) + '\n'
}

function templateErrorMsgs() {
    return (
        JSON.stringify(
            {
                es: {
                    notFound: { msg: 'Recurso no encontrado', code: 404 },
                    unknownError: { msg: 'Error desconocido', code: 500 },
                },
                en: {
                    notFound: { msg: 'Resource not found', code: 404 },
                    unknownError: { msg: 'Unknown error', code: 500 },
                },
            },
            null,
            2
        ) + '\n'
    )
}

function templateAlertsLabels(objectName: string) {
    return (
        JSON.stringify(
            {
                es: { labels: { id: 'El id' } },
                en: { labels: { id: 'The id' } },
            },
            null,
            2
        ) + '\n'
    )
}

function templateSchemas(objectName: string, methods: string[]) {
    const methodSchemas = methods
        .map((m) => {
            return `    ${m}: z.object({
        // TODO: define validation
    }),`
        })
        .join('\n')

    return `import { z } from 'zod'

export const ${objectName}Schemas = {
${methodSchemas}
}
`
}

function templateErrorHandler(objectName: string) {
    return `
export class ${objectName}ErrorHandler {
    // TODO: implement error handler
}
`
}

// Reuse Auth presets
function authMethods() {
    return presetAuthMethods()
}
function templateAuthBO() {
    return presetTemplateAuthBO()
}
function templateAuthRepo() {
    return presetTemplateAuthRepo()
}
function templateAuthValidate() {
    return presetTemplateAuthValidate()
}
function templateAuthSuccessMsgs() {
    return presetTemplateAuthSuccessMsgs()
}
function templateAuthErrorMsgs() {
    return presetTemplateAuthErrorMsgs()
}
function templateAuthAlertsLabels() {
    return presetTemplateAuthAlertsLabels()
}
function templateAuthErrorHandler() {
    return presetTemplateAuthErrorHandler()
}

// --- Commands ---

async function cmdNew(objectName: string, opts: any) {
    validateObjectName(objectName)

    const methods = opts.methods ? parseCsv(opts.methods) : crudMethods(objectName)
    if (methods.length === 0) throw new Error('No methods to create')

    const force = Boolean(opts.force)
    const baseDir = path.join(repoRoot, 'BO', objectName)

    if (opts.dry) {
        console.log(`DRY RUN: would create ${baseDir}`)
    } else {
        await fs.mkdir(baseDir, { recursive: true })
    }

    const files = [
        { p: path.join(baseDir, `${objectName}BO.ts`), c: templateBO(objectName, methods) },
        { p: path.join(baseDir, `${objectName}Service.ts`), c: templateService(objectName) },
        { p: path.join(baseDir, `${objectName}Repository.ts`), c: templateRepo(objectName) },
        { p: path.join(baseDir, `${objectName}Types.ts`), c: templateTypes(objectName) },
        {
            p: path.join(baseDir, 'messages', `${objectName.toLowerCase()}SuccessMsgs.json`),
            c: templateSuccessMsgs(objectName, methods),
        },
        {
            p: path.join(baseDir, 'messages', `${objectName.toLowerCase()}ErrorMsgs.json`),
            c: templateErrorMsgs(),
        },
        {
            p: path.join(baseDir, 'messages', `${objectName.toLowerCase()}Alerts.json`),
            c: templateAlertsLabels(objectName),
        },
        // Also create skeletons for ErrorHandler and Validate if needed, or omit.
        // I included templateErrorHandler/Validate stubs above.
        { p: path.join(baseDir, `schemas.ts`), c: templateSchemas(objectName, methods) },
        {
            p: path.join(baseDir, `${objectName}ErrorHandler.ts`),
            c: templateErrorHandler(objectName),
        },
    ]

    for (const f of files) {
        if (opts.dry) console.log('DRY RUN write', f.p)
        else await writeFileSafe(f.p, f.c, force)
    }

    console.log(`Created BO ${objectName} with methods: ${methods.join(', ')}`)

    if (opts.db) {
        const mapping = await upsertMethodsToDb(objectName, methods, opts)
        console.log('DB tx mapping:', mapping)
        console.log('Restart the server to reload Security cache.')
    }
}

// ... Sync helpers ...
export function parseMethodsFromBO(fileContent: string): string[] {
    const methods = new Set<string>()
    const re = /\basync\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g
    let m: RegExpExecArray | null
    while ((m = re.exec(fileContent)) != null) {
        const name = m[1]
        if (!name) continue
        if (['constructor'].includes(name)) continue
        if (name.startsWith('#')) continue
        methods.add(name)
    }
    return Array.from(methods)
}

// --- Restored Sync Logic ---

type SyncObject = { objectName: string; boFile: string; methods: string[] }

async function discoverRepoBOs(): Promise<SyncObject[]> {
    const boRoot = path.join(repoRoot, 'BO')
    const entries = await fs.readdir(boRoot, { withFileTypes: true })
    const objects: SyncObject[] = []

    for (const e of entries) {
        if (!e.isDirectory()) continue
        const objectName = e.name
        // Best-effort filter: only PascalCase folders.
        if (!/^[A-Z][A-Za-z0-9]*$/.test(objectName)) continue

        try {
            const boFile = await resolveBoSourceFile(objectName)
            const content = await fs.readFile(boFile, 'utf8')
            const methods = parseMethodsFromBO(content).filter((m) => !m.startsWith('_'))
            if (methods.length === 0) continue
            objects.push({ objectName, boFile, methods })
        } catch {
            // Ignore folders without a BO file.
        }
    }

    objects.sort((a, b) => a.objectName.localeCompare(b.objectName))
    return objects
}

function computeStaleMethods(dbRows: any[], codeObjects: SyncObject[]) {
    const codeMap = new Map<string, Set<string>>()
    for (const o of codeObjects) {
        codeMap.set(o.objectName, new Set(o.methods))
    }

    const stale: Array<{ objectName: string; methodName: string; tx?: number }> = []
    for (const r of dbRows ?? []) {
        const objectName = String(r.object_na)
        const methodName = String(r.method_na)
        const tx = Number(r.tx_nu)
        const codeMethods = codeMap.get(objectName)
        if (!codeMethods || !codeMethods.has(methodName)) {
            stale.push({ objectName, methodName, tx: Number.isFinite(tx) ? tx : undefined })
        }
    }

    stale.sort((a, b) =>
        a.objectName === b.objectName
            ? String(a.methodName).localeCompare(String(b.methodName))
            : String(a.objectName).localeCompare(String(b.objectName))
    )

    return stale
}

function buildDbMethodsIndex(dbRows: any[]) {
    const index = new Map<string, Set<string>>()
    for (const r of dbRows ?? []) {
        const objectName = String(r.object_na)
        const methodName = String(r.method_na)
        if (!index.has(objectName)) index.set(objectName, new Set())
        index.get(objectName)!.add(methodName)
    }
    return index
}

function diffObjectMethods(objectName: string, codeMethods: string[], dbMethodSet?: Set<string>) {
    const codeSet = new Set<string>(codeMethods)
    const dbSet = dbMethodSet ?? new Set<string>()

    const inBoth = Array.from(codeSet)
        .filter((m) => dbSet.has(m))
        .sort()
    const missingInDb = Array.from(codeSet)
        .filter((m) => !dbSet.has(m))
        .sort()
    const staleInDb = Array.from(dbSet)
        .filter((m) => !codeSet.has(m))
        .sort()

    return { inBoth, missingInDb, staleInDb }
}

function printSyncSummary(summary: {
    scopeLabel: string
    objects: Array<{
        objectName: string
        inBoth: string[]
        missingInDb: string[]
        staleInDb: string[]
    }>
}) {
    const totalExisting = summary.objects.reduce((n, o) => n + o.inBoth.length, 0)
    const totalMissing = summary.objects.reduce((n, o) => n + o.missingInDb.length, 0)
    const totalStale = summary.objects.reduce((n, o) => n + o.staleInDb.length, 0)

    console.log(`Sync summary (${summary.scopeLabel}):`)
    console.log(`  existing (code ∩ db): ${totalExisting}`)
    console.log(`  to add   (code − db): ${totalMissing}`)
    console.log(`  to prune (db − code): ${totalStale}`)

    const changed = summary.objects.filter(
        (o) => o.missingInDb.length > 0 || o.staleInDb.length > 0
    )
    if (changed.length === 0) return

    console.log('Changes by object:')
    for (const o of changed) {
        const parts = []
        if (o.missingInDb.length > 0) parts.push(`add=${o.missingInDb.length}`)
        if (o.staleInDb.length > 0) parts.push(`prune=${o.staleInDb.length}`)
        console.log(`  - ${o.objectName}: ${parts.join('  ')}`)
    }
}

async function pruneStaleMethods(
    stale: Array<{ objectName: string; methodName: string }>,
    opts: any
) {
    if (stale.length === 0) return { deleted: 0 }
    await ensureDbQueries()

    const affectedObjects = Array.from(new Set(stale.map((s) => s.objectName)))

    if (opts.dry) {
        console.log('DRY RUN: would delete stale DB methods:')
        stale.forEach((s) => console.log(`  - ${s.objectName}.${s.methodName}`))
        console.log('DRY RUN: would also delete empty objects (no remaining methods):')
        affectedObjects.forEach((o) => console.log(`  - ${o}`))
        return { deleted: stale.length }
    }

    if (!isInteractive(opts) && opts.prune !== true) {
        console.log(
            `Detected ${stale.length} stale DB methods (in DB but not in code). Use --prune to delete them.`
        )
        return { deleted: 0 }
    }

    let okToDelete = Boolean(opts.yes)
    if (!okToDelete && isInteractive(opts)) {
        console.log('Detected methods present in DB but not in code:')
        stale.slice(0, 50).forEach((s) => console.log(`  - ${s.objectName}.${s.methodName}`))
        if (stale.length > 50) console.log(`  ...and ${stale.length - 50} more`)
        console.log('Deleting a method will also delete its permissions (cascade).')

        const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
        try {
            okToDelete = await promptYesNo(
                rl,
                'Delete these stale DB methods now? (in DB but not in code)',
                false
            )
        } finally {
            rl.close()
        }
    }

    if (!okToDelete) return { deleted: 0 }

    for (const s of stale) {
        await (globalThis as any).db.exe('security', 'deleteMethodByName', [
            s.objectName,
            s.methodName,
        ])
    }

    for (const o of affectedObjects) {
        await (globalThis as any).db.exe('security', 'deleteObjectIfNoMethods', [o])
    }

    return { deleted: stale.length }
}

async function cmdAuth(opts: any) {
    const objectName = 'Auth'
    const methods = authMethods()

    const force = Boolean(opts.force)
    const baseDir = path.join(repoRoot, 'BO', objectName)

    if (opts.dry) {
        console.log(`DRY RUN: would create ${baseDir}`)
    } else {
        await fs.mkdir(baseDir, { recursive: true })
    }

    const files = [
        { p: path.join(baseDir, `${objectName}BO.ts`), c: templateAuthBO() },
        { p: path.join(baseDir, `${objectName}.ts`), c: templateAuthRepo() },
        { p: path.join(baseDir, `${objectName}Validate.ts`), c: templateAuthValidate() },
        {
            p: path.join(baseDir, 'messages', `${objectName.toLowerCase()}SuccessMsgs.json`),
            c: templateAuthSuccessMsgs(),
        },
        { p: path.join(baseDir, `${objectName}ErrorHandler.ts`), c: templateAuthErrorHandler() },
        {
            p: path.join(baseDir, 'messages', `${objectName.toLowerCase()}ErrorMsgs.json`),
            c: templateAuthErrorMsgs(),
        },
        {
            p: path.join(baseDir, 'messages', `${objectName.toLowerCase()}Alerts.json`),
            c: templateAuthAlertsLabels(),
        },
    ]

    for (const f of files) {
        if (opts.dry) console.log('DRY RUN write', f.p)
        else await writeFileSafe(f.p, f.c, force)
    }

    console.log(`Created BO ${objectName} with methods: ${methods.join(', ')}`)

    if (opts.db) {
        const mapping = await upsertMethodsToDb(objectName, methods, opts)
        console.log('DB tx mapping:', mapping)
        console.log('Restart the server to reload Security cache.')
    }
}

async function cmdSync(objectName: string, opts: any) {
    if (opts.all === true) {
        const codeObjects = await discoverRepoBOs()
        if (codeObjects.length === 0) throw new Error('No BOs found under /BO')

        console.log(`Discovered ${codeObjects.length} BOs in repo.`)

        if (opts.dry) {
            console.log(
                'DRY RUN: cannot diff against DB without connecting. Showing code-only list:'
            )
            codeObjects.forEach((o) =>
                console.log(`  - ${o.objectName}: ${o.methods.length} methods`)
            )
            return
        }

        await ensureDbQueries()

        const dbMethods = await (globalThis as any).db.exe('security', 'listMethods', null)
        const dbIndex = buildDbMethodsIndex(dbMethods.rows ?? [])

        const perObject = codeObjects.map((o) => {
            const diff = diffObjectMethods(o.objectName, o.methods, dbIndex.get(o.objectName))
            return { objectName: o.objectName, ...diff }
        })

        printSyncSummary({ scopeLabel: 'all BOs', objects: perObject })

        let proceed = true
        if (isInteractive(opts)) {
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
            try {
                proceed = await promptYesNo(rl, 'Apply these changes to DB now?', true)
            } finally {
                rl.close()
            }
        }
        if (!proceed) return

        for (const o of codeObjects) {
            const diff = diffObjectMethods(o.objectName, o.methods, dbIndex.get(o.objectName))
            if (diff.missingInDb.length === 0) continue
            const mapping = await upsertMethodsToDb(o.objectName, diff.missingInDb, opts)
            console.log(`Synced ${o.objectName} new methods:`, mapping)
        }

        const stale = computeStaleMethods(dbMethods.rows ?? [], codeObjects)
        if (stale.length > 0) {
            const result = await pruneStaleMethods(
                stale.map((s) => ({ objectName: s.objectName, methodName: s.methodName })),
                opts
            )
            if (result.deleted > 0) console.log(`Pruned ${result.deleted} stale DB methods.`)
        }

        console.log('Sync-all complete. Restart the server to reload Security cache.')
        return
    }

    validateObjectName(objectName)
    const boFile = await resolveBoSourceFile(objectName)
    const content = await fs.readFile(boFile, 'utf8')
    const methods = parseMethodsFromBO(content).filter((m) => !m.startsWith('_'))

    if (methods.length === 0) throw new Error(`No methods found in ${boFile}`)

    if (opts.dry) {
        console.log(`DRY RUN: methods discovered in ${boFile}:`)
        console.log(methods.join(', '))
        const mapping = await upsertMethodsToDb(objectName, methods, opts)
        console.log(`DRY RUN: sync would upsert ${objectName} methods:`, mapping)
        console.log('DRY RUN: cannot diff against DB without connecting.')
        return
    }

    await ensureDbQueries()
    const existing = await (globalThis as any).db.exe('security', 'listMethodsByObject', [
        objectName,
    ])
    const existingSet = new Set<string>((existing.rows ?? []).map((r: any) => String(r.method_na)))
    const diff = diffObjectMethods(objectName, methods, existingSet)

    printSyncSummary({
        scopeLabel: objectName,
        objects: [
            {
                objectName,
                inBoth: diff.inBoth,
                missingInDb: diff.missingInDb,
                staleInDb: diff.staleInDb,
            },
        ],
    })

    let proceed = true
    if (isInteractive(opts)) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
        try {
            proceed = await promptYesNo(rl, 'Apply these changes to DB now?', true)
        } finally {
            rl.close()
        }
    }
    if (!proceed) return

    if (diff.missingInDb.length > 0) {
        const mapping = await upsertMethodsToDb(objectName, diff.missingInDb, opts)
        console.log(`Synced ${objectName} new methods:`, mapping)
    } else {
        console.log(`No new methods to add for ${objectName}.`)
    }

    if (diff.staleInDb.length > 0) {
        const stale = diff.staleInDb.map((m) => ({ objectName, methodName: m }))
        const result = await pruneStaleMethods(stale, opts)
        if (result.deleted > 0) console.log(`Pruned ${result.deleted} stale DB methods.`)
    }

    console.log('Restart the server to reload Security cache.')
}

async function cmdList() {
    await ensureDbQueries()
    const r = await (globalThis as any).db.exe('security', 'listMethods', null)
    for (const row of r.rows ?? []) {
        console.log(`${row.object_na}.${row.method_na}  tx=${row.tx_nu}`)
    }
}

async function resolveMethodId(objectName: string, methodName: string) {
    const r = await (globalThis as any).db.exe('security', 'resolveMethodId', [
        objectName,
        methodName,
    ])
    const row = r.rows?.[0]
    if (!row?.method_id) return null
    return { methodId: row.method_id, tx: row.tx_nu }
}

async function applyPerm(
    profileId: string | number,
    fqMethods: string[],
    mode: 'allow' | 'deny',
    opts: any
) {
    await ensureDbQueries()
    const profile = Number(profileId)
    if (!Number.isInteger(profile) || profile <= 0)
        throw new Error('--profile must be a positive integer')

    const results = []
    for (const fq of fqMethods) {
        const [objectName, methodName] = String(fq).split('.')
        if (!objectName || !methodName)
            throw new Error(`Invalid method format: ${fq} (use Object.method)`)

        if (opts.dry) {
            results.push({ action: mode, profile, objectName, methodName })
            continue
        }

        const resolved = await resolveMethodId(objectName, methodName)
        if (!resolved) throw new Error(`Method not found in DB: ${objectName}.${methodName}`)

        if (mode === 'allow')
            await (globalThis as any).db.exe('security', 'grantPermission', [
                profile,
                resolved.methodId,
            ])
        else
            await (globalThis as any).db.exe('security', 'revokePermission', [
                profile,
                resolved.methodId,
            ])

        results.push({ action: mode, profile, objectName, methodName, tx: resolved.tx })
    }

    return results
}

async function cmdPerms(opts: any) {
    const profile = opts.profile
    const allow = parseCsv(opts.allow)
    const deny = parseCsv(opts.deny)

    if (profile && (allow.length > 0 || deny.length > 0)) {
        const mode = allow.length > 0 ? 'allow' : 'deny'
        const list = allow.length > 0 ? allow : deny
        const r = await applyPerm(profile, list, mode, opts)
        console.log(r)
        console.log('Restart the server to reload Security cache.')
        return
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    try {
        const profiles = await (globalThis as any).db.exe('security', 'listProfiles', null)
        const profileIds = (profiles.rows ?? []).map((r: any) => r.profile_id)
        console.log('Profiles:', profileIds.join(', '))
        const p = await rl.question('Profile id: ')

        const objects = await (globalThis as any).db.exe('security', 'listObjects', null)
        const objectNames = (objects.rows ?? []).map((r: any) => r.object_na)
        console.log('Objects:', objectNames.join(', '))
        const o = await rl.question('Object (exact): ')

        const methods = await (globalThis as any).db.exe('security', 'listMethodsByObject', [o])
        const rows = methods.rows ?? []
        if (rows.length === 0) {
            console.log('No methods for object. Use: npm run bo -- sync ' + o)
            return
        }

        rows.forEach((r: any, idx: number) => {
            console.log(`[${idx + 1}] ${r.object_na}.${r.method_na}  tx=${r.tx_nu}`)
        })

        const action =
            (await rl.question('Action (allow/deny): ')).trim().toLowerCase() === 'deny'
                ? 'deny'
                : 'allow'
        const pick = await rl.question('Select methods (e.g. 1,2,5): ')
        const idxs = parseCsv(pick)
            .map((n) => Number(n))
            .filter((n) => Number.isInteger(n) && n >= 1 && n <= rows.length)
        const selected = idxs.map((i) => `${rows[i - 1].object_na}.${rows[i - 1].method_na}`)

        const r = await applyPerm(p, selected, action, opts)
        console.log('Done:', r)
        console.log('Restart the server to reload Security cache.')
    } finally {
        rl.close()
    }
}

async function main() {
    const { args, opts } = parseArgs(process.argv.slice(2))
    let cmd = args[0]

    if (!cmd && isInteractive(opts)) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
        try {
            cmd = await promptChoice(
                rl,
                'Command',
                ['new', 'auth', 'sync', 'list', 'perms', 'help'],
                'new'
            )

            if (cmd === 'new') {
                if (!args[1]) {
                    args[1] = await promptText(rl, 'ObjectName (PascalCase)', 'MyObject')
                }

                if (!opts.methods && !opts.crud) {
                    const mode = await promptChoice(
                        rl,
                        'Scaffold methods',
                        ['crud', 'custom'],
                        'crud'
                    )
                    if (mode === 'custom') {
                        const m = await promptText(rl, 'Methods (comma-separated)', '')
                        if (m.trim().length > 0) opts.methods = m
                    } else {
                        opts.crud = true
                    }
                }

                if (opts.force == null) {
                    const baseDir = path.join(repoRoot, 'BO', String(args[1]))
                    const boPath = path.join(baseDir, `${String(args[1])}BO.ts`)
                    const anyExists = await fileExists(boPath)
                    if (anyExists) {
                        opts.force = await promptYesNo(
                            rl,
                            'Files exist. Overwrite (--force)?',
                            false
                        )
                    }
                }

                if (opts.db == null) {
                    opts.db = await promptYesNo(rl, 'Also upsert methods to DB now (--db)?', false)
                }

                if (opts.db === true && !opts.tx && opts.txStart == null) {
                    const methodsForCount =
                        typeof opts.methods === 'string' && String(opts.methods).trim().length > 0
                            ? parseCsv(opts.methods)
                            : crudMethods(String(args[1]))

                    const mode = await promptChoice(
                        rl,
                        'TX mapping mode',
                        ['auto', 'explicit'],
                        'auto'
                    )
                    if (mode === 'explicit') {
                        console.log('Methods (order matters):')
                        methodsForCount.forEach((m, i) => console.log(`  [${i + 1}] ${m}`))
                        const ans = await promptText(
                            rl,
                            `Enter comma-separated tx numbers (same count=${methodsForCount.length})`,
                            ''
                        )
                        if (ans.trim().length > 0) opts.tx = ans
                    } else {
                        try {
                            await ensureDbQueries()
                            const nextTx = await getNextTx()
                            const start = await promptText(rl, 'txStart', String(nextTx))
                            if (String(start).trim().length > 0) opts.txStart = String(start)
                        } catch {
                            // If DB isn't available yet, upsertMethodsToDb will prompt later.
                        }
                    }
                }
            }

            if (cmd === 'auth') {
                // ... same auth interactive logic ...
            }
        } finally {
            rl.close()
        }
    }

    if (!cmd || cmd === 'help') {
        printHelp()
        return
    }

    try {
        switch (cmd) {
            case 'new':
                await cmdNew(args[1], opts)
                break
            case 'auth':
                await cmdAuth(opts)
                break
            case 'sync':
                await cmdSync(args[1], opts)
                break
            case 'list':
                await cmdList()
                break
            case 'perms':
                await cmdPerms(opts)
                break
            default:
                console.error(`Unknown command: ${cmd}`)
                printHelp()
                process.exit(1)
        }
    } catch (err) {
        console.error(style.err('ERROR:'), formatError(err))
        process.exit(1)
    }
}

if (isMainModule()) {
    main().catch((err) => {
        console.error(err)
        process.exit(1)
    })
}
