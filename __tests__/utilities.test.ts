import { extractWordFromSentence, getUpdatedScores, getWinners, wordCleaner } from '../src/utilities';

describe('getWinners', () => {
    it('should get the correct list of winners - 3 participants / 2 winners', async () => {
        const correctWord = 'BOSCO';

        const participantsWords = {
            U5ZDPV5S6: {
                word: 'BOSCO',
                sentAt: 1667944391,
            },
            U5QJXTGR1: {
                word: 'BOSCO',
                sentAt: 1667944392,
            },
            U5X56H0TG: {
                word: 'FORESTA',
                sentAt: 1667944393,
            },
        };

        const response = getWinners(correctWord, participantsWords);

        expect(response).toEqual(['U5ZDPV5S6', 'U5QJXTGR1']);
    });

    it('should get the correct list of winners - 3 participants / 3 winners', async () => {
        const correctWord = 'BOSCO';

        const participantsWords = {
            U5ZDPV5S6: {
                word: 'BOSCO',
                sentAt: 1667944391,
            },
            U5QJXTGR1: {
                word: 'BOSCO',
                sentAt: 1667944392,
            },
            U5X56H0TG: {
                word: 'BOSCO',
                sentAt: 1667944393,
            },
        };

        const response = getWinners(correctWord, participantsWords);

        expect(response).toEqual(['U5ZDPV5S6', 'U5QJXTGR1', 'U5X56H0TG']);
    });

    it('should get the correct list of winners - 2 participants / no winners', async () => {
        const correctWord = 'BOSCO';

        const participantsWords = {
            U5ZDPV5S6: {
                word: 'ALBERO',
                sentAt: 1667944391,
            },
            U5QJXTGR1: {
                word: 'ALBERO',
                sentAt: 1667944392,
            },
        };

        const response = getWinners(correctWord, participantsWords);

        expect(response).toEqual([]);
    });
});

describe('getUpdatedScores', () => {
    it('should update the scores correctly - 3 participants / 2 winners', async () => {
        const winners = ['U5ZDPV5S6', 'U5QJXTGR1'];

        const participantsWords = {
            U5ZDPV5S6: {
                word: 'BOSCO',
                sentAt: 1667944392,
            },
            U5QJXTGR1: {
                word: 'BOSCO',
                sentAt: 1667944391,
            },
            U5X56H0TG: {
                word: 'FORESTA',
                sentAt: 1667944393,
            },
        };

        const sessionScores = {
            results: [
                {
                    user: 'U5ZDPV5S6',
                    score: 1,
                },
                {
                    user: 'U5QJXTGR1',
                    score: 2,
                },
                {
                    user: 'U5X56H0TG',
                    score: 3,
                },
                {
                    user: 'U5Q1D5LE4',
                    score: 0,
                },
            ],
        };

        const response = getUpdatedScores(participantsWords, winners, sessionScores);

        expect(response).toEqual([
            {
                user: 'U5ZDPV5S6',
                score: 2,
            },
            {
                user: 'U5QJXTGR1',
                score: 4,
            },
            {
                user: 'U5X56H0TG',
                score: 3,
            },
            {
                user: 'U5Q1D5LE4',
                score: 0,
            },
        ]);
    });

    it('should update the scores correctly - 3 participants / 3 winners', async () => {
        const winners = ['U5ZDPV5S6', 'U5QJXTGR1', 'U5X56H0TG'];

        const participantsWords = {
            U5ZDPV5S6: {
                word: 'BOSCO',
                sentAt: 1667944392,
            },
            U5QJXTGR1: {
                word: 'BOSCO',
                sentAt: 1667944391,
            },
            U5X56H0TG: {
                word: 'BOSCO',
                sentAt: 1667944393,
            },
        };

        const sessionScores = {
            results: [
                {
                    user: 'U5ZDPV5S6',
                    score: 1,
                },
                {
                    user: 'U5QJXTGR1',
                    score: 2,
                },
                {
                    user: 'U5X56H0TG',
                    score: 3,
                },
                {
                    user: 'U5Q1D5LE4',
                    score: 0,
                },
            ],
        };

        const response = getUpdatedScores(participantsWords, winners, sessionScores);

        expect(response).toEqual([
            {
                user: 'U5ZDPV5S6',
                score: 2,
            },
            {
                user: 'U5QJXTGR1',
                score: 3,
            },
            {
                user: 'U5X56H0TG',
                score: 4,
            },
            {
                user: 'U5Q1D5LE4',
                score: 0,
            },
        ]);
    });

    it('should update the scores correctly - 3 participants / no winners', async () => {
        const winners = [];

        const participantsWords = {
            U5ZDPV5S6: {
                word: 'BOSCO',
                sentAt: 1667944392,
            },
            U5QJXTGR1: {
                word: 'BOSCO',
                sentAt: 1667944391,
            },
            U5X56H0TG: {
                word: 'BOSCO',
                sentAt: 1667944393,
            },
        };

        const sessionScores = {
            results: [
                {
                    user: 'U5ZDPV5S6',
                    score: 1,
                },
                {
                    user: 'U5QJXTGR1',
                    score: 2,
                },
                {
                    user: 'U5X56H0TG',
                    score: 3,
                },
                {
                    user: 'U5Q1D5LE4',
                    score: 0,
                },
            ],
        };

        const response = getUpdatedScores(participantsWords, winners, sessionScores);

        expect(response).toEqual([
            {
                user: 'U5ZDPV5S6',
                score: 1,
            },
            {
                user: 'U5QJXTGR1',
                score: 2,
            },
            {
                user: 'U5X56H0TG',
                score: 3,
            },
            {
                user: 'U5Q1D5LE4',
                score: 0,
            },
        ]);
    });
});

describe('extractWordFromSentence', () => {
    it('should get only the relevant word from the sentence', async () => {
        const sentence = 'era BOSCO';
        const response = extractWordFromSentence(sentence);

        expect(response).toEqual('BOSCO');
    });

    it('should get only the relevant word from the sentence - extra space', async () => {
        const sentence = 'era BOSCO ';
        const response = extractWordFromSentence(sentence);

        expect(response).toEqual('BOSCO');
    });
});

describe('wordCleaner', () => {
    it('should remove a trailing space at the end of the word', async () => {
        const word = 'SERA ';
        const response = wordCleaner(word);

        expect(response).toEqual('SERA');
    });

    it('should remove a leading space at the beginning of the word', async () => {
        const word = ' SERA';
        const response = wordCleaner(word);

        expect(response).toEqual('SERA');
    });

    it('should remove multiple spaces at the end of the word', async () => {
        const word = 'SERA  ';
        const response = wordCleaner(word);

        expect(response).toEqual('SERA');
    });

    it('should remove multiple spaces at the beginning of the word', async () => {
        const word = '  SERA';
        const response = wordCleaner(word);

        expect(response).toEqual('SERA');
    });
});
