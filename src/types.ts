export type TParticipantsWords = {
    [key: string]: {
        word: string;
        sentAt: number;
    };
};

export type TSessionScores = {
    results: TSingleScore[];
};

export type TSingleScore = {
    user: string;
    score: number;
};

export type THallOfFame = {
    'hall-of-fame': TSingleHallOfFameEntry[];
};

export type TSingleHallOfFameEntry = {
    season: string;
    winner: string;
};

export type TPointsScenario = 'points' | 'no-points' | 'participation-points';
