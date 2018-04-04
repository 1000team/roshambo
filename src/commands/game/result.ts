import { SlackClient } from 'slacklib'
import { getUserStats } from '../stats'
import { getRealname, Mode } from '../util'

export interface ResultTextOpts {
  bot: SlackClient
  mode: Mode
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
  const { bot, challengerId, opponentId, results, mode } = opts
  const { pre, post } = results

  const challenger = getRealname(bot, challengerId)
  const opponent = getRealname(bot, opponentId)
  const chDiff = pre.ch - post.ch
  const opDiff = pre.opp - post.opp

  const leftStats = getUserStats(mode, challengerId)
  const rightStats = getUserStats(mode, opponentId)

  const preWhite = results.shift.white >= 0 ? '+' : ''
  const preBlack = results.shift.black >= 0 ? '+' : ''

  const abcCh = Math.abs(chDiff)
  const absOp = Math.abs(opDiff)

  const diffWhite = chDiff === 0 ? '' : chDiff < 0 ? `(--${abcCh})` : `(++${abcCh})`
  const diffBlack = opDiff === 0 ? '' : opDiff < 0 ? `(--${absOp})` : `(++${absOp})`

  const shiftText = [
    `*${preWhite}${results.shift.white} ${diffWhite}*`,
    `*${preBlack}${results.shift.black} ${diffBlack}*`
  ]

  const responses = [
    `*${challenger}* is now rated ${leftStats.rating} and position #${post.ch} ${shiftText[0]}`,
    `*${opponent}* is now rated ${rightStats.rating} and position #${post.opp} ${shiftText[1]}`
  ]
  return responses
}
