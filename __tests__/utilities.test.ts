import { getWinners } from '../src/utilities';

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
