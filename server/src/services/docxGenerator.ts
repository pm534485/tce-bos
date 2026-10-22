import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  ShadingType,
  WidthType,
  BorderStyle,
  Footer,
  Header,
  Packer,
  VerticalMergeType,
  UnderlineType,
} from 'docx';
import { Course } from '@syllabusforge/shared';
import { getDegreeProgramHeader } from './pdfGenerator.js';

// Table cell borders helper: clean single solid borders
const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
};

function createText(text: string, options: { bold?: boolean; size?: number; font?: string; italics?: boolean } = {}) {
  return new TextRun({
    text: text || '',
    font: options.font || 'Arial',
    size: options.size !== undefined ? options.size : 20, // 20 half-pts = 10 pt
    bold: !!options.bold,
    italics: !!options.italics,
  });
}

function createPlainHeading(text: string) {
  return new Paragraph({
    spacing: { before: 0, after: 60 },
    children: [createText(text, { bold: true, size: 21 })],
  });
}

function createShadedBanner(text: string, options: { pageBreakBefore?: boolean } = {}) {
  const p = new Paragraph({
    pageBreakBefore: options.pageBreakBefore,
    spacing: { before: 20, after: 20 },
    children: [createText(text, { bold: true, size: 20 })],
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            },
            shading: { fill: 'D9D9D9' },
            margins: { top: 40, bottom: 40, left: 80, right: 80 },
            children: [p],
          }),
        ],
      }),
    ],
  });
}

function createLineSpace() {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    children: [createText('')],
  });
}

function createCell(
  textOrRuns: string | TextRun[],
  options: {
    bold?: boolean;
    fill?: string;
    widthPercent?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    verticalMerge?: (typeof VerticalMergeType)[keyof typeof VerticalMergeType];
    rowSpan?: number;
    colSpan?: number;
    size?: number;
  } = {}
) {
  const children = typeof textOrRuns === 'string'
    ? (textOrRuns ? textOrRuns.split('\n').map(line => new Paragraph({
        alignment: options.align || AlignmentType.LEFT,
        children: [createText(line, { bold: options.bold, size: options.size || 19 })],
      })) : [new Paragraph({ children: [] })])
    : [new Paragraph({
        alignment: options.align || AlignmentType.LEFT,
        children: textOrRuns,
      })];

  return new TableCell({
    borders: cellBorders,
    shading: options.fill ? { fill: options.fill } : undefined,
    width: options.widthPercent ? { size: options.widthPercent, type: WidthType.PERCENTAGE } : undefined,
    verticalMerge: options.verticalMerge,
    rowSpan: options.rowSpan,
    columnSpan: options.colSpan,
    children,
  });
}

export async function generateDocxDocument(course: Course): Promise<Buffer> {
  const headerText = getDegreeProgramHeader(course);
  const titleText = (course.courseName || '').toUpperCase();

  // Running Header on every page
  const header = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [createText(headerText, { size: 19 })],
      }),
    ],
  });

  // Running Footer on every page
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.BOTH,
        tabStops: [
          {
            type: 'right' as any,
            position: 9500,
          },
        ],
        children: [
          createText('Passed in BoS Meeting ' + (course.bosMeetingDate || '30.05.2026'), { size: 17 }),
          new TextRun({ text: '\t' }),
          createText('Approved in 71', { size: 17 }),
          new TextRun({ text: 'st', superScript: true, font: 'Arial', size: 17 }),
          createText(' Academic council meeting ' + (course.academicCouncilDate || '27.06.2026'), { size: 17 }),
        ],
      }),
    ],
  });

  const children: any[] = [];

  // ==================== PAGE 1 ====================

  // 1. Course Header Table
  const isTcp = course.courseType === 'TCP';
  const headerRow1 = new TableRow({
    children: [
      createCell(course.courseCode, {
        bold: true,
        widthPercent: isTcp ? 16 : 18,
        verticalMerge: VerticalMergeType.RESTART,
        align: AlignmentType.CENTER,
        size: 21,
      }),
      createCell(titleText, {
        bold: true,
        widthPercent: isTcp ? 38 : 44,
        verticalMerge: VerticalMergeType.RESTART,
        align: AlignmentType.CENTER,
        size: 21,
      }),
      createCell('Category', { widthPercent: isTcp ? 12 : 14, align: AlignmentType.CENTER }),
      createCell('L', { widthPercent: isTcp ? 5 : 6, align: AlignmentType.CENTER }),
      createCell('T', { widthPercent: isTcp ? 5 : 6, align: AlignmentType.CENTER }),
      createCell('P', { widthPercent: isTcp ? 5 : 6, align: AlignmentType.CENTER }),
      createCell('Credits', { widthPercent: isTcp ? 7 : 6, align: AlignmentType.CENTER }),
      ...(isTcp ? [createCell('TE Type', { widthPercent: 12, align: AlignmentType.CENTER })] : []),
    ],
  });

  const headerRow2 = new TableRow({
    children: [
      createCell('', { widthPercent: isTcp ? 16 : 18, verticalMerge: VerticalMergeType.CONTINUE }),
      createCell('', { widthPercent: isTcp ? 38 : 44, verticalMerge: VerticalMergeType.CONTINUE }),
      createCell(course.categoryAbbr || 'PCC', { widthPercent: isTcp ? 12 : 14, align: AlignmentType.CENTER }),
      createCell(String(course.L), { widthPercent: isTcp ? 5 : 6, align: AlignmentType.CENTER }),
      createCell(String(course.T), { widthPercent: isTcp ? 5 : 6, align: AlignmentType.CENTER }),
      createCell(String(course.P), { widthPercent: isTcp ? 5 : 6, align: AlignmentType.CENTER }),
      createCell(String(course.credits), { bold: true, widthPercent: isTcp ? 7 : 6, align: AlignmentType.CENTER }),
      ...(isTcp ? [createCell(course.teExamType || 'TCP-T', { bold: true, widthPercent: 12, align: AlignmentType.CENTER })] : []),
    ],
  });

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow1, headerRow2],
  }));

  // Line space between sections
  children.push(createLineSpace());

  // 2. Preamble
  children.push(createShadedBanner('Preamble'));
  children.push(new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 60, after: 0 },
    children: [createText(course.preamble || '')],
  }));

  // Line space between sections
  children.push(createLineSpace());

  // 3. Prerequisite
  const getPrerequisiteList = (prereqs: any): string[] => {
    if (!prereqs) return [];
    if (Array.isArray(prereqs)) {
      return prereqs
        .map(p => {
          if (typeof p === 'string') return p.trim();
          const code = (p.courseCode || '').trim();
          const name = (p.courseName || '').trim();
          if (code && name) return `${code} ${name}`;
          return code || name || '';
        })
        .filter(s => s && s.toLowerCase() !== 'nil');
    }
    if (typeof prereqs === 'string') {
      const trimmed = prereqs.trim();
      if (!trimmed || trimmed.toLowerCase() === 'nil') return [];
      if (trimmed.includes('\n')) {
        return trimmed
          .split('\n')
          .map(s => s.trim().replace(/^[•\-\*]\s*/, ''))
          .filter(s => s && s.toLowerCase() !== 'nil');
      }
      return [trimmed];
    }
    return [];
  };

  const prereqList = getPrerequisiteList(course.prerequisites);

  children.push(createShadedBanner('Prerequisite'));
  if (prereqList.length > 0) {
    prereqList.forEach(p => {
      children.push(new Paragraph({
        indent: { left: 360, hanging: 180 },
        spacing: { before: 40, after: 40 },
        children: [createText(`•  ${p}`)],
      }));
    });
  } else {
    children.push(new Paragraph({
      spacing: { before: 60, after: 0 },
      children: [createText('NIL')],
    }));
  }

  // Line space between sections
  children.push(createLineSpace());

  // 4. Course Outcomes
  children.push(createShadedBanner('Course Outcomes'));
  children.push(new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [createText('After the successful completion of the course, students will be able to:')],
  }));

  const coList = course.courseOutcomes || [];
  const coHeaderRow = new TableRow({
    children: [
      createCell('No.', { bold: true, widthPercent: 7, align: AlignmentType.CENTER }),
      createCell('Course Outcome', { bold: true, widthPercent: 45 }),
      createCell('TPS Level', { bold: true, widthPercent: 10, align: AlignmentType.CENTER }),
      createCell('Performance Indicator', { bold: true, widthPercent: 14, align: AlignmentType.CENTER }),
      createCell('CO Weightage', { bold: true, widthPercent: 10, align: AlignmentType.CENTER }),
      createCell('SDG addressed', { bold: true, widthPercent: 8, align: AlignmentType.CENTER }),
      createCell('SDG Level', { bold: true, widthPercent: 6, align: AlignmentType.CENTER }),
    ],
  });

  const coRows = [coHeaderRow];
  coList.forEach(co => {
    coRows.push(new TableRow({
      children: [
        createCell(co.coNo, { widthPercent: 7, align: AlignmentType.CENTER }),
        createCell(co.statement, { widthPercent: 45 }),
        createCell(`TPS${co.tpsLevel}`, { widthPercent: 10, align: AlignmentType.CENTER }),
        createCell(co.pi, { widthPercent: 14, align: AlignmentType.CENTER }),
        createCell(co.weightage !== undefined ? String(co.weightage) : '', { widthPercent: 10, align: AlignmentType.CENTER }),
        createCell(co.sdgNo && co.sdgNo !== 'NC' ? (String(co.sdgNo).includes(',') ? `SDGs ${co.sdgNo}` : `SDG ${co.sdgNo}`) : 'NC', { widthPercent: 8, align: AlignmentType.CENTER }),
        createCell(co.sdgLevel !== undefined ? String(co.sdgLevel) : '', { widthPercent: 6, align: AlignmentType.CENTER }),
      ],
    }));
  });

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: coRows,
  }));

  // Line space between sections
  children.push(createLineSpace());

  // 5. Assessment Pattern
  children.push(createShadedBanner('Assessment Pattern'));
  children.push(new Paragraph({ spacing: { before: 40, after: 40 }, children: [] }));

  const isPractical = course.courseType === 'PRACTICAL';
  const matrix = course.assessmentMatrix || [];

  if (isPractical) {
    const terminalBracket = (course.courseType === 'PRACTICAL' || course.teExamType === 'TCP-P') ? '(Practical)' : '(Theory)';

    const assessHeader1 = new TableRow({
      children: [
        createCell('CO', { bold: true, widthPercent: 10, align: AlignmentType.CENTER, verticalMerge: VerticalMergeType.RESTART }),
        createCell('Theory', { bold: true, widthPercent: 36, align: AlignmentType.CENTER, colSpan: 2 }),
        createCell('Practical', { bold: true, widthPercent: 36, align: AlignmentType.CENTER, colSpan: 2 }),
        createCell(`Terminal Exam\n${terminalBracket}`, { bold: true, widthPercent: 18, align: AlignmentType.CENTER, verticalMerge: VerticalMergeType.RESTART }),
      ],
    });

    const assessHeader2 = new TableRow({
      children: [
        createCell('', { widthPercent: 10, verticalMerge: VerticalMergeType.CONTINUE }),
        createCell('CAT1', { bold: true, widthPercent: 18, align: AlignmentType.CENTER }),
        createCell('CAT2', { bold: true, widthPercent: 18, align: AlignmentType.CENTER }),
        createCell('OCR/Continuous Assessment', { bold: true, widthPercent: 18, align: AlignmentType.CENTER }),
        createCell('Model Test CO-wise', { bold: true, widthPercent: 18, align: AlignmentType.CENTER }),
        createCell('', { widthPercent: 18, verticalMerge: VerticalMergeType.CONTINUE }),
      ],
    });

    const assessHeader3 = new TableRow({
      children: [
        createCell('', { widthPercent: 10, verticalMerge: VerticalMergeType.CONTINUE }),
        createCell('% of Marks', { bold: true, widthPercent: 18, align: AlignmentType.CENTER, size: 17 }),
        createCell('% of Marks', { bold: true, widthPercent: 18, align: AlignmentType.CENTER, size: 17 }),
        createCell('% of Marks', { bold: true, widthPercent: 18, align: AlignmentType.CENTER, size: 17 }),
        createCell('% of Marks', { bold: true, widthPercent: 18, align: AlignmentType.CENTER, size: 17 }),
        createCell('% of Marks', { bold: true, widthPercent: 18, align: AlignmentType.CENTER, size: 17 }),
      ],
    });

    let totPracticalCat1 = 0;
    let totPracticalCat2 = 0;
    let totPracticalCa = 0;
    let totPracticalModel = 0;
    let totPracticalTerm = 0;

    const practicalDataRows = coList.map((co) => {
      const row = matrix.find(m => m.coNo === co.coNo);
      let cat1: number | string = '';
      let cat2: number | string = '';
      let ca: number | string = '';
      let model: number | string = '';
      let term: number | string = '';

      if (row) {
        cat1 = row.theoryCat1 && row.theoryCat1 > 0 ? row.theoryCat1 : (row.cat1 && row.cat1 > 0 ? row.cat1 : '');
        cat2 = row.theoryCat2 && row.theoryCat2 > 0 ? row.theoryCat2 : (row.cat2 && row.cat2 > 0 ? row.cat2 : (row.assignment1 && row.assignment1 > 0 ? row.assignment1 : ''));
        ca = row.practicalCa && row.practicalCa > 0 ? row.practicalCa : '';
        model = row.practicalModel && row.practicalModel > 0 ? row.practicalModel : '';
        term = row.terminalExam && row.terminalExam > 0 ? row.terminalExam : (row.tcpTerminal && row.tcpTerminal > 0 ? row.tcpTerminal : '');
      }

      if (typeof cat1 === 'number') totPracticalCat1 += cat1;
      if (typeof cat2 === 'number') totPracticalCat2 += cat2;
      if (typeof ca === 'number') totPracticalCa += ca;
      if (typeof model === 'number') totPracticalModel += model;
      if (typeof term === 'number') totPracticalTerm += term;

      return new TableRow({
        children: [
          createCell(co.coNo, { widthPercent: 10, align: AlignmentType.LEFT }),
          createCell(cat1 !== '' ? String(cat1) : '', { widthPercent: 18, align: AlignmentType.CENTER }),
          createCell(cat2 !== '' ? String(cat2) : '', { widthPercent: 18, align: AlignmentType.CENTER }),
          createCell(ca !== '' ? String(ca) : '', { widthPercent: 18, align: AlignmentType.CENTER }),
          createCell(model !== '' ? String(model) : '', { widthPercent: 18, align: AlignmentType.CENTER }),
          createCell(term !== '' ? String(term) : '', { widthPercent: 18, align: AlignmentType.CENTER }),
        ],
      });
    });

    const assessTotalRow = new TableRow({
      children: [
        createCell('Total', { bold: true, widthPercent: 10, align: AlignmentType.LEFT }),
        createCell(String(totPracticalCat1 || 100), { bold: true, widthPercent: 18, align: AlignmentType.CENTER }),
        createCell(String(totPracticalCat2 || 100), { bold: true, widthPercent: 18, align: AlignmentType.CENTER }),
        createCell(String(totPracticalCa || 100), { bold: true, widthPercent: 18, align: AlignmentType.CENTER }),
        createCell(String(totPracticalModel || 100), { bold: true, widthPercent: 18, align: AlignmentType.CENTER }),
        createCell(String(totPracticalTerm || 100), { bold: true, widthPercent: 18, align: AlignmentType.CENTER }),
      ],
    });

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [assessHeader1, assessHeader2, assessHeader3, ...practicalDataRows, assessTotalRow],
    }));

    children.push(new Paragraph({
      spacing: { before: 180, after: 120 },
      alignment: AlignmentType.BOTH,
      tabStops: [
        {
          type: 'right' as any,
          position: 9500,
        },
      ],
      children: [
        createText('Passed in BoS Meeting ' + (course.bosMeetingDate || '30.05.2026'), { size: 17 }),
        new TextRun({ text: '\t' }),
        createText('Approved in 71', { size: 17 }),
        new TextRun({ text: 'st', superScript: true, font: 'Arial', size: 17 }),
        createText(' Academic council meeting ' + (course.academicCouncilDate || '27.06.2026'), { size: 17 }),
      ],
    }));
  } else {
    const assessHeader1 = new TableRow({
      children: [
        createCell('CO', { bold: true, widthPercent: 10, align: AlignmentType.CENTER, verticalMerge: VerticalMergeType.RESTART }),
        createCell(isTcp ? 'Theory CAT1' : 'CAT1', { bold: true, widthPercent: 18, align: AlignmentType.CENTER }),
        createCell(isTcp ? 'Theory CAT2' : 'Assignment 1', { bold: true, widthPercent: 18, align: AlignmentType.CENTER }),
        createCell(isTcp ? 'Practical CA' : 'CAT2', { bold: true, widthPercent: 18, align: AlignmentType.CENTER }),
        createCell(isTcp ? 'Model Test' : 'Assignment 2', { bold: true, widthPercent: 18, align: AlignmentType.CENTER }),
        createCell('Terminal Exam', { bold: true, widthPercent: 18, align: AlignmentType.CENTER }),
      ],
    });

    const assessHeader2 = new TableRow({
      children: [
        createCell('', { widthPercent: 10, verticalMerge: VerticalMergeType.CONTINUE }),
        createCell('% of Marks', { bold: true, widthPercent: 18, align: AlignmentType.CENTER, size: 17 }),
        createCell('% of Marks', { bold: true, widthPercent: 18, align: AlignmentType.CENTER, size: 17 }),
        createCell('% of Marks', { bold: true, widthPercent: 18, align: AlignmentType.CENTER, size: 17 }),
        createCell('% of Marks', { bold: true, widthPercent: 18, align: AlignmentType.CENTER, size: 17 }),
        createCell('% of Marks', { bold: true, widthPercent: 18, align: AlignmentType.CENTER, size: 17 }),
      ],
    });

    let totCol1 = 0;
    let totCol2 = 0;
    let totCol3 = 0;
    let totCol4 = 0;
    let totCol5 = 0;

    const assessDataRows = coList.map((co, idx) => {
      const row = matrix.find(m => m.coNo === co.coNo);
      let c1: number | string = '';
      let c2: number | string = '';
      let c3: number | string = '';
      let c4: number | string = '';
      let c5: number | string = '';

      if (row) {
        if (isTcp) {
          c1 = row.theoryCat1 && row.theoryCat1 > 0 ? row.theoryCat1 : '';
          c2 = row.theoryCat2 && row.theoryCat2 > 0 ? row.theoryCat2 : '';
          c3 = row.practicalCa && row.practicalCa > 0 ? row.practicalCa : '';
          c4 = row.practicalModel && row.practicalModel > 0 ? row.practicalModel : '';
          c5 = row.tcpTerminal && row.tcpTerminal > 0 ? row.tcpTerminal : '';
        } else {
          c1 = row.cat1 && row.cat1 > 0 ? row.cat1 : '';
          c2 = row.assignment1 && row.assignment1 > 0 ? row.assignment1 : '';
          c3 = row.cat2 && row.cat2 > 0 ? row.cat2 : '';
          c4 = row.assignment2 && row.assignment2 > 0 ? row.assignment2 : '';
          c5 = row.terminalExam && row.terminalExam > 0 ? row.terminalExam : '';
        }
      } else {
        if (isTcp) {
          if (idx === 0) { c1 = 30; c3 = 10; c4 = 10; c5 = 15; }
          else if (idx === 1) { c1 = 40; c2 = 10; c3 = 15; c4 = 15; c5 = 20; }
          else if (idx === 2) { c1 = 30; c2 = 20; c3 = 25; c4 = 25; c5 = 20; }
          else if (idx === 3) { c2 = 40; c3 = 25; c4 = 25; c5 = 25; }
          else if (idx === 4) { c2 = 15; c3 = 15; c4 = 15; c5 = 10; }
          else if (idx === 5) { c2 = 15; c3 = 10; c4 = 10; c5 = 10; }
        } else {
          if (idx === 0 || idx === 1) { c1 = 30; c2 = 30; c5 = 10; }
          else if (idx === 2) { c1 = 40; c2 = 40; c5 = 20; }
          else if (idx === 3 || idx === 4) { c3 = 30; c4 = 30; c5 = 20; }
          else if (idx === 5) { c3 = 40; c4 = 40; c5 = 20; }
        }
      }

      if (typeof c1 === 'number') totCol1 += c1;
      if (typeof c2 === 'number') totCol2 += c2;
      if (typeof c3 === 'number') totCol3 += c3;
      if (typeof c4 === 'number') totCol4 += c4;
      if (typeof c5 === 'number') totCol5 += c5;

      return new TableRow({
        children: [
          createCell(co.coNo, { widthPercent: 10, align: AlignmentType.CENTER }),
          createCell(String(c1 || ''), { widthPercent: 18, align: AlignmentType.CENTER }),
          createCell(String(c2 || ''), { widthPercent: 18, align: AlignmentType.CENTER }),
          createCell(String(c3 || ''), { widthPercent: 18, align: AlignmentType.CENTER }),
          createCell(String(c4 || ''), { widthPercent: 18, align: AlignmentType.CENTER }),
          createCell(String(c5 || ''), { widthPercent: 18, align: AlignmentType.CENTER }),
        ],
      });
    });

    const assessTotalRow = new TableRow({
      children: [
        createCell('Total', { bold: true, widthPercent: 10, align: AlignmentType.CENTER }),
        createCell(String(totCol1 || 100), { bold: true, widthPercent: 18, align: AlignmentType.CENTER }),
        createCell(String(totCol2 || 100), { bold: true, widthPercent: 18, align: AlignmentType.CENTER }),
        createCell(String(totCol3 || 100), { bold: true, widthPercent: 18, align: AlignmentType.CENTER }),
        createCell(String(totCol4 || 100), { bold: true, widthPercent: 18, align: AlignmentType.CENTER }),
        createCell(String(totCol5 || 100), { bold: true, widthPercent: 18, align: AlignmentType.CENTER }),
      ],
    });

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [assessHeader1, assessHeader2, ...assessDataRows, assessTotalRow],
    }));

    children.push(new Paragraph({
      spacing: { before: 180, after: 120 },
      alignment: AlignmentType.BOTH,
      tabStops: [
        {
          type: 'right' as any,
          position: 9500,
        },
      ],
      children: [
        createText('Passed in BoS Meeting ' + (course.bosMeetingDate || '30.05.2026'), { size: 17 }),
        new TextRun({ text: '\t' }),
        createText('Approved in 71', { size: 17 }),
        new TextRun({ text: 'st', superScript: true, font: 'Arial', size: 17 }),
        createText(' Academic council meeting ' + (course.academicCouncilDate || '27.06.2026'), { size: 17 }),
      ],
    }));
  }

  // ==================== PAGE 2 ====================

  const formatCitation = (b: any) => {
    const parts: string[] = [];
    if (b.authors && String(b.authors).trim()) {
      parts.push(String(b.authors).trim().replace(/,\s*$/, ''));
    }
    if (b.title && String(b.title).trim()) {
      let t = String(b.title).trim().replace(/,\s*$/, '');
      const isQuoted =
        (t.startsWith('"') && t.endsWith('"')) ||
        (t.startsWith('“') && t.endsWith('”')) ||
        (t.startsWith('”') && t.endsWith('”'));
      if (!isQuoted) {
        t = `“${t}”`;
      }
      parts.push(t);
    }
    if (b.edition && String(b.edition).trim()) {
      parts.push(String(b.edition).trim().replace(/,\s*$/, ''));
    }
    if (b.publisher && String(b.publisher).trim()) {
      parts.push(String(b.publisher).trim().replace(/,\s*$/, ''));
    }
    if (b.year && String(b.year).trim()) {
      parts.push(String(b.year).trim().replace(/\.+$/, ''));
    }
    if (parts.length === 0) return '';
    return parts.join(', ') + '.';
  };

  const formatNptel = (w: any) => {
    const parts: string[] = [];
    if (w.title && String(w.title).trim()) {
      parts.push(String(w.title).trim().replace(/;\s*$/, ''));
    }
    if (w.authors && String(w.authors).trim()) {
      parts.push(String(w.authors).trim().replace(/;\s*$/, ''));
    }
    if (w.publisher && String(w.publisher).trim()) {
      parts.push(String(w.publisher).trim().replace(/;\s*$/, ''));
    }
    if (w.url && String(w.url).trim()) {
      parts.push(String(w.url).trim());
    }
    return parts.join('; ');
  };

  if (isPractical) {
    // List of Experiments with CO Mapping
    children.push(createShadedBanner('List of Experiments with CO Mapping', { pageBreakBefore: true }));
    children.push(createLineSpace());

    const expHeaderRow = new TableRow({
      children: [
        createCell('Sl. No.', { bold: true, widthPercent: 10, align: AlignmentType.CENTER }),
        createCell('Name of the Experiment', { bold: true, widthPercent: 55 }),
        createCell('Level of Experiment', { bold: true, widthPercent: 15, align: AlignmentType.CENTER }),
        createCell('COs Addressed', { bold: true, widthPercent: 20, align: AlignmentType.CENTER }),
      ],
    });

    const expRows = [expHeaderRow];
    const experimentsList = course.experiments || [];
    if (experimentsList.length > 0) {
      experimentsList.forEach((exp, idx) => {
        expRows.push(new TableRow({
          children: [
            createCell(String(exp.slNo || idx + 1), { widthPercent: 10, align: AlignmentType.CENTER }),
            createCell(exp.name || '', { widthPercent: 55 }),
            createCell(`Level ${exp.level || 1}`, { widthPercent: 15, align: AlignmentType.CENTER }),
            createCell(Array.isArray(exp.coNos) ? exp.coNos.join(', ') : (exp.coNos || ''), { widthPercent: 20, align: AlignmentType.CENTER }),
          ],
        }));
      });
    } else {
      expRows.push(new TableRow({
        children: [
          createCell('No laboratory experiments entered yet', { colSpan: 4, widthPercent: 100, align: AlignmentType.CENTER }),
        ],
      }));
    }

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: expRows,
    }));
    children.push(createLineSpace());
  } else {
    // Shaded Syllabus Heading with PageBreak Before
    children.push(createShadedBanner('Syllabus', { pageBreakBefore: true }));
    children.push(createLineSpace());

    // Syllabus modules
    (course.modules || []).forEach(mod => {
      children.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
          createText(`${mod.mainTopic}: `, { bold: true }),
          createText(Array.isArray(mod.subtopics) ? mod.subtopics.join(' – ') : ''),
        ],
      }));
      children.push(createLineSpace());
    });

    // TCP course: include experiments if present
    if (course.courseType === 'TCP' && (course.experiments || []).length > 0) {
      children.push(createShadedBanner('List of Experiments with CO Mapping'));
      children.push(createLineSpace());

      const expHeaderRow = new TableRow({
        children: [
          createCell('Sl. No.', { bold: true, widthPercent: 10, align: AlignmentType.CENTER }),
          createCell('Name of the Experiment', { bold: true, widthPercent: 55 }),
          createCell('Level of Experiment', { bold: true, widthPercent: 15, align: AlignmentType.CENTER }),
          createCell('COs Addressed', { bold: true, widthPercent: 20, align: AlignmentType.CENTER }),
        ],
      });

      const expRows = [expHeaderRow];
      course.experiments.forEach((exp, idx) => {
        expRows.push(new TableRow({
          children: [
            createCell(String(exp.slNo || idx + 1), { widthPercent: 10, align: AlignmentType.CENTER }),
            createCell(exp.name || '', { widthPercent: 55 }),
            createCell(`Level ${exp.level || 1}`, { widthPercent: 15, align: AlignmentType.CENTER }),
            createCell(Array.isArray(exp.coNos) ? exp.coNos.join(', ') : (exp.coNos || ''), { widthPercent: 20, align: AlignmentType.CENTER }),
          ],
        }));
      });

      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: expRows,
      }));
      children.push(createLineSpace());
    }
  }

  // Learning Resources
  children.push(createShadedBanner(isPractical ? 'Learning Resources' : '6. Learning Resources'));
  children.push(createLineSpace());

  if (!isPractical || (course.textBooks && course.textBooks.length > 0)) {
    children.push(createShadedBanner(isPractical ? 'Text Book(s)' : '6.1 Text Book'));
    children.push(createLineSpace());

    (course.textBooks || []).forEach(b => {
      children.push(new Paragraph({
        bullet: { level: 0 },
        alignment: AlignmentType.JUSTIFIED,
        children: [createText(formatCitation(b))],
      }));
    });
    children.push(createLineSpace());
  }

  children.push(createShadedBanner(isPractical ? 'Reference Books and Web resources' : '6.2 Reference Books & Web resources'));
  children.push(createLineSpace());

  (course.referenceBooks || []).forEach(b => {
    children.push(new Paragraph({
      bullet: { level: 0 },
      alignment: AlignmentType.JUSTIFIED,
      children: [createText(formatCitation(b))],
    }));
  });

  children.push(createLineSpace());

  children.push(createPlainHeading('NPTEL Courses'));
  children.push(new Paragraph({ spacing: { before: 40, after: 40 }, children: [] }));

  (course.webResources || []).forEach(w => {
    const text = formatNptel(w);
    if (!text) return;
    children.push(new Paragraph({
      bullet: { level: 0 },
      alignment: AlignmentType.JUSTIFIED,
      children: [createText(text)],
    }));
  });

  // ==================== PAGE 3 ====================

  if (!isPractical) {
    // 7. Course Contents and Lecture Schedule with PageBreak Before
    children.push(createShadedBanner('7. Course Contents and Lecture Schedule', { pageBreakBefore: true }));
    children.push(createLineSpace());

    let scheduleItems = course.lectureScheduleItems || [];
    if (scheduleItems.length === 0 && (course.modules || []).length > 0) {
      scheduleItems = [];
      (course.modules || []).forEach((mod, modIdx) => {
        const modNo = String(mod.moduleNo || modIdx + 1);
        if (mod.subtopics && mod.subtopics.length > 0) {
          const totalModPeriods = Number(mod.periods) || 5;
          const perTopic = Math.max(1, Math.floor(totalModPeriods / mod.subtopics.length));
          mod.subtopics.forEach((sub, sIdx) => {
            scheduleItems.push({
              moduleNo: modNo,
              topic: sIdx === 0 ? `${mod.mainTopic}: ${sub}` : sub,
              periods: sIdx === mod.subtopics.length - 1 ? totalModPeriods - (perTopic * (mod.subtopics.length - 1)) : perTopic,
            });
          });
        } else {
          scheduleItems.push({
            moduleNo: modNo,
            topic: mod.mainTopic,
            periods: Number(mod.periods) || 5,
          });
        }
      });
    }

    const schedHeaderRow = new TableRow({
      children: [
        createCell('Module No', { bold: true, widthPercent: 12, align: AlignmentType.CENTER }),
        createCell('Topics', { bold: true, widthPercent: 58 }),
        createCell('No of Periods', { bold: true, widthPercent: 14, align: AlignmentType.CENTER }),
        createCell('Course Outcomes', { bold: true, widthPercent: 16, align: AlignmentType.CENTER }),
      ],
    });

    let totalPeriods = 0;
    const schedRows = [schedHeaderRow];
    scheduleItems.forEach(item => {
      const p = Number(item.periods) || 0;
      totalPeriods += p;
      const periodDisplay = item.periods !== undefined && item.periods !== null && item.periods !== '' ? String(item.periods) : '';
      const coDisplay = Array.isArray(item.coMapping) ? item.coMapping.join(', ') : (item.coMapping || '');
      schedRows.push(new TableRow({
        children: [
          createCell(item.moduleNo || '', { widthPercent: 12, align: AlignmentType.CENTER }),
          createCell(item.topic || '', { widthPercent: 58 }),
          createCell(periodDisplay, { widthPercent: 14, align: AlignmentType.CENTER }),
          createCell(coDisplay, { widthPercent: 16, align: AlignmentType.CENTER }),
        ],
      }));
    });

    schedRows.push(new TableRow({
      children: [
        createCell('Total Periods', { bold: true, widthPercent: 70, colSpan: 2, align: AlignmentType.CENTER }),
        createCell(String(totalPeriods), { bold: true, widthPercent: 14, align: AlignmentType.CENTER }),
        createCell('', { widthPercent: 16, align: AlignmentType.CENTER }),
      ],
    }));

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: schedRows,
    }));

    // Line space between sections
    children.push(createLineSpace());
  }

  // Course Designer(s)
  children.push(createShadedBanner(isPractical ? '7. Course Designer(s):' : '8. Course Designer(s):', isPractical ? { pageBreakBefore: true } : {}));
  children.push(createLineSpace());

  const designers = course.designers || [];
  if (designers.length > 0) {
    designers.forEach(d => {
      const parts = [d.name, d.designation].filter(Boolean).join(', ');
      const runs = [createText(`${parts}${d.email ? (parts ? ', ' : '') : ''}`)];
      if (d.email) {
        runs.push(new TextRun({
          text: d.email,
          font: 'Arial',
          size: 20,
          color: '0000FF',
          underline: {
            type: UnderlineType.SINGLE,
            color: '0000FF',
          },
        }));
      }
      children.push(new Paragraph({
        children: runs,
      }));
    });
  } else {
    children.push(new Paragraph({
      children: [
        createText('Faculty Member, '),
        new TextRun({
          text: 'faculty@tce.edu',
          font: 'Arial',
          size: 20,
          color: '0000FF',
          underline: {
            type: UnderlineType.SINGLE,
            color: '0000FF',
          },
        }),
      ],
    }));
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 20,
            color: '000000',
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134, // ~20mm
              bottom: 1134,
              left: 1134,
              right: 1134,
            },
          },
        },
        headers: {
          default: header,
        },
        footers: {
          default: footer,
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

// Programme Compilation Bundle Generator
export async function generateProgrammeBundleDocx(bundleData: {
  programmeCode: string;
  programmeName: string;
  department: string;
  regulationYear: number;
  annexureNo: string;
  courses: Course[];
}): Promise<Buffer> {
  const { programmeCode, programmeName, regulationYear, annexureNo, courses } = bundleData;
  const headerText = `${programmeCode} Degree Program ${regulationYear}-${(regulationYear + 1).toString().slice(-2)}`;

  const header = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [createText(headerText, { size: 19 })],
      }),
    ],
  });

  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.BOTH,
        tabStops: [
          {
            type: 'right' as any,
            position: 9500,
          },
        ],
        children: [
          createText('Passed in BoS Meeting 30.05.2026', { size: 17 }),
          new TextRun({ text: '\t' }),
          createText('Approved in 71st Academic council meeting 27.06.2026', { size: 17 }),
        ],
      }),
    ],
  });

  // Front / Cover Page
  const coverChildren = [
    new Paragraph({ spacing: { before: 2000 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [createText(`ANNEXURE ${annexureNo}`, { bold: true, size: 32 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [createText('CURRICULUM AND SYLLABI', { bold: true, size: 28 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 500 },
      children: [createText(`FOR ${programmeName.toUpperCase()} (${programmeCode})`, { bold: true, size: 26 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        createText(
          `FOR THE STUDENTS ADMITTED FROM THE ACADEMIC YEAR ${regulationYear}–${(regulationYear + 1).toString().slice(-2)} ONWARDS`,
          { bold: true, size: 22 }
        ),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1000 },
      children: [createText('Approved in 71st Academic Council Meeting 27.06.2026', { italics: true, size: 20 })],
    }),
  ];

  const unifiedChildren: any[] = [...coverChildren];
  for (const course of courses) {
    unifiedChildren.push(new Paragraph({ pageBreakBefore: true }));
    const titleText = (course.courseName || '').toUpperCase();
    const isTcp = course.courseType === 'TCP';
    unifiedChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              createCell(course.courseCode, { bold: true, widthPercent: isTcp ? 16 : 18, align: AlignmentType.CENTER }),
              createCell(titleText, { bold: true, widthPercent: isTcp ? 38 : 44, align: AlignmentType.CENTER }),
              createCell('Category', { widthPercent: isTcp ? 12 : 14, align: AlignmentType.CENTER }),
              createCell('L', { widthPercent: isTcp ? 5 : 6, align: AlignmentType.CENTER }),
              createCell('T', { widthPercent: isTcp ? 5 : 6, align: AlignmentType.CENTER }),
              createCell('P', { widthPercent: isTcp ? 5 : 6, align: AlignmentType.CENTER }),
              createCell('Credits', { widthPercent: isTcp ? 7 : 6, align: AlignmentType.CENTER }),
              ...(isTcp ? [createCell('TE Type', { widthPercent: 12, align: AlignmentType.CENTER })] : []),
            ],
          }),
          new TableRow({
            children: [
              createCell('', { widthPercent: isTcp ? 16 : 18 }),
              createCell('', { widthPercent: isTcp ? 38 : 44 }),
              createCell(course.categoryAbbr || 'PCC', { widthPercent: isTcp ? 12 : 14, align: AlignmentType.CENTER }),
              createCell(String(course.L), { widthPercent: isTcp ? 5 : 6, align: AlignmentType.CENTER }),
              createCell(String(course.T), { widthPercent: isTcp ? 5 : 6, align: AlignmentType.CENTER }),
              createCell(String(course.P), { widthPercent: isTcp ? 5 : 6, align: AlignmentType.CENTER }),
              createCell(String(course.credits), { bold: true, widthPercent: isTcp ? 7 : 6, align: AlignmentType.CENTER }),
              ...(isTcp ? [createCell(course.teExamType || 'TCP-T', { bold: true, widthPercent: 12, align: AlignmentType.CENTER })] : []),
            ],
          }),
        ],
      })
    );
    unifiedChildren.push(createLineSpace());
    unifiedChildren.push(createShadedBanner('Preamble'));
    unifiedChildren.push(new Paragraph({ children: [createText(course.preamble || '')] }));
  }

  const bundledDoc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
        },
        headers: { default: header },
        footers: { default: footer },
        children: unifiedChildren,
      },
    ],
  });

  return Packer.toBuffer(bundledDoc);
}
