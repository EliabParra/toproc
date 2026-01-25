export type PartialDeep<T> = T extends object
    ? {
          [P in keyof T]?: PartialDeep<T[P]>
      }
    : T

export function envBool(val: string | undefined): boolean | undefined {
    if (!val) return undefined
    const v = val.toLowerCase().trim()
    if (['true', '1', 'yes', 'on'].includes(v)) return true
    if (['false', '0', 'no', 'off'].includes(v)) return false
    return undefined
}

export function envInt(val: string | undefined): number | undefined {
    if (!val) return undefined
    const n = parseInt(val, 10)
    return isNaN(n) ? undefined : n
}

export function envList(val: string | undefined): string[] | undefined {
    if (!val) return undefined
    return val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
}
