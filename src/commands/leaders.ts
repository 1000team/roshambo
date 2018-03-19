import { getConfig, register } from '../config'
import { SlackClient } from 'slacklib'
import { toStats } from './stats'
import { getRealname, Mode, getModeKey } from './util'

register(
  'leaders',
  'View the Roshambo leaderboard. ls = lizardspock, bo3 = best of 3.\n    *Usage*: leaders (bo3 | ls) -- _bo3 and ls are optional_',
  (bot, msg, _, args) => {
    const mode = args[0]
    if (mode === 'bo3' || mode === 'ls') {
      return leaders(bot, mode, msg.channel, msg.user)
    }

    return leaders(bot, 'classic', msg.channel, msg.user)
  }
)

export async function leaders(bot: SlackClient, mode: Mode, channel: string, userId: string) {
  const posTexts = getLeaders(bot, mode)
  const messages = [
    `*${getModeName(mode)} Roshambo Leaderboard*`,
    ...posTexts.slice(0, 10).map(pos => pos.text)
  ]

  const userPosition = posTexts.find(pos => pos.id === userId)!

  if (userPosition.position > 10) {
    messages.push('...', userPosition.text + ' _(you)_')
  }

  return bot.postMessage({
    channel,
    text: messages.join('\n')
  })
}

export function getLeaders(bot: SlackClient, mode: Mode) {
  const key = getModeKey(mode)
  const cfg = getConfig()
  const allUsers = Object.keys(cfg[key])

  allUsers.sort((l, r) => {
    const left = cfg[key][l]
    const right = cfg[key][r]

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

    const user = cfg[key][userId]
    return {
      id: userId,
      position: pos + 1,
      name: userName,
      text: `*#${pos + 1}.* ${userName}, ${toStats(user)}`
    }
  })
  return leaders
}

function getModeName(mode: Mode) {
  switch (mode) {
    case 'classic':
      return 'Classic'

    case 'bo3':
      return 'Best of Three'

    case 'ls':
      return 'LizardSpock'
  }
}
