import express, { Express } from 'express'
import { IConfig } from '../../../types/index.js'

/**
 * Configura los parsers de body de Express (JSON y URL-encoded).
 *
 * Aplica límites de tamaño configurables (`app.bodyLimit`) para prevenir ataques DoS.
 *
 */
export function applyBodyParsers(app: Express, config: IConfig) {
    const bodyLimit = config.app.bodyLimit || '100kb'
    app.use(express.json({ limit: bodyLimit }))
    app.use(express.urlencoded({ extended: false, limit: bodyLimit }))
}
