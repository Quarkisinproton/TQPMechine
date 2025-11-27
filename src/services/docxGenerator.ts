import { Document, Paragraph, TextRun, AlignmentType, TabStopType, TabStopPosition } from 'docx';
import type { ExamPaper } from '../types';

const parseHtmlToParagraphs = (html: string): Paragraph[] => {
    if (typeof DOMParser === 'undefined') {
        // Fallback for Node.js environment (strip tags)
        return [
            new Paragraph({
                children: [new TextRun({ text: html.replace(/<[^>]*>/g, ''), bold: true, size: 32 })],
                alignment: AlignmentType.CENTER,
            })
        ];
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const paragraphs: Paragraph[] = [];

    doc.body.childNodes.forEach((node) => {
        const children: TextRun[] = [];
        let alignment: any = AlignmentType.LEFT;
        let size = 24; // 12pt default
        let bold = false;
        let spacing = { after: 100 };

        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;

            // Determine alignment from Quill classes
            if (el.classList.contains('ql-align-center')) alignment = AlignmentType.CENTER;
            if (el.classList.contains('ql-align-right')) alignment = AlignmentType.RIGHT;
            if (el.classList.contains('ql-align-justify')) alignment = AlignmentType.JUSTIFIED;

            // Determine Heading level / size
            if (el.tagName === 'H1') { size = 32; bold = true; spacing = { after: 200 }; }
            if (el.tagName === 'H2') { size = 28; bold = true; spacing = { after: 150 }; }

            // Process children (TextRuns)
            const processChild = (n: Node, currentStyle: { bold?: boolean, italics?: boolean, underline?: boolean }) => {
                if (n.nodeType === Node.TEXT_NODE) {
                    if (n.textContent) {
                        children.push(new TextRun({
                            text: n.textContent,
                            bold: currentStyle.bold || bold,
                            italics: currentStyle.italics,
                            underline: currentStyle.underline ? {} : undefined,
                            size: size,
                        }));
                    }
                } else if (n.nodeType === Node.ELEMENT_NODE) {
                    const e = n as HTMLElement;
                    const newStyle = { ...currentStyle };
                    if (e.tagName === 'STRONG' || e.tagName === 'B') newStyle.bold = true;
                    if (e.tagName === 'EM' || e.tagName === 'I') newStyle.italics = true;
                    if (e.tagName === 'U') newStyle.underline = true;

                    e.childNodes.forEach(c => processChild(c, newStyle));
                }
            };

            el.childNodes.forEach(c => processChild(c, {}));

            // Ensure children is not empty to avoid docx errors
            if (children.length === 0) {
                children.push(new TextRun({ text: "" }));
            }

            paragraphs.push(new Paragraph({
                alignment,
                children,
                spacing,
            }));

        } else if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent?.trim()) {
                paragraphs.push(new Paragraph({
                    children: [new TextRun({ text: node.textContent, size: 24 })],
                    alignment: AlignmentType.CENTER // Default for top level text
                }));
            }
        }
    });

    return paragraphs;
};

export const generateDocx = (paper: ExamPaper): Document => {
    const children: Paragraph[] = [];

    // Header: Parse HTML from headerText
    const headerText = paper.config.headerText || 'EXAM PAPER';
    try {
        const headerParagraphs = parseHtmlToParagraphs(headerText);
        children.push(...headerParagraphs);
    } catch (e) {
        console.error("Failed to parse header HTML", e);
        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: headerText.replace(/<[^>]*>/g, ''), bold: true, size: 32 })],
        }));
    }

    // Process each section
    let globalQuestionNumber = 1;

    for (const section of paper.sections) {
        // Section Name (centered, bold)
        children.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: section.config.name,
                        bold: true,
                        size: 28, // 14pt
                    }),
                ],
                spacing: { before: 300, after: 150 },
            })
        );

        // Section Instruction AFTER section name (e.g., "Answer 10 Questions. Each carries 2 Marks.")
        if (section.config.sectionInstruction) {
            children.push(
                new Paragraph({
                    alignment: AlignmentType.LEFT,
                    children: [
                        new TextRun({
                            text: section.config.sectionInstruction,
                            italics: true,
                            size: 24, // 12pt
                        }),
                    ],
                    spacing: { after: 250 },
                })
            );
        }

        // Questions
        for (const item of section.selectedQuestions) {
            if ('or' in item) {
                // OR Pattern
                const [q1, q2] = item.or;

                // Question A
                children.push(
                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        tabStops: [
                            {
                                type: TabStopType.RIGHT,
                                position: TabStopPosition.MAX,
                            },
                        ],
                        children: [
                            new TextRun({
                                text: `${globalQuestionNumber}) A) ${q1.text}`,
                            }),
                            new TextRun({
                                text: `\t${section.config.marksPerQuestion}`,
                            }),
                        ],
                        spacing: { after: 100 },
                    })
                );

                // OR
                children.push(
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: 'OR',
                                bold: true,
                            }),
                        ],
                        spacing: { after: 100 },
                    })
                );

                // Question B
                children.push(
                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        tabStops: [
                            {
                                type: TabStopType.RIGHT,
                                position: TabStopPosition.MAX,
                            },
                        ],
                        children: [
                            new TextRun({
                                text: `    B) ${q2.text}`,
                            }),
                            new TextRun({
                                text: `\t${section.config.marksPerQuestion}`,
                            }),
                        ],
                        spacing: { after: 200 },
                    })
                );

            } else {
                // Normal Question
                children.push(
                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        tabStops: [
                            {
                                type: TabStopType.RIGHT,
                                position: TabStopPosition.MAX,
                            },
                        ],
                        children: [
                            new TextRun({
                                text: `${globalQuestionNumber}) ${item.text}`,
                            }),
                            new TextRun({
                                text: `\t${section.config.marksPerQuestion}`,
                            }),
                        ],
                        spacing: { after: 150 },
                    })
                );
            }

            globalQuestionNumber++;
        }
    }

    return new Document({
        sections: [
            {
                children,
            },
        ],
    });
};
