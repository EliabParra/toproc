export function deepMerge<T = unknown>(target: T, ...sources: unknown[]): T {
    if (!sources.length) return target
    const source = sources.shift()

    if (isObject(target) && isObject(source)) {
        const t = target as Record<string, unknown>
        const s = source as Record<string, unknown>
        for (const key in s) {
            if (isObject(s[key])) {
                if (!t[key]) Object.assign(t, { [key]: {} })
                deepMerge(t[key], s[key])
            } else if (s[key] !== undefined) {
                Object.assign(t, { [key]: s[key] })
            }
        }
    }

    return deepMerge(target, ...sources)
}

function isObject(item: unknown): boolean {
    return !!item && typeof item === 'object' && !Array.isArray(item)
}
