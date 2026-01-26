import express from 'express'
import { IConfig } from '../../types/core.js'

/**
 * Configura los parsers de body de Express (JSON y URL-encoded).
 *
 * Aplica límites de tamaño configurables (`app.bodyLimit`) para prevenir ataques DoS.
 *
 */
export function applyBodyParsers(app: any, config: IConfig) {
    const bodyLimit = config.app.bodyLimit || '100kb'
    app.use(express.json({ limit: bodyLimit }))
    app.use(express.urlencoded({ extended: false, limit: bodyLimit }))
}
