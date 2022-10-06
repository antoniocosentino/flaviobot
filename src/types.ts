export type TParticipantsWords = {
    [key: string]: {
        word: string;
        sentAt: number;
    };
};

export type TSessionScores = {
    results: TSingleScore[];
};

type TSingleScore = {
    user: string;
    score: number;
};
