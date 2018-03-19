import { setConfig, register, Tournament, Match, getConfig } from '../../config'
import { getModeName, Mode, sleep } from '../util'
import { SlackClient } from 'slacklib'
import { runGame, GameResult } from '../game'

register('start', 'Force start a tournament that is currently in signup mode', bot => {
  return startTournament(bot)
})

register(
  'tournament',
  'Start a Roshambo tournament! *Usage* `tournament [ls]`. _`ls` is optional_',
  async (bot, msg, cfg, args) => {
    const mode = args[0] === 'ls' ? 'ls' : 'classic'
    const modeName = getModeName(mode)
    const channel = msg.channel

    const tournament = cfg.tournament
    if (tournament.active) {
      return bot.postMessage({
        channel,
        text: `Cannot start ${modeName} tournament: One already in progress`
      })
    }

    await startSignups(bot, mode, channel)
    await sleep(60000 * 5)
    await startTournament(bot)
    const currentTournament = getConfig().tournament
    if (!currentTournament.signup) {
      return
    }
  }
)

async function startSignups(bot: SlackClient, mode: Mode, channel: string) {
  const cfg = getConfig()
  await setConfig('tournament', {
    mode,
    channel,
    active: true,
    signup: true,
    users: [],
    round: 0,
    matches: []
  })

  await bot.postMessage({
    channel,
    text: [
      `Registrations are open for a ${getModeName(mode)} Roshambo tournament!`,
      `Use  \`@${cfg.name} signup\` to join the tournament`,
      `Registrations will be open for 5 minutes or \`${cfg.name} start\` is used`
    ].join('\n')
  })
}

async function startTournament(bot: SlackClient) {
  const tournament = getConfig().tournament

  // Tournament has already started, take no action
  if (!tournament.signup) {
    return
  }

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
  const matches = toMatches(tournament.users)
  return runRound(bot, tournament, matches)
}

async function runRound(bot: SlackClient, tournament: Tournament, matches: Match[]) {
  const promises = matches.map((match, i) =>
    sleep(i * 3000).then(() => runMatch(bot, tournament, match))
  )

  const results = await Promise.all(promises)

  /** Case: Finals */
  // Cannot be undefined
  // If null (both chickened out), cancel tournament

  /** Case: Semi-finals */
  // If one game fails (null), tournament winner is winner of the completed game

  /** All other cases */
  // Create next matches
  return results
}

async function runMatch(
  bot: SlackClient,
  tournament: Tournament,
  match: Match
): Promise<GameResult | null | void> {
  if (match.opponent === 'bye') {
    return
  }

  const result = await runGame({
    bot,
    chickenIsLoser: true,
    channel: tournament.channel,
    challengerId: match.challenger.id,
    opponentId: match.opponent.id,
    mode: tournament.mode
  })

  return result
}

function toMatches(users: string[]) {
  let index = 0
  const matches: Match[] = []

  while (!users[index]) {
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

async function endTournament() {
  const tournament = getConfig().tournament
  tournament.active = false
  tournament.signup = false
  tournament.users = []
  tournament.matches = []
  tournament.round = 0
  await setConfig('tournament', tournament)
}
