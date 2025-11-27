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




    // Distribution Logic - now using questionDifficulties and questionUnits arrays
    // For OR pattern: arrays have 2 entries per question (pairs)
    // For normal: arrays have 1 entry per question
    const requirements = config.questionDifficulties.slice(0, config.isOrPattern ? config.questionCount * 2 : config.questionCount);
    const units = config.questionUnits.slice(0, config.isOrPattern ? config.questionCount * 2 : config.questionCount);

    // Ensure we have exactly the right number of requirements
    const targetLength = config.isOrPattern ? config.questionCount * 2 : config.questionCount;
    while (requirements.length < targetLength) {
        requirements.push('Average');
    }
    while (units.length < targetLength) {
        units.push(1);
    }


    let requirementIndex = 0;
    for (let i = 0; i < config.questionCount; i++) {
        if (config.isOrPattern) {
            // OR Pattern: Need 2 questions from SAME unit with the specified difficulties
            const difficulty1 = requirements[requirementIndex] || 'Average';
            const difficulty2 = requirements[requirementIndex + 1] || 'Average';
            const targetUnit = units[requirementIndex] || 1; // Both should be from this unit
            requirementIndex += 2;

            // Find 2 questions from the target unit
            let q1 = findQuestion(difficulty1, targetUnit, usedQuestionIds);
            let q2 = findQuestion(difficulty2, targetUnit, new Set(q1 ? [q1.id] : []));

            // Fallback: Relax difficulty if strict match fails
            if (!q1) q1 = findQuestion(null, targetUnit, usedQuestionIds);
            if (q1 && !q2) q2 = findQuestion(null, targetUnit, new Set([q1.id]));

            // Further fallback: Try any unit if target unit doesn't have 2 questions
            if (!q1 || !q2) {
                for (let u = 1; u <= 5; u++) {
                    if (u === targetUnit) continue;
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
                console.warn(`Not enough questions for OR pattern (Target Unit: ${targetUnit})`);
            }

        } else {
            // Normal Pattern: Use specified unit and difficulty
            const difficulty = requirements[requirementIndex] || 'Average';
            const targetUnit = units[requirementIndex] || 1;
            requirementIndex++;

            // Try to find question from target unit with target difficulty
            let q = findQuestion(difficulty, targetUnit, usedQuestionIds);

            // Fallback 1: Target unit, any difficulty
            if (!q) q = findQuestion(null, targetUnit, usedQuestionIds);

            // Fallback 2: Any unit, target difficulty
            if (!q) q = findQuestion(difficulty, undefined, usedQuestionIds);

            // Fallback 3: Any question
            if (!q) q = findQuestion(null, undefined, usedQuestionIds);

            if (q) {
                selected.push(q);
                usedQuestionIds.add(q.id);
            }
        }
    }


    return selected;
};
