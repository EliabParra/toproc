export function redactSecretsInString(s: string): string {
    return s
        .replace(/password=.+?(?=&|$)/g, 'password=[REDACTED]')
        .replace(/"password":\s*".+?"/g, '"password": "[REDACTED]"')
}

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
