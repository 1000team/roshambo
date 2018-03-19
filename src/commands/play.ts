import { register } from '../config'
import { game, setInGame, updateResults, getResultText } from './game'

register(
  'play',
  `Highly advanced and diplomatic decision maker and argument resolver. *Usage*: \`play @user\``,
  async (bot, msg, cfg, args) => {
    const mode = 'classic'
    const channel = msg.channel
    const challengerId = msg.user
    const opponentId = args[0] === 'ai' ? 'ai' : (args[0] || '').slice(2, -1)
    const isOkayToStart = await setInGame(mode, msg.user, opponentId, true)
    if (!isOkayToStart) {
      return bot.postMessage({
        channel: msg.channel,
        text: 'Unable to start: Both users can only be in one game at a time'
      })
    }

    try {
      const gameResult = await game({ bot, mode, channel, challengerId, opponentId })
      if (!gameResult) {
        return
      }

      const { preText } = gameResult
      const results = await updateResults(bot, mode, challengerId, opponentId, gameResult.winner)

      const resultText = getResultText({
        bot,
        mode,
        results,
        opponentId,
        challengerId
      })

      await bot.postMessage({
        channel,
        text: [...preText, ...resultText].join('\n')
      })
    } finally {
      await setInGame(mode, msg.user, opponentId, false)
    }
  }
)
