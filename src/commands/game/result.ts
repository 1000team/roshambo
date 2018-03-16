import { SlackClient } from 'slacklib'
import { toStats, getUserStats } from '../stats'
import { getRealname } from '../util'

export interface ResultTextOpts {
  bot: SlackClient
  results: EloResult & { pre: Position; post: Position }
  challengerId: string
  opponentId: string
}

interface Position {
  ch: number
  opp: number
}

interface EloResult {
  white: number
  black: number
  shift: {
    white: number
    black: number
  }
}

export function getResultText(opts: ResultTextOpts) {
  const { bot, challengerId, opponentId, results } = opts
  const { pre, post } = results

  const challenger = getRealname(bot, challengerId)
  const opponent = getRealname(bot, opponentId)
  const chDiff = pre.ch - post.ch
  const opDiff = pre.opp - post.opp

  const leftStats = getUserStats(challengerId)
  const rightStats = getUserStats(opponentId)

  const preWhite = results.shift.white >= 0 ? '+' : ''
  const preBlack = results.shift.black >= 0 ? '+' : ''

  const diffWhite = chDiff < 0 ? '--' : '++'
  const diffBlack = opDiff < 0 ? '--' : '++'

  const shiftText = [
    `*${preWhite}${results.shift.white} ${diffWhite}#${Math.abs(chDiff)}*`,
    `*${preBlack}${results.shift.black} ${diffBlack}#${Math.abs(opDiff)}*`
  ]

  const responses = [
    `*#${post.ch} ${challenger}*: ${toStats(leftStats)} ${shiftText[0]}`,
    `*#${post.opp} ${opponent}*: ${toStats(rightStats)} ${shiftText[1]}`
  ]
  return responses
}
