import { Course, getDisplayTeType } from '@syllabusforge/shared';
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
    'AM': 'B.E. (AIML)',
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

export function buildCourseInnerHtml(
  course: Course,
  options?: {
    includeApprovalFooter?: boolean;
    bosMeetingText?: string;
    academicCouncilText?: string;
  }
): { headerText: string; bodyHtml: string; bosMeetingText: string; acmMeetingText: string; shouldIncludeFooter: boolean } {
  const shouldIncludeFooter = options?.includeApprovalFooter !== false;
  const bosMeetingText = options?.bosMeetingText || `Passed in BoS Meeting ${course.bosMeetingDate || '30.05.2026'}`;
  const acmMeetingText = options?.academicCouncilText || `Approved in 71<sup>st</sup> Academic council meeting ${course.academicCouncilDate || '27.06.2026'}`;

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
  const isPractical = course.courseType === 'PRACTICAL';
  let totalCol1 = 0;
  let totalCol2 = 0;
  let totalCol3 = 0;
  let totalCol4 = 0;
  let totalCol5 = 0;

  // Practical totals
  let totalPracticalCa = 0;
  let totalPracticalModel = 0;
  let totalPracticalTerm = 0;
  const terminalExamBracket = (course.courseType === 'PRACTICAL' || course.teExamType === 'TCP-P' || course.teExamType === '100% Practical') ? '(Practical)' : '(Theory)';

  const practicalRowsHtml = isPractical
    ? coList.map((co, idx) => {
        const row = matrix.find(m => m.coNo === co.coNo);
        let ca: number | string = '';
        let model: number | string = '';
        let term: number | string = '';

        if (row) {
          ca = row.practicalCa && row.practicalCa > 0 ? row.practicalCa : '';
          model = row.practicalModel && row.practicalModel > 0 ? row.practicalModel : '';
          term = row.terminalExam && row.terminalExam > 0 ? row.terminalExam : (row.tcpTerminal && row.tcpTerminal > 0 ? row.tcpTerminal : '');
        }

        if (typeof ca === 'number') totalPracticalCa += ca;
        if (typeof model === 'number') totalPracticalModel += model;
        if (typeof term === 'number') totalPracticalTerm += term;

        return `
          <tr>
            <td class="left" style="padding-left: 10px;">${co.coNo}</td>
            <td class="center">${ca !== '' ? ca : ''}</td>
            <td class="center">${model !== '' ? model : ''}</td>
            <td class="center">${term !== '' ? term : ''}</td>
          </tr>
        `;
      }).join('')
    : '';

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

  // Helper for experiment objectives (e.g. 1, 3)
  const getExperimentObjectives = (exp: any): string => {
    if (exp.objectiveNos && exp.objectiveNos.length > 0) {
      return exp.objectiveNos.join(', ');
    }
    const objSet = new Set<number>();
    (exp.coNos || []).forEach((cNo: string) => {
      const matched = (course.courseOutcomes || []).find(c => c.coNo === cNo);
      if (matched?.objectiveNo) objSet.add(matched.objectiveNo);
    });
    const sorted = Array.from(objSet).sort((a, b) => a - b);
    return sorted.length > 0 ? sorted.join(', ') : '—';
  };

  const getExperimentLevelNumber = (exp: any): string => {
    const raw = String(exp.level || 1);
    const match = raw.match(/\d+/);
    return match ? match[0] : '1';
  };

  // 4b. Laboratory Experiments formatting
  const experimentsList = course.experiments || [];
  const hasExpHours = isTcp || experimentsList.some((e: any) => e.hours !== undefined && e.hours !== null);
  const totalExpHours = experimentsList.reduce((sum: number, e: any) => sum + (Number(e.hours) || 0), 0);

  const experimentsRowsHtml = experimentsList.length > 0
    ? experimentsList.map((exp, idx) => `
      <tr>
        <td class="center">${exp.slNo || idx + 1}</td>
        <td class="left">${exp.name || ''}</td>
        ${hasExpHours ? `<td class="center font-medium">${exp.hours !== undefined && exp.hours !== null ? exp.hours : '-'}</td>` : ''}
        <td class="center">${getExperimentLevelNumber(exp)}</td>
        <td class="center">${getExperimentObjectives(exp)}</td>
        <td class="center font-bold">${Array.isArray(exp.coNos) ? exp.coNos.join(', ') : (exp.coNos || '')}</td>
      </tr>
    `).join('') + (hasExpHours && totalExpHours > 0 ? `
      <tr style="background-color: #F2F2F2; font-weight: bold;">
        <td colspan="2" class="center font-bold">Total Practical Hours</td>
        <td class="center font-bold">${totalExpHours}</td>
        <td colspan="3" class="center"></td>
      </tr>
    ` : '')
    : `
      <tr>
        <td colspan="${hasExpHours ? 6 : 5}" class="center" style="font-style: italic; color: #64748b; padding: 10px;">No laboratory experiments entered yet</td>
      </tr>
    `;

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
        const parts = [d.name, d.designation, d.department].filter(Boolean).join(', ');
        return `${parts}${d.email ? (parts ? ', ' : '') + `<a href="mailto:${d.email}" style="color: #0000FF; text-decoration: underline;">${d.email}</a>` : ''}`;
      }).join('<br>')
    : 'Faculty Member, <a href="mailto:faculty@tce.edu" style="color: #0000FF; text-decoration: underline;">faculty@tce.edu</a>';


  const subtitleFormatted = course.courseSubtitle?.trim()
    ? (course.courseSubtitle.trim().startsWith('(') && course.courseSubtitle.trim().endsWith(')')
        ? course.courseSubtitle.trim()
        : `(${course.courseSubtitle.trim()})`)
    : '';

  const bodyHtml = `
  <!-- ==================== PAGE 1 ==================== -->
  <!-- Header Table -->
  <table>
    <tr>
      <td rowspan="2" class="center font-bold" style="width: ${isTcp ? '16%' : '18%'}; font-size: 10.5pt;">${course.courseCode}</td>
      <td rowspan="2" class="center font-bold" style="width: ${isTcp ? '38%' : '44%'}; font-size: 10.5pt;">
        <div style="text-transform: uppercase;">${titleCaps}</div>
        ${subtitleFormatted ? `<div style="font-weight: normal; font-size: 8.5pt; text-transform: none; margin-top: 3px;">${subtitleFormatted}</div>` : ''}
      </td>
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
      ${isTcp ? `<td class="center font-bold">${getDisplayTeType(course.teExamType)}</td>` : ''}
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
  ${isPractical ? `
  <div class="gray-banner">Assessment Pattern</div>
  <div class="line-space-sm"></div>
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr>
        <th rowspan="3" class="center" style="width: 16%;">CO</th>
        <th colspan="2" class="center">Practical</th>
        <th rowspan="2" class="center" style="width: 28%;">Terminal Exam<br />${terminalExamBracket}</th>
      </tr>
      <tr>
        <th class="center" style="width: 28%;">OCR/Continuous Assessment</th>
        <th class="center" style="width: 28%;">Model Test CO-wise</th>
      </tr>
      <tr>
        <th class="center" style="font-weight: bold; font-size: 8.5pt;">% of Marks</th>
        <th class="center" style="font-weight: bold; font-size: 8.5pt;">% of Marks</th>
        <th class="center" style="font-weight: bold; font-size: 8.5pt;">% of Marks</th>
      </tr>
    </thead>
    <tbody>
      ${practicalRowsHtml}
      <tr>
        <td class="left" style="font-weight: bold; padding-left: 10px;">Total</td>
        <td class="center font-bold">${totalPracticalCa || 100}%</td>
        <td class="center font-bold">${totalPracticalModel || 100}%</td>
        <td class="center font-bold">${totalPracticalTerm || 100}%</td>
      </tr>
    </tbody>
  </table>
  ` : `
  <div class="gray-banner">Assessment Pattern</div>
  <div class="line-space-sm"></div>
  <div class="plain-heading">Continuous Assessment – Theory</div>
  <table>
    <thead>
      <tr>
        <th rowspan="3" class="center" style="width: 10%;">CO</th>
        <th colspan="4" class="center">Continuous Assessment</th>
        <th rowspan="2" class="center" style="width: 18%;">Terminal Exam<br>${terminalExamBracket}</th>
      </tr>
      <tr>
        <th class="center" style="width: 18%;">CAT1</th>
        <th class="center" style="width: 18%;">CAT2</th>
        <th class="center" style="width: 18%;">Assignment-1 / Tutorial</th>
        <th class="center" style="width: 18%;">Assignment-2</th>
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
        <td class="center font-bold">${totalCol1 || 100}%</td>
        <td class="center font-bold">${totalCol2 || 100}%</td>
        <td class="center font-bold">${totalCol3 || 100}%</td>
        <td class="center font-bold">${totalCol4 || 100}%</td>
        <td class="center font-bold">${totalCol5 || 100}%</td>
      </tr>
    </tbody>
  </table>
  `}

  ${isPractical ? `
  <!-- ==================== PRACTICAL: EXPERIMENTS & DESIGNERS ==================== -->
  <div class="line-space"></div>
  <div class="gray-banner">List of Experiments with CO Mapping</div>
  <div class="line-space"></div>

  <table>
    <thead>
      <tr>
        <th style="width: ${hasExpHours ? '7%' : '8%'}; text-align: center;">Sl. No.</th>
        <th style="width: ${hasExpHours ? '47%' : '50%'}; text-align: left;">Name of the Experiment</th>
        ${hasExpHours ? '<th style="width: 8%; text-align: center;">Hours</th>' : ''}
        <th style="width: ${hasExpHours ? '12%' : '14%'}; text-align: center;">Level of Experiment</th>
        <th style="width: ${hasExpHours ? '13%' : '14%'}; text-align: center;">Objective(s)</th>
        <th style="width: ${hasExpHours ? '13%' : '14%'}; text-align: center;">COs Addressed</th>
      </tr>
    </thead>
    <tbody>
      ${experimentsRowsHtml}
    </tbody>
  </table>

  <div class="line-space"></div>

  <!-- Course Designer(s) -->
  <div class="gray-banner">Course Designer(s):</div>
  <div class="line-space"></div>

  <div class="section-p">
    ${designersHtml}
  </div>
  ` : ''}

  ${!isPractical ? `
  <!-- ==================== PAGE 2 (THEORY & TCP) ==================== -->
  <div class="line-space"></div>

  <!-- Syllabus -->
  <div class="gray-banner">Syllabus</div>
  <div class="line-space"></div>

  ${modulesHtml}

  ${isTcp && experimentsList.length > 0 ? `
  <div style="font-size: 10pt; font-weight: bold; text-decoration: underline; margin-bottom: 6px;">Practical:</div>
  <div class="line-space-sm"></div>
  <div class="section-p">
    ${experimentsList.map(e => `${e.slNo || ''}. ${e.name || ''}${e.hours ? ` (${e.hours} Hours)` : ''}`).join('; ')}
  </div>
  <div class="line-space"></div>
  ` : ''}

  <!-- Learning Resources -->
  <div class="gray-banner">Learning Resources</div>
  <div class="line-space"></div>

  ${(course.textBooks || []).length > 0 ? `
  <div class="plain-heading">Text Book(s):</div>
  <ol class="bullet-list" style="list-style-type: decimal;">
    ${textBooksHtml}
  </ol>
  <div class="line-space-sm"></div>
  ` : ''}

  ${(course.referenceBooks || []).length > 0 ? `
  <div class="plain-heading">Reference Book(s):</div>
  <ol class="bullet-list" style="list-style-type: decimal;">
    ${refBooksHtml}
  </ol>
  <div class="line-space-sm"></div>
  ` : ''}

  ${webResourcesHtml ? `
  <div class="plain-heading">NPTEL Courses</div>
  <ol class="bullet-list" style="list-style-type: decimal;">
    ${webResourcesHtml}
  </ol>
  <div class="line-space-sm"></div>
  ` : ''}

  <!-- ==================== PAGE 3 (THEORY & TCP) ==================== -->
  ${(scheduleItems.length > 0 || modules.length > 0 || (isTcp && experimentsList.length > 0)) ? `
  <div class="line-space"></div>
  ` : ''}
  ${(scheduleItems.length > 0 || modules.length > 0) ? `
  <!-- 7. Course Contents and Lecture Schedule -->
  <div class="gray-banner">Course Contents and Lecture Schedule</div>
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

  <div class="line-space"></div>
  ` : ''}

  ${isTcp && experimentsList.length > 0 ? `
  <!-- List of Experiments with CO Mapping (TCP) -->
  <div class="gray-banner">List of Experiments with CO Mapping</div>
  <div class="line-space"></div>

  <table>
    <thead>
      <tr>
        <th style="width: 7%; text-align: center;">Sl. No.</th>
        <th style="width: 47%; text-align: left;">Name of the Experiment</th>
        <th style="width: 8%; text-align: center;">Hours</th>
        <th style="width: 12%; text-align: center;">Level of Experiment</th>
        <th style="width: 13%; text-align: center;">Objective(s)</th>
        <th style="width: 13%; text-align: center;">COs Addressed</th>
      </tr>
    </thead>
    <tbody>
      ${experimentsRowsHtml}
    </tbody>
  </table>

  <div class="line-space"></div>
  ` : ''}

  <!-- Course Designer(s) -->
  <div class="gray-banner">Course Designer(s):</div>
  <div class="line-space"></div>

  <div class="section-p">
    ${designersHtml}
  </div>
  ` : ''}
  `;

  return { headerText, bodyHtml, bosMeetingText, acmMeetingText, shouldIncludeFooter };
}

const COMMON_PDF_STYLES = `
  @page {
    size: A4 portrait;
    margin: 12mm 15mm 12mm 15mm;
  }
  * {
    box-sizing: border-box;
  }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    line-height: 1.3;
    color: #000;
    margin: 0;
    padding: 0;
  }
  .line-space {
    height: 8px;
    clear: both;
  }
  .line-space-sm {
    height: 5px;
    clear: both;
  }
  .plain-heading {
    font-size: 10pt;
    font-weight: bold;
    color: #000;
    margin-top: 4px;
    margin-bottom: 2px;
  }
  .section-p {
    font-size: 10pt;
    line-height: 1.3;
    text-align: justify;
    margin: 0;
    color: #000;
  }
  .gray-banner {
    background-color: #D9D9D9;
    color: #000;
    font-weight: bold;
    font-size: 10pt;
    padding: 2.5px 5px;
    margin: 0;
    width: 100%;
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9pt;
    margin: 0;
  }
  thead {
    display: table-header-group;
  }
  tr { page-break-inside: avoid; break-inside: avoid; }
  th, td {
    border: 1px solid #000;
    padding: 1.5px 4px;
    vertical-align: middle;
    color: #000;
    line-height: 1.2;
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
    font-size: 9.5pt;
    line-height: 1.3;
    text-align: justify;
    margin: 0;
  }
  .bullet-list {
    margin: 0;
    padding-left: 18px;
    list-style-type: disc;
    font-size: 9.5pt;
    line-height: 1.3;
  }
  .bullet-list li {
    margin-bottom: 2px;
    text-align: justify;
  }
  .page-break {
    page-break-after: always;
    break-after: page;
  }
  .course-separator {
    page-break-before: always;
    break-before: page;
  }
`;

export async function generatePdfDocument(
  course: Course,
  options?: {
    includeApprovalFooter?: boolean;
    bosMeetingText?: string;
    academicCouncilText?: string;
  }
): Promise<Buffer> {
  const { headerText, bodyHtml, bosMeetingText, acmMeetingText, shouldIncludeFooter } = buildCourseInnerHtml(course, options);
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>${COMMON_PDF_STYLES}</style>
</head>
<body>
${bodyHtml}
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
    pipe: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' as any });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '14mm', bottom: '15mm', left: '15mm', right: '15mm' },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 8pt; width: 100%; text-align: right; padding-right: 15mm; color: #000; -webkit-print-color-adjust: exact;">
          <span>${headerText}</span>
        </div>
      `,
      footerTemplate: shouldIncludeFooter ? `
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 8pt; width: 100%; display: flex; justify-content: space-between; padding-left: 15mm; padding-right: 15mm; color: #000; -webkit-print-color-adjust: exact;">
          <span>${bosMeetingText}</span>
          <span>${acmMeetingText}</span>
        </div>
      ` : '<div></div>',
      printBackground: true,
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

export function generateMergedCoursesHtml(
  courses: Course[],
  metadata: {
    department?: string;
    regulationYear?: number;
    includeApprovalFooter?: boolean;
    bosMeetingText?: string;
    academicCouncilText?: string;
  }
): string {
  if (!courses || courses.length === 0) {
    return '<html><body><p>No courses provided.</p></body></html>';
  }

  const shouldIncludeFooter = metadata.includeApprovalFooter !== false;

  // Render all courses, each wrapped in standard print page-wrapper with running headers and footers
  const renderedCourses = courses.map((course, idx) => {
    const meta = buildCourseInnerHtml(course, metadata);
    return `
    <div class="${idx > 0 ? 'course-separator' : ''}">
      <table class="print-page-wrapper">
        <thead>
          <tr>
            <th>
              <div class="running-header-bar">${meta.headerText}</div>
            </th>
          </tr>
        </thead>
        ${shouldIncludeFooter ? `
        <tfoot>
          <tr>
            <td>
              <div class="running-footer-bar">
                <span>${meta.bosMeetingText}</span>
                <span>${meta.acmMeetingText}</span>
              </div>
              <div class="running-footer-spacer"></div>
            </td>
          </tr>
        </tfoot>` : ''}
        <tbody>
          <tr>
            <td>
              ${meta.bodyHtml}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Curriculum_Bundle_${(metadata.department || 'Curriculum').replace(/[^a-zA-Z0-9_-]/g, '_')}_${metadata.regulationYear || 2026}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 12mm 15mm 12mm 15mm;
  }
  *, *::before, *::after {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    line-height: 1.35;
    color: #000000;
    margin: 0;
    padding: 0;
    background: #FFFFFF;
  }
  .print-page-wrapper {
    width: 100%;
    border-collapse: collapse;
    border: none !important;
  }
  .print-page-wrapper > thead {
    display: table-header-group !important;
  }
  .print-page-wrapper > tfoot {
    display: table-footer-group !important;
  }
  .print-page-wrapper > thead > tr > th,
  .print-page-wrapper > tfoot > tr > td,
  .print-page-wrapper > tbody > tr > td {
    border: none !important;
    padding: 0 !important;
    font-weight: normal;
    text-align: left;
  }
  .running-header-bar {
    width: 100%;
    text-align: right;
    font-size: 8.5pt;
    color: #000000;
    padding-bottom: 6px;
    font-family: Arial, Helvetica, sans-serif;
  }
  .running-footer-bar {
    width: 100%;
    display: flex;
    justify-content: space-between;
    font-size: 8pt;
    color: #000000;
    border-top: 1px solid #000000;
    padding-top: 4px;
    margin-top: 8px;
    font-family: Arial, Helvetica, sans-serif;
  }
  .running-footer-spacer {
    height: 10px;
  }
  .course-separator {
    page-break-before: always;
    break-before: page;
  }
  ${COMMON_PDF_STYLES}
</style>
</head>
<body>
  ${renderedCourses}
</body>
</html>`;
}

export async function generateMergedCoursesPdf(
  courses: Course[],
  metadata: {
    department?: string;
    regulationYear?: number;
    includeApprovalFooter?: boolean;
    bosMeetingText?: string;
    academicCouncilText?: string;
  }
): Promise<Buffer> {
  if (!courses || courses.length === 0) {
    throw new Error('No courses provided for merged PDF.');
  }

  const shouldIncludeFooter = metadata.includeApprovalFooter !== false;
  const firstCourseMeta = buildCourseInnerHtml(courses[0], metadata);
  const headerText = firstCourseMeta.headerText;
  const bosMeetingText = firstCourseMeta.bosMeetingText;
  const acmMeetingText = firstCourseMeta.acmMeetingText;

  const combinedBodies = courses.map((course, idx) => {
    const { bodyHtml } = buildCourseInnerHtml(course, metadata);
    if (idx === 0) return bodyHtml;
    return `<div class="course-separator"></div>${bodyHtml}`;
  }).join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>${COMMON_PDF_STYLES}</style>
</head>
<body>
${combinedBodies}
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
    pipe: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' as any });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '14mm', bottom: '15mm', left: '15mm', right: '15mm' },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 8pt; width: 100%; text-align: right; padding-right: 15mm; color: #000; -webkit-print-color-adjust: exact;">
          <span>${headerText}</span>
        </div>
      `,
      footerTemplate: shouldIncludeFooter ? `
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 8pt; width: 100%; display: flex; justify-content: space-between; padding-left: 15mm; padding-right: 15mm; color: #000; -webkit-print-color-adjust: exact;">
          <span>${bosMeetingText}</span>
          <span>${acmMeetingText}</span>
        </div>
      ` : '<div></div>',
      printBackground: true,
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
