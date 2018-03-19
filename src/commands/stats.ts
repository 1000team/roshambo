import { getConfig, register } from '../config'
import { SlackClient } from 'slacklib'
import { Mode, getModeKey } from './util'

register('stats', 'View your Roshambo stats', (bot, msg) => {
  return stats(bot, msg.user, msg.channel)
})

export async function stats(bot: SlackClient, userId: string, channel: string) {
  const modes: Mode[] = ['classic', 'ls', 'bo3']
  const messages: string[] = ['*Your statistics*:']
  for (const mode of modes) {
    const stats = getUserStats(mode, userId)
    const total = stats.wins + stats.losses + stats.draws
    messages.push(`[*${mode}*]: Played: ${total}, ${toStats(stats)}`)
  }

  return bot.postMessage({
    channel,
    text: messages.join('\n')
  })
}

export interface Stats {
  rating: number
  wins: number
  losses: number
  draws: number
}

export function toStats({ rating, wins, losses, draws }: Stats) {
  return `*${rating || 1500}* ${wins}W/${losses}L/${draws}D`
}

export function getUserStats(mode: Mode, userId: string) {
  const key = getModeKey(mode)
  const cfg = getConfig()
  const user = cfg[key][userId]

  if (!user) {
    return {
      rating: 1500,
      wins: 0,
      losses: 0,
      draws: 0
    }
  }

  return {
    rating: user.rating || 1500,
    wins: user.wins,
    losses: user.losses,
    draws: user.draws
  }
}
