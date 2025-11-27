import * as XLSX from 'xlsx';
import { Question } from '../types';

export const parseExcel = async (file: File): Promise<Question[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                const questions: Question[] = jsonData.map((row: any, index: number) => {
                    // Map Excel columns to our interface
                    // Adjust column names based on the user's description or file inspection if possible.
                    // Based on user request:
                    // Question Number, Question Type, Unit Number, CO Number, Blooms Taxonomy Level, Question, Question Complexity

                    return {
                        id: index,
                        questionNumber: row['Question Number'] || index + 1,
                        type: normalizeType(row['Question Type']),
                        unit: parseInt(row['Unit Number'] || '0'),
                        co: row['CO Number'] || '',
                        blooms: row['Blooms Taxonomy Level'] || '',
                        text: row['Question'] || '',
                        complexity: normalizeComplexity(row['Question Complexity']),
                    };
                });

                resolve(questions);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};

const normalizeType = (type: string): 'Short' | 'Long' => {
    if (!type) return 'Short';
    const t = type.toLowerCase();
    if (t.includes('short')) return 'Short';
    if (t.includes('long') || t.includes('essay')) return 'Long';
    return 'Short'; // Default
};

const normalizeComplexity = (comp: string): 'Easy' | 'Average' | 'Tough' => {
    if (!comp) return 'Average';
    const c = comp.toLowerCase();
    if (c.includes('easy')) return 'Easy';
    if (c.includes('tough') || c.includes('hard')) return 'Tough';
    return 'Average';
};
