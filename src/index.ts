import { startApi } from './api'
import { backfillConfig } from './config'
import { start } from 'slacklib'
import './commands'

async function main() {
  await backfillConfig()
  await startApi()
  await start()
}

main()

process.on('unhandledRejection', err => console.error(err) || console.error(err.stack))
