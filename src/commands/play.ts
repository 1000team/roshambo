import { register } from '../config'
import { play } from './game'

register(
  'play',
  `Highly advanced and diplomatic decision maker and argument resolver. *Usage*: \`play @user [best of N]\` *E.g* \`play @user 3\``,
  async (bot, msg, cfg, args) => {
    return play('classic', bot, msg, args)
  }
)
