import { setup } from 'slacklib'

const { setConfig, getConfig, register } = setup<Config>(
  {
    name: 'Roshambot',
    emoji: ':fist:',
    channel: 'team-1000-team',
    timezone: 8,
    roshambo: {},
    roshamboBo3: {}
  },
  ['roshambo', 'roshamboBo3']
)

export { setConfig, getConfig, register }

export async function backfillConfig() {
  const cfg: any = getConfig()

  // Set all players to out of game
  const roshambo = cfg.roshambo
  const keys = Object.keys(roshambo)
  for (const id of keys) {
    roshambo[id].inGame = false
  }

  const bo3 = cfg.roshamboBo3
  const bo3keys = Object.keys(bo3)
  for (const id of bo3keys) {
    bo3[id].inGame = false
  }

  await setConfig('roshambo', roshambo)
  await setConfig('roshamboBo3', bo3)
}

export interface Config {
  name: string
  emoji: string
  channel: string
  timezone: number
  roshambo: { [userId: string]: Roshambo }
  roshamboBo3: { [userId: string]: Roshambo }
}

export interface Roshambo {
  rating: number
  userId: string
  inGame: boolean
  wins: number
  losses: number
  draws: number
}
