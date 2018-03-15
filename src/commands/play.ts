import { SlackClient, Chat, readMessage } from 'slacklib'
import { getConfig, setConfig, Roshambo, register } from '../config'
import { toStats, getUserStats } from './stats'
import { getOdds } from './odds'
import { getLeaders } from './leaders'
import { getRealname } from './util'
import * as elo from 'ratings'

register(
  'play',
  `Highly advanced and diplomatic decision maker and argument resolver. *Usage*: \`play @user\``,
  async (bot, msg, cfg, args) => {
    const opponentId = args[0] === 'ai' ? 'ai' : (args[0] || '').slice(2, -1)
    return game(bot, msg, opponentId)
  }
)

export async function game(bot: SlackClient, msg: Chat.Message, opponentId: string) {
  const cfg = getConfig()

  // Only allow groups and channels
  const isChannel = msg.channel.startsWith('C') || msg.channel.startsWith('G')
  if (!isChannel) {
    return bot.postMessage({
      channel: msg.channel,
      text: 'This feature must be used in a channel or group',
      ...cfg.defaultParams
    })
  }

  const toChannel = (text: string) =>
    bot.postMessage({ channel: msg.channel, text, ...cfg.defaultParams })

  if (opponentId === msg.user) {
    return toChannel('You cannot challenge yourself')
  }

  const challenger = getRealname(bot, msg.user)
  const opponent = getRealname(bot, opponentId)

  if (!opponent) {
    return toChannel(`Roshambo cancelled: Couldn't find opponent with that name`)
  }

  if ((opponent as any).is_bot) {
    return toChannel('You cannot challenge a bot user')
  }

  if (!challenger) {
    return toChannel(`Roshambo cancelled: Unexpected error (Challenger user not found)`)
  }

  const isOkayToStart = await setInGame(msg.user, opponentId, true)
  if (!isOkayToStart) {
    return toChannel('Unable to start: Both users can only be in one game at a time')
  }

  const prePos = getUserPositions(bot, msg.user, opponentId)

  const odds = getOdds(bot, msg.user, opponentId)
  await bot.postMessage({
    channel: msg.channel,
    text: [
      `*#${prePos.ch} ${challenger}* (${odds.challenger.text})`,
      'has challanged',
      `*#${prePos.opp} ${opponent}* (${odds.opponent.text})!`
    ].join(' '),
    ...cfg.defaultParams
  })

  try {
    const [left, right] = await Promise.all([
      getSelection(bot, msg.user),
      getSelection(bot, opponentId, `${challenger} has challenged you to Roshambo.\n`)
    ])

    const winner = getWinner(left, right)

    const pre = [
      `*Challenger*: ${challenger} picked ${left}`,
      `*Opponent*: ${opponent} picked ${right}`
    ]

    const results = await updateResults(msg.user, opponentId, winner)

    const sendResult = (text: string) => {
      const postPos = getUserPositions(bot, msg.user, opponentId)
      const resultText = getResultText({
        bot,
        results,
        text,
        pre: prePos,
        post: postPos,
        challengerId: msg.user,
        opponentId
      })
      return bot.postMessage({
        channel: msg.channel,
        text: [...pre, ...resultText].join('\n'),
        ...cfg.defaultParams
      })
    }

    switch (winner) {
      case Result.Draw:
        return sendResult('Draw!')

      case Result.Left:
        return sendResult(`${challenger} wins!`)

      case Result.Right:
        return sendResult(`${opponent} wins!`)
    }
  } catch (ex) {
    await setInGame(msg.user, opponentId, false)

    if (ex instanceof TimeoutError) {
      await bot.postMessage({
        channel: msg.channel,
        text: `Looks like ${challenger} and ${opponent} chickened out! :hatched_chick:`,
        ...cfg.defaultParams
      })
      return
    }

    await bot.postMessage({
      channel: msg.channel,
      text: `Failed to complete Roshambo: ${ex.message || ex}`,
      ...cfg.defaultParams
    })
  }
}
interface ResultTextOpts {
  bot: SlackClient
  results: EloResult
  text: string
  pre: Position
  post: Position
  challengerId: string
  opponentId: string
}
function getResultText(opts: ResultTextOpts) {
  const { bot, challengerId, opponentId, pre, post, results, text } = opts
  const challenger = getRealname(bot, challengerId)
  const opponent = getRealname(bot, opponentId)
  const chDiff = pre.ch - post.ch
  const opDiff = pre.opp - post.opp

  const leftStats = getUserStats(challengerId)
  const rightStats = getUserStats(opponentId)

  const preWhite = results.shift.white >= 0 ? '+' : ''
  const preBlack = results.shift.black >= 0 ? '+' : ''

  const shiftText = [
    `*${preWhite}${results.shift.white} ${preWhite}#${Math.abs(chDiff)}*`,
    `*${preBlack}${results.shift.black} ${preBlack}#${Math.abs(opDiff)}*`
  ]

  const responses = [
    `*Result*: ${text}`,
    `*#${post.ch} ${challenger}*: ${toStats(leftStats)} ${shiftText[0]}`,
    `*#${post.opp} ${opponent}*: ${toStats(rightStats)} ${shiftText[1]}`
  ]
  return responses
}

interface EloResult {
  white: number
  black: number
  shift: {
    white: number
    black: number
  }
}

interface Position {
  ch: number
  opp: number
}

function getUserPositions(bot: SlackClient, challengerId: string, opponentId: string) {
  const leaders = getLeaders(bot)
  return {
    ch: leaders.find(user => user.id === challengerId)!.position,
    opp: leaders.find(user => user.id === opponentId)!.position
  }
}

async function getSelection(bot: SlackClient, userId: string, preText = ''): Promise<string> {
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
    text: preText + 'Enter your selection: rock, scissors, paper',
    ...cfg.defaultParams
  })

  if (!result) {
    throw new Error(`Failed to message user`)
  }

  if (!result.ok) {
    throw new Error(`Failed to message user: ${(result as any).error}`)
  }

  const response = await readMessage(bot, userId, { directOnly: true, timeout: 120 }).catch(() => {
    throw new TimeoutError()
  })

  if (!isValid(response)) {
    return getSelection(bot, userId, 'Invalid selection. ')
  }

  await bot.directMessage(userId, { text: 'Response accepted', ...cfg.defaultParams })
  return response.toLowerCase().trim()
}

async function updateResults(leftId: string, rightId: string, result: Result) {
  const cfg = getConfig()
  const challenger = cfg.roshambo[leftId]
  const opponent = cfg.roshambo[rightId]
  if (!challenger.rating) {
    challenger.rating = 1500
  }

  if (!opponent.rating) {
    opponent.rating = 1500
  }

  const results = elo.adjustment(challenger.rating, opponent.rating, result)
  challenger.rating = results.white
  opponent.rating = results.black

  challenger.inGame = false
  opponent.inGame = false

  switch (result) {
    case Result.Draw:
      challenger.draws++
      opponent.draws++
      break

    case Result.Left:
      challenger.wins++
      opponent.losses++
      break

    case Result.Right:
      challenger.losses++
      opponent.wins++
      break
  }

  const roshambo = cfg.roshambo
  roshambo[leftId] = challenger
  roshambo[rightId] = opponent

  await setConfig('roshambo', roshambo)
  return results
}

function getWinner(left: string, right: string) {
  if (left === right) {
    return Result.Draw
  }

  switch (left) {
    case 'rock':
      return right === 'scissors' ? Result.Left : Result.Right

    case 'paper':
      return right === 'rock' ? Result.Left : Result.Right

    case 'scissors':
      return right === 'paper' ? Result.Left : Result.Right
  }

  throw new Error('Unable to determine Roshambo winner: Invalid selections')
}

function isValid(selection: string) {
  const lowered = (selection || '').toLowerCase().trim()
  return lowered === 'rock' || lowered === 'paper' || lowered === 'scissors'
}

enum Result {
  Left = 1,
  Right = -1,
  Draw = 0
}

async function setInGame(challengerId: string, opponentId: string, inGame: boolean) {
  const cfg = getConfig()
  const challenger = cfg.roshambo[challengerId] || { ...defaultHistory, userId: challengerId }
  const opponent = cfg.roshambo[opponentId] || { ...defaultHistory, userId: opponentId }

  if (inGame && (challenger.inGame || opponent.inGame)) {
    return false
  }

  challenger.inGame = inGame

  // The AI is talented enough to multi-table
  opponent.inGame = opponentId === 'ai' ? false : inGame

  const existing = cfg.roshambo
  existing[challengerId] = challenger
  existing[opponentId] = opponent

  await setConfig('roshambo', existing)
  return true
}

class TimeoutError extends Error {}

const defaultHistory: Roshambo = {
  userId: '',
  rating: 1500,
  inGame: false,
  wins: 0,
  losses: 0,
  draws: 0
}
