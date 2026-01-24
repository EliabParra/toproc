import {
    authMethods as presetAuthMethods,
    templateAuthSuccessMsgs as presetTemplateAuthSuccessMsgs,
    templateAuthErrorMsgs as presetTemplateAuthErrorMsgs,
    templateAuthAlertsLabels as presetTemplateAuthAlertsLabels,
    templateAuthErrorHandler as presetTemplateAuthErrorHandler,
    templateAuthValidate as presetTemplateAuthValidate,
    templateAuthRepo as presetTemplateAuthRepo,
    templateAuthBO as presetTemplateAuthBO,
} from '../../bo-auth-preset.js'

export const AuthPreset = {
    methods: presetAuthMethods,
    bo: presetTemplateAuthBO,
    repo: presetTemplateAuthRepo,
    validate: presetTemplateAuthValidate,
    success: presetTemplateAuthSuccessMsgs,
    error: presetTemplateAuthErrorMsgs,
    alerts: presetTemplateAuthAlertsLabels,
    errorHandler: presetTemplateAuthErrorHandler,
}
