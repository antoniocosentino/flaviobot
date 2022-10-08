const _ = require('lodash');

import { TParticipantsWords, TSessionScores } from './types';

// I don't want to make an extra API call for this, so I will store the known
// players nicknames here
const KNOWN_USERS = new Map([
    ['U5ZDPV5S6', 'Kose'],
    ['U5QJXTGR1', 'Guybrush'],
    ['U5X56H0TG', 'Stefano'],
    ['U5Q1D5LE4', 'Manu'],
]);

const getFriendlyNameFromId = (id: string): string => {
    const friendly_name = KNOWN_USERS.get(id);

    if (friendly_name) {
        return friendly_name;
    }

    return id;
};

export const constructResponse = (participantsWords: TParticipantsWords): string => {
    let finalResponse = '';

    for (const [key, value] of Object.entries(participantsWords)) {
        const friendly_name = getFriendlyNameFromId(key);

        finalResponse = finalResponse + `• *${friendly_name}*: ${value.word} \n`;
    }

    return finalResponse;
};

export const constructScores = (sessionScores: TSessionScores): string => {
    const sorted = _.orderBy(sessionScores.results, 'score', 'desc');
    let finalResponse = '';

    sorted.forEach((singleResult) => {
        finalResponse = finalResponse + `• *${getFriendlyNameFromId(singleResult.user)}*: ${singleResult.score} \n`;
    });

    return finalResponse;
};

export const getWinners = (correctWord: string, participantsWords: TParticipantsWords): string[] => {
    const winnersArr = [];

    for (const [key, value] of Object.entries(participantsWords)) {
        if (value.word.toLowerCase() === correctWord.toLowerCase()) {
            winnersArr.push(key);
        }
    }

    return winnersArr;
};

export const saySomething = async (say: any, whatToSay: string): Promise<void> => {
    // NOTE: say is the method returned by bolt, which apparently is not typed
    // therefore I'm just going to use any for it
    try {
        await say(whatToSay);
    } catch (error) {
        console.error(error);
    }
};

export const removeMentionFromString = (text: string): string => {
    const indexOfSpace = text.indexOf(' ');

    return text.substring(indexOfSpace + 1);
};
