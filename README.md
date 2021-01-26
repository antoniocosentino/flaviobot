
# Flaviobot

Flaviobot is a bot that allows to play the popular Italian TV game "La Ghigliottina" with friends on Slack.

The goal is to be able to store all the participants' words and then reveal them all together when the game is over.

Flaviobot is currently WIP. A more detailed readme is coming soon.


#
## Setup
### Natively (Node.js)
Clone this repo, then run:

`npm install`

You also need to create two environmental variables:

`export BOTPORT=80` the port where you want to run the bot

`export TOKEN=xxx-xxx` this is the token you get from Slack

When this is done you can simply run it with:
`npm start`

#
### Docker
First create a file on root level called `variables.env`

Then put here the environmental variables, as explained previously.

Example:
```
TOKEN=xxx-xxx
BOTPORT=80
```

When this is done you can run it with Docker:

`docker-compose up --build`

#

That's it. Enjoy!
