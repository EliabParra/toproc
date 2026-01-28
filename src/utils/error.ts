/**
 * Extrae un mensaje de error legible de cualquier objeto catch.
 *
 * @param err - El error capturado (puede ser Error, objeto, string o null)
 * @returns El mensaje de error extraído o la representación en string
 */
export function errorMessage(err: unknown): string {
    if (err instanceof Error) return err.message

    if (err && typeof err === 'object' && 'message' in err) {
        const message = (err as { message?: unknown }).message
        if (message != null) return String(message)
    }

    return String(err)
}
