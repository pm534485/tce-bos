import React, { useState } from 'react';
import { Course } from '@syllabusforge/shared';
import { Download, FileText, Printer, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface DocumentPreviewProps {
  course: Course;
}

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

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ course }) => {
  const [downloadingFormat, setDownloadingFormat] = useState<'docx' | 'pdf' | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const headerText = getDegreeProgramHeader(course);
  const titleCaps = (course.courseName || '').toUpperCase();
  const bosMeetingText = `Passed in BoS Meeting ${course.bosMeetingDate || '30.05.2026'}`;
  const acmMeetingText = (
    <>
      Approved in 71<sup>st</sup> Academic council meeting {course.academicCouncilDate || '27.06.2026'}
    </>
  );

  const handleDownload = async (format: 'docx' | 'pdf') => {
    try {
      setDownloadingFormat(format);
      setDownloadError(null);
      const blob = await api.exportCourseBlob(course, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeCode = (course.courseCode || 'Course').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeName = (course.courseName || 'Syllabus').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${safeCode}_${safeName}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Download error:', err);
      if (format === 'pdf') {
        window.print();
        return;
      }
      setDownloadError(err.message || 'Export failed. Please check network connection.');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

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
          .map(s => s.trim().replace(/^[•\-\*–\s]+/, ''))
          .filter(s => s && s.toLowerCase() !== 'nil');
      }
      return [trimmed];
    }
    return [];
  };

  const prereqList = getPrerequisiteList(course.prerequisites);
  const coList = course.courseOutcomes || [];

  // Assessment Pattern Matrix
  const matrix = course.assessmentMatrix || [];
  const isTcp = course.courseType === 'TCP';
  const isPractical = course.courseType === 'PRACTICAL';
  let totalCol1 = 0;
  let totalCol2 = 0;
  let totalCol3 = 0;
  let totalCol4 = 0;
  let totalCol5 = 0;

  const assessmentRows = coList.map((co, idx) => {
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
        if (idx === 0 || idx === 1) { v1 = 30; v2 = 30; v5 = 10; }
        else if (idx === 2) { v1 = 40; v2 = 40; v5 = 20; }
        else if (idx === 3 || idx === 4) { v3 = 30; v4 = 30; v5 = 20; }
        else if (idx === 5) { v3 = 40; v4 = 40; v5 = 20; }
      }
    }

    if (typeof v1 === 'number') totalCol1 += v1;
    if (typeof v2 === 'number') totalCol2 += v2;
    if (typeof v3 === 'number') totalCol3 += v3;
    if (typeof v4 === 'number') totalCol4 += v4;
    if (typeof v5 === 'number') totalCol5 += v5;

    return {
      coNo: co.coNo,
      col1: v1,
      col2: v2,
      col3: v3,
      col4: v4,
      col5: v5,
    };
  });

  // Citation formatting
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

  // Helper for experiment objectives (e.g. 1, 3 or 1,2,3,4,13)
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

  // Helper for experiment level (e.g. 1, 2, 3)
  const getExperimentLevelNumber = (exp: any): string => {
    const raw = String(exp.level || 1);
    const match = raw.match(/\d+/);
    return match ? match[0] : '1';
  };

  // Lecture schedule
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

  const totalPeriods = scheduleItems.reduce((acc, item) => acc + (Number(item.periods) || 0), 0);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Top Action Bar */}
      <div className="top-action-bar w-full max-w-5xl flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-sky-600" />
          <span className="font-semibold text-slate-800 text-sm">
            Institutional Layout Preview ({course.courseType || 'THEORY'})
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleDownload('docx')}
            disabled={downloadingFormat !== null}
            className="glass-btn inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-800 transition-all disabled:opacity-50"
            title="Download formatted Microsoft Word document (.docx)"
          >
            {downloadingFormat === 'docx' ? (
              <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span>{downloadingFormat === 'docx' ? 'Exporting...' : 'Export .docx'}</span>
          </button>
          <button
            onClick={() => handleDownload('pdf')}
            disabled={downloadingFormat !== null}
            className="glass-btn inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-800 transition-all disabled:opacity-50"
            title="Download formatted institutional PDF document (.pdf)"
          >
            {downloadingFormat === 'pdf' ? (
              <Loader2 className="w-3.5 h-3.5 text-rose-600 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-rose-600" />
            )}
            <span>{downloadingFormat === 'pdf' ? 'Exporting...' : 'Export PDF'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="glass-btn inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-800 transition-all"
            title="Print or save using browser dialog"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {downloadError && (
        <div className="w-full max-w-5xl mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{downloadError}</span>
          </div>
          <button
            onClick={() => setDownloadError(null)}
            className="text-xs font-bold text-rose-800 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* CONTINUOUS DOCUMENT CONTAINER (Continuous layout matching reference PDF without artificial page gaps) */}
      <div className="document-sheet bg-white p-10 sm:p-14 rounded-xl shadow-lg border border-slate-300 text-slate-900 select-text font-sans text-sm w-full max-w-5xl space-y-4">
        {/* Running Top Right Header */}
        <div className="text-right text-xs font-normal text-slate-800 mb-3">
          {headerText}
        </div>

        {/* 1. Header Table */}
        <table className="w-full border-collapse border border-black mb-0 text-xs">
          <tbody>
            <tr>
              <td rowSpan={2} className={`${isTcp ? 'w-[16%]' : 'w-[18%]'} font-bold text-center align-middle border border-black p-2 text-sm`}>
                {course.courseCode || '______'}
              </td>
              <td rowSpan={2} className={`${isTcp ? 'w-[38%]' : 'w-[44%]'} font-bold uppercase text-center align-middle border border-black p-2 text-sm`}>
                {titleCaps || '____________________'}
              </td>
              <td className={`text-center border border-black p-1.5 ${isTcp ? 'w-[12%]' : 'w-[14%]'}`}>Category</td>
              <td className={`text-center border border-black p-1.5 ${isTcp ? 'w-[5%]' : 'w-[6%]'}`}>L</td>
              <td className={`text-center border border-black p-1.5 ${isTcp ? 'w-[5%]' : 'w-[6%]'}`}>T</td>
              <td className={`text-center border border-black p-1.5 ${isTcp ? 'w-[5%]' : 'w-[6%]'}`}>P</td>
              <td className={`text-center border border-black p-1.5 ${isTcp ? 'w-[7%]' : 'w-[6%]'}`}>Credits</td>
              {isTcp && (
                <td className="text-center border border-black p-1.5 w-[12%]">TE Type</td>
              )}
            </tr>
            <tr>
              <td className="text-center border border-black p-1.5">{course.categoryAbbr || '—'}</td>
              <td className="text-center border border-black p-1.5">{course.L !== undefined && course.L !== null ? course.L : '_'}</td>
              <td className="text-center border border-black p-1.5">{course.T !== undefined && course.T !== null ? course.T : '_'}</td>
              <td className="text-center border border-black p-1.5">{course.P !== undefined && course.P !== null ? course.P : '_'}</td>
              <td className="text-center font-bold border border-black p-1.5">{course.credits !== undefined && course.credits !== null ? course.credits : '_'}</td>
              {isTcp && (
                <td className="text-center font-bold border border-black p-1.5">{course.teExamType || 'TCP-T'}</td>
              )}
            </tr>
          </tbody>
        </table>

        {/* 1. Preamble */}
        <div className="section-block">
          <div className="bg-[#D9D9D9] font-bold px-2 py-1 text-black text-xs sm:text-sm w-full">
            1. Preamble
          </div>
          <p className="text-justify text-xs leading-relaxed text-black mt-1.5 mb-0">
            {course.preamble || ''}
          </p>
        </div>

        {/* 2. Prerequisite */}
        <div className="section-block">
          <div className="bg-[#D9D9D9] font-bold px-2 py-1 text-black text-xs sm:text-sm w-full">
            2. Prerequisite
          </div>
          {prereqList.length > 0 ? (
            <ul className="list-disc pl-5 text-xs text-black mt-1.5 mb-0 space-y-0.5">
              {prereqList.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-black mt-1.5 mb-0">
              Nil
            </p>
          )}
        </div>

        {/* 3. Course Outcomes */}
        <div className="section-block">
          <div className="bg-[#D9D9D9] font-bold px-2 py-1 text-black text-xs sm:text-sm w-full">
            3. Course Outcomes
          </div>
          <p className="text-xs text-black mt-1 mb-1.5">
            On the successful completion of the course, students will be able to
          </p>
          <table className="w-full border-collapse border border-black mb-0 text-xs">
            <thead>
              <tr className="border-b border-black">
                <th className="border border-black p-1.5 text-center w-[7%]">COs</th>
                <th className="border border-black p-1.5 text-left w-[45%]">Course Outcome Statement</th>
                <th className="border border-black p-1.5 text-center w-[12%]">TCE Proficiency Scale</th>
                <th className="border border-black p-1.5 text-center w-[14%]">Performance Indicators</th>
                <th className="border border-black p-1.5 text-center w-[8%]">Objective</th>
                <th className="border border-black p-1.5 text-center w-[8%]">SDG Addressed</th>
                <th className="border border-black p-1.5 text-center w-[6%]">SDG Level</th>
              </tr>
            </thead>
            <tbody>
              {coList.map(co => (
                <tr key={co.coNo} className="border-b border-black">
                  <td className="border border-black p-1.5 text-center font-bold">{co.coNo}</td>
                  <td className="border border-black p-1.5 text-left">{co.statement}</td>
                  <td className="border border-black p-1.5 text-center">TPS {co.tpsLevel}</td>
                  <td className="border border-black p-1.5 text-center">{co.pi}</td>
                  <td className="border border-black p-1.5 text-center">{co.objectiveNo !== undefined ? co.objectiveNo : ''}</td>
                  <td className="border border-black p-1.5 text-center">{co.sdgNo && co.sdgNo !== 'NC' ? (String(co.sdgNo).includes(',') ? `SDGs ${co.sdgNo}` : `SDG ${co.sdgNo}`) : 'NC'}</td>
                  <td className="border border-black p-1.5 text-center">{co.sdgLevel !== undefined ? co.sdgLevel : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. Assessment Pattern */}
        {isPractical ? (
          <div className="section-block">
            <div className="bg-[#D9D9D9] font-bold px-2 py-1 text-black text-xs sm:text-sm w-full mb-1 text-left">
              4. Assessment Pattern: Cognitive Domain
            </div>
            <table className="w-full border-collapse border border-black mb-0 text-xs">
              <thead>
                <tr className="border-b border-black">
                  <th className="border border-black p-1.5 text-left w-[24%]">Type of Assessment</th>
                  <th className="border border-black p-1.5 text-left w-[36%]">Component</th>
                  <th className="border border-black p-1.5 text-center w-[10%]">Marks</th>
                  <th className="border border-black p-1.5 text-left w-[30%]">Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black">
                  <td className="border border-black p-1.5 font-bold">Continuous Assessment</td>
                  <td className="border border-black p-1.5">Pre-lab, In-lab, Post-lab</td>
                  <td className="border border-black p-1.5 text-center font-bold">75</td>
                  <td className="border border-black p-1.5">Conducted throughout the semester</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border border-black p-1.5 font-bold">Model Test</td>
                  <td className="border border-black p-1.5">CO-wise (Cognitive, Psychomotor, Affective)</td>
                  <td className="border border-black p-1.5 text-center font-bold">25</td>
                  <td className="border border-black p-1.5">Mid/End semester internal test</td>
                </tr>
                <tr className="border-b border-black font-bold">
                  <td className="border border-black p-1.5">Total Internal Marks</td>
                  <td className="border border-black p-1.5"></td>
                  <td className="border border-black p-1.5 text-center">100</td>
                  <td className="border border-black p-1.5"></td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border border-black p-1.5 font-bold">End Semester Examination</td>
                  <td className="border border-black p-1.5">CO-wise (Cognitive, Psychomotor, Affective)</td>
                  <td className="border border-black p-1.5 text-center font-bold">100</td>
                  <td className="border border-black p-1.5">As directed by COE or as per curriculum</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="section-block">
            <div className="bg-[#D9D9D9] font-bold px-2 py-1 text-black text-xs sm:text-sm w-full mb-1">
              4. Assessment Pattern
            </div>
            <table className="w-full border-collapse border border-black mb-0 text-xs">
              <thead>
                <tr>
                  <th rowSpan={2} className="border border-black p-1.5 text-center align-middle w-[10%]">CO</th>
                  <th className="border border-black p-1.5 text-center w-[18%]">{isTcp ? 'Theory CAT1' : 'CAT1'}</th>
                  <th className="border border-black p-1.5 text-center w-[18%]">{isTcp ? 'Theory CAT2' : 'Assignment 1'}</th>
                  <th className="border border-black p-1.5 text-center w-[18%]">{isTcp ? 'Practical CA' : 'CAT2'}</th>
                  <th className="border border-black p-1.5 text-center w-[18%]">{isTcp ? 'Model Test' : 'Assignment 2'}</th>
                  <th className="border border-black p-1.5 text-center w-[18%]">Terminal Exam</th>
                </tr>
                <tr>
                  <th className="border border-black p-1 text-center font-bold text-[10px]">% of Marks</th>
                  <th className="border border-black p-1 text-center font-bold text-[10px]">% of Marks</th>
                  <th className="border border-black p-1 text-center font-bold text-[10px]">% of Marks</th>
                  <th className="border border-black p-1 text-center font-bold text-[10px]">% of Marks</th>
                  <th className="border border-black p-1 text-center font-bold text-[10px]">% of Marks</th>
                </tr>
              </thead>
              <tbody>
                {assessmentRows.map(row => (
                  <tr key={row.coNo} className="border-b border-black">
                    <td className="border border-black p-1.5 text-center font-bold">{row.coNo}</td>
                    <td className="border border-black p-1.5 text-center">{row.col1}</td>
                    <td className="border border-black p-1.5 text-center">{row.col2}</td>
                    <td className="border border-black p-1.5 text-center">{row.col3}</td>
                    <td className="border border-black p-1.5 text-center">{row.col4}</td>
                    <td className="border border-black p-1.5 text-center">{row.col5}</td>
                  </tr>
                ))}
                <tr>
                  <td className="border border-black p-1.5 text-center font-bold">Total</td>
                  <td className="border border-black p-1.5 text-center font-bold">{totalCol1 || 100}</td>
                  <td className="border border-black p-1.5 text-center font-bold">{totalCol2 || 100}</td>
                  <td className="border border-black p-1.5 text-center font-bold">{totalCol3 || 100}</td>
                  <td className="border border-black p-1.5 text-center font-bold">{totalCol4 || 100}</td>
                  <td className="border border-black p-1.5 text-center font-bold">{totalCol5 || 100}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Syllabus (Theory/TCP) OR 5. List of Experiments with CO Mapping (Practical) */}
        {isPractical ? (
          <div className="section-block">
            <div className="bg-[#D9D9D9] font-bold px-2 py-1 text-black text-xs sm:text-sm w-full">
              5. List of Experiments with CO Mapping
            </div>
            <div className="h-2" />
            {(course.experiments && course.experiments.length > 0) ? (
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="border-b border-black">
                    <th className="border border-black p-1.5 text-center w-[8%]">Sl. No.</th>
                    <th className="border border-black p-1.5 text-left w-[50%]">Name of the Experiment</th>
                    <th className="border border-black p-1.5 text-center w-[14%]">Level of Experiment</th>
                    <th className="border border-black p-1.5 text-center w-[14%]">Objective(s)</th>
                    <th className="border border-black p-1.5 text-center w-[14%]">COs Addressed</th>
                  </tr>
                </thead>
                <tbody>
                  {(course.experiments || []).map((exp, idx) => (
                    <tr key={idx} className="border-b border-black">
                      <td className="border border-black p-1.5 text-center">{exp.slNo || idx + 1}</td>
                      <td className="border border-black p-1.5 text-left">{exp.name || ''}</td>
                      <td className="border border-black p-1.5 text-center">{getExperimentLevelNumber(exp)}</td>
                      <td className="border border-black p-1.5 text-center">{getExperimentObjectives(exp)}</td>
                      <td className="border border-black p-1.5 text-center font-medium">
                        {Array.isArray(exp.coNos) ? exp.coNos.join(', ') : (exp.coNos || '')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-xs italic text-slate-500 py-1">No experiments added yet.</div>
            )}
          </div>
        ) : (
          <div className="section-block">
            <div className="bg-[#D9D9D9] font-bold px-2 py-1 text-black text-xs sm:text-sm w-full">
              5. Syllabus
            </div>
            <div className="h-2" />

            {(course.modules && course.modules.length > 0) && (
              <div className="space-y-2">
                {course.modules.map((mod, idx) => (
                  <div key={idx} className="text-xs leading-relaxed text-justify">
                    <span className="font-bold text-black">{mod.mainTopic}: </span>
                    <span className="text-black">{Array.isArray(mod.subtopics) ? mod.subtopics.join(' – ') : ''}</span>
                  </div>
                ))}
              </div>
            )}

            {isTcp && (course.experiments && course.experiments.length > 0) && (
              <div className={course.modules && course.modules.length > 0 ? "mt-3" : ""}>
                <div className="font-bold underline text-xs text-black mb-1">Practical:</div>
                <ol className="list-decimal pl-5 space-y-1 text-xs text-black">
                  {course.experiments.map((exp, idx) => (
                    <li key={idx} className="text-justify">{exp.name}</li>
                  ))}
                </ol>
              </div>
            )}

            {(!course.modules || course.modules.length === 0) && (!course.experiments || course.experiments.length === 0) && (
              <div className="text-xs italic text-slate-500 py-1">No syllabus topics or laboratory experiments added yet.</div>
            )}
          </div>
        )}

        {/* 6. Learning Resources (ONLY for Theory and TCP) */}
        {!isPractical && (
          <div className="section-block">
            <div className="bg-[#D9D9D9] font-bold px-2 py-1 text-black text-xs sm:text-sm w-full">
              6. Learning Resources
            </div>
            <div className="h-2" />

            {(course.textBooks && course.textBooks.length > 0) && (
              <>
                <div className="bg-[#D9D9D9] font-bold px-2 py-1 text-black text-xs sm:text-sm w-full">
                  6.1 Text Book
                </div>
                <div className="h-1" />
                <ul className="list-disc pl-5 space-y-1 text-xs text-black">
                  {(course.textBooks || []).map((b, idx) => (
                    <li key={idx} className="text-justify">{formatCitation(b)}</li>
                  ))}
                </ul>
                <div className="h-2" />
              </>
            )}

            <div className="bg-[#D9D9D9] font-bold px-2 py-1 text-black text-xs sm:text-sm w-full">
              6.2 Reference Books &amp; Web resources
            </div>
            <div className="h-1" />
            <ul className="list-disc pl-5 space-y-1 text-xs text-black">
              {(course.referenceBooks || []).map((b, idx) => (
                <li key={idx} className="text-justify">{formatCitation(b)}</li>
              ))}
            </ul>
            <div className="h-2" />

            <div className="font-bold text-xs text-black mb-1">NPTEL Courses</div>
            <ul className="list-disc pl-5 space-y-1 text-xs text-black">
              {(course.webResources || []).map((w, idx) => (
                <li key={idx} className="text-justify">{formatNptel(w)}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 7. Course Contents and Lecture Schedule (ONLY for Theory and TCP) */}
        {!isPractical && (scheduleItems.length > 0 || (course.modules && course.modules.length > 0)) && (
          <div className="section-block">
            <div className="bg-[#D9D9D9] font-bold px-2 py-1 text-black text-xs sm:text-sm w-full">
              7. Course Contents and Lecture Schedule
            </div>
            <div className="h-2" />

            <table className="w-full border-collapse border border-black mb-0 text-xs">
              <thead>
                <tr className="border-b border-black">
                  <th className="border border-black p-1.5 text-center w-[12%]">Module<br />No</th>
                  <th className="border border-black p-1.5 text-left w-[58%]">Topics</th>
                  <th className="border border-black p-1.5 text-center w-[14%]">No of<br />Periods</th>
                  <th className="border border-black p-1.5 text-center w-[16%]">Course<br />Outcomes</th>
                </tr>
              </thead>
              <tbody>
                {scheduleItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-black">
                    <td className="border border-black p-1.5 text-center">{item.moduleNo || ''}</td>
                    <td className="border border-black p-1.5 text-left">{item.topic || ''}</td>
                    <td className="border border-black p-1.5 text-center">
                      {item.periods !== undefined && item.periods !== null && item.periods !== '' ? String(item.periods) : ''}
                    </td>
                    <td className="border border-black p-1.5 text-center">
                      {Array.isArray(item.coMapping) ? item.coMapping.join(', ') : (item.coMapping || '')}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td colSpan={2} className="border border-black p-1.5 text-center">Total Periods</td>
                  <td className="border border-black p-1.5 text-center">{totalPeriods}</td>
                  <td className="border border-black p-1.5 text-center"></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* List of Experiments with CO Mapping table (TCP courses only) */}
        {isTcp && (course.experiments && course.experiments.length > 0) && (
          <div className="section-block">
            <div className="bg-[#D9D9D9] font-bold px-2 py-1 text-black text-xs sm:text-sm w-full">
              List of Experiments with CO Mapping
            </div>
            <div className="h-2" />

            <table className="w-full border-collapse border border-black mb-0 text-xs">
              <thead>
                <tr className="border-b border-black">
                  <th className="border border-black p-1.5 text-center w-[8%]">Sl. No.</th>
                  <th className="border border-black p-1.5 text-left w-[50%]">Name of the Experiment</th>
                  <th className="border border-black p-1.5 text-center w-[14%]">Level of Experiment</th>
                  <th className="border border-black p-1.5 text-center w-[14%]">Objective(s)</th>
                  <th className="border border-black p-1.5 text-center w-[14%]">COs Addressed</th>
                </tr>
              </thead>
              <tbody>
                {(course.experiments || []).map((exp, idx) => (
                  <tr key={idx} className="border-b border-black">
                    <td className="border border-black p-1.5 text-center">{exp.slNo || idx + 1}</td>
                    <td className="border border-black p-1.5 text-left">{exp.name || ''}</td>
                    <td className="border border-black p-1.5 text-center">{getExperimentLevelNumber(exp)}</td>
                    <td className="border border-black p-1.5 text-center">{getExperimentObjectives(exp)}</td>
                    <td className="border border-black p-1.5 text-center font-medium">
                      {Array.isArray(exp.coNos) ? exp.coNos.join(', ') : (exp.coNos || '')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Course Designer(s): Section 6 for Practical, Course Designer(s) for Theory/TCP */}
        <div className="section-block">
          <div className="bg-[#D9D9D9] font-bold px-2 py-1 text-black text-xs sm:text-sm w-full">
            {isPractical ? '6. Course Designer(s):' : 'Course Designer(s):'}
          </div>
          <div className="h-2" />

          <div className="text-xs text-black leading-relaxed space-y-1">
            {(course.designers && course.designers.length > 0) ? (
              course.designers.map((d, idx) => {
                const textParts = [d.name, d.designation].filter(Boolean).join(', ');
                return (
                  <div key={idx}>
                    {textParts}
                    {d.email ? (
                      <>
                        {textParts ? ', ' : ''}
                        <a href={`mailto:${d.email}`} className="text-[#0000FF] underline font-medium hover:text-blue-800">
                          {d.email}
                        </a>
                      </>
                    ) : ''}
                  </div>
                );
              })
            ) : (
              <div>Faculty Member, <a href="mailto:faculty@tce.edu" className="text-[#0000FF] underline font-medium">faculty@tce.edu</a></div>
            )}
          </div>
        </div>

        {/* Continuous Footer Note */}
        <div className="pt-6 mt-4 border-t border-slate-200 flex justify-between text-[11px] text-slate-700">
          <span>{bosMeetingText}</span>
          <span>{acmMeetingText}</span>
        </div>
      </div>
    </div>
  );
};
