import { setup } from 'slacklib'
import { Mode } from './commands/util'
import { Result } from './commands/game/select'

const { setConfig, getConfig, register } = setup<Config>(
  {
    name: 'Roshambot',
    emoji: ':fist:',
    channel: 'team-1000-team',
    timezone: 8,
    roshambo: {},
    roshamboLS: {},
    tournament: {
      channel: 'team-1000-team',
      active: false,
      mode: 'classic',
      matches: [],
      signup: false,
      round: 0,
      users: []
    }
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

  const tournament = cfg.tournament
  tournament.active = false
  tournament.users = []
  tournament.signup = false
  tournament.matches = []
  await setConfig('tournament', tournament)
}

export interface Config {
  name: string
  emoji: string
  channel: string
  timezone: number
  roshambo: { [userId: string]: Roshambo }
  roshamboLS: { [userId: string]: Roshambo }
  tournament: Tournament
}

export interface Tournament {
  channel: string
  active: boolean
  signup: boolean
  mode: Mode
  users: string[]
  round: number
  matches: Match[]
}

export interface Match {
  challenger: { id: string }
  opponent: { id: string } | Bye

  /** null indicates a chicken out scenario. Chickening out in a tournment will be a loss */
  result?: Result | null
}

export type Bye = 'bye'

export interface Roshambo {
  rating: number
  userId: string
  inGame: boolean
  wins: number
  losses: number
  draws: number
}
