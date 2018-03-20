import { setConfig, register, getConfig } from '../../config'
import { getModeName, Mode, sleep } from '../util'
import { SlackClient } from 'slacklib'
import { runTournament } from './run'

register('start', 'Force start a tournament that is currently in signup mode', bot => {
  return runTournament(bot)
})

register(
  'signup',
  'Join a tournament that is currently accepting signups',
  async (bot, msg, cfg) => {
    if (!cfg.tournament.signup) {
      await bot.postMessage({
        channel: msg.channel,
        text: 'There is no tournament currently accepting signups'
      })
      return
    }

    cfg.tournament.users.push(msg.user)
    await bot.postMessage({
      channel: msg.channel,
      text: 'You have joined the tournament'
    })
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
  const cfg = getConfig()
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
      `Use  \`@${cfg.name} signup\` to join the tournament`,
      `Registrations will be open for 5 minutes or \`${cfg.name} start\` is used`
    ].join('\n')
  })
}
