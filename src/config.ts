import { setup } from 'slacklibbot'

const { setConfig, getConfig, register } = setup<Config>(
  {
    name: 'Roshambot',
    emoji: ':derpderp:',
    channel: 'team-1000-team',
    timezone: 8,
    roshambo: {}
  },
  ['roshambo']
)

export { setConfig, getConfig, register }

/**
 * The top-level configuration keys changed
 * This will backfill them if they aren't set
 */

export async function backfillConfig() {
  const cfg: any = getConfig()

  // Set all players to out of game
  const roshambo = cfg.roshambo
  const players = Object.keys(roshambo)
  for (const id of players) {
    roshambo[id].inGame = false
  }

  await setConfig('roshambo', roshambo)

  if (cfg.name !== cfg.botName) {
    await setConfig('name', cfg.botName)
    await setConfig('emoji', cfg.botEmoji)
    await setConfig('timezone', cfg.botTimezone)
    await setConfig('channel', cfg.botChannel)
  }
}

export interface Config {
  name: string
  emoji: string
  channel: string
  timezone: number
  roshambo: { [userId: string]: Roshambo }
}

export interface Roshambo {
  rating: number
  userId: string
  inGame: boolean
  wins: number
  losses: number
  draws: number
}
