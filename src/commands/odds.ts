import * as elo from 'ratings'
import { register, getConfig } from '../config'
import { getRealname, Mode, getModeKey } from './util'
import { SlackClient } from 'slacklib'

register(
  'odds',
  'View the match odds. *Usage* `odds @opponent` | `odds @challenger @opponent`',
  (bot, msg, cfg, args) => {
    const left = args.length === 1 ? msg.user : trim(args[0])
    const right = args.length === 1 ? trim(args[0]) : trim(args[1])

    return sendOdds(bot, msg.channel, left, right)
  }
)

function trim(name: string) {
  if (name === 'ai') {
    return name
  }

  return (name || '').slice(2, -1)
}

function sendOdds(bot: SlackClient, channel: string, left: string, right: string) {
  const modes: Mode[] = ['classic', 'ls']
  const messages: string[] = []
  for (const mode of modes) {
    try {
      const { challenger, opponent } = getOdds(bot, mode, left, right)
      messages.push(
        `[${mode}] *${challenger.name}*: ${challenger.text} | *${opponent.name}*: ${opponent.text}`
      )
    } catch (ex) {
      // Intentional NOOP
    }
  }

  if (messages.length) {
    return bot.postMessage({
      channel,
      text: messages.join('\n')
    })
  }

  return bot.postMessage({
    channel,
    text: 'Unable to determine odds: One of the users does not have a profile'
  })
}

export function getOdds(bot: SlackClient, mode: Mode, challengerId: string, opponentId: string) {
  const cfg = getConfig()
  const key = getModeKey(mode)
  const chal = cfg[key][challengerId]
  const opp = cfg[key][opponentId]

  if (!chal) {
    throw new Error('No Roshambo profile found for challenger')
  }

  if (!opp) {
    throw new Error('No Roshambo profile found for opponent')
  }

  const chalName = getRealname(bot, challengerId)
  const oppName = getRealname(bot, opponentId)

  if (!chalName) {
    throw new Error('Unable to find Slack user data for challenger')
  }

  if (!oppName) {
    throw new Error('Unable to find Slack user data for opponent')
  }

  const odds = elo.chance(chal.rating, opp.rating)
  const chPercent = round(odds.white * 100)
  const opPercent = round(odds.black * 100)

  const shifts = [
    elo.adjustment(chal.rating, opp.rating, 1).shift,
    elo.adjustment(chal.rating, opp.rating, 0).shift,
    elo.adjustment(chal.rating, opp.rating, -1).shift
  ]

  const chShift = `${neat(shifts[0].white)} ${neat(shifts[1].white)} ${neat(shifts[2].white)}`
  const opShift = `${neat(shifts[2].black)} ${neat(shifts[1].black)} ${neat(shifts[0].black)}`

  return {
    challenger: {
      name: chalName,
      text: `${chPercent}% ${chShift}`,
      rating: chal.rating
    },
    opponent: {
      name: oppName,
      text: `${opPercent}% ${opShift}`,
      rating: opp.rating
    }
  }
}

function neat(value: number) {
  return value >= 0 ? '+' + value : value
}

function round(val: number) {
  return Math.round(val * 1000) / 1000
}
