import { APP_TOKEN, PORT, SIGNING_SECRET, TOKEN, SCORES_API } from './config';
import { TParticipantsWords, TSessionScores } from './types';
const { App } = require('@slack/bolt');
const axios = require('axios');

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
let sessionScores = null as TSessionScores;

// is the game running?
let isGameRunning = false;

// when the game is closed, the bot expects to know what the word was. This will be used for the scores management.
let isWaitingForWord = false;

// the channel where the "start" command was launched is the
// channel where the game is happening
let channelId = undefined as string;

// storing the words
let participantsWords = {} as TParticipantsWords;

// Useful information for development
// relevant info is all part of "event"
// - user
// - text
// - channel

const updateScores = (winners): void => {
    const numberOfPoints = Object.entries(participantsWords).length;

    const pointsPerWinner = Math.floor(numberOfPoints / winners.length);

    const extraPoint = numberOfPoints % winners.length;

    let fastestWinner = null;
    let previousWinnerTime = Math.floor(Date.now() / 1000); // setting this to now, since obviously answer cannot come from the future

    // in this case we need to assign this point to the person who answered first
    if (extraPoint > 0) {
        for (const [key, value] of Object.entries(participantsWords)) {
            // first of all check if this is a winner
            if (winners.includes(key)) {
                // now that we know that this is a winner, check if he was the fastest
                if (value.sentAt < previousWinnerTime) {
                    fastestWinner = key;
                    previousWinnerTime = value.sentAt;
                }
            }
        }
    }

    const updatedScores = [];

    sessionScores.results.forEach((singlePerson) => {
        // check if this person is a winner
        if (winners.includes(singlePerson.user)) {
            const additionalPoints = singlePerson.user === fastestWinner ? extraPoint : 0;

            updatedScores.push({
                user: singlePerson.user,
                score: singlePerson.score + pointsPerWinner + additionalPoints,
            });
        } else {
            updatedScores.push({
                user: singlePerson.user,
                score: singlePerson.score,
            });
        }
    });

    sessionScores = {
        results: updatedScores,
    };

    axios
        .post(SCORES_API, sessionScores)
        .then((res) => {
            console.log(`statusCode: ${res.status}`);
            console.log(res);
        })
        .catch((error) => {
            console.error(error);
        });
};

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
