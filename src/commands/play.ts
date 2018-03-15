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
    const isOkayToStart = await setInGame('classic', msg.user, opponentId, true)
    if (!isOkayToStart) {
      return bot.postMessage({
        channel: msg.channel,
        text: 'Unable to start: Both users can only be in one game at a time',
        ...cfg.defaultParams
      })
    }

    try {
      const gameResult = await game({ bot, mode, channel, challengerId, opponentId })
      if (!gameResult) {
        return
      }

      const { preText } = gameResult
      const results = await updateResults(
        bot,
        'classic',
        challengerId,
        opponentId,
        gameResult.winner
      )

      const resultText = getResultText({
        bot,
        results,
        opponentId,
        challengerId
      })

      await bot.postMessage({
        channel,
        text: [...preText, ...resultText].join('\n'),
        ...cfg.defaultParams
      })
    } finally {
      await setInGame('classic', msg.user, opponentId, false)
    }
  }
)
