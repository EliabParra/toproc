import {
    ILogger,
    IDatabase,
    IConfig,
    ISecurityService,
    ISessionService,
    II18nService,
} from '../types/core.js'

export class Container {
    private static instance: Container
    private services: Map<string, any> = new Map()

    private constructor() {}

    static getInstance(): Container {
        if (!Container.instance) {
            Container.instance = new Container()
        }
        return Container.instance
    }

    register<T>(key: string, service: T): void {
        this.services.set(key, service)
    }

    resolve<T>(key: string): T {
        if (!this.services.has(key)) {
            throw new Error(`Service not found: ${key}`)
        }
        return this.services.get(key)
    }

    // Typed helpers for core services
    get config(): IConfig {
        return this.resolve<IConfig>('config')
    }
    get log(): ILogger {
        return this.resolve<ILogger>('log')
    }
    get db(): IDatabase {
        return this.resolve<IDatabase>('db')
    }
    get security(): ISecurityService {
        return this.resolve<ISecurityService>('security')
    }
    get i18n(): II18nService {
        return this.resolve<II18nService>('i18n')
    }
    get queries(): unknown {
        return this.resolve<unknown>('queries')
    }
    get session(): ISessionService {
        return this.resolve<ISessionService>('session')
    }
}

export const container = Container.getInstance()
