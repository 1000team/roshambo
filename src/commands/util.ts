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

export type Mode = 'classic' | 'bo3'

export function getModeKey(mode: Mode) {
  switch (mode) {
    case 'classic':
      return 'roshambo'
    case 'bo3':
      return 'roshamboBo3'
  }
}

export function sleep(time: number) {
  return new Promise(resolve => setTimeout(() => resolve(), time))
}

export enum Selection {
  Rock = 'r',
  Scissors = 's',
  Paper = 'p'
}
