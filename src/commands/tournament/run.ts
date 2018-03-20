import { getConfig, setConfig, Match } from '../../config'
import { Result } from '../game/select'
import { runRound } from './round'
import { getRealname, getModeName, Mode } from '../util'
import { SlackClient } from 'slacklib'

export async function runTournament(bot: SlackClient) {
  const cfg = getConfig()
  const tournament = cfg.tournament

  // Tournament has already started
  if (!tournament.signup) {
    return
  }

  // Minimum required is 3 players to form a 2 round single-elimination bracket
  if (tournament.users.length <= 2) {
    await endTournament()
    return bot.postMessage({
      channel: tournament.channel,
      text: 'Failed to start tournament. Not enough signups. Minimum required: 3'
    })
  }

  tournament.signup = false
  tournament.round = 1
  await setConfig('tournament', tournament)
  let done = false
  let winnerId: string | undefined

  while (!done) {
    const nextUsers: string[] = []
    const matches = toMatches(tournament.users)
    const messages: string[] = [`*Starting round ${tournament.round}*`]
    if (matches.length === 1) {
      messages.push('_Final Round!_')
    }

    for (const match of matches) {
      const cha = getRealname(bot, match.challenger.id)
      const opp = match.opponent === 'bye' ? '_BYE_' : getRealname(bot, match.opponent.id)
      messages.push(`*${cha}* vs. *${opp}*`)
    }

    await bot.postMessage({ channel: tournament.channel, text: messages.join('\n') })

    const results = await runRound(bot, tournament, matches)

    let index = -1
    for (const result of results) {
      index++
      const match = matches[index]

      if (result === 'bye' || match.opponent === 'bye') {
        nextUsers.push(match.challenger.id)
        continue
      }

      // Both users disqualified due to chicken out
      if (result === 'chickens') {
        continue
      }

      const winner = result.winner === Result.Left ? match.challenger : match.opponent
      nextUsers.push(winner.id)
      continue
    }

    tournament.round++
    tournament.users = nextUsers.slice()
    if (nextUsers.length <= 1) {
      done = true
      winnerId = nextUsers[0]
    }
    await setConfig('tournament', tournament)
  }

  await announceWinner(bot, tournament.mode, tournament.channel, winnerId)
  await endTournament()
}

async function announceWinner(
  bot: SlackClient,
  mode: Mode,
  channel: string,
  winnerId: string | undefined
) {
  const winner = getRealname(bot, winnerId!)
  const messages: string[] = []
  if (!winner) {
    messages.push(
      'The last round of the tournament was inconclusive!',
      'The tournament has been cancelled'
    )
  }

  if (winnerId) {
    messages.push(`The winner of the ${getModeName(mode)} Roshambo tournament is: *${winner}*!!!`)
  }

  await bot.postMessage({
    channel,
    text: messages.join('\n')
  })
}

async function endTournament() {
  const tournament = getConfig().tournament
  tournament.active = false
  tournament.signup = false
  tournament.users = []
  tournament.matches = []
  tournament.round = 0
  await setConfig('tournament', tournament)
}

function toMatches(users: string[]) {
  let index = 0
  const matches: Match[] = []

  while (users[index]) {
    const challenger = users[index]
    const opponent = users[index + 1]
    matches.push({
      challenger: { id: challenger },
      opponent: opponent ? { id: opponent } : 'bye'
    })
    index += 2
  }

  return matches
}
