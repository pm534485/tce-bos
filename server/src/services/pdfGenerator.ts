import { Course, getDisplayTeType, formatDesignerName, LAB_OBJECTIVES_LEGEND_TEXT, isPgCourse } from '@syllabusforge/shared';
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
    'EL': 'B.Tech. Electronics Engineering (VLSI Design and Technology)',
    'EV': 'B.Tech. Electronics Engineering (VLSI Design and Technology)',
    'FT': 'B.Tech. (Fashion Technology)',
    'ER': 'B.E. (Electrical and Computer Engg)',
  };

  const regYear = course.regulationYear || 2026;
  const nextYearShort = String(Number(regYear) + 1).slice(2);
  const acadYear = `${regYear}-${nextYearShort}`;

  if (progCode === 'EL' || progCode === 'EV') {
    return `B.Tech. Electronics Engineering (VLSI Design and Technology) Program ${acadYear}`;
  }

  const degree = progMap[progCode] || (progCode ? `B.E. (${progCode})` : 'B.E. (ECE)');

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
  const isPg = isPgCourse(course);
  const coList = course.courseOutcomes || [];
  const coRowsHtml = coList.map(co => `
    <tr>
      <td class="center">${co.coNo}</td>
      <td class="left">${co.statement}</td>
      <td class="center">TPS${co.tpsLevel}</td>
      ${!isPg ? `<td class="center">${co.pi || ''}</td>` : ''}
      <td class="center">${co.weightage !== undefined ? co.weightage : ''}</td>
      <td class="center">${co.sdgNo && co.sdgNo !== 'NC' ? (String(co.sdgNo).includes(',') ? `SDGs ${co.sdgNo}` : `SDG ${co.sdgNo}`) : 'NC'}</td>
      <td class="center">${co.sdgLevel !== undefined ? co.sdgLevel : ''}</td>
    </tr>
  `).join('');

  // 3. Assessment Pattern Matrix
  const matrix = course.assessmentMatrix || [];
  const isTcp = course.courseType === 'TCP';
  const isPractical = course.courseType === 'PRACTICAL';
  const isBajaj = course.courseType === 'BAJAJ';
  let totalCol1 = 0;
  let totalCol2 = 0;
  let totalCol3 = 0;
  let totalCol4 = 0;
  let totalCol5 = 0;

  // Bajaj Assessment Pattern
  const bajajPattern = course.bajajAssessmentPattern;
  const bajajTheoryTpsLevels = bajajPattern?.theoryTpsLevels || [1, 2, 3];
  const bajajPracticalTpsLevels = bajajPattern?.practicalTpsLevels || [1, 2, 3];
  const bajajTerminalTpsLevels = bajajPattern?.terminalTpsLevels || [1, 2, 3];
  const bajajCatName = bajajPattern?.catName || 'Assessment CAT – 1';

  const defaultBajajRows: Array<{ coNo: string; theory: Record<number, number>; practical: Record<number, number>; terminal: Record<number, number> }> = [
    { coNo: 'CO1', theory: { 2: 10 }, practical: { 3: 20 }, terminal: { 3: 20 } },
    { coNo: 'CO2', theory: { 2: 5, 3: 15 }, practical: { 3: 20 }, terminal: { 3: 20 } },
    { coNo: 'CO3', theory: { 2: 5, 3: 15 }, practical: { 3: 20 }, terminal: { 3: 20 } },
    { coNo: 'CO4', theory: { 3: 20 }, practical: { 3: 20 }, terminal: { 3: 20 } },
    { coNo: 'CO5', theory: { 2: 5, 3: 10 }, practical: { 3: 10 }, terminal: { 3: 10 } },
    { coNo: 'CO6', theory: { 2: 5, 3: 10 }, practical: { 3: 10 }, terminal: { 3: 10 } },
  ];

  const bajajRows = coList.map((co, idx) => {
    const existing = bajajPattern?.rows?.find(r => r.coNo === co.coNo);
    const fallback = defaultBajajRows[idx] || { theory: {}, practical: {}, terminal: {} };
    return {
      coNo: co.coNo,
      theoryMarks: (existing?.theoryMarks && Object.keys(existing.theoryMarks).length > 0) ? existing.theoryMarks : fallback.theory,
      practicalMarks: (existing?.practicalMarks && Object.keys(existing.practicalMarks).length > 0) ? existing.practicalMarks : fallback.practical,
      terminalMarks: (existing?.terminalMarks && Object.keys(existing.terminalMarks).length > 0) ? existing.terminalMarks : fallback.terminal,
    };
  });

  // Bajaj PO-PSO Mapping rows
  const defaultPoPsoRows = [
    { coNo: 'CO1', po1: 'M', po2: 'L', po8: 'L', po9: 'L', po10: 'L', po11: 'L', po12: 'L', pso1: 'L', pso3: 'L' },
    { coNo: 'CO2', po1: 'S', po2: 'M', po3: 'L', po4: 'L', po8: 'L', po9: 'L', po10: 'L', po11: 'L', po12: 'L', pso2: 'L', pso3: 'L' },
    { coNo: 'CO3', po1: 'S', po2: 'M', po3: 'L', po5: 'S', po8: 'L', po9: 'L', po10: 'L', po11: 'L', po12: 'L', pso1: 'M', pso2: 'L', pso3: 'L' },
    { coNo: 'CO4', po1: 'S', po2: 'M', po3: 'L', po4: 'L', po5: 'S', po6: 'L', po8: 'L', po9: 'L', po10: 'L', po11: 'L', po12: 'L', pso1: 'M', pso2: 'L', pso3: 'L' },
    { coNo: 'CO5', po1: 'S', po2: 'M', po3: 'L', po4: 'L', po6: 'L', po8: 'L', po9: 'L', po10: 'L', po11: 'L', po12: 'L', pso1: 'M', pso3: 'L' },
    { coNo: 'CO6', po1: 'S', po2: 'L', po3: 'L', po4: 'L', po8: 'L', po9: 'L', po10: 'L', po11: 'L', po12: 'L', pso2: 'L', pso3: 'L' },
  ];

  const poPsoRows = coList.map((co, idx) => {
    const existing = (course.poPsoMapping || []).find(r => r.coNo === co.coNo);
    const fallback = defaultPoPsoRows[idx] || {};
    return {
      coNo: co.coNo,
      po1: existing?.po1 || (fallback as any).po1 || '-',
      po2: existing?.po2 || (fallback as any).po2 || '-',
      po3: existing?.po3 || (fallback as any).po3 || '-',
      po4: existing?.po4 || (fallback as any).po4 || '-',
      po5: existing?.po5 || (fallback as any).po5 || '-',
      po6: existing?.po6 || (fallback as any).po6 || '-',
      po7: existing?.po7 || (fallback as any).po7 || '-',
      po8: existing?.po8 || (fallback as any).po8 || '-',
      po9: existing?.po9 || (fallback as any).po9 || '-',
      po10: existing?.po10 || (fallback as any).po10 || '-',
      po11: existing?.po11 || (fallback as any).po11 || '-',
      po12: existing?.po12 || (fallback as any).po12 || '-',
      pso1: existing?.pso1 || (fallback as any).pso1 || '-',
      pso2: existing?.pso2 || (fallback as any).pso2 || '-',
      pso3: existing?.pso3 || (fallback as any).pso3 || '-',
    };
  });

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
    <div class="syllabus-topic" style="margin-bottom: 4px; line-height: 1.35; text-align: justify;">
      <strong>${mod.mainTopic}:</strong> ${Array.isArray(mod.subtopics) ? mod.subtopics.join(' – ') : ''}
    </div>
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
        const fullName = formatDesignerName(d);
        const parts = [fullName, d.designation, d.department].filter(Boolean).join(', ');
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
  ${isBajaj ? `
  <table>
    <tr>
      <td rowspan="3" class="center font-bold" style="width: 16%; font-size: 11pt;">${course.courseCode}</td>
      <td rowspan="3" class="center font-bold" style="width: 40%; font-size: 11pt;">
        <div style="text-transform: uppercase;">${titleCaps}</div>
        ${subtitleFormatted ? `<div style="font-weight: normal; font-size: 9pt; text-transform: none; margin-top: 3px;">${subtitleFormatted}</div>` : ''}
      </td>
      <td class="center" style="width: 12%;">Category</td>
      <td class="center" style="width: 5%;">L</td>
      <td class="center" style="width: 5%;">T</td>
      <td class="center" style="width: 5%;">P</td>
      <td rowspan="2" class="center font-bold" style="width: 7%;">C</td>
      <td rowspan="2" class="center font-bold" style="width: 10%;">Total<br>Hours</td>
    </tr>
    <tr>
      <td class="center">${course.categoryAbbr || 'PCC'}</td>
      <td class="center">${course.L !== undefined && course.L !== null ? course.L : 0}</td>
      <td class="center">${course.T !== undefined && course.T !== null ? course.T : 0}</td>
      <td class="center">${course.P !== undefined && course.P !== null ? course.P : 0}</td>
    </tr>
    <tr>
      <td class="center font-bold">Hours</td>
      <td class="center">${(Number(course.L) || 0) * 14}</td>
      <td class="center">${(Number(course.T) || 0) * 14}</td>
      <td class="center">${(Number(course.P) || 0) * 14}</td>
      <td class="center font-bold">${course.credits !== undefined && course.credits !== null ? course.credits : 0}</td>
      <td class="center font-bold">${((Number(course.L) || 0) + (Number(course.T) || 0) + (Number(course.P) || 0)) * 14}</td>
    </tr>
  </table>
  ` : `
  <table>
    <tr>
      <td rowspan="2" class="center font-bold" style="width: ${isTcp ? '16%' : '18%'}; font-size: 11pt;">${course.courseCode}</td>
      <td rowspan="2" class="center font-bold" style="width: ${isTcp ? '38%' : '44%'}; font-size: 11pt;">
        <div style="text-transform: uppercase;">${titleCaps}</div>
        ${subtitleFormatted ? `<div style="font-weight: normal; font-size: 9pt; text-transform: none; margin-top: 3px;">${subtitleFormatted}</div>` : ''}
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
  `}

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
  ${!isBajaj ? '<p class="section-p" style="margin-top: 4px; margin-bottom: 6px;">After the successful completion of the course, students will be able to:</p>' : '<div class="line-space-sm"></div>'}
  <table>
    <thead>
      ${isBajaj ? `
      <tr>
        <th class="center" style="width: 10%;">CO#</th>
        <th style="width: 52%; text-align: left;">Course Outcomes</th>
        <th class="center" style="width: 16%;">TCE<br>Proficiency Scale</th>
        <th class="center" style="width: 11%;">Expected<br>Outcome in %</th>
        <th class="center" style="width: 11%;">Expected<br>Attainment Level %</th>
      </tr>
      ` : `
      <tr>
        <th style="width: 7%; text-align: center;">No.</th>
        <th style="width: ${isPg ? '55%' : '45%'}; text-align: left;">Course Outcome</th>
        <th style="width: ${isPg ? '13%' : '10%'}; text-align: center;">TPS<br>Level</th>
        ${!isPg ? '<th style="width: 14%; text-align: center;">Performance<br>Indicator</th>' : ''}
        <th style="width: ${isPg ? '10%' : '10%'}; text-align: center;">CO<br>Weightage</th>
        <th style="width: ${isPg ? '9%' : '8%'}; text-align: center;">SDG<br>addressed</th>
        <th style="width: 6%; text-align: center;">SDG<br>Level</th>
      </tr>
      `}
    </thead>
    <tbody>
      ${isBajaj ? coList.map(co => `
        <tr>
          <td class="center font-bold">${co.coNo}</td>
          <td>${co.statement}</td>
          <td class="center font-bold">TPS${co.tpsLevel || 3}</td>
          <td class="center">${co.expectedProficiency !== undefined ? co.expectedProficiency : 70}</td>
          <td class="center">${co.expectedAttainment !== undefined ? co.expectedAttainment : 60}</td>
        </tr>
      `).join('') : coRowsHtml}
    </tbody>
  </table>

  ${isBajaj ? `
  <div class="line-space"></div>
  <div class="gray-banner">Mapping with Programme Outcomes</div>
  <table style="table-layout: fixed;">
    <thead>
      <tr>
        <th class="center font-bold" style="width: 7%;">COs</th>
        ${Array.from({ length: 12 }, (_, i) => `<th class="center font-bold">PO ${i+1}</th>`).join('')}
        ${Array.from({ length: 3 }, (_, i) => `<th class="center font-bold">PSO ${i+1}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${poPsoRows.map(row => `
        <tr>
          <td class="center font-bold">${row.coNo}</td>
          ${Array.from({ length: 12 }, (_, i) => `<td class="center">${(row as any)['po' + (i+1)] || '-'}</td>`).join('')}
          ${Array.from({ length: 3 }, (_, i) => `<td class="center">${(row as any)['pso' + (i+1)] || '-'}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div style="font-size: 9pt; font-weight: bold; margin-top: 4px;">S- Strong; M-Medium; L-Low</div>
  ` : ''}

  <!-- Line space between each section -->
  <div class="line-space"></div>

  <!-- Assessment Pattern -->
  ${isBajaj ? `
  <div class="gray-banner">Assessment Pattern</div>
  <div class="line-space-sm"></div>
  <table style="table-layout: fixed;">
    <thead>
      <tr>
        <th rowspan="3" class="center font-bold" style="width: 10%;">CO</th>
        <th colspan="${bajajTheoryTpsLevels.length + bajajPracticalTpsLevels.length}" class="center font-bold">${bajajCatName}</th>
        <th colspan="${bajajTerminalTpsLevels.length}" class="center font-bold">Terminal Exam Practical</th>
      </tr>
      <tr>
        <th colspan="${bajajTheoryTpsLevels.length}" class="center font-bold">Theory</th>
        <th colspan="${bajajPracticalTpsLevels.length}" class="center font-bold">Practical</th>
        <th colspan="${bajajTerminalTpsLevels.length}" class="center font-bold">Practical</th>
      </tr>
      <tr>
        ${bajajTheoryTpsLevels.map(lvl => `<th class="center font-bold" style="font-size: 10pt;">${lvl}</th>`).join('')}
        ${bajajPracticalTpsLevels.map(lvl => `<th class="center font-bold" style="font-size: 10pt;">${lvl}</th>`).join('')}
        ${bajajTerminalTpsLevels.map(lvl => `<th class="center font-bold" style="font-size: 10pt;">${lvl}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${bajajRows.map(r => `
        <tr>
          <td class="center font-bold">${r.coNo}</td>
          ${bajajTheoryTpsLevels.map(lvl => `<td class="center">${r.theoryMarks[lvl] && r.theoryMarks[lvl] > 0 ? r.theoryMarks[lvl] : ''}</td>`).join('')}
          ${bajajPracticalTpsLevels.map(lvl => `<td class="center">${r.practicalMarks[lvl] && r.practicalMarks[lvl] > 0 ? r.practicalMarks[lvl] : ''}</td>`).join('')}
          ${bajajTerminalTpsLevels.map(lvl => `<td class="center">${r.terminalMarks[lvl] && r.terminalMarks[lvl] > 0 ? r.terminalMarks[lvl] : ''}</td>`).join('')}
        </tr>
      `).join('')}
      <tr>
        <td class="center font-bold">Total</td>
        ${bajajTheoryTpsLevels.map(lvl => {
          const sum = bajajRows.reduce((acc, r) => acc + (Number(r.theoryMarks[lvl]) || 0), 0);
          return `<td class="center font-bold">${sum > 0 ? sum : ''}</td>`;
        }).join('')}
        ${bajajPracticalTpsLevels.map(lvl => {
          const sum = bajajRows.reduce((acc, r) => acc + (Number(r.practicalMarks[lvl]) || 0), 0);
          return `<td class="center font-bold">${sum > 0 ? sum : ''}</td>`;
        }).join('')}
        ${bajajTerminalTpsLevels.map(lvl => {
          const sum = bajajRows.reduce((acc, r) => acc + (Number(r.terminalMarks[lvl]) || 0), 0);
          return `<td class="center font-bold">${sum > 0 ? sum : ''}</td>`;
        }).join('')}
      </tr>
    </tbody>
  </table>
  ` : isPractical ? `
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
        <th class="center" style="width: 28%;">Practical CA (OCR)</th>
        <th class="center" style="width: 28%;">Model Test CO-wise</th>
      </tr>
      <tr>
        <th class="center" style="font-weight: bold; font-size: 11pt;">% of Marks</th>
        <th class="center" style="font-weight: bold; font-size: 11pt;">% of Marks</th>
        <th class="center" style="font-weight: bold; font-size: 11pt;">% of Marks</th>
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
  ` : isTcp ? `
  <div class="gray-banner">Assessment Pattern</div>
  <div class="line-space-sm"></div>
  <table>
    <thead>
      <tr>
        <th rowspan="2" class="center" style="width: 10%;">CO</th>
        <th class="center" style="width: 18%;">Theory CAT1</th>
        <th class="center" style="width: 18%;">Theory CAT2</th>
        <th class="center" style="width: 18%;">Practical CA (OCR)</th>
        <th class="center" style="width: 18%;">Model Test</th>
        <th class="center" style="width: 18%;">Terminal Exam</th>
      </tr>
      <tr>
        <th class="center" style="font-weight: bold; font-size: 11pt;">% of Marks</th>
        <th class="center" style="font-weight: bold; font-size: 11pt;">% of Marks</th>
        <th class="center" style="font-weight: bold; font-size: 11pt;">% of Marks</th>
        <th class="center" style="font-weight: bold; font-size: 11pt;">% of Marks</th>
        <th class="center" style="font-weight: bold; font-size: 11pt;">% of Marks</th>
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
        <th class="center" style="font-weight: bold; font-size: 11pt;">% of Marks</th>
        <th class="center" style="font-weight: bold; font-size: 11pt;">% of Marks</th>
        <th class="center" style="font-weight: bold; font-size: 11pt;">% of Marks</th>
        <th class="center" style="font-weight: bold; font-size: 11pt;">% of Marks</th>
        <th class="center" style="font-weight: bold; font-size: 11pt;">% of Marks</th>
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
  <div style="font-size: 8pt; font-style: italic; color: #000; margin-top: 4px; margin-bottom: 6px;">${LAB_OBJECTIVES_LEGEND_TEXT}</div>

  <div class="line-space"></div>

  <!-- Course Designer(s) -->
  <div class="gray-banner">Course Designer(s):</div>
  <div class="line-space"></div>

  <div class="section-p">
    ${designersHtml}
  </div>
  ` : ''}

  ${isBajaj ? `
  <!-- ==================== BAJAJ SYLLABUS, RESOURCES & SCHEDULE ==================== -->
  <div class="line-space"></div>
  <div class="gray-banner">Syllabus</div>
  <div class="line-space"></div>

  <div style="font-weight: bold; margin-bottom: 4px;">Theory (${(Number(course.L) || 0) * 14} Hours):</div>
  ${(course.modules || []).map(mod => `
    <div class="section-p" style="margin-bottom: 4px;">
      <b>${mod.mainTopic}:</b> ${Array.isArray(mod.subtopics) ? mod.subtopics.join(' – ') : ''}${mod.periods ? ` <b>[${mod.periods} Hours]</b>` : ''}
    </div>
  `).join('')}
  <div style="text-align: right; font-weight: bold; margin-top: 4px; margin-bottom: 8px;">Total Theory: ${(Number(course.L) || 0) * 14} Hours</div>

  <div style="font-weight: bold; margin-top: 8px; margin-bottom: 4px;">Practical Experiments: (${(Number(course.P) || 0) * 14} Hours)</div>
  <ol class="bullet-list" style="list-style-type: decimal;">
    ${(course.experiments || []).map(exp => `
      <li>${exp.name}${exp.hours ? ` (${exp.hours})` : ''}</li>
    `).join('')}
  </ol>
  <div style="text-align: right; font-weight: bold; margin-top: 4px; margin-bottom: 8px;">Total: ${((Number(course.L) || 0) + (Number(course.P) || 0)) * 14} Hours</div>

  <div class="line-space"></div>
  <div class="gray-banner">Reference Books & web resources</div>
  <div class="line-space"></div>
  <ul class="bullet-list">
    ${(course.referenceBooks || []).map(b => `<li>${formatCitation(b)}</li>`).join('')}
  </ul>

  <div class="line-space"></div>
  <div class="gray-banner">Course Contents and Lecture Schedule</div>
  <div class="line-space"></div>
  <table>
    <thead>
      <tr>
        <th class="center" style="width: 10%;">#</th>
        <th style="width: 72%; text-align: left;">Topic</th>
        <th class="center" style="width: 18%;">Lecture<br>Hours</th>
      </tr>
    </thead>
    <tbody>
      ${scheduleItems.map(item => `
        <tr>
          <td class="center font-bold">${item.moduleNo || ''}</td>
          <td>${item.topic || ''}</td>
          <td class="center">${item.periods !== undefined && item.periods !== null && item.periods !== '' ? item.periods : ''}</td>
        </tr>
      `).join('')}
      <tr>
        <td colspan="2" class="center font-bold">Theory</td>
        <td class="center font-bold">${(Number(course.L) || 0) * 14}</td>
      </tr>
      <tr>
        <td colspan="2" class="center font-bold">Practical</td>
        <td class="center font-bold">${(Number(course.P) || 0) * 14}</td>
      </tr>
      <tr style="background-color: #F2F2F2;">
        <td colspan="2" class="center font-bold">Total</td>
        <td class="center font-bold">${((Number(course.L) || 0) + (Number(course.P) || 0)) * 14}</td>
      </tr>
    </tbody>
  </table>

  <div class="line-space"></div>
  <div class="gray-banner">Course Designer(s):</div>
  <div class="line-space"></div>
  <div class="section-p">
    ${designersHtml}
  </div>
  ` : !isPractical ? `
  <!-- ==================== PAGE 2 (THEORY & TCP) ==================== -->
  <div class="line-space"></div>

  <!-- Syllabus -->
  <div class="gray-banner">Syllabus</div>
  <div class="line-space"></div>

  ${modulesHtml}

  ${isTcp && experimentsList.length > 0 ? `
  <div style="font-size: 11pt; font-weight: bold; text-decoration: underline; margin-bottom: 6px;">Practical:</div>
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
  <div style="font-size: 8pt; font-style: italic; color: #000; margin-top: 4px; margin-bottom: 6px;">${LAB_OBJECTIVES_LEGEND_TEXT}</div>

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
    font-size: 11pt;
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
    font-size: 11pt;
    font-weight: bold;
    color: #000;
    margin-top: 4px;
    margin-bottom: 2px;
  }
  .section-p {
    font-size: 11pt;
    line-height: 1.3;
    text-align: justify;
    margin: 0;
    color: #000;
  }
  .gray-banner {
    background-color: #D9D9D9;
    color: #000;
    font-weight: bold;
    font-size: 11pt;
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
    font-size: 11pt;
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
    font-size: 11pt;
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
    font-size: 11pt;
    line-height: 1.3;
    text-align: justify;
    margin: 0;
  }
  .bullet-list {
    margin: 0;
    padding-left: 18px;
    list-style-type: disc;
    font-size: 11pt;
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
    font-size: 11pt;
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
