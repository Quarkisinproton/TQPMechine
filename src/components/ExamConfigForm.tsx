import React, { useState } from 'react';
import { Plus, Trash2, Settings } from 'lucide-react';
import type { ExamConfig, SectionConfig } from '../types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const modules = {
    toolbar: [
        [{ 'header': [1, 2, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'align': [] }],
        ['clean']
    ],
};


interface ExamConfigFormProps {
    onGenerate: (config: ExamConfig) => void;
}

export const ExamConfigForm: React.FC<ExamConfigFormProps> = ({ onGenerate }) => {
    const [time, setTime] = useState(180);
    const [totalMarks, setTotalMarks] = useState(70);
    const [headerText, setHeaderText] = useState('EXAM PAPER');
    const [sections, setSections] = useState<SectionConfig[]>([
        {
            id: '1',
            name: 'Section A',
            sectionInstruction: 'Answer all questions. Each carries 4 Marks.',
            questionCount: 5,
            marksPerQuestion: 4,
            type: 'Short',
            questionDifficulties: ['Easy', 'Easy', 'Average', 'Average', 'Tough'],
            questionUnits: [1, 2, 3, 4, 5], // Rotate through units
            isOrPattern: false,
        },
        {
            id: '2',
            name: 'Section B',
            sectionInstruction: 'Answer 5 questions. Each carries 10 Marks.',
            questionCount: 5,
            marksPerQuestion: 10,
            type: 'Long',
            questionDifficulties: ['Easy', 'Average', 'Average', 'Average', 'Average', 'Tough', 'Tough', 'Average', 'Average', 'Tough'], // 10 for 5 OR questions
            questionUnits: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5], // Pairs from same unit for OR
            isOrPattern: true,
        }
    ]);

    const addSection = () => {
        setSections([
            ...sections,
            {
                id: Date.now().toString(),
                name: `Section ${String.fromCharCode(65 + sections.length)}`,
                sectionInstruction: 'Answer all questions.',
                questionCount: 5,
                marksPerQuestion: 10,
                type: 'Long',
                questionDifficulties: ['Average', 'Average', 'Average', 'Average', 'Average'],
                questionUnits: [1, 2, 3, 4, 5],
                isOrPattern: false,
            }
        ]);
    };

    const updateSection = (id: string, field: keyof SectionConfig, value: any) => {
        setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
    };


    const updateQuestionCount = (id: string, count: number) => {
        setSections(sections.map(s => {
            if (s.id !== id) return s;

            // For OR pattern, we need 2 entries per question (Option A and Option B)
            const targetLength = s.isOrPattern ? count * 2 : count;

            // Update difficulties array
            const newDifficulties = [...s.questionDifficulties];
            if (targetLength > newDifficulties.length) {
                while (newDifficulties.length < targetLength) {
                    newDifficulties.push('Average');
                }
            } else {
                newDifficulties.length = targetLength;
            }

            // Update units array
            const newUnits = [...s.questionUnits];
            if (targetLength > newUnits.length) {
                // Add more units, rotating through 1-5
                let nextUnit = newUnits.length > 0 ? ((newUnits[newUnits.length - 1] % 5) + 1) : 1;
                while (newUnits.length < targetLength) {
                    newUnits.push(nextUnit);
                    if (s.isOrPattern && newUnits.length < targetLength) { // Ensure we don't exceed targetLength
                        // For OR pattern, pairs should have the same unit
                        newUnits.push(nextUnit);
                    }
                    nextUnit = (nextUnit % 5) + 1;
                }
                newUnits.length = targetLength; // Trim if we added too many
            } else {
                newUnits.length = targetLength;
            }

            return { ...s, questionCount: count, questionDifficulties: newDifficulties, questionUnits: newUnits };
        }));
    };

    const updateQuestionDifficulty = (sectionId: string, questionIndex: number, difficulty: 'Easy' | 'Average' | 'Tough') => {
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            const newDifficulties = [...s.questionDifficulties];
            newDifficulties[questionIndex] = difficulty;
            return { ...s, questionDifficulties: newDifficulties };
        }));
    };

    const updateQuestionUnit = (sectionId: string, questionIndex: number, unit: number) => {
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            const newUnits = [...s.questionUnits];
            newUnits[questionIndex] = unit;

            // For OR pattern, both options in a pair should have the same unit
            if (s.isOrPattern && questionIndex % 2 === 0) {
                newUnits[questionIndex + 1] = unit; // Update Option B to match Option A
            } else if (s.isOrPattern && questionIndex % 2 === 1) {
                newUnits[questionIndex - 1] = unit; // Update Option A to match Option B
            }

            return { ...s, questionUnits: newUnits };
        }));
    };

    const toggleOrPattern = (id: string, enabled: boolean) => {
        setSections(sections.map(s => {
            if (s.id !== id) return s;

            // Calculate the target array size
            const targetLength = enabled ? s.questionCount * 2 : s.questionCount;

            let newDifficulties = [...s.questionDifficulties];
            let newUnits = [...s.questionUnits];

            if (enabled && newDifficulties.length === s.questionCount) {
                // Switching from normal to OR: double the arrays by duplicating each entry
                newDifficulties = newDifficulties.flatMap(d => [d, d]);
                newUnits = newUnits.flatMap(u => [u, u]); // Same unit for both options in OR pair
            } else if (!enabled && newDifficulties.length === s.questionCount * 2) {
                // Switching from OR to normal: take every other entry
                newDifficulties = newDifficulties.filter((_, idx) => idx % 2 === 0);
                newUnits = newUnits.filter((_, idx) => idx % 2 === 0);
            }

            // Ensure correct length
            while (newDifficulties.length < targetLength) {
                newDifficulties.push('Average');
            }
            while (newUnits.length < targetLength) {
                newUnits.push(1);
            }
            newDifficulties.length = targetLength;
            newUnits.length = targetLength;

            return { ...s, isOrPattern: enabled, questionDifficulties: newDifficulties, questionUnits: newUnits };
        }));
    };

    const removeSection = (id: string) => {
        setSections(sections.filter(s => s.id !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate({ time, totalMarks, headerText, sections });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
            {/* Global Settings */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <Settings className="text-gray-400" size={20} />
                    <h3 className="text-lg font-medium text-gray-900">Exam Details</h3>
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Header Text</label>
                    <ReactQuill
                        theme="snow"
                        value={headerText}
                        onChange={setHeaderText}
                        modules={modules}
                        className="bg-white"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Time (Minutes)</label>
                        <input
                            type="number"
                            value={time}
                            onChange={(e) => setTime(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                        <input
                            type="number"
                            value={totalMarks}
                            onChange={(e) => setTotalMarks(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Sections</h3>
                    <button
                        type="button"
                        onClick={addSection}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                    >
                        <Plus size={16} /> Add Section
                    </button>
                </div>

                {sections.map((section) => (
                    <div key={section.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative group">
                        <button
                            type="button"
                            onClick={() => removeSection(section.id)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={18} />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Section Name</label>
                                <input
                                    type="text"
                                    value={section.name}
                                    onChange={(e) => updateSection(section.id, 'name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                                <select
                                    value={section.type}
                                    onChange={(e) => updateSection(section.id, 'type', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="Short">Short Answer</option>
                                    <option value="Long">Long Answer</option>
                                    <option value="Mixed">Mixed</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Section Instruction</label>
                            <textarea
                                value={section.sectionInstruction}
                                onChange={(e) => updateSection(section.id, 'sectionInstruction', e.target.value)}
                                placeholder="Answer all questions. Each carries X Marks."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Num Questions</label>
                                <input
                                    type="number"
                                    value={section.questionCount}
                                    onChange={(e) => updateQuestionCount(section.id, Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    min="1"
                                    max="20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Marks per Q</label>
                                <input
                                    type="number"
                                    value={section.marksPerQuestion}
                                    onChange={(e) => updateSection(section.id, 'marksPerQuestion', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div className="flex items-center pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={section.isOrPattern}
                                        onChange={(e) => toggleOrPattern(section.id, e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Enable "OR" Pattern</span>
                                </label>
                            </div>
                        </div>

                        {/* Individual Question Difficulty & Unit Selectors */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Question Configuration {section.isOrPattern && "(Option A & B for each)"}
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {section.isOrPattern ? (
                                    // OR Pattern: Show pairs (Option A and Option B for each question)
                                    Array.from({ length: section.questionCount }).map((_, qIdx) => (
                                        <div key={qIdx} className="bg-white p-3 rounded border border-gray-200">
                                            <label className="block text-xs font-medium text-gray-600 mb-2">
                                                Question {qIdx + 1} <span className="text-[10px] text-gray-400">(Unit {section.questionUnits[qIdx * 2] || 1})</span>
                                            </label>
                                            <div className="space-y-2">
                                                <div>
                                                    <label className="block text-[10px] text-gray-500 mb-1">Unit (both options)</label>
                                                    <select
                                                        value={section.questionUnits[qIdx * 2] || 1}
                                                        onChange={(e) => updateQuestionUnit(section.id, qIdx * 2, Number(e.target.value))}
                                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                                    >
                                                        <option value={1}>Unit 1</option>
                                                        <option value={2}>Unit 2</option>
                                                        <option value={3}>Unit 3</option>
                                                        <option value={4}>Unit 4</option>
                                                        <option value={5}>Unit 5</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-gray-500 mb-1">Option A Difficulty</label>
                                                    <select
                                                        value={section.questionDifficulties[qIdx * 2] || 'Average'}
                                                        onChange={(e) => updateQuestionDifficulty(section.id, qIdx * 2, e.target.value as 'Easy' | 'Average' | 'Tough')}
                                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                                    >
                                                        <option value="Easy">Easy</option>
                                                        <option value="Average">Average</option>
                                                        <option value="Tough">Tough</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-gray-500 mb-1">Option B Difficulty</label>
                                                    <select
                                                        value={section.questionDifficulties[qIdx * 2 + 1] || 'Average'}
                                                        onChange={(e) => updateQuestionDifficulty(section.id, qIdx * 2 + 1, e.target.value as 'Easy' | 'Average' | 'Tough')}
                                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                                    >
                                                        <option value="Easy">Easy</option>
                                                        <option value="Average">Average</option>
                                                        <option value="Tough">Tough</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    // Normal Pattern: One difficulty and unit per question
                                    section.questionDifficulties.map((difficulty, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                                            <label className="block text-xs font-medium text-gray-600 mb-2">
                                                Question {idx + 1}
                                            </label>
                                            <div className="space-y-2">
                                                <div>
                                                    <label className="block text-[10px] text-gray-500 mb-1">Unit</label>
                                                    <select
                                                        value={section.questionUnits[idx] || 1}
                                                        onChange={(e) => updateQuestionUnit(section.id, idx, Number(e.target.value))}
                                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                                    >
                                                        <option value={1}>Unit 1</option>
                                                        <option value={2}>Unit 2</option>
                                                        <option value={3}>Unit 3</option>
                                                        <option value={4}>Unit 4</option>
                                                        <option value={5}>Unit 5</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-gray-500 mb-1">Difficulty</label>
                                                    <select
                                                        value={difficulty}
                                                        onChange={(e) => updateQuestionDifficulty(section.id, idx, e.target.value as 'Easy' | 'Average' | 'Tough')}
                                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                                    >
                                                        <option value="Easy">Easy</option>
                                                        <option value="Average">Average</option>
                                                        <option value="Tough">Tough</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end pt-6">
                <button
                    type="submit"
                    className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all"
                >
                    Generate Exam Paper
                </button>
            </div>
        </form>
    );
};
