import { SlackClient } from 'slacklib'
import { Tournament, Match } from '../../config'
import { GameResult, runGame } from '../game'
import { Result } from '../game/select'

export async function runRound(bot: SlackClient, tournament: Tournament, matches: Match[]) {
  const promises = matches.map((match, i) => runMatch(bot, tournament, match))

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
): Promise<GameResult | 'chickens' | 'bye'> {
  if (match.opponent === 'bye') {
    return 'bye'
  }

  const result = await runGame({
    bot,
    chickenIsLoser: true,
    channel: tournament.channel,
    challengerId: match.challenger.id,
    opponentId: match.opponent.id,
    mode: tournament.mode
  })

  // If the result is a Draw, it must be replayed
  // Tournament matches must be decisive
  if (result && result.winner === Result.Draw) {
    return runMatch(bot, tournament, match)
  }

  if (result === null) {
    return 'chickens'
  }

  return result
}
