import {
    templateBO,
    templateService,
    templateRepository,
    templateSchemas,
    templateTypes,
    templateMessages,
} from './bo/templates/bo.js'
import 'colors'

console.log('🧪 Testing Templates Generation...'.cyan.bold)

const objectName = 'TestObjectBO'
const methods = ['create', 'get', 'update', 'delete', 'list']

console.log('\n[Types.ts]'.yellow)
console.log(templateTypes(objectName))

console.log('\n[Messages.ts]'.yellow)
console.log(templateMessages(objectName, methods))

console.log('\n[BO.ts]'.yellow)
console.log(templateBO(objectName, methods))

console.log('\n[Service.ts]'.yellow)
console.log(templateService(objectName))

console.log('\n[Repository.ts]'.yellow)
console.log(templateRepository(objectName))

console.log('\n[Schemas.ts]'.yellow)
console.log(templateSchemas(objectName, methods))

console.log('\n✅ Done'.green)
