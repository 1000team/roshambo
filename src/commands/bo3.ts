import { register, getConfig } from '../config'
import { game, setInGame, GameOptions, GameResult, updateResults, getResultText } from './game'
import { Result } from './game/winner'
import { SlackClient } from 'slacklib'
import { getRealname, sleep } from './util'

register(
  'bo3',
  'Three times the diplomacy of classical Roshambo. *Usage* `bo3 @user`',
  async (bot, msg, cfg, args) => {
    const channel = msg.channel
    const challengerId = msg.user
    const opponentId = args[0] === 'ai' ? 'ai' : (args[0] || '').slice(2, -1)
    const isOkayToStart = await setInGame('bo3', msg.user, opponentId, true)
    if (!isOkayToStart) {
      return bot.postMessage({
        channel,
        text: 'Unable to start: Both users can only be in one game at a time',
        ...cfg.defaultParams
      })
    }

    const opts: GameOptions = {
      bot,
      mode: 'bo3',
      channel,
      challengerId,
      opponentId
    }

    const chName = getRealname(bot, challengerId)
    const opName = getRealname(bot, opponentId)

    let score = 0
    await sleep(1000)
    for (let count = 1; count <= 3; count++) {
      const result = await getResult(bot, opts)
      if (!result) {
        return bot.postMessage({
          channel,
          text: `Best of 3 cancelled between *${chName}* and *${opName}*`
        })
      }

      const text = result.preText
      if (count < 3) {
        text.push('Starting the next round...')
      }
      await sleep(1000)
      await bot.postMessage({
        channel,
        text: text.join('\n'),
        ...cfg.defaultParams
      })
      score += result.winner
      await sleep(1000)
    }

    const winnerName = score > 0 ? chName : opName
    const winner = score > 0 ? 1 : -1

    const results = await updateResults(bot, 'bo3', challengerId, opponentId, winner)
    const resultsText = getResultText({ bot, results, challengerId, opponentId })

    await bot.postMessage({
      channel,
      text: [`The winner of the best of 3 is: *${winnerName}*!!!`, ...resultsText].join('\n'),
      ...cfg.defaultParams
    })

    try {
    } finally {
      setInGame('bo3', msg.user, opponentId, false)
    }
  }
)

async function getResult(bot: SlackClient, opts: GameOptions): Promise<GameResult | null> {
  const result = await game(opts)
  if (result === null) {
    return null
  }

  if (result.winner === Result.Draw) {
    const leftName = getRealname(bot, opts.challengerId)
    const rightName = getRealname(bot, opts.opponentId)
    await bot.postMessage({
      channel: opts.channel,
      text: [
        `*${leftName}*: ${result.challenger}, *${rightName}*: ${result.opponent}`,
        '*Result*: Draw! ... Replaying ...'
      ].join('\n'),
      ...getConfig().defaultParams
    })
    return getResult(bot, opts)
  }

  return result
}
