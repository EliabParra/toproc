/**
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

import { AuthMessages } from './Auth.Messages.js'
import { AuthError } from './Auth.Errors.js'

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
