import { APP_TOKEN, PORT, SIGNING_SECRET, TOKEN } from './config';

const { App } = require('@slack/bolt');

const app = new App({
    token: TOKEN,
    signingSecret: SIGNING_SECRET,
    socketMode: true,
    appToken: APP_TOKEN,
});

//////
// All the live variables are stored here
//////

// do I have the scores in the session?
let sessionScores = null;

// is the game running?
let isGameRunning = false;

// when the game is closed, the bot expects to know what the word was. This will be used for the scores management.
let isWaitingForWord = false;

// the channel where the "start" command was launched is the
// channel where the game is happening
let channelId = undefined;

// storing the words
let participantsWords = {};

// Useful information for development
// relevant info is all part of "event"
// - user
// - text
// - channel

app.event('message', async ({ event, say }) => {
    try {
        await say('you wrote me something on a direct message');
    } catch (error) {
        console.error(error);
    }
});

app.event('app_mention', async ({ event, say }) => {
    try {
        await say("i've been mentioned");
    } catch (error) {
        console.error(error);
    }
});

app.start(PORT);
