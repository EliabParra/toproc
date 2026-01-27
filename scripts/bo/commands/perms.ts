import { Context } from '../core/ctx.js'
import { Interactor } from '../interactor/ui.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import 'colors'

interface Profile {
    profileId: number
    profileName: string
}

interface MethodPermission {
    methodName: string
    profiles: number[]
}

/**
 * Permission management command
 */
export class PermsCommand {
    private interactor: Interactor

    constructor(private ctx: Context) {
        this.interactor = new Interactor()
    }

    async run(objectName?: string) {
        console.log(`\n${'🔐'.cyan} Permission Manager`.cyan.bold)
        console.log('══════════════════════════════════════════════════'.gray)

        // If no object specified, list available BOs
        if (!objectName) {
            const bos = await this.listBOs()
            if (bos.length === 0) {
                console.log(`${'⚠️'.yellow} No BOs found`)
                return
            }

            console.log(`\n${'📦'.blue} Select a BO to manage permissions:`)
            for (let i = 0; i < bos.length; i++) {
                console.log(`   ${String(i + 1).gray}. ${bos[i]}`)
            }

            const answer = await this.interactor.ask('Select BO', '1')
            const idx = parseInt(answer) - 1
            if (idx >= 0 && idx < bos.length) {
                objectName = bos[idx]
            } else {
                console.log(`${'❌'.red} Invalid selection`)
                this.interactor.close()
                return
            }
        }

        await this.managePermissions(objectName)
        this.interactor.close()
    }

    private async managePermissions(objectName: string) {
        console.log(`\n${'🔐'.cyan} Managing permissions for ${objectName}BO`.cyan.bold)

        await this.ctx.ensureGlobals()

        const { Database } = await import('../../db/core/db.js')

        const db = new Database({
            host: process.env.PGHOST || 'localhost',
            port: Number(process.env.PGPORT) || 5432,
            user: process.env.PGUSER || 'postgres',
            password: process.env.PGPASSWORD || '',
            database: process.env.PGDATABASE || 'toproc',
        })

        try {
            // Get profiles
            const profilesResult = await db.exeRaw(`
                SELECT profile_id, profile_name 
                FROM security.profiles 
                ORDER BY profile_id
            `)
            const profiles: Profile[] = profilesResult.rows.map((r: any) => ({
                profileId: r.profile_id,
                profileName: r.profile_name,
            }))

            if (profiles.length === 0) {
                console.log(`${'⚠️'.yellow} No profiles found. Run: npm run db seed --seedProfiles`)
                return
            }

            // Get object and methods
            const objectResult = await db.exeRaw(
                `
                SELECT object_id FROM security.objects WHERE object_name = $1
            `,
                [objectName]
            )

            if (objectResult.rows.length === 0) {
                console.log(
                    `${'⚠️'.yellow} BO "${objectName}" not registered. Run: npm run bo sync ${objectName}`
                )
                return
            }

            const objectId = objectResult.rows[0].object_id

            // Get methods with permissions
            const methodsResult = await db.exeRaw(
                `
                SELECT 
                    m.method_id,
                    m.method_name,
                    m.tx,
                    COALESCE(array_agg(pm.profile_id) FILTER (WHERE pm.profile_id IS NOT NULL), '{}') as profile_ids
                FROM security.methods m
                LEFT JOIN security.permission_methods pm ON pm.method_id = m.method_id
                WHERE m.object_id = $1
                GROUP BY m.method_id, m.method_name, m.tx
                ORDER BY m.method_name
            `,
                [objectId]
            )

            const methods = methodsResult.rows

            if (methods.length === 0) {
                console.log(`${'⚠️'.yellow} No methods found for ${objectName}BO`)
                return
            }

            // Display permission matrix
            this.printPermissionMatrix(methods, profiles)

            // Interactive editing
            console.log(`\n${'💡'.blue} Options:`)
            console.log('   1. Grant permission to profile')
            console.log('   2. Revoke permission from profile')
            console.log('   3. Apply template')
            console.log('   4. Exit')

            const choice = await this.interactor.ask('Select action', '4')

            switch (choice) {
                case '1':
                    await this.grantPermission(db, methods, profiles, objectId)
                    break
                case '2':
                    await this.revokePermission(db, methods, profiles)
                    break
                case '3':
                    await this.applyTemplate(db, methods, profiles, objectId)
                    break
                case '4':
                default:
                    console.log('👋 Done'.gray)
            }
        } finally {
            await db.close()
        }
    }

    private printPermissionMatrix(methods: any[], profiles: Profile[]) {
        // Header
        const methodColWidth = Math.max(12, ...methods.map((m: any) => m.method_name.length))
        const profileColWidth = 10

        let header = '│ ' + 'Method'.padEnd(methodColWidth) + ' │'
        let divider = '├' + '─'.repeat(methodColWidth + 2) + '┼'

        for (const p of profiles) {
            const name = p.profileName.substring(0, profileColWidth - 2)
            header += ' ' + name.padEnd(profileColWidth - 1) + '│'
            divider += '─'.repeat(profileColWidth) + '┼'
        }
        divider = divider.slice(0, -1) + '┤'

        console.log(
            '\n┌' +
                '─'.repeat(methodColWidth + 2) +
                '┬' +
                profiles.map(() => '─'.repeat(profileColWidth)).join('┬') +
                '┐'
        )
        console.log(header.bold)
        console.log(divider)

        // Rows
        for (const m of methods) {
            const profileIds = Array.isArray(m.profile_ids) ? m.profile_ids : []
            let row = '│ ' + m.method_name.padEnd(methodColWidth) + ' │'

            for (const p of profiles) {
                const hasPermission = profileIds.includes(p.profileId)
                const icon = hasPermission ? '✅'.green : '❌'.red
                row += ' ' + icon.padEnd(profileColWidth + 8) + '│'
            }
            console.log(row)
        }

        console.log(
            '└' +
                '─'.repeat(methodColWidth + 2) +
                '┴' +
                profiles.map(() => '─'.repeat(profileColWidth)).join('┴') +
                '┘'
        )
    }

    private async grantPermission(db: any, methods: any[], profiles: Profile[], objectId: number) {
        console.log('\n${"📝".blue} Grant permission:')

        // Select method
        console.log('Methods:')
        methods.forEach((m: any, i: number) => console.log(`  ${i + 1}. ${m.method_name}`))
        const methodIdx = parseInt(await this.interactor.ask('Select method')) - 1
        if (methodIdx < 0 || methodIdx >= methods.length) return

        // Select profile
        console.log('Profiles:')
        profiles.forEach((p, i) => console.log(`  ${i + 1}. ${p.profileName}`))
        const profileIdx = parseInt(await this.interactor.ask('Select profile')) - 1
        if (profileIdx < 0 || profileIdx >= profiles.length) return

        const methodId = methods[methodIdx].method_id
        const profileId = profiles[profileIdx].profileId

        await db.exeRaw(
            `
            INSERT INTO security.permission_methods (profile_id, method_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
        `,
            [profileId, methodId]
        )

        console.log(`${'✅'.green} Permission granted!`)
    }

    private async revokePermission(db: any, methods: any[], profiles: Profile[]) {
        console.log('\n${"📝".blue} Revoke permission:')

        // Select method
        console.log('Methods:')
        methods.forEach((m: any, i: number) => console.log(`  ${i + 1}. ${m.method_name}`))
        const methodIdx = parseInt(await this.interactor.ask('Select method')) - 1
        if (methodIdx < 0 || methodIdx >= methods.length) return

        // Select profile
        console.log('Profiles:')
        profiles.forEach((p, i) => console.log(`  ${i + 1}. ${p.profileName}`))
        const profileIdx = parseInt(await this.interactor.ask('Select profile')) - 1
        if (profileIdx < 0 || profileIdx >= profiles.length) return

        const methodId = methods[methodIdx].method_id
        const profileId = profiles[profileIdx].profileId

        await db.exeRaw(
            `
            DELETE FROM security.permission_methods 
            WHERE profile_id = $1 AND method_id = $2
        `,
            [profileId, methodId]
        )

        console.log(`${'✅'.green} Permission revoked!`)
    }

    private async applyTemplate(db: any, methods: any[], profiles: Profile[], objectId: number) {
        console.log('\n${"📋".blue} Permission Templates:')
        console.log(
            '   1. Public Read, Private Write (read methods public, write methods admin only)'
        )
        console.log('   2. Admin Only (all methods admin only)')
        console.log('   3. All Authenticated (all methods for session profile)')
        console.log('   4. All Public (all methods for everyone)')

        const template = await this.interactor.ask('Select template', '1')

        // Find profile IDs
        const adminId =
            profiles.find((p) => p.profileName.toLowerCase().includes('admin'))?.profileId ?? 1
        const publicId =
            profiles.find((p) => p.profileName.toLowerCase().includes('public'))?.profileId ?? 2
        const sessionId =
            profiles.find((p) => p.profileName.toLowerCase().includes('session'))?.profileId ?? 3

        // Clear existing permissions for this object
        for (const m of methods) {
            await db.exeRaw(`DELETE FROM security.permission_methods WHERE method_id = $1`, [
                m.method_id,
            ])
        }

        // Apply template
        for (const m of methods) {
            const isReadMethod = ['get', 'list', 'search', 'find'].some((r) =>
                m.method_name.toLowerCase().includes(r)
            )

            let profileIds: number[] = []

            switch (template) {
                case '1': // Public Read, Private Write
                    profileIds = isReadMethod
                        ? [adminId, publicId, sessionId]
                        : [adminId, sessionId]
                    break
                case '2': // Admin Only
                    profileIds = [adminId]
                    break
                case '3': // All Authenticated
                    profileIds = [adminId, sessionId]
                    break
                case '4': // All Public
                    profileIds = [adminId, publicId, sessionId]
                    break
            }

            for (const pid of profileIds) {
                await db.exeRaw(
                    `
                    INSERT INTO security.permission_methods (profile_id, method_id)
                    VALUES ($1, $2) ON CONFLICT DO NOTHING
                `,
                    [pid, m.method_id]
                )
            }
        }

        console.log(`${'✅'.green} Template applied!`)
    }

    private async listBOs(): Promise<string[]> {
        const boRoot = path.join(this.ctx.config.rootDir, 'BO')
        const bos: string[] = []

        try {
            const entries = await fs.readdir(boRoot, { withFileTypes: true })
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    bos.push(entry.name)
                }
            }
        } catch {
            // BO directory doesn't exist
        }

        return bos
    }
}
