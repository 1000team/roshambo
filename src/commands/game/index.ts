import { SlackClient } from 'slacklib'
import { getOdds } from '../odds'
import { getRealname, sleep } from '../util'
import { getSelection, TimeoutError, getWinner, Result, toMessage } from './select'
import { getUserPositions } from './update'
import { Mode } from '../util'
export { getResultText } from './result'
export { setInGame, updateResults } from './update'

export interface GameOptions {
  bot: SlackClient
  mode: Mode
  channel: string
  challengerId: string
  opponentId: string
  timeout?: number
}

export interface GameResult {
  winner: Result
  challenger: string
  opponent: string
  preText: string[]
}

export async function game(options: GameOptions): Promise<GameResult | null> {
  const { bot, channel, challengerId, opponentId, mode, timeout = 120 } = options

  // Only allow groups and channels
  const isChannel = channel.startsWith('C') || channel.startsWith('G')
  if (!isChannel) {
    await bot.postMessage({
      channel,
      text: 'This feature must be used in a channel or group'
    })
    return null
  }

  const cancel = async (text: string) => {
    await bot.postMessage({ channel, text })
    return null
  }

  if (opponentId === challengerId) {
    return cancel('You cannot challenge yourself')
  }

  const challenger = getRealname(bot, challengerId)
  const opponent = getRealname(bot, opponentId)

  if (!opponent) {
    return cancel(`Roshambo cancelled: Couldn't find opponent with that name`)
  }

  if ((opponent as any).is_bot) {
    return cancel('You cannot challenge a bot user')
  }

  if (!challenger) {
    return cancel(`Roshambo cancelled: Unexpected error (Challenger user not found)`)
  }

  const prePos = getUserPositions(bot, mode, challengerId, opponentId)

  const odds = getOdds(bot, mode, challengerId, opponentId)
  await bot.postMessage({
    channel,
    text: [
      `*#${prePos.ch} ${challenger}* (_${odds.challenger.rating}_ ${odds.challenger.text})`,
      'versus',
      `*#${prePos.opp} ${opponent}* (_${odds.opponent.rating}_ ${odds.opponent.text})!`
    ].join(' ')
  })

  try {
    const [left, right] = await Promise.all([
      getSelection(bot, mode, challengerId, timeout),
      sleep(250).then(() =>
        getSelection(
          bot,
          mode,
          opponentId,
          timeout,
          `${challenger} has challenged you to Roshambo.\n`
        )
      )
    ])

    const winner = getWinner(left, right)

    const pre = [toMessage({ name: challenger, select: left }, { name: opponent, select: right })]

    switch (winner) {
      case Result.Draw:
        pre.push('*Result*: *Draw*!')
        break

      case Result.Left:
        pre.push(`*Result*: *${challenger}* wins!`)
        break

      case Result.Right:
        pre.push(`*Result*: *${opponent}* wins!`)
        break
    }

    return {
      challenger: left,
      opponent: right,
      winner,
      preText: pre
    }
  } catch (ex) {
    if (ex instanceof TimeoutError) {
      await bot.postMessage({
        channel,
        text: `Looks like ${challenger} and ${opponent} chickened out! :hatched_chick:`
      })
      return null
    }

    await bot.postMessage({
      channel,
      text: `Failed to complete Roshambo: ${ex.message || ex}`
    })
    return null
  }
}
