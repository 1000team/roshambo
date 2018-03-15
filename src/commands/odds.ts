import { register, getConfig } from '../config'
import { getRealname } from './util'
import * as elo from 'ratings'
import { SlackClient } from 'slacklib'

register(
  'odds',
  'View the match odds. *Usage* `odds @opponent` | `odds @challenger @opponent`',
  (bot, msg, cfg, args) => {
    const left = (args[0] || '').slice(2, -1)
    const right = (args[1] || '').slice(2, -1)

    try {
      if (left && right) {
        const { challenger, opponent } = getOdds(bot, left, right)
        return bot.postMessage({
          channel: msg.channel,
          text: `*${challenger.name}*: ${challenger.text} | *${opponent.name}*: ${opponent.text}`,
          ...cfg.defaultParams
        })
      }

      const odds = getOdds(bot, msg.user, left)
      return bot.postMessage({
        channel: msg.channel,
        text: `${odds.challenger} | ${odds.opponent}`,
        ...cfg.defaultParams
      })
    } catch (ex) {
      return bot.postMessage({
        channel: msg.channel,
        text: ex.message,
        ...cfg.defaultParams
      })
    }
  }
)

export function getOdds(bot: SlackClient, challengerId: string, opponentId: string) {
  const cfg = getConfig()
  const chal = cfg.roshambo[challengerId]
  const opp = cfg.roshambo[opponentId]

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
  const opShift = `${neat(shifts[0].black)} ${neat(shifts[1].black)} ${neat(shifts[2].black)}`

  return {
    challenger: {
      name: chalName,
      text: `${chPercent}% ${chShift}`
    },
    opponent: {
      name: oppName,
      text: `${opPercent}% ${opShift}`
    }
  }
}

function neat(value: number) {
  return value >= 0 ? '+' + value : value
}

function round(val: number) {
  return Math.round(val * 1000) / 1000
}
