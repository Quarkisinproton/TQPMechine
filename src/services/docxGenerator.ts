import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';
import { ExamPaper } from '../types';

export const generateDocx = async (paper: ExamPaper): Promise<Blob> => {
    const sections = [];

    // Header
    const header = new Paragraph({
        children: [
            new TextRun({
                text: "EXAM PAPER",
                bold: true,
                size: 32,
            }),
            new TextRun({
                text: `\nTime: ${paper.config.time} Minutes   Max. Marks: ${paper.config.totalMarks}`,
                size: 24,
            }),
        ],
        alignment: AlignmentType.CENTER,
    });
    sections.push(header);

    // Sections
    for (const section of paper.sections) {
        // Section Header
        sections.push(
            new Paragraph({
                text: `\n${section.config.name} - ${section.config.type} Answer Questions`,
                heading: "Heading2",
                spacing: { before: 400, after: 200 },
            })
        );

        sections.push(
            new Paragraph({
                text: `Answer ${section.config.questionCount} Questions. Each carries ${section.config.marksPerQuestion} Marks.`,
                italics: true,
            })
        );

        // Questions Table or List
        // Using a table for better alignment of QNo, Unit, CO, Question
        const rows = [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: "Q.No", bold: true })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: "Question", bold: true })], width: { size: 60, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: "Unit", bold: true })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: "CO", bold: true })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                ],
            }),
        ];

        let qIndex = 1;
        for (const item of section.selectedQuestions) {
            if ('or' in item) {
                // OR Pattern
                const [q1, q2] = item.or;
                rows.push(
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph(qIndex.toString())] }),
                            new TableCell({
                                children: [
                                    new Paragraph({ text: q1.text }),
                                    new Paragraph({ text: "OR", alignment: AlignmentType.CENTER, bold: true }),
                                    new Paragraph({ text: q2.text }),
                                ],
                            }),
                            new TableCell({
                                children: [
                                    new Paragraph(q1.unit.toString()),
                                    new Paragraph(""),
                                    new Paragraph(q2.unit.toString()),
                                ],
                            }),
                            new TableCell({
                                children: [
                                    new Paragraph(q1.co),
                                    new Paragraph(""),
                                    new Paragraph(q2.co),
                                ],
                            }),
                        ],
                    })
                );
            } else {
                // Single Question
                rows.push(
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph(qIndex.toString())] }),
                            new TableCell({ children: [new Paragraph(item.text)] }),
                            new TableCell({ children: [new Paragraph(item.unit.toString())] }),
                            new TableCell({ children: [new Paragraph(item.co)] }),
                        ],
                    })
                );
            }
            qIndex++;
        }

        sections.push(
            new Table({
                rows: rows,
                width: { size: 100, type: WidthType.PERCENTAGE },
            })
        );
    }

    const doc = new Document({
        sections: [
            {
                properties: {},
                children: sections,
            },
        ],
    });

    return await Packer.toBlob(doc);
};
