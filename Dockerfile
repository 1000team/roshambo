FROM mhart/alpine-node:8

LABEL description "Roshambot"

WORKDIR /code

ENV SLACK_TOKEN=""

VOLUME [ "/code/database" ]

COPY package.json /code
COPY yarn.lock /code
COPY tsconfig.json /code
COPY src /code/src

RUN yarn \
  && yarn build \
  && yarn --prod

CMD node src/index.js