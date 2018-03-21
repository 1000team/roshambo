import * as express from 'express'
import * as path from 'path'
import { getLeaders } from '../commands/leaders'
import { getBot } from 'slacklib'

export { app as default }

const api: express.RequestHandler = async (req, res) => {
  const bot = await getBot()
  const leaders = {
    classic: getLeaders(bot, 'classic'),
    ls: getLeaders(bot, 'ls')
  }
  res.json(leaders)
}

const app = express()

app.use('/api', api)
app.use(express.static(path.resolve(__dirname, '..', 'front')))
