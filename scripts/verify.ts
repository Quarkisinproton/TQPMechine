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

    // Find header row using sheet_to_json (more robust)
    const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    let headerRowIndex = 0;
    for (let i = 0; i < allRows.length; i++) {
        const row = allRows[i];
        if (row && row.some((cell: any) => cell && cell.toString().toLowerCase().includes('question number'))) {
            headerRowIndex = i;
            break;
        }
    }
    console.log("Found header at row:", headerRowIndex);
    // Empirically need +1 (maybe range is 1-based or something)
    const jsonData = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex + 1 });

    // Map to Question interface
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
    console.log(`Types: Short=${questions.filter(q => q.type === 'Short').length}, Long=${questions.filter(q => q.type === 'Long').length}`);
    console.log(`Units: ${[1, 2, 3, 4, 5].map(u => `U${u}=${questions.filter(q => q.unit === u).length}`).join(', ')}`);

    // 2. Define Config
    const config: ExamConfig = {
        time: 180,
        totalMarks: 70,
        headerText: 'EXAM PAPER',
        sections: [
            {
                id: '1',
                name: 'Section A - Short Answer Questions',
                sectionInstruction: 'Answer all 5 questions. Each carries 4 Marks.',
                questionCount: 5,
                marksPerQuestion: 4,
                type: 'Short',
                questionDifficulties: ['Easy', 'Easy', 'Average', 'Average', 'Tough'],
                questionUnits: [1, 2, 3, 4, 5],
                isOrPattern: false,
            },
            {
                id: '2',
                name: 'Section B - Long Answer Questions',
                sectionInstruction: 'Answer 5 questions, choosing one option from each pair. Each carries 10 Marks.',
                questionCount: 5,
                marksPerQuestion: 10,
                type: 'Long',
                questionDifficulties: ['Easy', 'Average', 'Average', 'Average', 'Average', 'Tough', 'Tough', 'Average', 'Average', 'Tough'],
                questionUnits: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
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
