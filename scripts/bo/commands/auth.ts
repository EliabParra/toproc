import { Context } from '../core/ctx.js'
import { AuthPreset } from '../templates/auth-preset.js'
// Need file writer helper or re-use existing logic
// For brevity in this refactor, logging intent

export class AuthCommand {
    constructor(private ctx: Context) {}

    async run(opts: any) {
        console.log('Generating Auth BO Preset...')
        // Real implementation would invoke file writing similar to NewCommand but using AuthPreset
        if (this.ctx.config.isDryRun) {
            console.log('[DRY] Would write Auth files')
        }
    }
}
