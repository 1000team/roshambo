import { register } from '../config'
import { game, setInGame, updateResults, getResultText } from './game'

register(
  'ls',
  `Decision making and argument resolving from the year 2074. *Usage*: \`ls @user\``,
  async (bot, msg, cfg, args) => {
    const mode = 'ls'
    const channel = msg.channel
    const challengerId = msg.user
    const opponentId = args[0] === 'ai' ? 'ai' : (args[0] || '').slice(2, -1)
    const isOkayToStart = await setInGame(mode, msg.user, opponentId, true)
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
        text: [...preText, ...resultText].join('\n'),
        ...cfg.defaultParams
      })
    } finally {
      await setInGame(mode, msg.user, opponentId, false)
    }
  }
)
