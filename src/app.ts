import { APP_TOKEN, PORT, SIGNING_SECRET, TOKEN, SCORES_API, DEBUG_MODE } from './config';
import { TParticipantsWords, TSessionScores } from './types';
import {
    constructResponse,
    constructScores,
    extractWordFromSentence,
    getFriendlyNameFromId,
    getUpdatedScores,
    getWinners,
    removeMentionFromString,
    saySomething,
} from './utilities';
const { App } = require('@slack/bolt');
const axios = require('axios');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;

const app = new App({
    token: TOKEN,
    signingSecret: SIGNING_SECRET,
    socketMode: true,
    appToken: APP_TOKEN,
});

const logger = createLogger({
    level: 'info',
    format: combine(label({ label: 'flaviolog' }), timestamp(), prettyPrint()),
    transports: [new transports.Console()],
});

logger.silent = !DEBUG_MODE;

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

const updateScores = (winners): void => {
    sessionScores = {
        results: getUpdatedScores(participantsWords, winners, sessionScores),
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

app.event('message', async ({ event, say, client }) => {
    const triggerWord = event.text;

    if (isGameRunning) {
        participantsWords[event.user] = {
            word: triggerWord,
            sentAt: Math.floor(Date.now() / 1000),
        };
        saySomething(say, `Ok, ho memorizzato la tua parola: ${triggerWord}`);

        logger.log({
            level: 'info',
            message: `Received word from ${event.user}: ${triggerWord}`,
        });

        const friendly_name = getFriendlyNameFromId(event.user);

        try {
            await client.chat.postMessage({
                channel: channelId,
                text: `*${friendly_name}* ha scritto la sua parola`,
            });
        } catch (error) {
            console.error(error);
        }
    } else {
        saySomething(say, 'Non puoi inviarmi la parola se il gioco non è in corso');
    }
});

app.event('app_mention', async ({ event, say }) => {
    const triggerWord = removeMentionFromString(event.text);

    switch (triggerWord) {
        case 'vai!':
            if (!isGameRunning) {
                saySomething(say, 'Inizia il gioco. Attendo le vostre risposte in DM');
                isGameRunning = true;
                // resetting the words object
                participantsWords = {};
                channelId = event.channel;

                logger.log({
                    level: 'info',
                    message: 'Game was started',
                });
            } else {
                saySomething(say, 'Il gioco è già stato avviato');
            }
            break;

        case 'stop!':
            if (isGameRunning) {
                const allWords = constructResponse(participantsWords);

                saySomething(say, `Il gioco è chiuso. Ecco le parole: \n ${allWords}`);
                isGameRunning = false;
                isWaitingForWord = true;

                logger.log({
                    level: 'info',
                    message: 'Game was stopped',
                });
            } else {
                saySomething(say, 'Nessun gioco in corso');
            }
            break;

        case 'classifica!':
            if (!SCORES_API) {
                saySomething(say, 'Questa funzionalità non è supportata.');
            } else {
                const readableScores = constructScores(sessionScores);
                saySomething(say, `Ecco la classifica: \n ${readableScores}`);

                logger.log({
                    level: 'info',
                    message: `Asked for scores. Current scores: ${sessionScores}`,
                });
            }

            break;
    }

    // The switch only covered the exact matches
    // in the case where we communicate the correct word to the bot, we need to match a sentence pattern

    if (triggerWord.startsWith('era ')) {
        if (!isWaitingForWord) {
            saySomething(say, 'Non puoi comunicarmi la parola vincente in questa fase del gioco.');
        } else if (!SCORES_API) {
            saySomething(say, 'Questa funzionalità non è supportata.');
        } else {
            isWaitingForWord = false;

            const finalWord = extractWordFromSentence(triggerWord);

            const winners = getWinners(finalWord, participantsWords);

            logger.log({
                level: 'info',
                message: `Received final word: ${finalWord} - Winners: ${winners} `,
            });

            if (winners.length < 1) {
                saySomething(say, `La parola era ${finalWord}. Non ci sono stati vincitori.`);
            } else {
                updateScores(winners);
                const readableChart = constructScores(sessionScores);
                saySomething(say, `La parola era ${finalWord}. Ecco la classifica aggiornata: \n${readableChart}`);
            }
        }
    }
});

app.start(PORT);

if (SCORES_API) {
    axios.get(SCORES_API).then((resp) => {
        sessionScores = resp.data;
    });
}
