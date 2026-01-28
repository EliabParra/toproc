import { IConfig } from '../types/core.js'

export enum Feature {
    USE_NEW_VALIDATOR = 'USE_NEW_VALIDATOR',
    USE_STRICT_SECURITY = 'USE_STRICT_SECURITY',
    USE_NEW_CONFIG = 'USE_NEW_CONFIG', // Already implicitly active
    USE_I18N_V2 = 'USE_I18N_V2',
}

/**
 * Gestor de banderas de características (Feature Flags).
 *
 * Controla la activación de funcionalidades mediante configuración o variables de entorno.
 * Prioriza variables de entorno sobre configuración por defecto.
 */
export class FeatureFlags {
    private flags: Map<string, boolean> = new Map()

    constructor(private config: IConfig) {
        this.loadFlags()
    }

    private loadFlags() {
        // Load from env vars first (highest priority for overrides)
        this.set(Feature.USE_NEW_VALIDATOR, this.envBool('FEATURE_USE_NEW_VALIDATOR', true))
        this.set(Feature.USE_STRICT_SECURITY, this.envBool('FEATURE_USE_STRICT_SECURITY', false))
        this.set(Feature.USE_I18N_V2, this.envBool('FEATURE_USE_I18N_V2', true))
    }

    private envBool(key: string, defaultVal: boolean): boolean {
        const val = process.env[key]
        if (val === 'true' || val === '1') return true
        if (val === 'false' || val === '0') return false
        return defaultVal
    }

    public isEnabled(feature: Feature): boolean {
        return this.flags.get(feature) ?? false
    }

    public set(feature: Feature, value: boolean) {
        this.flags.set(feature, value)
    }

    public getAll(): Record<string, boolean> {
        return Object.fromEntries(this.flags)
    }
}
