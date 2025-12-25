import { APP_TOKEN, PORT, SIGNING_SECRET, TOKEN, SCORES_API, DEBUG_MODE } from './config';
import { TParticipantsWords, TSessionScores } from './types';
import fetch from 'node-fetch';
import {
    constructHallOfFame,
    constructResponse,
    constructScores,
    extractWordFromSentence,
    getFriendlyNameFromId,
    getPointsScenario,
    getUpdatedScores,
    getWinners,
    isOnlyOnePlayer,
    removeMentionFromString,
    saySomething,
    wordCleaner,
} from './utilities';
const { App } = require('@slack/bolt');
const axios = require('axios');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;

const express = require('express');
const expressApp = express();

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

const updateScores = async (winners): Promise<boolean> => {
    sessionScores = {
        results: getUpdatedScores(participantsWords, winners, sessionScores),
    };

    try {
        const response = await fetch(SCORES_API, {
            method: 'POST',
            body: JSON.stringify(sessionScores),
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });

        // TODO: we probably want to be more precise with error management here (in case failure is on API side)

        logger.log({
            level: 'info',
            message: `API update successful`,
        });

        return true;
    } catch (error) {
        logger.log({
            level: 'error',
            message: `Error during API update: ${error}`,
        });
    }
};

app.event('message', async ({ event, say, client }) => {
    if (event && event.text) {
        const triggerWord = wordCleaner(event.text);

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
    } else {
        console.error('Invalid message event:', event);
    }
});

app.event('app_mention', async ({ event, say }) => {
    if (event && event.text) {
        logger.log({
            level: 'info',
            message: `Bot was mentioned. Here is the full mention: "${event.text}"`,
        });

        const triggerWord = wordCleaner(removeMentionFromString(event.text));

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
                        message: `Game was started - Session scores: ${JSON.stringify(sessionScores)}`,
                    });
                } else {
                    saySomething(say, 'Il gioco è già stato avviato');
                }
                break;

            case 'stop!':
                if (isGameRunning) {
                    const allWords = constructResponse(participantsWords);

                    saySomething(say, `Il gioco è chiuso. Ecco le parole:\n${allWords}`);
                    isGameRunning = false;
                    isWaitingForWord = true;

                    logger.log({
                        level: 'info',
                        message: `Game was stopped - Words: ${JSON.stringify(participantsWords)}`,
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
                    saySomething(say, `Ecco la classifica:\n${readableScores}`);

                    logger.log({
                        level: 'info',
                        message: `${event.user} asked for scores. Current scores: ${JSON.stringify(sessionScores)}`,
                    });
                }

                break;

            case "albo d'oro!":
                if (!SCORES_API) {
                    saySomething(say, 'Questa funzionalità non è supportata.');
                } else {
                    logger.log({
                        level: 'info',
                        message: `${event.user} asked for hall of fame. Fetching it from endpoint`,
                    });

                    let hallOfFame = null;

                    axios
                        .get(`${SCORES_API}/hall-of-fame`)
                        .then((resp) => {
                            hallOfFame = resp.data;

                            const readableHallOfFame = hallOfFame ? constructHallOfFame(hallOfFame) : '';

                            if (readableHallOfFame) {
                                saySomething(say, `Ecco l'albo d'oro:\n${readableHallOfFame}`);

                                logger.log({
                                    level: 'info',
                                    message: `Hall of fame was shown in the channel. Records: ${JSON.stringify(
                                        hallOfFame,
                                    )}`,
                                });

                                return;
                            }

                            logger.log({
                                level: 'info',
                                message: `Hall of fame was not shown in the channel because it was empty`,
                            });
                        })
                        .catch((error) => {
                            logger.log({
                                level: 'info',
                                message: `Fetching of hall of fame failed. ${error}`,
                            });

                            return;
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
                    message: `Received final word: ${finalWord} - Winners: ${JSON.stringify(winners)} `,
                });

                const pointsScenario = getPointsScenario(winners, participantsWords);

                // the only scenario where we don't update the scores is when there are no winners
                // and more than one participant (nobody guessed the word)
                if (pointsScenario === 'no-points') {
                    saySomething(say, `La parola era ${finalWord}. Non ci sono stati vincitori.`);

                    return;
                }

                const updateScoresAction = await updateScores(winners);

                if (updateScoresAction) {
                    logger.log({
                        level: 'info',
                        message: `Session scores after update: ${JSON.stringify(sessionScores)}`,
                    });

                    const readableChart = constructScores(sessionScores);

                    if (pointsScenario === 'participation-points') {
                        saySomething(
                            say,
                            `La parola era ${finalWord}. Non ci sono stati vincitori, ma verrà assegnato un quarto di punto di partecipazione. Ecco la classifica aggiornata:\n${readableChart}`,
                        );

                        return;
                    }

                    saySomething(say, `La parola era ${finalWord}. Ecco la classifica aggiornata:\n${readableChart}`);
                }
            }
        }
    } else {
        console.error('Invalid app_mention event:', event);
    }
});

app.start(PORT);

expressApp.listen(PORT, () => {
    console.log(`Flaviobot is running on port ${PORT}`);
});

if (SCORES_API) {
    logger.log({
        level: 'info',
        message: 'Fetching scores from the API',
    });

    axios.get(SCORES_API).then((resp) => {
        sessionScores = resp.data;
    });
}

// Exposing the service for healthcheck
expressApp.get('/', (req, res) => {
    res.send('Flaviobot is running');
});
