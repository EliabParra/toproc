export type ApiResponse<T = any> = {
    code: number
    msg: string
    data?: T | null
    alerts?: string[]
}
