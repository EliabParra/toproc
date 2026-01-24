import fs from 'node:fs/promises'
import path from 'node:path'
import { InitConfig } from '../core/config.js'

export class EnvGenerator {
    constructor(private rootDir: string) {}

    async generate(config: InitConfig) {
        // Generates .env content based on config
        const envPath = path.join(this.rootDir, '.env')

        let content = ''
        // If file exists, maybe read it first? (TODO for robustness)
        // For now, simple append or create structure

        content += `\n# --- ToProccess Init Config ---\n`
        content += `NODE_ENV=${config.app.profile}\n`

        if (config.db.connectionString) {
            content += `DATABASE_URL=${config.db.connectionString}\n`
        } else {
            content += `PGHOST=${config.db.host}\n`
            content += `PGPORT=${config.db.port}\n`
            content += `PGUSER=${config.db.user}\n`
            content += `PGPASSWORD=${config.db.password}\n`
            content += `PGDATABASE=${config.db.database}\n`
            content += `PGSSL=${config.db.ssl}\n`
        }

        if (config.auth.enabled) {
            content += `AUTH_ENABLE=true\n`
            content += `AUTH_PUBLIC_PROFILE_ID=${config.auth.publicProfileId}\n`
            content += `AUTH_SESSION_PROFILE_ID=${config.auth.sessionProfileId}\n`
        }

        // Write
        await fs.writeFile(envPath, content, { flag: 'a' }) // Append to avoid destroying existing secrets
        console.log(`Updated .env at ${envPath}`)
    }
}
