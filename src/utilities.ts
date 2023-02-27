const _ = require('lodash');

import { TParticipantsWords, TSessionScores, TSingleScore } from './types';

// I don't want to make an extra API call for this, so I will store the known
// players nicknames here
const KNOWN_USERS = new Map([
    ['U5ZDPV5S6', 'Kose'],
    ['U5QJXTGR1', 'Guybrush'],
    ['U5X56H0TG', 'Stefano'],
    ['U5Q1D5LE4', 'Manu'],
]);

export const getFriendlyNameFromId = (id: string): string => {
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
    const winnersArr = [] as string[];

    for (const [key, value] of Object.entries(participantsWords)) {
        if (value.word.toLowerCase() === correctWord.toLowerCase()) {
            winnersArr.push(key);
        }
    }

    return winnersArr;
};

export const getUpdatedScores = (
    participantsWords: TParticipantsWords,
    winners: string[],
    sessionScores: TSessionScores,
): TSingleScore[] => {
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

    const updatedScores = [] as TSingleScore[];

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

    return updatedScores;
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

export const extractWordFromSentence = (sentence: string): string => {
    const relevantWordRegex = /(?<=\bera\s)([A-zÀ-ÿ]+)/;
    return sentence.match(relevantWordRegex)[0];
};

export const wordCleaner = (word: string): string => {
    return word.trim();
};

export const shouldAssignThePoints = (participantsWords: TParticipantsWords): boolean => {
    return !(Object.keys(participantsWords).length === 1);
};
