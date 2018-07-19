# Roshambot
> Very serious argument resolution

![Roshambo Example](https://github.com/1000team/roshambo/raw/master/example.png "Roshambo Example")

## Getting Started

In Slack:
- Create a new Custom Integration -> Bot configuration
- Record the API Token and the username you configured
- Invite the bot to a channel in Slack

## Docker Image
```sh
> docker run -dt --env SLACK_TOKEN={API TOKEN} --name=roshambo --restart=always seikho/roshambo:latest
```

## Building from Source
```sh
> git clone https://github.com/1000team/roshambo && cd roshambo

# From the command line:
> yarn
> yarn build
> yarn bundle
> SLACK_TOKEN={API TOKEN} yarn start

# Using Docker:
> docker build -t roshambo:latest .
> docker run -dt --env SLACK_TOKEN={API TOKEN} --name roshambo --restart=always roshambo:latest
```


To get started with the bot in Slack:
- Message the bot directly with `@username help`
- Or in any channel the bot is in: `@username help`

## License

MIT
