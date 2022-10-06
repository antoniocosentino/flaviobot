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

const constructResponse = (participantsWords: TParticipantsWords) => {
    let finalResponse = '';

    for (const [key, value] of Object.entries(participantsWords)) {
        const friendly_name = getFriendlyNameFromId(key);

        finalResponse = finalResponse + `• *${friendly_name}*: ${value.word} \n`;
    }

    return finalResponse;
};

const constructChart = (sessionScores: TSessionScores) => {
    const sorted = _.orderBy(sessionScores.results, 'score', 'desc');
    let finalResponse = '';

    sorted.forEach((singleResult) => {
        finalResponse = finalResponse + `• *${getFriendlyNameFromId(singleResult.user)}*: ${singleResult.score} \n`;
    });

    return finalResponse;
};

const getWinners = (correctWord: string, participantsWords: TParticipantsWords) => {
    const winnersArr = [];

    for (const [key, value] of Object.entries(participantsWords)) {
        if (value.word.toLowerCase() === correctWord.toLowerCase()) {
            winnersArr.push(key);
        }
    }

    return winnersArr;
};
