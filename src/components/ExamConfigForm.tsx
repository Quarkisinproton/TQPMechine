import React, { useState } from 'react';
import { Plus, Trash2, Settings } from 'lucide-react';
import { ExamConfig, SectionConfig } from '../types';

interface ExamConfigFormProps {
    onGenerate: (config: ExamConfig) => void;
}

export const ExamConfigForm: React.FC<ExamConfigFormProps> = ({ onGenerate }) => {
    const [time, setTime] = useState(180);
    const [totalMarks, setTotalMarks] = useState(70);
    const [sections, setSections] = useState<SectionConfig[]>([
        {
            id: '1',
            name: 'Section A',
            questionCount: 5,
            marksPerQuestion: 4,
            type: 'Short',
            difficultyDistribution: { Easy: 2, Average: 2, Tough: 1 },
            isOrPattern: false,
        },
        {
            id: '2',
            name: 'Section B',
            questionCount: 5,
            marksPerQuestion: 10,
            type: 'Long',
            difficultyDistribution: { Easy: 1, Average: 3, Tough: 1 },
            isOrPattern: true,
        }
    ]);

    const addSection = () => {
        setSections([
            ...sections,
            {
                id: Date.now().toString(),
                name: `Section ${String.fromCharCode(65 + sections.length)}`,
                questionCount: 5,
                marksPerQuestion: 10,
                type: 'Long',
                difficultyDistribution: { Easy: 1, Average: 3, Tough: 1 },
                isOrPattern: false,
            }
        ]);
    };

    const updateSection = (id: string, field: keyof SectionConfig, value: any) => {
        setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const updateDistribution = (id: string, type: 'Easy' | 'Average' | 'Tough', value: number) => {
        setSections(sections.map(s =>
            s.id === id ? { ...s, difficultyDistribution: { ...s.difficultyDistribution, [type]: value } } : s
        ));
    };

    const removeSection = (id: string) => {
        setSections(sections.filter(s => s.id !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate({ time, totalMarks, sections });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
            {/* Global Settings */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <Settings className="text-gray-400" size={20} />
                    <h3 className="text-lg font-medium text-gray-900">Exam Details</h3>
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

                {sections.map((section, index) => (
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Num Questions</label>
                                <input
                                    type="number"
                                    value={section.questionCount}
                                    onChange={(e) => updateSection(section.id, 'questionCount', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                                        onChange={(e) => updateSection(section.id, 'isOrPattern', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Enable "OR" Pattern</span>
                                </label>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Difficulty Distribution</span>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Easy</label>
                                    <input
                                        type="number"
                                        value={section.difficultyDistribution.Easy}
                                        onChange={(e) => updateDistribution(section.id, 'Easy', Number(e.target.value))}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Average</label>
                                    <input
                                        type="number"
                                        value={section.difficultyDistribution.Average}
                                        onChange={(e) => updateDistribution(section.id, 'Average', Number(e.target.value))}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Tough</label>
                                    <input
                                        type="number"
                                        value={section.difficultyDistribution.Tough}
                                        onChange={(e) => updateDistribution(section.id, 'Tough', Number(e.target.value))}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                    />
                                </div>
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
