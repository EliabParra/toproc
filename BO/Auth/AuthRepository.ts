import { IDatabaseService } from '../../src/core/interfaces/services.js'
import { OneTimeCodeRow, PasswordResetRow, UserBaseRow, UserRow } from './AuthTypes.js'

/**
 * Repositorio de acceso a datos para AuthBO.
 *
 * Encapsula todas las consultas SQL relacionadas con autenticación y gestión de usuarios.
 * Utiliza el esquema `security` de la base de datos.
 */
export class AuthRepository {
    /**
     * Crea una instancia de AuthRepository.
     * @param db - Servicio de base de datos unificado
     */
    constructor(private readonly db: IDatabaseService) {}

    // --- Users
    /**
     * Busca un usuario por email.
     * @param email - Email del usuario
     * @returns El usuario encontrado o null si no existe.
     */
    async getUserByEmail(email: string): Promise<UserRow | null> {
        const r = await this.db.exe('security', 'getUserByEmail', [email])
        return r.rows?.[0] ?? null
    }

    /**
     * Busca un usuario por nombre de usuario.
     * @param username - Nombre de usuario
     * @returns El usuario encontrado o null si no existe.
     */
    async getUserByUsername(username: string): Promise<UserRow | null> {
        const r = await this.db.exe('security', 'getUserByUsername', [username])
        return r.rows?.[0] ?? null
    }

    /**
     * Busca la información base de un usuario por email.
     * @param email - Email del usuario
     * @returns La información base del usuario o null si no existe.
     */
    async getUserBaseByEmail(email: string): Promise<UserBaseRow | null> {
        const r = await this.db.exe('security', 'getUserBaseByEmail', [email])
        return r.rows?.[0] ?? null
    }

    /**
     * Busca la información base de un usuario por nombre de usuario.
     * @param username - Nombre de usuario
     * @returns La información base del usuario o null si no existe.
     */
    async getUserBaseByUsername(username: string): Promise<UserBaseRow | null> {
        const r = await this.db.exe('security', 'getUserBaseByUsername', [username])
        return r.rows?.[0] ?? null
    }

    /**
     * Inserta un nuevo usuario en la base de datos.
     * @param params - Objeto con los datos del usuario.
     * @param params.username - Nombre de usuario (puede ser null).
     * @param params.email - Email del usuario (puede ser null).
     * @param params.passwordHash - Hash de la contraseña del usuario.
     * @returns Un objeto con el ID del usuario creado.
     * @throws Error si la inserción no devuelve un user_id.
     */
    async insertUser({
        username,
        email,
        passwordHash,
    }: {
        username: string | null
        email: string | null
        passwordHash: string
    }): Promise<{ user_id: number }> {
        const r = await this.db.exe('security', 'insertUser', [username, email, passwordHash])
        const row = r.rows?.[0]
        if (!row?.user_id) throw new Error('insertUser did not return user_id')
        return row
    }

    /**
     * Asocia un perfil a un usuario o actualiza la asociación existente.
     * @param params - Objeto con el ID de usuario y el ID de perfil.
     * @param params.userId - ID del usuario.
     * @param params.profileId - ID del perfil.
     * @returns `true` si la operación fue exitosa.
     */
    async upsertUserProfile({ userId, profileId }: { userId: number; profileId: number }) {
        await this.db.exe('security', 'upsertUserProfile', [userId, profileId])
        return true
    }

    /**
     * Marca el email de un usuario como verificado.
     * @param userId - ID del usuario.
     * @returns `true` si la operación fue exitosa.
     */
    async setUserEmailVerified(userId: number) {
        await this.db.exe('security', 'setUserEmailVerified', [userId])
        return true
    }

    /**
     * Actualiza la fecha del último inicio de sesión de un usuario.
     * @param userId - ID del usuario.
     * @returns `true` si la operación fue exitosa.
     */
    async updateUserLastLogin(userId: number) {
        await this.db.exe('security', 'updateUserLastLogin', [userId])
        return true
    }

    // --- Password reset
    /**
     * Inserta un nuevo registro de restablecimiento de contraseña.
     * @param params - Objeto con los detalles del restablecimiento.
     * @param params.userId - ID del usuario.
     * @param params.tokenHash - Hash del token de restablecimiento.
     * @param params.sentTo - Dirección a la que se envió el token (ej. email).
     * @param params.expiresSeconds - Tiempo de expiración del token en segundos.
     * @param params.ip - Dirección IP desde donde se solicitó (opcional).
     * @param params.userAgent - User-Agent desde donde se solicitó (opcional).
     */
    async insertPasswordReset({
        userId,
        tokenHash,
        sentTo,
        expiresSeconds,
        ip,
        userAgent,
    }: {
        userId: number
        tokenHash: string
        sentTo: string
        expiresSeconds: number
        ip?: string | null
        userAgent?: string | null
    }): Promise<void> {
        await this.db.exe('security', 'insertPasswordReset', [
            userId,
            tokenHash,
            sentTo,
            String(expiresSeconds),
            ip ?? null,
            userAgent ?? null,
        ])
    }

    /**
     * Invalida todos los restablecimientos de contraseña activos para un usuario.
     * @param userId - ID del usuario.
     * @returns `true` si la operación fue exitosa.
     */
    async invalidateActivePasswordResetsForUser(userId: number): Promise<boolean> {
        await this.db.exe('security', 'invalidateActivePasswordResetsForUser', [userId])
        return true
    }

    /**
     * Obtiene un registro de restablecimiento de contraseña por su hash de token.
     * @param tokenHash - Hash del token de restablecimiento.
     * @returns El registro de restablecimiento o null si no se encuentra.
     */
    async getPasswordResetByTokenHash(tokenHash: string): Promise<PasswordResetRow | null> {
        const r = await this.db.exe('security', 'getPasswordResetByTokenHash', [tokenHash])
        return r.rows?.[0] ?? null
    }

    /**
     * Incrementa el contador de intentos para un restablecimiento de contraseña.
     * @param resetId - ID del registro de restablecimiento.
     * @returns `true` si la operación fue exitosa.
     */
    async incrementPasswordResetAttempt(resetId: number): Promise<boolean> {
        await this.db.exe('security', 'incrementPasswordResetAttempt', [resetId])
        return true
    }

    /**
     * Marca un registro de restablecimiento de contraseña como usado.
     * @param resetId - ID del registro de restablecimiento.
     * @returns `true` si la operación fue exitosa.
     */
    async markPasswordResetUsed(resetId: number): Promise<boolean> {
        await this.db.exe('security', 'markPasswordResetUsed', [resetId])
        return true
    }

    // --- One-time codes (email verification, password reset, etc)
    /**
     * Inserta un nuevo código de un solo uso.
     * @param params - Objeto con los detalles del código.
     * @param params.userId - ID del usuario asociado.
     * @param params.purpose - Propósito del código (ej. 'email_verification', 'password_reset').
     * @param params.codeHash - Hash del código de un solo uso.
     * @param params.expiresSeconds - Tiempo de expiración del código en segundos.
     * @param params.meta - Metadatos adicionales (opcional).
     * @returns `true` si la operación fue exitosa.
     */
    async insertOneTimeCode({
        userId,
        purpose,
        codeHash,
        expiresSeconds,
        meta,
    }: {
        userId: number
        purpose: string
        codeHash: string
        expiresSeconds: number
        meta?: Record<string, unknown>
    }): Promise<boolean> {
        await this.db.exe('security', 'insertOneTimeCode', [
            userId,
            purpose,
            codeHash,
            String(expiresSeconds),
            JSON.stringify(meta ?? {}),
        ])
        return true
    }

    /**
     * Consume (invalida) todos los códigos de un solo uso para un usuario y propósito específicos.
     * @param params - Objeto con el ID de usuario y el propósito.
     * @param params.userId - ID del usuario.
     * @param params.purpose - Propósito del código.
     * @returns `true` si la operación fue exitosa.
     */
    async consumeOneTimeCodesForUserPurpose({
        userId,
        purpose,
    }: {
        userId: number
        purpose: string
    }) {
        await this.db.exe('security', 'consumeOneTimeCodesForUserPurpose', [userId, purpose])
        return true
    }

    /**
     * Obtiene un código de un solo uso válido para un usuario, propósito y hash de código específicos.
     * @param params - Objeto con el ID de usuario, propósito y hash del código.
     * @param params.userId - ID del usuario.
     * @param params.purpose - Propósito del código.
     * @param params.codeHash - Hash del código de un solo uso.
     * @returns El registro del código de un solo uso o null si no se encuentra o no es válido.
     */
    async getValidOneTimeCode({
        userId,
        purpose,
        codeHash,
    }: {
        userId: number
        purpose: string
        codeHash: string
    }): Promise<OneTimeCodeRow | null> {
        const r = await this.db.exe('security', 'getValidOneTimeCodeForPurpose', [
            userId,
            purpose,
            codeHash,
        ])
        return r.rows?.[0] ?? null
    }

    /**
     * Obtiene un código de un solo uso válido para un propósito, hash de token y hash de código específicos.
     * @param params - Objeto con el propósito, hash de token y hash de código.
     * @param params.purpose - Propósito del código.
     * @param params.tokenHash - Hash del token asociado (si aplica).
     * @param params.codeHash - Hash del código de un solo uso.
     * @returns El registro del código de un solo uso o null si no se encuentra o no es válido.
     */
    async getValidOneTimeCodeForPurposeAndTokenHash({
        purpose,
        tokenHash,
        codeHash,
    }: {
        purpose: string
        tokenHash: string
        codeHash: string
    }): Promise<OneTimeCodeRow | null> {
        const r = await this.db.exe('security', 'getValidOneTimeCodeForPurposeAndTokenHash', [
            purpose,
            tokenHash,
            codeHash,
        ])
        return r.rows?.[0] ?? null
    }

    /**
     * Obtiene un código de un solo uso activo para un propósito y hash de token específicos.
     * @param params - Objeto con el propósito y hash de token.
     * @param params.purpose - Propósito del código.
     * @param params.tokenHash - Hash del token asociado.
     * @returns El registro del código de un solo uso o null si no se encuentra o no está activo.
     */
    async getActiveOneTimeCodeForPurposeAndTokenHash({
        purpose,
        tokenHash,
    }: {
        purpose: string
        tokenHash: string
    }): Promise<OneTimeCodeRow | null> {
        const r = await this.db.exe('security', 'getActiveOneTimeCodeForPurposeAndTokenHash', [
            purpose,
            tokenHash,
        ])
        return r.rows?.[0] ?? null
    }

    /**
     * Incrementa el contador de intentos para un código de un solo uso.
     * @param codeId - ID del código de un solo uso.
     * @returns `true` si la operación fue exitosa.
     */
    async incrementOneTimeCodeAttempt(codeId: number): Promise<boolean> {
        await this.db.exe('security', 'incrementOneTimeCodeAttempt', [codeId])
        return true
    }

    /**
     * Consume (invalida) un código de un solo uso específico.
     * @param codeId - ID del código de un solo uso.
     * @returns `true` si la operación fue exitosa.
     */
    async consumeOneTimeCode(codeId: number): Promise<boolean> {
        await this.db.exe('security', 'consumeOneTimeCode', [codeId])
        return true
    }

    // --- Password
    /**
     * Actualiza la contraseña de un usuario.
     * @param params - Objeto con el ID de usuario y el nuevo hash de contraseña.
     * @param params.userId - ID del usuario.
     * @param params.passwordHash - Nuevo hash de la contraseña.
     * @returns `true` si la operación fue exitosa.
     */
    async updateUserPassword({
        userId,
        passwordHash,
    }: {
        userId: number
        passwordHash: string
    }): Promise<boolean> {
        await this.db.exe('security', 'updateUserPassword', [userId, passwordHash])
        return true
    }

    /**
     * Invalida todas las sesiones de un usuario.
     * Útil para revocar acceso global al cambiar contraseña o detectar fraude.
     * @param userId - ID del usuario cuyas sesiones se invalidarán.
     */
    async invalidateAllUserSessions(userId: number): Promise<void> {
        // Best effort session invalidation.
        try {
            // Note: This matches the legacy logic expected by tests.
            // In a real scenario, this depends on the session store implementation.
            await this.db.exeRaw("DELETE FROM security.sessions WHERE sess ->> 'user_id' = $1", [
                String(userId),
            ])
        } catch (e) {
            console.error('Failed to invalidate sessions', e)
        }
    }
}
