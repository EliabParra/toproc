export const AuthMessages = {
    LOGIN_SUCCESS: 'Sesión iniciada exitosamente',
    LOGOUT_SUCCESS: 'Sesión cerrada exitosamente',
    REGISTER_SUCCESS: 'Usuario registrado exitosamente',
    EMAIL_VERIFIED: 'Email verificado exitosamente',
    PASSWORD_RESET_SENT: 'Enlace de recuperación enviado',
    PASSWORD_CHANGED: 'Contraseña actualizada exitosamente',
    VERIFICATION_SENT: 'Enlace de verificación enviado',
    TOKEN_VALID: 'Token válido',

    USER_NOT_FOUND: 'Usuario no encontrado',
    INVALID_CREDENTIALS: 'Credenciales inválidas',
    EMAIL_NOT_VERIFIED: 'Email no verificado',
    SESSION_EXPIRED: 'Sesión expirada',
    TOKEN_INVALID: 'Token inválido o expirado',
    EMAIL_ALREADY_EXISTS: 'Ya existe un usuario con este email',
    ACCOUNT_DISABLED: 'Cuenta deshabilitada',

    VALIDATION: {
        LOGIN_ID_REQUIRED: 'El email o usuario es requerido',
        PASSWORD_REQUIRED: 'La contraseña es requerida',
        PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres',
        EMAIL_REQUIRED: 'El email es requerido',
        EMAIL_INVALID: 'El email no es válido',
        TOKEN_REQUIRED: 'El token es requerido',
    },

    welcomeBack: (name: string) => `Bienvenido de nuevo, ${name}`,
    verificationSentTo: (email: string) => `Se envió verificación a ${email}`,
}

export type AuthMessageKey = keyof typeof AuthMessages
export type AuthValidationKey = keyof typeof AuthMessages.VALIDATION
