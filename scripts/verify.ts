import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { generateExamPaper } from '../src/services/questionSelector';
import { generateDocx } from '../src/services/docxGenerator';
import { Question, ExamConfig } from '../src/types';

// Mock Browser APIs for Node environment if needed, or just bypass them
// Since we are testing logic, we will read file using fs and parse manually

const verify = async () => {
    console.log("Starting Verification...");

    // 1. Read Excel
    const excelPath = '/home/gb/Desktop/TQPMechine/OOP USING JAVA(Maj).xlsx';
    console.log(`Reading Excel from: ${excelPath}`);
    const buf = fs.readFileSync(excelPath);
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet);
    console.log("Raw JSON first row:", jsonData[0]);
    process.exit(0);

    // Map to Question interface (Copying logic from excelParser.ts for Node)
    const questions: Question[] = jsonData.map((row: any, index: number) => ({
        id: index,
        questionNumber: row['Question Number'] || index + 1,
        type: (row['Question Type'] || '').toLowerCase().includes('long') ? 'Long' : 'Short',
        unit: parseInt(row['Unit Number'] || '0'),
        co: row['CO Number'] || '',
        blooms: row['Blooms Taxonomy Level'] || '',
        text: row['Question'] || '',
        complexity: (row['Question Complexity'] || '').toLowerCase().includes('easy') ? 'Easy' :
            (row['Question Complexity'] || '').toLowerCase().includes('tough') ? 'Tough' : 'Average',
    }));

    console.log(`Parsed ${questions.length} questions.`);
    console.log("Unique Types:", [...new Set(questions.map(q => q.type))]);
    console.log("Unique Complexities:", [...new Set(questions.map(q => q.complexity))]);
    console.log("First 5 questions:", questions.slice(0, 5));

    // 2. Define Config
    const config: ExamConfig = {
        time: 180,
        totalMarks: 70,
        sections: [
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
        ]
    };

    // 3. Generate Paper
    console.log("Generating Exam Paper...");
    const paper = generateExamPaper(questions, config);

    console.log("Selected Questions:");
    paper.sections.forEach(s => {
        console.log(`Section ${s.config.name}: ${s.selectedQuestions.length} items`);
        s.selectedQuestions.forEach(q => {
            if ('or' in q) {
                console.log(`  OR Pair: [${q.or[0].id}] ${q.or[0].text.substring(0, 20)}... vs [${q.or[1].id}] ${q.or[1].text.substring(0, 20)}...`);
            } else {
                console.log(`  Question: [${q.id}] ${q.text.substring(0, 20)}...`);
            }
        });
    });

    // 4. Generate Docx
    console.log("Generating DOCX...");
    const blob = await generateDocx(paper);

    // Convert Blob to Buffer (Node specific)
    const buffer = Buffer.from(await blob.arrayBuffer());
    const outPath = '/home/gb/Desktop/TQPMechine/Verified_Output.docx';
    fs.writeFileSync(outPath, buffer);
    console.log(`DOCX saved to ${outPath}`);
};

verify().catch(console.error);
