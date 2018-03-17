import { SlackClient, readMessage } from 'slacklib'
import { getConfig } from '../../config'
import { Selection } from '../util'

export async function getSelection(
  bot: SlackClient,
  userId: string,
  timeout: number,
  preText = ''
): Promise<Selection> {
  if (userId === 'ai') {
    const guess = Math.round(Math.random() * 2)
    switch (guess) {
      case 0:
        return Selection.Rock
      case 1:
        return Selection.Scissors
      case 2:
        return Selection.Paper
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

  const selection = toSelection((response || '').trim().slice(0, 1))
  if (!selection) {
    return getSelection(bot, userId, timeout, 'Invalid selection. ')
  }

  await bot.directMessage(userId, { text: 'Response accepted', ...cfg.defaultParams })
  return selection
}

function toSelection(selection: string) {
  switch (selection) {
    case 'r':
      return Selection.Rock

    case 's':
      return Selection.Scissors

    case 'p':
      return Selection.Paper
  }
  return
}

export class TimeoutError extends Error {}

export function toString(selection: Selection): string {
  switch (selection) {
    case Selection.Paper:
      return 'paper :raised_back_of_hand:'

    case Selection.Rock:
      return 'rock :fist:'

    case Selection.Scissors:
      return 'scissors :v:'
  }
}
