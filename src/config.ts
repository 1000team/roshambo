import { setup } from 'slacklib'

const { setConfig, getConfig, register } = setup<Config>(
  {
    name: 'Roshambot',
    emoji: ':fist:',
    channel: 'team-1000-team',
    timezone: 8,
    roshambo: {}
  },
  ['roshambo']
)

export { setConfig, getConfig, register }

export async function backfillConfig() {
  const cfg: any = getConfig()

  // Set all players to out of game
  const roshambo = cfg.roshambo
  const players = Object.keys(roshambo)
  for (const id of players) {
    roshambo[id].inGame = false
  }

  await setConfig('roshambo', roshambo)
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
