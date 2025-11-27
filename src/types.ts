export interface Question {
    id: number;
    questionNumber: number;
    type: 'Short' | 'Long';
    unit: number;
    co: string;
    blooms: string;
    text: string;
    complexity: 'Easy' | 'Average' | 'Tough';
}

export interface SectionConfig {
    id: string;
    name: string;
    questionCount: number;
    marksPerQuestion: number;
    type: 'Short' | 'Long' | 'Mixed';
    difficultyDistribution: {
        Easy: number;
        Average: number;
        Tough: number;
    };
    isOrPattern: boolean; // For "Either/Or" sections
}

export interface ExamConfig {
    time: number; // in minutes
    totalMarks: number;
    sections: SectionConfig[];
}

export interface ExamPaper {
    config: ExamConfig;
    sections: {
        config: SectionConfig;
        selectedQuestions: (Question | { or: [Question, Question] })[];
    }[];
}
