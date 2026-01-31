import { InitConfig, PartialInitConfig } from '../types.js'
import { DEFAULT_CONFIG, PROFILES, deepMerge } from './defaults.js'
import { Interactor } from '../interactor/prompts.js'
import colors from 'colors'

/**
 * Builds the full configuration by merging defaults, profiles, CLI args, and interactive prompts.
 */
export class ConfigBuilder {
    private interactor?: Interactor

    constructor() {}

    /**
     * Builds basic configuration from defaults, profiles, and CLI args.
     * No interactive prompts here.
     */
    async buildBasic(cliConfig: PartialInitConfig): Promise<InitConfig> {
        const profile = cliConfig.app?.profile || DEFAULT_CONFIG.app.profile
        const profileConfig = PROFILES[profile] || {}

        return deepMerge(
            DEFAULT_CONFIG,
            profileConfig as Partial<InitConfig>,
            cliConfig as Partial<InitConfig>
        ) as InitConfig
    }

    /**
     * Runs the interactive configuration wizard based on the action.
     */
    async runWizard(
        config: InitConfig,
        cliConfig: PartialInitConfig,
        action: string
    ): Promise<InitConfig> {
        if (!config.app.interactive || !process.stdin.isTTY) {
            return config
        }

        this.interactor = new Interactor()

        // 1. Profile selection (only if not set via CLI and in a setup-like action)
        if (!cliConfig.app?.profile && (action === 'seed' || action === 'sync')) {
            const profiles = ['development', 'production', 'testing']
            const selected = await this.interactor.select(
                'Environment Profile',
                profiles,
                config.app.profile
            )
            if (selected !== config.app.profile) {
                config.app.profile = selected
                const profileConfig = PROFILES[selected] || {}
                config = deepMerge(config, profileConfig)
            }
        }

        // 2. Database configuration (only if missing or if user wants to reconfigure)
        const hasDbConfig = config.db.host && config.db.database && config.db.user
        let reconfigureDb = false

        if (!hasDbConfig) {
            console.log(colors.yellow('\n⚠️  Database configuration is incomplete.'))
            reconfigureDb = true
        } else if (action === 'sync' || action === 'seed') {
            // Optional: ask if they want to re-verify DB config
            // config.db.host + "..."
        }

        if (reconfigureDb) {
            console.log(colors.cyan(colors.bold('\n[Database Connection]')))
            config.db.host = await this.interactor.ask('DB Host', config.db.host || 'localhost')
            const portStr = await this.interactor.ask('DB Port', String(config.db.port || 5432))
            config.db.port = parseInt(portStr)
            config.db.database = await this.interactor.ask(
                'DB Name',
                config.db.database || 'toproc_dev'
            )
            config.db.user = await this.interactor.ask('DB User', config.db.user || 'postgres')
            if (!config.db.password) {
                config.db.password = await this.interactor.ask('DB Password', '')
            }
        }

        // 3. Action-specific Wizardry
        if (action === 'seed') {
            console.log(colors.cyan(colors.bold('\n[Seeding Options]')))

            if (cliConfig.security?.seedProfiles === undefined) {
                config.security.seedProfiles = await this.interactor.confirm(
                    'Seed default profiles (public/session)?',
                    config.security.seedProfiles ?? true
                )
            }

            if (cliConfig.security?.seedAdmin === undefined) {
                config.security.seedAdmin = await this.interactor.confirm(
                    'Seed admin user?',
                    config.security.seedAdmin ?? false
                )
            }

            if (config.security.seedAdmin) {
                if (!cliConfig.security?.adminUser) {
                    config.security.adminUser = await this.interactor.ask(
                        'Admin username',
                        config.security.adminUser || 'admin'
                    )
                }
                if (!cliConfig.security?.adminPassword) {
                    config.security.adminPassword = await this.interactor.ask(
                        'Admin password (leave empty to generate)',
                        ''
                    )
                }
            }
        }

        if (action === 'seed' || action === 'sync' || action === 'bo') {
            if (cliConfig.security?.registerBo === undefined) {
                config.security.registerBo = await this.interactor.confirm(
                    'Auto-register Business Object methods?',
                    config.security.registerBo ?? true
                )
            }
        }

        if (action === 'introspect') {
            if (cliConfig.security?.introspectData === undefined) {
                config.security.introspectData = await this.interactor.confirm(
                    'Include data records (INSERTs) in generated files?',
                    config.security.introspectData ?? false
                )
            }
        }

        this.interactor.close()
        return config
    }
}
