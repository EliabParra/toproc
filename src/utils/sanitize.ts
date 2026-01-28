/**
 * Redacta secretos conocidos en un string (e.g. logs).
 * Busca patrones como `password=...`.
 *
 * @param s - String a limpiar
 * @returns String sanitizado
 */
export function redactSecretsInString(s: string): string {
    return s
        .replace(/password=.+?(?=&|$)/g, 'password=[REDACTED]')
        .replace(/"password":\s*".+?"/g, '"password": "[REDACTED]"')
}

/**
 * Recorre recursivamente un objeto y redacta claves sensibles.
 * Claves afectadas: password, token, secret, code.
 *
 * @param obj - Objeto a limpiar
 * @returns Copia del objeto con valores redactados
 */
export function redactSecrets(obj: Record<string, unknown>): Record<string, unknown> {
    if (!obj || typeof obj !== 'object') return obj
    const out = { ...obj }
    for (const k of Object.keys(out)) {
        if (/password/i.test(k) || /token/i.test(k) || /secret/i.test(k) || /code/i.test(k)) {
            out[k] = '[REDACTED]'
        } else if (typeof out[k] === 'object' && out[k] !== null) {
            out[k] = redactSecrets(out[k] as Record<string, unknown>)
        }
    }
    return out
}
