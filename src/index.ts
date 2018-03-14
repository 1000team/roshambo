import { backfillConfig } from './config'
import { start } from 'slacklibbot'
import './commands'

async function main() {
  try {
    await start()
  } catch (ex) {
    const msg: string = ex.message || ''
    if (msg.includes('Failed to connect')) {
      console.error(msg)
      setTimeout(() => {
        console.log('Reconnecting...')
        main()
      }, 3000)
      return
    }

    console.error(ex.message)
    process.exit(1)
  }

  try {
    await backfillConfig()
  } catch (ex) {
    console.error(ex.message || ex)
    process.exit(1)
  }
}

main().catch(err => console.error(err))

process.on('unhandledRejection', err => console.error(err))
