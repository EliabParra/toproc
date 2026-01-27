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
     * Builds the complete configuration.
     */
    async build(cliConfig: PartialInitConfig & { action?: string }): Promise<InitConfig> {
        // 1. Determine profile
        const profile = cliConfig.app?.profile || DEFAULT_CONFIG.app.profile
        const profileConfig = PROFILES[profile] || {}

        // 2. Deep merge: Defaults → Profile → CLI
        let config = deepMerge(
            DEFAULT_CONFIG,
            profileConfig as Partial<InitConfig>,
            cliConfig as Partial<InitConfig>
        ) as InitConfig

        // 3. Interactive prompts (if enabled and TTY)
        if (config.app.interactive && process.stdin.isTTY && process.stdout.isTTY) {
            this.interactor = new Interactor()
            config = await this.runInteractiveWizard(config, cliConfig)
            this.interactor.close()
        }

        return config
    }

    /**
     * Runs the interactive configuration wizard.
     */
    private async runInteractiveWizard(
        config: InitConfig,
        cliConfig: PartialInitConfig
    ): Promise<InitConfig> {
        if (!this.interactor) return config

        await this.interactor.header()

        // Profile selection (if not set via CLI)
        if (!cliConfig.app?.profile) {
            const profiles = ['development', 'production', 'testing']
            const selected = await this.interactor.select(
                'Environment Profile',
                profiles,
                config.app.profile
            )
            config.app.profile = selected
            const profileConfig = PROFILES[selected] || {}
            config = deepMerge(config, profileConfig)
        }

        // Database configuration
        console.log(colors.cyan(colors.bold('\n[Database]')))

        if (!cliConfig.db?.host) {
            config.db.host = await this.interactor.ask('DB Host', config.db.host || 'localhost')
        }
        if (!cliConfig.db?.port) {
            const portStr = await this.interactor.ask('DB Port', String(config.db.port || 5432))
            config.db.port = parseInt(portStr)
        }
        if (!cliConfig.db?.database) {
            config.db.database = await this.interactor.ask(
                'DB Name',
                config.db.database || 'toproc_dev'
            )
        }
        if (!cliConfig.db?.user) {
            config.db.user = await this.interactor.ask('DB User', config.db.user || 'postgres')
        }
        if (!cliConfig.db?.password && !config.db.password) {
            config.db.password = await this.interactor.ask('DB Password', '')
        }

        // Auth options
        console.log(colors.cyan(colors.bold('\n[Authentication]')))

        if (cliConfig.auth?.enabled === undefined) {
            config.auth.enabled = await this.interactor.confirm(
                'Enable Auth module?',
                config.auth.enabled || false
            )
        }

        if (config.auth.enabled) {
            if (cliConfig.auth?.loginId === undefined) {
                const loginId = await this.interactor.select(
                    'Primary Login Identifier',
                    ['email', 'username'],
                    config.auth.loginId || 'email'
                )
                config.auth.loginId = loginId as 'email' | 'username'
            }

            if (
                config.auth.loginId === 'email' &&
                cliConfig.auth?.usernameSupported === undefined
            ) {
                config.auth.usernameSupported = await this.interactor.confirm(
                    'Keep username as optional field?',
                    config.auth.usernameSupported !== false
                )
            }
        }

        // Seeding options
        console.log(colors.cyan(colors.bold('\n[Seeding]')))

        if (cliConfig.security?.seedProfiles === undefined) {
            config.security.seedProfiles = await this.interactor.confirm(
                'Seed default profiles (public/session)?',
                true
            )
        }

        if (cliConfig.security?.seedAdmin === undefined) {
            config.security.seedAdmin = await this.interactor.confirm('Seed admin user?', false)
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

        if (cliConfig.security?.registerBo === undefined) {
            config.security.registerBo = await this.interactor.confirm(
                'Auto-register BO methods?',
                true
            )
        }

        return config
    }
}
