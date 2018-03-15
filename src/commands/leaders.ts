import { getConfig, register } from '../config'
import { SlackClient } from 'slacklib'
import { toStats } from './stats'
import { getRealname } from './util'

register('leaders', 'View the Roshambo leaderboard', (bot, msg) => {
  return leaders(bot, msg.channel, msg.user)
})

export async function leaders(bot: SlackClient, channel: string, userId: string) {
  const cfg = getConfig()
  const posTexts = getLeaders(bot)
  const messages = ['*Roshambo Leaderboard*', ...posTexts.slice(0, 10).map(pos => pos.text)]

  const userPosition = posTexts.find(pos => pos.id === userId)!

  if (userPosition.position > 10) {
    messages.push('...', userPosition.text + ' _(you)_')
  }

  return bot.postMessage({
    channel,
    text: messages.join('\n'),
    ...cfg.defaultParams
  })
}

export function getLeaders(bot: SlackClient) {
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

  const leaders = allUsers.map((userId, pos) => {
    const userName = getRealname(bot, userId)

    const user = cfg.roshambo[userId]
    return {
      id: userId,
      position: pos + 1,
      name: userName,
      text: `*#${pos + 1}.* ${userName}, ${toStats(user)}`
    }
  })
  return leaders
}
