import { setConfig, register, getConfig } from '../../config'
import { getModeName, Mode, sleep, getRealname } from '../util'
import { SlackClient } from 'slacklib'
import { runTournament } from './run'
import { createProfile } from '../game/update'

register('start', 'Force start a tournament that is currently in signup mode', bot => {
  return runTournament(bot)
})

register(
  'signup',
  'Join a tournament that is currently accepting signups',
  async (bot, msg, cfg, args) => {
    if (!cfg.tournament.signup) {
      await bot.postMessage({
        channel: msg.channel,
        text: 'There is no tournament currently accepting signups'
      })
      return
    }

    if (args[0] === 'ai') {
      await createProfile(cfg.tournament.mode, 'ai')
      cfg.tournament.users.push('ai')
      await bot.postMessage({
        channel: msg.channel,
        text: 'You have entered a bot into the tournament'
      })
    } else {
      await createProfile(cfg.tournament.mode, msg.user)
      cfg.tournament.users.push(msg.user)
      const name = getRealname(bot, msg.user)
      await bot.postMessage({
        channel: msg.channel,
        text: `*${name}* has joined the tournament`
      })
    }

    await setConfig('tournament', cfg.tournament)
  }
)

register(
  'tournament',
  'Start a Roshambo tournament! *Usage* `tournament [ls]`. _`ls` is optional_',
  async (bot, msg, cfg, args) => {
    const mode = args[0] === 'ls' ? 'ls' : 'classic'
    const modeName = getModeName(mode)
    const channel = msg.channel

    const tournament = cfg.tournament
    if (tournament.active) {
      return bot.postMessage({
        channel,
        text: `Cannot start ${modeName} tournament: One already in progress`
      })
    }

    await startSignups(bot, mode, channel)
    await sleep(60000 * 5)
    await runTournament(bot)
    const currentTournament = getConfig().tournament
    if (!currentTournament.signup) {
      return
    }
  }
)

async function startSignups(bot: SlackClient, mode: Mode, channel: string) {
  await setConfig('tournament', {
    mode,
    channel,
    active: true,
    signup: true,
    users: [],
    round: 0,
    matches: []
  })

  await bot.postMessage({
    channel,
    text: [
      `Registrations are open for a ${getModeName(mode)} Roshambo tournament!`,
      `Use  \`@${bot.self.name} signup\` to join the tournament`,
      `Registrations will be open for 5 minutes or \`@${bot.self.name} start\` is used`
    ].join('\n')
  })
}
