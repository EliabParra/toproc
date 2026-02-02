import fs from 'node:fs/promises'
import path from 'node:path'
import { InitConfig } from '../types.js'

export class DocsGenerator {
    constructor(private rootDir: string) {}

    async generate(config: InitConfig) {
        const docsPath = path.join(this.rootDir, 'DB_SETUP.md.generated')

        let md = `# ToProccess Database Setup Report\n\n`
        md += `**Date:** ${new Date().toISOString()}\n`
        md += `**Profile:** ${config.app.profile}\n`
        md += `**DB Host:** ${config.db.host}\n\n`

        md += `## Components Initialized\n`
        md += `- [x] Base Security Schema (users, profiles, objects, methods)\n`

        if (config.auth.enabled) {
            md += `- [x] Authentication Module (password resets, OTPs)\n`
            if (!config.auth.usernameSupported) {
                md += `  - Username is optional (Login ID: ${config.auth.loginId})\n`
            }
        } else {
            md += `- [ ] Authentication Module (Skipped)\n`
        }

        md += `\n## Next Steps\n`
        md += `1. Review and update \`.env\` file. All secrets and configuration are now centralized there.\n`
        md += `2. Run \`pnpm run dev\` to start the server.\n`
        if (config.auth.enabled) {
            md += `3. Use \`scripts/bo.ts\` to generate Auth BOs if needed.\n`
        }

        await fs.writeFile(docsPath, md)
        console.log(`Generated setup report at ${docsPath}`)
    }
}
