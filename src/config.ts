import { setup } from 'slacklib'

const { setConfig, getConfig, register } = setup<Config>(
  {
    name: 'Roshambot',
    emoji: ':fist:',
    channel: 'team-1000-team',
    timezone: 8,
    roshambo: {},
    roshamboLS: {}
  },
  ['roshambo', 'roshamboLS']
)

export { setConfig, getConfig, register }

export async function backfillConfig() {
  const cfg = getConfig()

  const reset = (key: 'roshambo' | 'roshamboLS') => {
    const game = cfg[key]
    const keys = Object.keys(game)
    for (const id of keys) {
      game[id].inGame = false
    }
    return setConfig(key, game)
  }

  // Set all players to out of game
  await reset('roshambo')
  await reset('roshamboLS')
}

export interface Config {
  name: string
  emoji: string
  channel: string
  timezone: number
  roshambo: { [userId: string]: Roshambo }
  roshamboLS: { [userId: string]: Roshambo }
}

export interface Roshambo {
  rating: number
  userId: string
  inGame: boolean
  wins: number
  losses: number
  draws: number
}
