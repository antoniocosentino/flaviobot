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
