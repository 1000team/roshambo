FROM mhart/alpine-node:8

LABEL description "Roshambot"

WORKDIR /code

ENV SLACK_TOKEN=""

VOLUME [ "/code/database" ]

COPY package.json /code
COPY yarn.lock /code
COPY tsconfig.json /code
COPY tsconfig.front.json /code
COPY src /code/src

EXPOSE 3000

RUN yarn \
  && yarn build \
  && yarn bundle

CMD node build/index.js