import { SlackClient, readMessage } from 'slacklib'
import { getConfig } from '../../config'

export async function getSelection(
  bot: SlackClient,
  userId: string,
  timeout: number,
  preText = ''
): Promise<string> {
  if (userId === 'ai') {
    const guess = Math.round(Math.random() * 2)
    switch (guess) {
      case 0:
        return 'rock'
      case 1:
        return 'scissors'
      case 2:
        return 'paper'
    }
  }

  const cfg = getConfig()
  const result = await bot.directMessage(userId, {
    text: preText + 'Enter your selection: (r) rock, (s) scissors, (p) paper',
    ...cfg.defaultParams
  })

  if (!result) {
    throw new Error(`Failed to message user`)
  }

  if (!result.ok) {
    throw new Error(`Failed to message user: ${(result as any).error}`)
  }

  const response = await readMessage(bot, userId, { directOnly: true, timeout }).catch(() => {
    throw new TimeoutError()
  })

  if (!isValid(response)) {
    return getSelection(bot, userId, timeout, 'Invalid selection. ')
  }

  await bot.directMessage(userId, { text: 'Response accepted', ...cfg.defaultParams })
  return response.toLowerCase().trim()
}

function isValid(selection: string) {
  const lowered = (selection || '').toLowerCase().trim()
  return 'rock'.startsWith(lowered) || 'paper'.startsWith(lowered) || 'scissors'.startsWith(lowered)
}

export class TimeoutError extends Error {}
