import { SlackClient, Chat } from 'slacklib'
import { getOdds } from '../odds'
import { getRealname, sleep, getModeName } from '../util'
import { getSelection, getWinner, Result, toMessage, toString, Selection } from './select'
import { getUserPositions } from './update'
import { Mode } from '../util'
import { setInGame, updateResults } from './update'
import { getResultText } from './result'

export interface GameOptions {
  bot: SlackClient
  mode: Mode
  channel: string
  challengerId: string
  opponentId: string
  preGameText?: string
  preChallengerText?: string
  preOpponentText?: string
  timeout?: number
}

export interface GameResult {
  winner: Result
  challenger: Selection
  opponent: Selection
  preText: string[]
}

export async function play(mode: Mode, bot: SlackClient, msg: Chat.Message, args: string[]) {
  const channel = msg.channel
  const challengerId = msg.user
  const opponentId = args[0] === 'ai' ? 'ai' : (args[0] || '').slice(2, -1)
  const challenger = getRealname(bot, challengerId)!
  const opponent = getRealname(bot, opponentId)!

  const isValidOpponent = !!opponent
  if (!isValidOpponent) {
    return bot.postMessage({
      channel: msg.channel,
      text: 'Unable to start: Cannot find a player with that name'
    })
  }

  const isOkayToStart = await setInGame(mode, challengerId, opponentId, true)
  if (!isOkayToStart) {
    return bot.postMessage({
      channel: msg.channel,
      text: 'Unable to start: Both users can only be in one game at a time'
    })
  }

  const winsReqd = raceTo(args[1])
  const modeText = getModeName(mode)
  let chalWins = 0
  let oppWins = 0
  let gamesPlayed = 0
  let preChallengerText = undefined
  let preOpponentText = undefined

  try {
    while (chalWins < winsReqd && oppWins < winsReqd) {
      if (gamesPlayed > 0) {
        await bot.postMessage({
          channel: msg.channel,
          text: `${modeText} Race to ${winsReqd}: *${challenger}* ${chalWins}/${winsReqd} | *${opponent}* ${oppWins}/${winsReqd}`
        })
        await sleep(750)
      }

      const preGameText =
        winsReqd > 1 && gamesPlayed === 0
          ? `*${challenger}* has challenged *${opponent}* to a Race to ${winsReqd}!`
          : undefined

      const gameResult = await runGame({
        bot,
        mode,
        channel,
        challengerId,
        opponentId,
        preGameText,
        preChallengerText,
        preOpponentText
      })

      if (!gameResult) {
        return
      }

      const { preText } = gameResult
      const results = await updateResults(bot, mode, challengerId, opponentId, gameResult.winner)
      gamesPlayed++

      const resultText = getResultText({
        bot,
        mode,
        results,
        opponentId,
        challengerId
      })

      const messages = [...preText, ...resultText]
      const chalSelect: string = `Your opponent selected ${toString(gameResult.opponent)}`
      const oppSelect: string = `Your opponent selected ${toString(gameResult.challenger)}`

      switch (gameResult.winner) {
        case Result.Left:
          chalWins++
          preChallengerText = `${chalSelect}. You won the previous round :heavy_check_mark:`
          preOpponentText = `${oppSelect}. You lost the previous round :x:`
          break

        case Result.Draw:
          preChallengerText = `${chalSelect}. You drew the previous round :heavy_minus_sign:`
          preOpponentText = `${oppSelect}. You drew the previous round :heavy_minus_sign:`
          break

        case Result.Right:
          oppWins++
          preChallengerText = `${chalSelect}. You lost the previous round :x:`
          preOpponentText = `${oppSelect}. You won the previous round :heavy_check_mark:`
          break
      }

      const winner = chalWins === winsReqd ? challenger : oppWins === winsReqd ? opponent : null
      if (winner) {
        messages.push(
          '___________________________',
          `*${winner}* has won the ${modeText} Race to ${winsReqd}`
        )
      }

      await bot.postMessage({
        channel,
        text: messages.join('\n')
      })
    }
  } finally {
    await setInGame(mode, challengerId, opponentId, false)
  }
}

async function runGame(options: GameOptions): Promise<GameResult | null> {
  const { bot, channel, challengerId, opponentId, mode, timeout = 180 } = options

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

  // This is a redundant check, but it's a good opportunity to narrow the type
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
      getSelection(bot, mode, challengerId, timeout, options.preChallengerText),
      sleep(1000).then(() =>
        getSelection(
          bot,
          mode,
          opponentId,
          timeout,
          options.preOpponentText || `${challenger} has challenged you to Roshambo.`
        )
      )
    ])

    if (!left || !right) {
      const chickens = []
      if (!left) chickens.push(challenger)
      if (!right) chickens.push(opponent)
      await bot.postMessage({
        channel,
        text: `Looks like ${chickens.join(' and ')} chickened out! :hatched_chick:`
      })
      return null
    }

    const winner = getWinner(left, right)

    const pre = [toMessage({ name: challenger, select: left }, { name: opponent, select: right })]

    return {
      challenger: left,
      opponent: right,
      winner,
      preText: pre
    }
  } catch (ex) {
    await bot.postMessage({
      channel,
      text: `Failed to complete Roshambo: ${ex.message || ex}`
    })
    return null
  }
}

export function raceTo(param: string) {
  const num = Number(param)
  if (isNaN(num)) {
    return 1
  }

  if (num <= 0) {
    return 1
  }

  const mod = num % 2
  const div = num / 2
  if (mod === 0) {
    return div
  }

  return Math.ceil(div)
}
