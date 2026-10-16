import { Course } from '@syllabusforge/shared';
import { ConfigSettingsModel } from '../models/MasterData.js';

export function getDegreeProgramHeader(course: Course): string {
  let progCode = (course.programmeCode || '').toUpperCase();
  if (!progCode && course.courseCode && course.courseCode.length >= 4) {
    progCode = course.courseCode.substring(2, 4).toUpperCase();
  }

  const progMap: Record<string, string> = {
    'EC': 'B.E. (ECE)',
    'ECE': 'B.E. (ECE)',
    'EE': 'B.E. (EEE)',
    'EEE': 'B.E. (EEE)',
    'CS': 'B.E. (CSE)',
    'CSE': 'B.E. (CSE)',
    'IT': 'B.Tech. (IT)',
    'ME': 'B.E. (MECH)',
    'CE': 'B.E. (CIVIL)',
    'CA': 'MCA',
    'MCA': 'MCA',
    'CB': 'B.Tech. (CSBS)',
    'AM': 'B.E. (CSE - AIML)',
    'MT': 'B.E. (Mechatronics)',
    'DS': 'M.Sc. (Data Science)',
    'PA': 'M.E. (Structural Engg)',
    'PB': 'M.E. (Construction Engg)',
    'PC': 'M.E. (Communication Systems)',
    'PD': 'M.E. (CSE)',
    'EL': 'B.E. (ECE - VLSI)',
    'EV': 'B.E. (ECE - VLSI)',
    'FT': 'B.Tech. (Fashion Technology)',
    'ER': 'B.E. (Electrical and Computer Engg)',
  };

  const degree = progMap[progCode] || (progCode ? `B.E. (${progCode})` : 'B.E. (ECE)');
  const regYear = course.regulationYear || 2026;
  const nextYearShort = String(Number(regYear) + 1).slice(2);
  const acadYear = `${regYear}-${nextYearShort}`;

  return `${degree} Degree Program ${acadYear}`;
}

export async function generatePdfDocument(course: Course): Promise<Buffer> {
  let footerSettingValue: string | null = null;
  try {
    if (ConfigSettingsModel.db?.readyState === 1) {
      const configSetting = await ConfigSettingsModel.findOne({ key: 'acmText' });
      footerSettingValue = configSetting?.value || null;
    }
  } catch (err) {
    // MongoDB not connected, proceed with institutional defaults
  }
  const bosMeetingText = 'Passed in BoS Meeting 30.05.2026';
  const acmMeetingText = 'Approved in 71st Academic council meeting 27.06.2026';

  const headerText = getDegreeProgramHeader(course);
  const titleCaps = (course.courseName || '').toUpperCase();

  // 1. Prerequisites formatting
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

  // 2. Course Outcomes formatting
  const coList = course.courseOutcomes || [];
  const coRowsHtml = coList.map(co => `
    <tr>
      <td class="center">${co.coNo}</td>
      <td class="left">${co.statement}</td>
      <td class="center">TPS${co.tpsLevel}</td>
      <td class="center">${co.pi}</td>
      <td class="center">${co.weightage !== undefined ? co.weightage : ''}</td>
      <td class="center">${co.sdgNo && co.sdgNo !== 'NC' ? (String(co.sdgNo).includes(',') ? `SDGs ${co.sdgNo}` : `SDG ${co.sdgNo}`) : 'NC'}</td>
      <td class="center">${co.sdgLevel !== undefined ? co.sdgLevel : ''}</td>
    </tr>
  `).join('');

  // 3. Assessment Pattern Matrix
  const matrix = course.assessmentMatrix || [];
  const isTcp = course.courseType === 'TCP';
  let totalCol1 = 0;
  let totalCol2 = 0;
  let totalCol3 = 0;
  let totalCol4 = 0;
  let totalCol5 = 0;

  const assessmentRowsHtml = coList.map((co, idx) => {
    const row = matrix.find(m => m.coNo === co.coNo);
    let v1: number | string = '';
    let v2: number | string = '';
    let v3: number | string = '';
    let v4: number | string = '';
    let v5: number | string = '';

    if (row) {
      if (isTcp) {
        v1 = row.theoryCat1 && row.theoryCat1 > 0 ? row.theoryCat1 : '';
        v2 = row.theoryCat2 && row.theoryCat2 > 0 ? row.theoryCat2 : '';
        v3 = row.practicalCa && row.practicalCa > 0 ? row.practicalCa : '';
        v4 = row.practicalModel && row.practicalModel > 0 ? row.practicalModel : '';
        v5 = row.tcpTerminal && row.tcpTerminal > 0 ? row.tcpTerminal : '';
      } else {
        v1 = row.cat1 && row.cat1 > 0 ? row.cat1 : '';
        v2 = row.assignment1 && row.assignment1 > 0 ? row.assignment1 : '';
        v3 = row.cat2 && row.cat2 > 0 ? row.cat2 : '';
        v4 = row.assignment2 && row.assignment2 > 0 ? row.assignment2 : '';
        v5 = row.terminalExam && row.terminalExam > 0 ? row.terminalExam : '';
      }
    } else {
      if (isTcp) {
        if (idx === 0) { v1 = 30; v3 = 10; v4 = 10; v5 = 15; }
        else if (idx === 1) { v1 = 40; v2 = 10; v3 = 15; v4 = 15; v5 = 20; }
        else if (idx === 2) { v1 = 30; v2 = 20; v3 = 25; v4 = 25; v5 = 20; }
        else if (idx === 3) { v2 = 40; v3 = 25; v4 = 25; v5 = 25; }
        else if (idx === 4) { v2 = 15; v3 = 15; v4 = 15; v5 = 10; }
        else if (idx === 5) { v2 = 15; v3 = 10; v4 = 10; v5 = 10; }
      } else {
        // Standard distribution fallback if assessmentMatrix is empty
        if (idx === 0 || idx === 1) {
          v1 = 30;
          v2 = 30;
          v5 = 10;
        } else if (idx === 2) {
          v1 = 40;
          v2 = 40;
          v5 = 20;
        } else if (idx === 3 || idx === 4) {
          v3 = 30;
          v4 = 30;
          v5 = 20;
        } else if (idx === 5) {
          v3 = 40;
          v4 = 40;
          v5 = 20;
        }
      }
    }

    if (typeof v1 === 'number') totalCol1 += v1;
    if (typeof v2 === 'number') totalCol2 += v2;
    if (typeof v3 === 'number') totalCol3 += v3;
    if (typeof v4 === 'number') totalCol4 += v4;
    if (typeof v5 === 'number') totalCol5 += v5;

    return `
      <tr>
        <td class="center font-bold">${co.coNo}</td>
        <td class="center">${v1}</td>
        <td class="center">${v2}</td>
        <td class="center">${v3}</td>
        <td class="center">${v4}</td>
        <td class="center">${v5}</td>
      </tr>
    `;
  }).join('');

  // 4. Syllabus Modules formatting
  const modules = course.modules || [];
  const modulesHtml = modules.map(mod => `
    <div class="syllabus-topic">
      <strong>${mod.mainTopic}:</strong> ${Array.isArray(mod.subtopics) ? mod.subtopics.join(' – ') : ''}
    </div>
    <div class="line-space"></div>
  `).join('');

  // 5. Learning Resources
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

  const textBooksHtml = (course.textBooks || []).map(b => `
    <li>${formatCitation(b)}</li>
  `).join('');

  const refBooksHtml = (course.referenceBooks || []).map(b => `
    <li>${formatCitation(b)}</li>
  `).join('');

  const webResourcesHtml = (course.webResources || []).map(w => {
    const t = formatNptel(w);
    return t ? `<li>${t}</li>` : '';
  }).filter(Boolean).join('');

  // 6. Lecture Schedule Items
  let scheduleItems = course.lectureScheduleItems || [];
  if (scheduleItems.length === 0 && modules.length > 0) {
    // Generate schedule items from modules if not pre-populated
    scheduleItems = [];
    modules.forEach((mod, modIdx) => {
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

  let totalPeriods = 0;
  const scheduleRowsHtml = scheduleItems.map(item => {
    const p = Number(item.periods) || 0;
    totalPeriods += p;
    const periodDisplay = item.periods !== undefined && item.periods !== null && item.periods !== '' ? String(item.periods) : '';
    const coDisplay = Array.isArray(item.coMapping) ? item.coMapping.join(', ') : (item.coMapping || '');
    return `
      <tr>
        <td class="center">${item.moduleNo || ''}</td>
        <td class="left">${item.topic || ''}</td>
        <td class="center">${periodDisplay}</td>
        <td class="center">${coDisplay}</td>
      </tr>
    `;
  }).join('');

  // 7. Designers
  const designers = course.designers || [];
  const designersHtml = designers.length > 0
    ? designers.map(d => {
        const parts = [d.name, d.designation].filter(Boolean).join(', ');
        return `${parts}${d.email ? (parts ? ', ' : '') + `<a href="mailto:${d.email}" style="color: #0000FF; text-decoration: underline;">${d.email}</a>` : ''}`;
      }).join('<br>')
    : 'Faculty Member, <a href="mailto:faculty@tce.edu" style="color: #0000FF; text-decoration: underline;">faculty@tce.edu</a>';

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {
    size: A4 portrait;
    margin: 18mm 20mm 20mm 20mm;
  }
  * {
    box-sizing: border-box;
  }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    line-height: 1.35;
    color: #000;
    margin: 0;
    padding: 0;
  }
  .line-space {
    height: 14px;
    clear: both;
  }
  .line-space-sm {
    height: 8px;
    clear: both;
  }
  .plain-heading {
    font-size: 10.5pt;
    font-weight: bold;
    color: #000;
    margin-bottom: 4px;
  }
  .section-p {
    font-size: 10pt;
    line-height: 1.35;
    text-align: justify;
    margin: 0;
    color: #000;
  }
  .gray-banner {
    background-color: #D9D9D9;
    color: #000;
    font-weight: bold;
    font-size: 10pt;
    padding: 3px 6px;
    margin: 0;
    width: 100%;
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
    margin: 0;
  }
  thead {
    display: table-header-group;
  }
  tr {
    page-break-inside: avoid;
  }
  th, td {
    border: 1px solid #000;
    padding: 2px 5px;
    vertical-align: middle;
    color: #000;
    line-height: 1.25;
  }
  th {
    font-weight: bold;
  }
  .center {
    text-align: center;
  }
  .left {
    text-align: left;
  }
  .font-bold {
    font-weight: bold;
  }
  .syllabus-topic {
    font-size: 10pt;
    line-height: 1.35;
    text-align: justify;
    margin: 0;
  }
  .bullet-list {
    margin: 0;
    padding-left: 20px;
    list-style-type: disc;
    font-size: 10pt;
    line-height: 1.35;
  }
  .bullet-list li {
    margin-bottom: 4px;
    text-align: justify;
  }
  .page-break {
    page-break-after: always;
    break-after: page;
  }
</style>
</head>
<body>

  <!-- ==================== PAGE 1 ==================== -->
  <div style="text-align: right; font-size: 9.5pt; font-family: Arial, Helvetica, sans-serif; margin-bottom: 8px; color: #000;">
    ${headerText}
  </div>

  <!-- Header Table -->
  <table>
    <tr>
      <td rowspan="2" class="center font-bold" style="width: ${isTcp ? '16%' : '18%'}; font-size: 10.5pt;">${course.courseCode}</td>
      <td rowspan="2" class="center font-bold" style="width: ${isTcp ? '38%' : '44%'}; font-size: 10.5pt; text-transform: uppercase;">${titleCaps}</td>
      <td class="center" style="width: ${isTcp ? '12%' : '14%'};">Category</td>
      <td class="center" style="width: ${isTcp ? '5%' : '6%'};">L</td>
      <td class="center" style="width: ${isTcp ? '5%' : '6%'};">T</td>
      <td class="center" style="width: ${isTcp ? '5%' : '6%'};">P</td>
      <td class="center" style="width: ${isTcp ? '7%' : '6%'};">Credits</td>
      ${isTcp ? `<td class="center" style="width: 12%;">TE Type</td>` : ''}
    </tr>
    <tr>
      <td class="center">${course.categoryAbbr || 'PCC'}</td>
      <td class="center">${course.L}</td>
      <td class="center">${course.T}</td>
      <td class="center">${course.P}</td>
      <td class="center font-bold">${course.credits}</td>
      ${isTcp ? `<td class="center font-bold">${course.teExamType || 'TCP-T'}</td>` : ''}
    </tr>
  </table>

  <!-- Line space between each section -->
  <div class="line-space"></div>

  <!-- Preamble -->
  <div class="gray-banner">Preamble</div>
  <p class="section-p" style="margin-top: 4px;">${course.preamble || ''}</p>

  <!-- Line space between each section -->
  <div class="line-space"></div>

  <!-- Prerequisite -->
  <div class="gray-banner">Prerequisite</div>
  ${prereqList.length > 0
    ? `<ul class="bullet-list" style="margin-top: 4px;">${prereqList.map(p => `<li>${p}</li>`).join('')}</ul>`
    : `<p class="section-p" style="margin-top: 4px;">NIL</p>`
  }

  <!-- Line space between each section -->
  <div class="line-space"></div>

  <!-- Course Outcomes -->
  <div class="gray-banner">Course Outcomes</div>
  <p class="section-p" style="margin-top: 4px; margin-bottom: 6px;">After the successful completion of the course, students will be able to:</p>
  <table>
    <thead>
      <tr>
        <th style="width: 7%; text-align: center;">No.</th>
        <th style="width: 45%; text-align: left;">Course Outcome</th>
        <th style="width: 10%; text-align: center;">TPS<br>Level</th>
        <th style="width: 14%; text-align: center;">Performance<br>Indicator</th>
        <th style="width: 10%; text-align: center;">CO<br>Weightage</th>
        <th style="width: 8%; text-align: center;">SDG<br>addressed</th>
        <th style="width: 6%; text-align: center;">SDG<br>Level</th>
      </tr>
    </thead>
    <tbody>
      ${coRowsHtml}
    </tbody>
  </table>

  <!-- Line space between each section -->
  <div class="line-space"></div>

  <!-- Assessment Pattern -->
  <div class="gray-banner">Assessment Pattern</div>
  <div class="line-space-sm"></div>
  <table>
    <thead>
      <tr>
        <th rowspan="2" class="center" style="width: 10%;">CO</th>
        <th class="center" style="width: 18%;">${isTcp ? 'Theory CAT1' : 'CAT1'}</th>
        <th class="center" style="width: 18%;">${isTcp ? 'Theory CAT2' : 'Assignment 1'}</th>
        <th class="center" style="width: 18%;">${isTcp ? 'Practical CA' : 'CAT2'}</th>
        <th class="center" style="width: 18%;">${isTcp ? 'Model Test' : 'Assignment 2'}</th>
        <th class="center" style="width: 18%;">Terminal Exam</th>
      </tr>
      <tr>
        <th class="center" style="font-weight: bold; font-size: 8.5pt;">% of Marks</th>
        <th class="center" style="font-weight: bold; font-size: 8.5pt;">% of Marks</th>
        <th class="center" style="font-weight: bold; font-size: 8.5pt;">% of Marks</th>
        <th class="center" style="font-weight: bold; font-size: 8.5pt;">% of Marks</th>
        <th class="center" style="font-weight: bold; font-size: 8.5pt;">% of Marks</th>
      </tr>
    </thead>
    <tbody>
      ${assessmentRowsHtml}
      <tr>
        <td class="center font-bold">Total</td>
        <td class="center font-bold">${totalCol1 || 100}</td>
        <td class="center font-bold">${totalCol2 || 100}</td>
        <td class="center font-bold">${totalCol3 || 100}</td>
        <td class="center font-bold">${totalCol4 || 100}</td>
        <td class="center font-bold">${totalCol5 || 100}</td>
      </tr>
    </tbody>
  </table>

  <!-- Page Break to Page 2 -->
  <div class="page-break"></div>

  <!-- ==================== PAGE 2 ==================== -->
  <div style="text-align: right; font-size: 9.5pt; font-family: Arial, Helvetica, sans-serif; margin-bottom: 8px; color: #000;">
    ${headerText}
  </div>

  <!-- Syllabus -->
  <div class="gray-banner">Syllabus</div>
  <div class="line-space"></div>

  ${modulesHtml}

  <!-- Learning Resources -->
  <div class="gray-banner">6. Learning Resources</div>
  <div class="line-space"></div>

  <div class="gray-banner">6.1 Text Book</div>
  <div class="line-space"></div>

  <ul class="bullet-list">
    ${textBooksHtml}
  </ul>

  <div class="line-space"></div>

  <div class="gray-banner">6.2 Reference Books & Web resources</div>
  <div class="line-space"></div>

  <ul class="bullet-list">
    ${refBooksHtml}
  </ul>

  <div class="line-space"></div>

  <div class="plain-heading">NPTEL Courses</div>
  <div class="line-space-sm"></div>

  <ul class="bullet-list">
    ${webResourcesHtml}
  </ul>

  <!-- Page Break to Page 3 -->
  <div class="page-break"></div>

  <!-- ==================== PAGE 3 ==================== -->
  <div style="text-align: right; font-size: 9.5pt; font-family: Arial, Helvetica, sans-serif; margin-bottom: 8px; color: #000;">
    ${headerText}
  </div>

  <!-- Course Contents and Lecture Schedule -->
  <div class="gray-banner">7. Course Contents and Lecture Schedule</div>
  <div class="line-space"></div>

  <table>
    <thead>
      <tr>
        <th style="width: 12%; text-align: center;">Module<br>No</th>
        <th style="width: 58%; text-align: left;">Topics</th>
        <th style="width: 14%; text-align: center;">No of<br>Periods</th>
        <th style="width: 16%; text-align: center;">Course<br>Outcomes</th>
      </tr>
    </thead>
    <tbody>
      ${scheduleRowsHtml}
      <tr>
        <td colspan="2" class="center font-bold">Total Periods</td>
        <td class="center font-bold">${totalPeriods}</td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <!-- Line space between each section -->
  <div class="line-space"></div>

  <!-- Course Designer(s) -->
  <div class="gray-banner">8. Course Designer(s):</div>
  <div class="line-space"></div>

  <div class="section-p">
    ${designersHtml}
  </div>

</body>
</html>
  `;

  let puppeteer: any;
  try {
    const puppeteerModule = await import('puppeteer');
    puppeteer = puppeteerModule.default || puppeteerModule;
  } catch (err: any) {
    throw new Error('PDF export requires Puppeteer runtime: ' + err.message);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' as any });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '15mm',
        bottom: '15mm',
        left: '20mm',
        right: '20mm',
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-family: Arial, sans-serif; font-size: 8pt; width: 100%; display: flex; justify-content: space-between; padding-left: 20mm; padding-right: 20mm; color: #000; -webkit-print-color-adjust: exact;">
          <span>${bosMeetingText}</span>
          <span>${acmMeetingText}</span>
        </div>
      `,
      printBackground: true,
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
