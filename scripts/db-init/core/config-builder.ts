import { InitConfig, DEFAULT_CONFIG, PROFILES, EnvType } from './config.js'
import { Interactor } from '../interactor/prompts.js'

export class ConfigBuilder {
    constructor(private interactor: Interactor) {}

    async build(cliConfig: Partial<InitConfig>): Promise<InitConfig> {
        // 1. Determine Profile
        let profile = cliConfig.app?.profile || DEFAULT_CONFIG.app.profile

        // If interactive and no profile set, ask
        if (!cliConfig.app?.interactive && !cliConfig.app?.profile) {
            // Default to dev?
        }

        const profileConfig = PROFILES[profile] || {}

        // Merge: Defaults -> Profile -> CLI -> Interactive Overrides
        // We need deep merge for app, db, auth, security to avoid clobbering.
        const merge = (base: any, ...overrides: any[]) => {
            const out = { ...base }
            for (const o of overrides) {
                if (!o) continue
                for (const k of Object.keys(o)) {
                    if (typeof o[k] === 'object' && o[k] !== null && !Array.isArray(o[k])) {
                        out[k] = merge(out[k] || {}, o[k])
                    } else {
                        out[k] = o[k]
                    }
                }
            }
            return out
        }

        let config = merge(DEFAULT_CONFIG, profileConfig, cliConfig)

        // Interactive questions
        if (config.app.interactive) {
            console.log('\n--- Configuration Wizard ---\n'.cyan)

            // Env
            const profiles = ['development', 'production', 'testing']
            if (!cliConfig.app?.profile) {
                config.app.profile = (await this.interactor.select(
                    'Select Environment Profile',
                    profiles,
                    config.app.profile
                )) as any
                const newProfileConfig = PROFILES[config.app.profile as EnvType] || {}
                config = { ...config, ...newProfileConfig }
            }

            // DB
            console.log('\n[Database]'.bold)
            config.db.host = await this.interactor.ask('DB Host', config.db.host)
            config.db.port = parseInt(await this.interactor.ask('DB Port', String(config.db.port)))
            config.db.database = await this.interactor.ask('DB Name', config.db.database)
            config.db.user = await this.interactor.ask('DB User', config.db.user)
            if (!config.db.password) {
                config.db.password = await this.interactor.ask(
                    'DB Password (leave empty if none)',
                    ''
                )
            }

            // Auth
            console.log('\n[Authentication]'.bold)
            config.auth.enabled = await this.interactor.confirm(
                'Enable standard Authentication module?',
                config.auth.enabled
            )

            if (config.auth.enabled) {
                const loginId = await this.interactor.select(
                    'Primary Login Identifier',
                    ['email', 'username'],
                    config.auth.loginId
                )
                config.auth.loginId = loginId as any

                if (loginId === 'email') {
                    config.auth.usernameSupported = await this.interactor.confirm(
                        'Support Username field?',
                        config.auth.usernameSupported
                    )
                }
            }
        }

        return config as InitConfig
    }
}
