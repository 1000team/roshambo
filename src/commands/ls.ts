import { register } from '../config'
import { play } from './game'

register(
  'ls',
  `Decision making and argument resolving from the year 2074. *Usage*: \`ls @user [best of N]\`. *E.g* \`ls @user 3\``,
  async (bot, msg, cfg, args) => {
    return play('ls', bot, msg, args)
  }
)
