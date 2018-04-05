import { SlackClient } from 'slacklib'
import { getUserStats } from '../stats'
import { Mode } from '../util'

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
  const { challengerId, opponentId, results, mode } = opts
  const { pre, post } = results

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

  const ratingText = [
    `${leftStats.rating} (${preWhite}${results.shift.white})`,
    `${rightStats.rating} (${preBlack}${results.shift.black})`
  ]

  const posText = [`${diffWhite}`, `${diffBlack}`]

  const responses = [
    `*Rank* #${post.ch} ${posText[0]} *Rating* ${ratingText[0]}`,
    `*Rank* #${post.opp} ${posText[1]} *Rating* ${ratingText[1]}`
  ]

  return responses
}
