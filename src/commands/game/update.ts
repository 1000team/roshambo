import * as elo from 'ratings'
import { getConfig, setConfig, Roshambo } from '../../config'
import { getLeaders } from '../leaders'
import { SlackClient } from 'slacklib'
import { getModeKey, Mode } from '../util'
import { Result } from './select'

export async function updateResults(
  bot: SlackClient,
  mode: Mode,
  challengerId: string,
  opponentId: string,
  result: Result
) {
  const key = getModeKey(mode)
  const cfg = getConfig()
  const challenger = cfg[key][challengerId]
  const opponent = cfg[key][opponentId]
  if (!challenger.rating) {
    challenger.rating = 1500
  }

  if (!opponent.rating) {
    opponent.rating = 1500
  }

  const results = elo.adjustment(challenger.rating, opponent.rating, result)
  const pre = getUserPositions(bot, mode, challengerId, opponentId)
  challenger.rating = results.white
  opponent.rating = results.black

  challenger.inGame = false
  opponent.inGame = false

  switch (result) {
    case Result.Draw:
      challenger.draws++
      opponent.draws++
      break

    case Result.Left:
      challenger.wins++
      opponent.losses++
      break

    case Result.Right:
      challenger.losses++
      opponent.wins++
      break
  }

  const roshambo = cfg[key]
  roshambo[challengerId] = challenger
  roshambo[opponentId] = opponent

  await setConfig(key, roshambo)
  const post = getUserPositions(bot, mode, challengerId, opponentId)
  return { ...results, pre, post }
}

export async function setInGame(
  mode: Mode,
  challengerId: string,
  opponentId: string,
  inGame: boolean
) {
  const cfg = getConfig()

  const key = getModeKey(mode)
  const history = cfg[key]

  const challenger = history[challengerId] || { ...defaultHistory, userId: challengerId }
  const opponent = history[opponentId] || { ...defaultHistory, userId: opponentId }

  const isInTournament = cfg.tournament.users.find(u => u === challengerId || u === opponentId)
  if (isInTournament) {
    return false
  }

  if (inGame && (challenger.inGame || opponent.inGame)) {
    return false
  }

  challenger.inGame = inGame

  // The AI is talented enough to multi-table
  opponent.inGame = opponentId === 'ai' ? false : inGame

  history[challengerId] = challenger
  history[opponentId] = opponent

  await setConfig(key, history)
  return true
}

export function getUserPositions(
  bot: SlackClient,
  mode: Mode,
  challengerId: string,
  opponentId: string
) {
  const leaders = getLeaders(bot, mode)
  return {
    ch: leaders.find(user => user.id === challengerId)!.position,
    opp: leaders.find(user => user.id === opponentId)!.position
  }
}

const defaultHistory: Roshambo = {
  userId: '',
  rating: 1500,
  inGame: false,
  wins: 0,
  losses: 0,
  draws: 0
}
