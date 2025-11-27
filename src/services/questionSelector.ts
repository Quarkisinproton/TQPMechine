import type { Question, SectionConfig, ExamConfig, ExamPaper } from '../types';

export const generateExamPaper = (bank: Question[], config: ExamConfig): ExamPaper => {
    const paper: ExamPaper = {
        config,
        sections: [],
    };

    for (const sectionConfig of config.sections) {
        const selectedQuestions = selectQuestionsForSection(bank, sectionConfig);
        paper.sections.push({
            config: sectionConfig,
            selectedQuestions,
        });
    }

    return paper;
};

const selectQuestionsForSection = (
    bank: Question[],
    config: SectionConfig
): (Question | { or: [Question, Question] })[] => {
    // Filter bank by type if specified
    let candidates = bank.filter((q) => {
        if (config.type === 'Mixed') return true;
        return q.type === config.type;
    });

    const selected: (Question | { or: [Question, Question] })[] = [];
    const usedQuestionIds = new Set<number>();

    // Helper to find a question
    const findQuestion = (
        complexity: 'Easy' | 'Average' | 'Tough' | null, // null means any complexity
        unit?: number,
        excludeIds: Set<number> = new Set()
    ): Question | null => {
        // Shuffle candidates for randomness
        const shuffled = [...candidates].sort(() => 0.5 - Math.random());

        return shuffled.find((q) =>
            (complexity === null || q.complexity === complexity) &&
            (!unit || q.unit === unit) &&
            !usedQuestionIds.has(q.id) &&
            !excludeIds.has(q.id)
        ) || null;
    };

    // Distribution Logic
    let requirements: ('Easy' | 'Average' | 'Tough')[] = [];
    for (let i = 0; i < config.difficultyDistribution.Easy; i++) requirements.push('Easy');
    for (let i = 0; i < config.difficultyDistribution.Average; i++) requirements.push('Average');
    for (let i = 0; i < config.difficultyDistribution.Tough; i++) requirements.push('Tough');

    while (requirements.length < config.questionCount) {
        requirements.push('Average');
    }
    requirements = requirements.slice(0, config.questionCount);
    requirements.sort(() => 0.5 - Math.random());

    let currentUnit = 1;
    const maxUnit = 5;

    for (const difficulty of requirements) {
        if (config.isOrPattern) {
            // OR Pattern: Need 2 questions from SAME unit
            // 1. Try strict: Correct Unit, Correct Difficulty
            let q1 = findQuestion(difficulty, currentUnit, usedQuestionIds);
            let q2 = findQuestion(difficulty, currentUnit, new Set(q1 ? [q1.id] : []));

            // 2. Relax Difficulty: Correct Unit, Any Difficulty
            if (!q1) q1 = findQuestion(null, currentUnit, usedQuestionIds);
            if (q1 && !q2) q2 = findQuestion(null, currentUnit, new Set([q1.id]));

            // 3. Relax Unit: Any Unit (that has 2 questions), Any Difficulty
            if (!q1 || !q2) {
                // Try to find ANY unit that has 2 available questions
                for (let u = 1; u <= maxUnit; u++) {
                    if (u === currentUnit) continue; // Already tried
                    const backupQ1 = findQuestion(null, u, usedQuestionIds);
                    const backupQ2 = findQuestion(null, u, new Set(backupQ1 ? [backupQ1.id] : []));
                    if (backupQ1 && backupQ2) {
                        q1 = backupQ1;
                        q2 = backupQ2;
                        break;
                    }
                }
            }

            if (q1 && q2) {
                selected.push({ or: [q1, q2] });
                usedQuestionIds.add(q1.id);
                usedQuestionIds.add(q2.id);
            } else {
                console.warn(`Not enough questions for OR pattern (Target Unit: ${currentUnit})`);
            }

            currentUnit = (currentUnit % maxUnit) + 1;

        } else {
            // Normal Pattern
            // 1. Try strict: Correct Unit, Correct Difficulty
            let q = findQuestion(difficulty, currentUnit, usedQuestionIds);

            // 2. Relax Unit: Any Unit, Correct Difficulty
            if (!q) q = findQuestion(difficulty, undefined, usedQuestionIds);

            // 3. Relax Difficulty: Correct Unit, Any Difficulty
            if (!q) q = findQuestion(null, currentUnit, usedQuestionIds);

            // 4. Relax All: Any Question
            if (!q) q = findQuestion(null, undefined, usedQuestionIds);

            if (q) {
                selected.push(q);
                usedQuestionIds.add(q.id);
            }

            currentUnit = (currentUnit % maxUnit) + 1;
        }
    }

    return selected;
};
