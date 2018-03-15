import { SlackClient } from 'slacklib'
import { getConfig } from '../config'

export function getRealname(bot: SlackClient, id: string) {
  if (id === 'ai') {
    const cfg = getConfig()
    return cfg.name
  }

  const user = bot.users.find(u => u.id === id)
  if (user) {
    return user.real_name
  }

  return
}
