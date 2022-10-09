FROM node:16.13.0

EXPOSE 3000

WORKDIR /opt/flaviobot

COPY ./package.json ./yarn.lock /opt/flaviobot/

RUN yarn

COPY tsconfig.json /opt/flaviobot/
COPY src /opt/flaviobot/src

RUN yarn build

CMD [ "yarn", "start" ]
