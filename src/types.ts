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
    sectionInstruction: string; // Customizable instruction (e.g., "Answer 10 Questions. Each carries 2 Marks.")
    questionCount: number;
    marksPerQuestion: number;
    type: 'Short' | 'Long' | 'Mixed';
    questionDifficulties: ('Easy' | 'Average' | 'Tough')[]; // One per question (or 2 per question if OR pattern)
    questionUnits: number[]; // Unit (1-5) for each question (or 2 per question if OR pattern)
    isOrPattern: boolean; // For "Either/Or" sections
}

export interface ExamConfig {
    time: number; // in minutes
    totalMarks: number;
    headerText: string; // Customizable header (e.g., "EXAM PAPER")
    sections: SectionConfig[];
}

export interface ExamPaper {
    config: ExamConfig;
    sections: {
        config: SectionConfig;
        selectedQuestions: (Question | { or: [Question, Question] })[];
    }[];
}
