import { getUpdatedScores, getWinners } from '../src/utilities';

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
});

describe('getUpdatedScores', () => {
    it('should update the scores correctly', async () => {
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
        ]);
    });
});
