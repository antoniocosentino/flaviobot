# Flaviobot

![Unit tests](https://github.com/antoniocosentino/flaviobot/actions/workflows/unit-tests.yml/badge.svg)

**Flaviobot** is a bot that allows you to play the popular Italian TV game ["La Ghigliottina"](<https://en.wikipedia.org/wiki/L%27eredit%C3%A0#%22La_Ghigliottina%22_(The_Guillotine,_round_7)>) with friends on Slack.

The goal is to be able to secretly store all the participants' words while the game is on and then reveal them all together when everybody has submitted a word. The bot is also able to store and update the players scoreboard.

![Flaviobot](avatar/flaviobot-logo.jpg)

The name Flaviobot is inspired by **Flavio Insinna**, the host of the TV show.

## How does it work?

> ℹ️ &nbsp; since the gameshow is in Italian, the bot "speaks" only Italian.

### Bot invitation

The bot needs to be invited in your channel. It can also be a private channel. Just invite it as you would do with a real person. It will automatically accept and join.

### Start of the game

When the TV game is starting you need to tell the bot to be ready to accept the words.
The command is:

```
@flaviobot vai!
```

![Activation](screenshots/activation.png)

### Sending a word to the bot

You can now direct message the bot and provide your word. It will be memorized, to be shared later. The bot will also inform (in the channel where he was activated) that a certain user has pr ovided a word (without revealing the word, of course)

_The word is sent in a direct message:_

![DM](screenshots/dm.png)

_The bot updates everybody in the channel:_

![Update](screenshots/update.png)

In case you change your mind you can still submit a new word, while the game is still open. The bot will remember only the last word provided.

### Closing the game / revealing the words

Once everybody has submitted a word the game can be closed.
The command is:

```
@flaviobot stop!
```

![Stopping](screenshots/stopping.png)

The bot closes the game and reveals all the words that were submitted.

### Announcing the correct word / updating the chart

Once the correct word is revealed in the TV show, it can be communicated to the bot. In this way the bot will update the chart in case there were winners.

```
@flaviobot era {WORD}
```

![Scores](screenshots/scores.png)

In case there are winners, the updated chart will be revealed. Otherwise the bot will just communicate that nobody guessed the right word.

![No Winners](screenshots/no-winners.png)

The scoreboard can be revealed at any time, by using this command:

```
@flaviobot classifica!
```

![Scores COMMAND](screenshots/scores-command.png)

#### How points are calculated

The amount of points each player receives is based on the amount of participants in that specific game session:

`n. of points = n. of players / n. of winners`

For example, if there are 2 players and both win, they get 1 point each.
If there are 3 players and only 1 player guesses the word, he gets 3 points while the others get 0.

#### Extra points

Since the score cannot contain decimals it might also happen that there are extra points to be assigned. For example, if there are 3 players but only 2 are guessing the word, each player should receive 1 point but then we have an extra point to assign. In this case the point will be assigned to the player who answered correctly first.

#### How can I use it?

The bot right now is not distributed via the Slack App Directory. This means that, if you want to use it, you have to host it yourself somewhere and then install it in your workspace. In case you are interested in using the bot feel free to [contact me](https://github.com/antoniocosentino/flaviobot/issues/new/choose). I might consider distributing it in the future if I see enough interest.
