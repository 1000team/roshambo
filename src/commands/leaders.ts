import { getConfig, register } from '../config'
import { SlackClient } from 'slacklib'
import { toStats } from './stats'

register('leaders', 'View the Roshambo leaderboard', (bot, msg) => {
  return leaders(bot, msg.channel, msg.user)
})

export async function leaders(bot: SlackClient, channel: string, userId: string) {
  const cfg = getConfig()
  const allUsers = Object.keys(cfg.roshambo)

  allUsers.sort((l, r) => {
    const left = cfg.roshambo[l]
    const right = cfg.roshambo[r]

    const leftRating = left.rating || 1500
    const rightRating = right.rating || 1500

    if (leftRating > rightRating) {
      return -1
    }

    if (leftRating < rightRating) {
      return 1
    }

    if (left.wins > right.wins) {
      return -1
    }

    if (left.wins < right.wins) {
      return 1
    }

    if (left.losses < right.losses) {
      return -1
    }

    if (left.losses > right.losses) {
      return 1
    }

    if (left.draws > right.draws) {
      return -1
    }

    if (left.draws < right.draws) {
      return 1
    }

    return 0
  })

  const posTexts = allUsers.map((userId, pos) => {
    const userInfo = bot.users.find(u => u.id === userId)
    const user = cfg.roshambo[userId]
    return `*#${pos + 1}.* ${userInfo!.real_name}, ${toStats(user)}`
  })

  const messages = ['*Roshambo Leaderboard*', ...posTexts.slice(0, 10)]

  const userPosition = allUsers.reduce((pos, id, i) => {
    if (pos !== -1) {
      return pos
    }

    if (id === userId) {
      return i
    }

    return -1
  }, -1)

  if (userPosition > 10) {
    messages.push('...', posTexts[userPosition] + ' _(you)_')
  }

  return bot.postMessage({
    channel,
    text: messages.join('\n'),
    ...cfg.defaultParams
  })
}
