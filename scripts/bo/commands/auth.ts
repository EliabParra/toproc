import { Context } from '../core/ctx.js'
import { Interactor } from '../interactor/ui.js'
import { AuthPreset } from '../templates/auth-preset.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import 'colors'

interface AuthOptions {
    isDryRun?: boolean
}

const AUTH_FEATURES = [
    { key: 'register', label: '📝 User Registration', enabled: true },
    { key: 'email-verify', label: '✉️ Email Verification', enabled: true },
    { key: 'password-reset', label: '🔑 Password Reset', enabled: true },
    { key: 'social', label: '🌐 Social Login (OAuth)', enabled: false, comingSoon: true },
]

/**
 * Comando Auth - genera el módulo de autenticación con nomenclatura Name.Type.ts
 *
 * Estructura generada:
 * - AuthBO.ts (archivo principal)
 * - AuthService.ts
 * - AuthRepository.ts
 * - AuthSchemas.ts
 * - AuthTypes.ts
 * - AuthMessages.ts
 * - AuthErrors.ts
 * - AuthSocialAuth.ts (placeholder)
 */
export class AuthCommand {
    private interactor: Interactor

    constructor(private ctx: Context) {
        this.interactor = new Interactor()
    }

    async run(opts: AuthOptions = {}) {
        console.log('\n🔑 Auth Preset Generator'.cyan.bold)
        console.log('══════════════════════════════════════════════════'.gray)
        console.log('')

        // Check if Auth already exists
        const authDir = path.join(this.ctx.config.rootDir, 'BO', 'Auth')
        let exists = false
        try {
            await fs.access(authDir)
            exists = true
        } catch {}

        if (exists && !opts.isDryRun) {
            console.log('⚠️ Auth module already exists at BO/Auth/'.yellow)
            const overwrite = await this.interactor.confirm('Overwrite existing files?', false)
            if (!overwrite) {
                console.log('Cancelled.'.gray)
                this.interactor.close()
                return
            }
        }

        // Show available features
        console.log('📋 Available Auth Features:')
        console.log('')

        for (const f of AUTH_FEATURES) {
            if (f.comingSoon) {
                console.log(`   ${'🔜'.gray} ${f.label} ${'[Coming Soon]'.yellow}`)
            } else if (f.enabled) {
                console.log(`   ${'✅'.green} ${f.label}`)
            }
        }

        console.log('')

        // Confirm generation
        if (!opts.isDryRun) {
            const proceed = await this.interactor.confirm('Generate Auth module?', true)
            if (!proceed) {
                console.log('Cancelled.'.gray)
                this.interactor.close()
                return
            }
        }

        if (opts.isDryRun) {
            console.log('\n📋 Dry run - would create:'.gray)
            console.log('   BO/Auth/')
            console.log('      ├── 📦 AuthBO.ts')
            console.log('      ├── 🧠 AuthService.ts')
            console.log('      ├── 🗄️ AuthRepository.ts')
            console.log('      ├── ✅ AuthSchemas.ts')
            console.log('      ├── 📘 AuthTypes.ts')
            console.log('      ├── 🌎 AuthMessages.ts')
            console.log('      ├── ❌ AuthErrors.ts')
            console.log('      ├── 🔍 AuthQueries.ts')
            console.log('      └── 🔜 AuthSocialAuth.ts (Coming Soon)')
            this.interactor.close()
            return
        }

        // Create directories
        await fs.mkdir(authDir, { recursive: true })

        console.log('\n📁 BO/Auth/')

        // Generate files with new naming convention
        const files = [
            {
                path: path.join(authDir, 'AuthBO.ts'),
                content: AuthPreset.bo(),
                icon: '📦',
            },
            {
                path: path.join(authDir, 'AuthService.ts'),
                content: AuthPreset.service(),
                icon: '🧠',
            },
            {
                path: path.join(authDir, 'AuthRepository.ts'),
                content: AuthPreset.repository(),
                icon: '🗄️',
                desc: 'Auth Repository',
            },
            {
                path: path.join(authDir, 'AuthSchemas.ts'),
                content: AuthPreset.schemas(),
                icon: '✅',
            },
            { path: path.join(authDir, 'AuthTypes.ts'), content: AuthPreset.types(), icon: '📘' },
            {
                path: path.join(authDir, 'AuthMessages.ts'),
                content: AuthPreset.messages(),
                icon: '🌎',
            },
            {
                path: path.join(authDir, 'AuthErrors.ts'),
                content: AuthPreset.errors(),
                icon: '❌',
            },
            {
                path: path.join(authDir, 'AuthQueries.ts'),
                content: AuthPreset.queries(),
                icon: '🔍',
                desc: 'SQL Queries',
            },
        ]

        for (const f of files) {
            await fs.writeFile(f.path, f.content)
            const basename = path.basename(f.path)
            console.log(`   ├── ${f.icon} ${basename} .............. ✅`)
        }

        // Create Social Auth placeholder
        const socialAuthPath = path.join(authDir, 'AuthSocialAuth.ts')
        await fs.writeFile(socialAuthPath, this.generateSocialAuthPlaceholder())
        console.log(`   └── 🔜 AuthSocialAuth.ts ........ ${'Coming Soon'.yellow}`)

        console.log('')
        console.log('🎉 Auth module created with 8 files!'.green.bold)
        console.log('')
        console.log('💡 Next steps:'.cyan)
        console.log(`   1. Edit ${'AuthTypes.ts'.bold} to define user interfaces`)
        console.log(`   2. Edit ${'AuthSchemas.ts'.bold} to add validation rules`)
        console.log(`   3. Configure auth in ${'config.json'.bold}:`)
        console.log('      "auth": {')
        console.log('        "loginId": "email",')
        console.log('        "requireEmailVerification": true,')
        console.log('        "sessionProfileId": 3')
        console.log('      }')
        console.log('')
        console.log(`   4. Register methods: ${'pnpm run bo sync Auth'.bold}`)
        console.log(`   5. Assign permissions: ${'pnpm run bo perms Auth'.bold}`)
        console.log('')

        this.interactor.close()
    }

    private generateSocialAuthPlaceholder(): string {
        return `/**
 * Social Authentication (OAuth) - Coming Soon
 *
 * Este módulo proveerá integración OAuth para:
 * - Google Sign-In
 * - GitHub OAuth
 * - Microsoft Account
 * - Apple Sign-In
 *
 * Estado: 🔜 Próximamente
 */

import { AuthMessages } from './AuthMessages.js'
import { AuthError } from './AuthErrors.js'

// ============================================================
// PLACEHOLDER - NO USAR EN PRODUCCIÓN
// ============================================================

export interface OAuthProvider {
    name: string
    clientId: string
    clientSecret: string
    redirectUri: string
    scopes: string[]
}

export interface OAuthConfig {
    google?: OAuthProvider
    github?: OAuthProvider
    microsoft?: OAuthProvider
    apple?: OAuthProvider
}

export interface OAuthUser {
    providerId: string
    providerUserId: string
    email: string
    name?: string
    picture?: string
}

/**
 * 🔜 Próximamente: Social Authentication Service
 *
 * Métodos planeados:
 * - getAuthorizationUrl(provider: string): string
 * - handleCallback(provider: string, code: string): Promise<OAuthUser>
 * - linkAccount(userId: number, oauthUser: OAuthUser): Promise<void>
 * - unlinkAccount(userId: number, provider: string): Promise<void>
 */
export class SocialAuthService {
    constructor(_config: OAuthConfig) {
        console.warn('⚠️ SocialAuthService aún no implementado')
    }

    async getAuthorizationUrl(_provider: string): Promise<string> {
        throw new AuthError('🔜 Social login próximamente!', 'SOCIAL_NOT_IMPLEMENTED', 501)
    }

    async handleCallback(_provider: string, _code: string): Promise<OAuthUser> {
        throw new AuthError('🔜 Social login próximamente!', 'SOCIAL_NOT_IMPLEMENTED', 501)
    }

    async linkAccount(_userId: number, _oauthUser: OAuthUser): Promise<void> {
        throw new AuthError('🔜 Social login próximamente!', 'SOCIAL_NOT_IMPLEMENTED', 501)
    }

    async unlinkAccount(_userId: number, _provider: string): Promise<void> {
        throw new AuthError('🔜 Social login próximamente!', 'SOCIAL_NOT_IMPLEMENTED', 501)
    }
}

/**
 * 🔜 Próximamente: Métodos de Social Auth para AuthBO
 */
export const SOCIAL_AUTH_METHODS = [
    'socialLoginStart',
    'socialLoginCallback',
    'linkSocialAccount',
    'unlinkSocialAccount',
]
`
    }
}
