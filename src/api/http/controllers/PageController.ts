import path from 'path'
import { pagesPath } from '../router/routes.js'
import type { AppRequest, AppResponse, ILogger, II18nService } from '../../../types/index.js'

export class PageController {
    private log: ILogger

    constructor(
        log: ILogger,
        private i18n: II18nService
    ) {
        this.log = log.child({ category: 'PageController' })
    }

    /**
     * Sirve una vista estática HTML.
     * @param view - Nombre del archivo de vista (sin extensión)
     */
    public serve(view: string) {
        return (req: AppRequest, res: AppResponse) => {
            try {
                const viewPath = path.join(pagesPath, 'pages', `${view}.html`)
                res.status(200).sendFile(viewPath)
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err)
                this.log.error(`Exception serving ${view}: ${message}`)

                const error = this.i18n.messages.errors.client.unknown || {
                    code: 500,
                    msg: 'Internal Server Error',
                }

                if (!res.headersSent) {
                    res.status(error.code).send(error)
                }
            }
        }
    }
}
