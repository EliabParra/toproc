/**
 * Barrel file para handlers HTTP.
 *
 * Re-exporta todos los handlers del directorio para simplificar imports.
 *
 * @module http/handlers
 */
export { createHealthHandler } from './health.js'
export { createReadyHandler } from './ready.js'
