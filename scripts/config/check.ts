import { ConfigLoader } from '../../src/config/index.js'
import 'colors'

async function main() {
    console.log('🔍 Validating Configuration...'.cyan)

    try {
        const config = ConfigLoader.load(process.cwd())
        console.log('✅ Configuration Valid!'.green.bold)

        const env = config.app.env
        console.log(`\nMode: ${env.blue.bold}`)
        console.log(`DB Host: ${config.db.host.yellow}`)
        console.log(`Log Level: ${config.log.minLevel}`)

        if (env === 'production') {
            console.log('\n🔒 Production Security Checks:'.bold)
            console.log(`  - SSL: ${config.db.ssl ? '✅'.green : '❌ (Required)'.red}`)
            console.log(
                `  - Cookie Secure: ${config.session.cookie.secure ? '✅'.green : '❌'.red}`
            )
        }
    } catch (err: any) {
        console.error('❌ Validation Failed'.red.bold)
        process.exit(1)
    }
}

main()
