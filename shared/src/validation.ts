// Institutional Validation Engine for SyllabusForge (Regulation 2026)

import {
  PROGRAMME_CODES,
  CATEGORY_CODES,
  CATEGORY_ABBREVIATIONS,
  TPS_VERBS,
  PERFORMANCE_INDICATORS,
  LAB_OBJECTIVES,
  GENERAL_CO_POOL,
  DEFAULT_CONFIG_SETTINGS,
  CategoryAbbreviation,
} from './constants.js';

import {
  Course,
  CourseType,
  CourseOutcome,
  AssessmentMatrixCell,
  SyllabusModule,
  LearningResource,
  SdgActivity,
  LabExperiment,
  LabCoursePlanItem,
  CourseDesigner,
  LectureScheduleItem,
  ValidationRuleResult,
  CourseValidationReport,
} from './types.js';

// Helper: Word count for string
export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// B1: Course Name Validation
export function validateCourseName(name: string, courseType: CourseType): ValidationRuleResult[] {
  const results: ValidationRuleResult[] = [];
  const trimmed = (name || '').trim();

  if (!trimmed) {
    results.push({
      id: 'B1_EMPTY',
      field: 'courseName',
      severity: 'error',
      message: 'Course name is required.',
      fixHint: 'Enter a clear, concise course title in Title Case.',
    });
    return results;
  }

  // Only letters, digits and spaces. No hyphens, slashes, ampersands, parentheses, colons, etc.
  if (!/^[a-zA-Z0-9\s]+$/.test(trimmed)) {
    results.push({
      id: 'B1_SPECIAL_CHARS',
      field: 'courseName',
      severity: 'error',
      message: 'Course name contains invalid characters. Only alphanumeric characters and spaces are allowed.',
      fixHint: 'Remove any hyphens, slashes, ampersands (&), colons, parentheses, or punctuation symbols.',
    });
  }

  // Max 60 characters incl. spaces
  if (trimmed.length > 60) {
    results.push({
      id: 'B1_MAX_LENGTH',
      field: 'courseName',
      severity: 'error',
      message: `Course name exceeds 60 characters (currently ${trimmed.length} characters).`,
      fixHint: 'Shorten the course title to 60 characters or fewer including spaces.',
    });
  }

  // Check for the word "Lab" as a standalone word (forbidden, must use "Laboratory")
  if (/\bLab\b/i.test(trimmed)) {
    results.push({
      id: 'B1_LAB_FORBIDDEN',
      field: 'courseName',
      severity: 'error',
      message: 'The word "Lab" is rejected. Use the full word "Laboratory".',
      fixHint: 'Replace "Lab" with "Laboratory".',
    });
  }

  // For PRACTICAL courses, course name should end with "Laboratory"
  if (courseType === 'PRACTICAL') {
    if (!trimmed.toLowerCase().endsWith('laboratory')) {
      results.push({
        id: 'B1_PRACTICAL_SUFFIX',
        field: 'courseName',
        severity: 'error',
        message: 'Practical course titles must end with the word "Laboratory".',
        fixHint: 'Append "Laboratory" to the end of the course title (e.g. "AC Machines Laboratory").',
      });
    }
  }

  // Check for redundant "Introduction to"
  if (/^Introduction to\b/i.test(trimmed)) {
    results.push({
      id: 'B1_REDUNDANT_INTRO',
      field: 'courseName',
      severity: 'warning',
      message: 'Course name begins with "Introduction to".',
      fixHint: 'Avoid redundant words unless the course is genuinely introductory in scope.',
    });
  }

  // Check for all-caps abbreviations (e.g., DSP, AI, ML, VLSI)
  const words = trimmed.split(/\s+/);
  const acronyms = words.filter(w => w.length >= 2 && w === w.toUpperCase() && /^[A-Z]+$/.test(w));
  if (acronyms.length > 0) {
    results.push({
      id: 'B1_ACRONYMS',
      field: 'courseName',
      severity: 'warning',
      message: `Course name contains capitalized abbreviations: ${acronyms.join(', ')}.`,
      fixHint: 'Spell out abbreviations in full (e.g., "Digital Signal Processing" instead of "DSP").',
    });
  }

  return results;
}

// B2: Course Code Validation (RR AA C U V)
export interface CourseCodeParts {
  regulationCode: string; // RR
  programmeCode: string;   // AA
  categoryLetter: string;  // C
  uniqueLetter: string;    // U
  version: number | string;// V
}

export function computeCourseCode(parts: CourseCodeParts): string {
  const { regulationCode, programmeCode, categoryLetter, uniqueLetter, version } = parts;
  return `${regulationCode || ''}${programmeCode || ''}${categoryLetter || ''}${uniqueLetter || ''}${version !== undefined ? version : ''}`;
}

export function validateCourseCode(
  parts: CourseCodeParts,
  existingProgrammeCodes: string[] = []
): ValidationRuleResult[] {
  const results: ValidationRuleResult[] = [];
  const { regulationCode, programmeCode, categoryLetter, uniqueLetter, version } = parts;

  // RR: 2 digits
  if (!regulationCode || !/^\d{2}$/.test(regulationCode)) {
    results.push({
      id: 'B2_REGULATION_CODE',
      field: 'regulationCode',
      severity: 'error',
      message: 'Regulation code (RR) must be exactly 2 digits (e.g., "26" for Regulation 2026).',
      fixHint: 'Set regulation code to 2 digits, such as "26".',
    });
  }

  // AA: Programme Code
  const validProgrammes = PROGRAMME_CODES.map(p => p.code);
  if (!programmeCode || !validProgrammes.includes(programmeCode)) {
    results.push({
      id: 'B2_PROGRAMME_CODE',
      field: 'programmeCode',
      severity: 'error',
      message: `Programme code (AA) must be a recognized 2-letter programme code (${validProgrammes.join(', ')}).`,
      fixHint: 'Select a valid academic programme code from the dropdown.',
    });
  }

  // C: Category Letter
  const validCategories = CATEGORY_CODES.map(c => c.code);
  if (!categoryLetter || !validCategories.includes(categoryLetter)) {
    results.push({
      id: 'B2_CATEGORY_LETTER',
      field: 'categoryLetter',
      severity: 'error',
      message: `Category code (C) must be a valid letter from the credit framework (${validCategories.join(', ')}).`,
      fixHint: 'Select a valid category letter (e.g., C, D for Programme Core, P for Elective, etc.).',
    });
  }

  // U: Single letter A-Z excluding I and O
  if (!uniqueLetter || !/^[A-HJ-NP-Z]$/.test(uniqueLetter)) {
    results.push({
      id: 'B2_UNIQUE_LETTER',
      field: 'uniqueLetter',
      severity: 'error',
      message: 'Unique course letter (U) must be a single uppercase letter from A to Z, excluding I and O.',
      fixHint: 'Choose a single letter from A-Z (excluding letters "I" and "O" to avoid confusion with 1 and 0).',
    });
  }

  // V: Single digit starting at 0
  const vNum = Number(version);
  if (version === undefined || version === null || isNaN(vNum) || vNum < 0 || vNum > 9 || String(version) === 'O' || String(version) === 'o') {
    results.push({
      id: 'B2_VERSION_DIGIT',
      field: 'version',
      severity: 'error',
      message: 'Version (V) must be a single digit (starts at 0, digit zero, never letter "O").',
      fixHint: 'Set version to 0 for initial course, increment by 1 for revisions.',
    });
  }

  // Full code format check
  const fullCode = computeCourseCode(parts);
  if (!/^\d{2}[A-Z]{2}[A-Z0-9][A-HJ-NP-Z]\d$/.test(fullCode)) {
    results.push({
      id: 'B2_FORMAT',
      field: 'courseCode',
      severity: 'error',
      message: `Composed course code "${fullCode}" does not match pattern RR AA C U V.`,
      fixHint: 'Verify all 5 components of the course code.',
    });
  }

  // Uniqueness check within programme
  if (existingProgrammeCodes.includes(fullCode)) {
    results.push({
      id: 'B2_UNIQUE_CONFLICT',
      field: 'courseCode',
      severity: 'error',
      message: `Course code "${fullCode}" already exists in programme ${programmeCode}.`,
      fixHint: 'Choose a different unique letter (U) or check the revision version number.',
    });
  }

  return results;
}

// B3: Category, L-T-P, Credits Validation
export function computeCredits(L: number, T: number, P: number, courseType?: CourseType): number {
  if (courseType === 'AUDIT') return 0;
  const lNum = Number(L) || 0;
  const tNum = Number(T) || 0;
  const pNum = Number(P) || 0;
  return Number((lNum + tNum + pNum * 0.5).toFixed(1));
}

export function validateLtpCredits(
  courseType: CourseType,
  categoryAbbr: string,
  L: number,
  T: number,
  P: number,
  credits: number
): ValidationRuleResult[] {
  const results: ValidationRuleResult[] = [];

  if (!CATEGORY_ABBREVIATIONS.includes(categoryAbbr as any)) {
    results.push({
      id: 'B3_CATEGORY_ABBR',
      field: 'categoryAbbr',
      severity: 'error',
      message: `Invalid category abbreviation "${categoryAbbr}". Must be one of: ${CATEGORY_ABBREVIATIONS.join(', ')}.`,
      fixHint: 'Select a standard category abbreviation (HSMC, BSC, ESC, PCC, PEC, OEC, EEC, AC).',
    });
  }

  if (L < 0 || T < 0 || P < 0) {
    results.push({
      id: 'B3_NEGATIVE_LTP',
      field: 'LTP',
      severity: 'error',
      message: 'Lecture (L), Tutorial (T), and Practical (P) hours cannot be negative.',
      fixHint: 'Enter non-negative numbers for L, T, and P.',
    });
  }

  if (courseType === 'THEORY') {
    if (P !== 0) {
      results.push({
        id: 'B3_THEORY_P_ZERO',
        field: 'P',
        severity: 'error',
        message: 'Theory (T) courses must have practical hours P = 0.',
        fixHint: 'Set P = 0 for theory courses, or change Course Type to Theory cum Practical (TCP).',
      });
    }
  }

  if (courseType === 'TCP') {
    if (L <= 0) {
      results.push({
        id: 'B3_TCP_L_POSITIVE',
        field: 'L',
        severity: 'error',
        message: 'Theory cum Practical (TCP) courses must have lecture hours L > 0.',
        fixHint: 'Set lecture contact hours L > 0 for TCP courses.',
      });
    }
    if (P <= 0) {
      results.push({
        id: 'B3_TCP_P_POSITIVE',
        field: 'P',
        severity: 'error',
        message: 'Theory cum Practical (TCP) courses must have practical hours P > 0.',
        fixHint: 'Set practical contact hours P > 0 for TCP courses.',
      });
    }
  }

  if (courseType === 'PRACTICAL') {
    if (L !== 0 || T !== 0) {
      results.push({
        id: 'B3_PRACTICAL_LT_ZERO',
        field: 'LTP',
        severity: 'error',
        message: 'Practical courses must have L = 0 and T = 0.',
        fixHint: 'Set L = 0 and T = 0 for laboratory courses.',
      });
    }
    if (P < 2 || P > 4) {
      results.push({
        id: 'B3_PRACTICAL_P_POSITIVE',
        field: 'P',
        severity: 'error',
        message: 'Practical courses must have practical hours P = 2, 3, or 4.',
        fixHint: 'Set practical contact hours to 2, 3, or 4.',
      });
    }
  }

  const expectedCredits = computeCredits(L, T, P);
  if (Math.abs(credits - expectedCredits) > 0.01) {
    results.push({
      id: 'B3_CREDIT_MISMATCH',
      field: 'credits',
      severity: 'error',
      message: `Credits (${credits}) does not match formula L + T + P/2 = ${expectedCredits}.`,
      fixHint: `Set credits to computed value: ${expectedCredits}.`,
    });
  }

  return results;
}

// B4: Preamble Validation
export function validatePreamble(preamble: string, coStatements: string[] = []): ValidationRuleResult[] {
  const results: ValidationRuleResult[] = [];
  const text = (preamble || '').trim();

  if (!text) {
    results.push({
      id: 'B4_EMPTY',
      field: 'preamble',
      severity: 'error',
      message: 'Preamble is required.',
      fixHint: 'Write a preamble explaining the course context and relevance.',
    });
    return results;
  }

  // Must be single paragraph
  if (text.split(/\n\s*\n/).length > 1) {
    results.push({
      id: 'B4_SINGLE_PARAGRAPH',
      field: 'preamble',
      severity: 'error',
      message: 'Preamble must be a single coherent paragraph without line breaks.',
      fixHint: 'Combine multiple paragraphs into a single introductory paragraph.',
    });
  }

  // Maximum limit is strictly 90 words; no minimum limit
  const wordCount = countWords(text);
  if (wordCount > 90) {
    results.push({
      id: 'B4_MAX_WORDS',
      field: 'preamble',
      severity: 'error',
      message: `Preamble exceeds the maximum limit of 90 words (currently ${wordCount} words).`,
      fixHint: 'Condense preamble to 90 words or fewer.',
    });
  }

  // Cliché phrase checks
  const cliches = [
    { pattern: /This course covers important topics/i, phrase: 'This course covers important topics' },
    { pattern: /Students will learn about/i, phrase: 'Students will learn about' },
    { pattern: /This course deals with/i, phrase: 'This course deals with' },
  ];

  for (const c of cliches) {
    if (c.pattern.test(text)) {
      results.push({
        id: 'B4_CLICHE_PHRASE',
        field: 'preamble',
        severity: 'warning',
        message: `Preamble contains discouraged generic phrase: "${c.phrase}".`,
        fixHint: 'Describe specific technical topics, industry relevance, and societal applications instead.',
      });
    }
  }

  // Check if CO statements are copied verbatim into preamble
  for (const co of coStatements) {
    if (co && co.length > 25 && text.toLowerCase().includes(co.toLowerCase().trim())) {
      results.push({
        id: 'B4_VERBATIM_CO',
        field: 'preamble',
        severity: 'warning',
        message: 'Preamble replicates Course Outcome statements verbatim.',
        fixHint: 'The preamble should provide academic context and domain relevance, not a restatement of COs.',
      });
      break;
    }
  }

  return results;
}

// B5: Course Outcomes Validation
export function validateCourseOutcomes(
  cos: CourseOutcome[],
  courseType: CourseType,
  allowTps1 = false,
  credits?: number | string
): ValidationRuleResult[] {
  const results: ValidationRuleResult[] = [];

  if (!cos || cos.length === 0) {
    results.push({
      id: 'B5_EMPTY',
      field: 'courseOutcomes',
      severity: 'error',
      message: 'Course outcomes are required.',
      fixHint: 'Add the required number of Course Outcomes (COs).',
    });
    return results;
  }

  // Credit-based count requirements:
  // Practical: 1 credit -> min 3 COs; 2 credits -> min 4 COs
  // Theory/TCP: 3 credits -> min 6 COs (between 6 and 8); 1 credit -> min 3 COs; 2 credits -> min 4 COs
  const numCredits = Number(credits) || 0;
  let minCos = 6;
  let maxCos: number | undefined = 8;
  let countRequirement = 'between 6 and 8';

  if (courseType === 'PRACTICAL') {
    maxCos = undefined; // Practical courses do not have a hard upper limit of 8
    if (numCredits <= 1) {
      minCos = 3;
      countRequirement = 'at least 3';
    } else {
      minCos = 4;
      countRequirement = 'at least 4';
    }
  } else {
    // THEORY or TCP
    if (numCredits > 0 && numCredits < 3) {
      minCos = numCredits === 1 ? 3 : 4;
      maxCos = 8;
      countRequirement = `at least ${minCos}`;
    } else {
      minCos = 6;
      maxCos = 8;
      countRequirement = 'at least 6 (between 6 and 8)';
    }
  }

  if (cos.length < minCos || (maxCos !== undefined && cos.length > maxCos)) {
    results.push({
      id: 'B5_COUNT_RANGE',
      field: 'courseOutcomes',
      severity: 'error',
      message: courseType === 'PRACTICAL'
        ? `A ${numCredits ? `${numCredits}-credit ` : ''}practical course must have ${countRequirement} Course Outcomes (currently ${cos.length}).`
        : `A ${numCredits ? `${numCredits}-credit ` : ''}theory course must have ${countRequirement} Course Outcomes (currently ${cos.length}).`,
      fixHint: `Adjust the number of COs so there are ${countRequirement}.`,
    });
  }

  // Distinct PIs check (warn on duplicates)
  const piList = cos.map(c => c.pi).filter(Boolean);
  const duplicatePis = piList.filter((pi, idx) => piList.indexOf(pi) !== idx);
  if (duplicatePis.length > 0) {
    results.push({
      id: 'B5_DUPLICATE_PI',
      field: 'courseOutcomes',
      severity: 'warning',
      message: `Performance Indicators should be distinct per CO. Found duplicates: ${[...new Set(duplicatePis)].join(', ')}.`,
      fixHint: 'Assign a distinct, measurable Performance Indicator to each CO.',
    });
  }

  // Check individual COs
  let tpsAtLeast3Count = 0;
  let tps2Count = 0;
  const statements: string[] = [];

  cos.forEach((co, idx) => {
    const coId = co.coNo || `CO${idx + 1}`;
    const stmt = (co.statement || '').trim();

    if (!stmt) {
      results.push({
        id: `B5_CO_STATEMENT_EMPTY_${coId}`,
        field: `courseOutcomes.${idx}.statement`,
        severity: 'error',
        message: `${coId}: Statement cannot be empty.`,
        fixHint: `Write a clear outcome statement beginning with an approved action verb.`,
      });
    } else {
      // Check duplicate / redundant COs
      if (statements.includes(stmt.toLowerCase())) {
        results.push({
          id: `B5_CO_DUPLICATE_${coId}`,
          field: `courseOutcomes.${idx}.statement`,
          severity: 'error',
          message: `${coId}: Duplicate or near-identical CO statement detected.`,
          fixHint: `Ensure every CO addresses a distinct competency.`,
        });
      }
      statements.push(stmt.toLowerCase());

      // First action verb check
      const firstWord = stmt.split(/\s+/)[0].replace(/[^a-zA-Z]/g, '');
      const validVerbs = TPS_VERBS[co.tpsLevel] || [];
      const isVerbApproved = validVerbs.some(v => v.toLowerCase() === firstWord.toLowerCase());

      if (!isVerbApproved) {
        results.push({
          id: `B5_CO_VERB_MISMATCH_${coId}`,
          field: `courseOutcomes.${idx}.statement`,
          severity: 'warning',
          message: `${coId}: First verb "${firstWord}" is not in standard action verbs list for TPS Level ${co.tpsLevel}.`,
          fixHint: `Standard verbs for TPS ${co.tpsLevel} are: ${validVerbs.join(', ')}.`,
        });
      }
    }

    // TPS Level validation
    if (co.tpsLevel === 1 && !allowTps1) {
      results.push({
        id: `B5_CO_TPS1_DISALLOWED_${coId}`,
        field: `courseOutcomes.${idx}.tpsLevel`,
        severity: 'error',
        message: `${coId}: TPS 1 (Remember level) is not permitted in course outcomes.`,
        fixHint: 'Upgrade outcome cognitive demand to TPS 2 (Understand) or TPS 3+ (Apply/Analyze/Evaluate).',
      });
    }

    if (co.tpsLevel === 2) {
      tps2Count++;
    }

    if (co.tpsLevel >= 3) {
      tpsAtLeast3Count++;
    }

    // Performance Indicator format & TPS alignment
    const piValues = (co.pi || '').split(/[,;]+/).map(s => s.trim()).filter(Boolean);
    if (piValues.length === 0) {
      results.push({
        id: `B5_CO_PI_FORMAT_${coId}`,
        field: `courseOutcomes.${idx}.pi`,
        severity: 'warning',
        message: `${coId}: Performance Indicator is recommended.`,
        fixHint: 'Enter a valid Performance Indicator (e.g. 1.2.1 or multiple values like 1.2.1, 2.1.3).',
      });
    } else {
      const nonStandardPis = piValues.filter(p => !/^[a-zA-Z0-9_.-]+$/.test(p));
      if (nonStandardPis.length > 0) {
        results.push({
          id: `B5_CO_PI_FORMAT_${coId}`,
          field: `courseOutcomes.${idx}.pi`,
          severity: 'warning',
          message: `${coId}: Non-standard Performance Indicator format: ${nonStandardPis.join(', ')}.`,
          fixHint: 'Standard Performance Indicators follow x.y.z format (e.g. 1.2.1), but custom indicators are accepted.',
        });
      }

      // Check if any entered PI matches known master list and TPS
      const matchedPis = piValues
        .map(p => PERFORMANCE_INDICATORS.find(pi => pi.piNumber === p))
        .filter(Boolean);
      if (matchedPis.length > 0 && !matchedPis.some(p => p!.tpsLevel === co.tpsLevel)) {
        results.push({
          id: `B5_CO_PI_TPS_MISMATCH_${coId}`,
          field: `courseOutcomes.${idx}.tpsLevel`,
          severity: 'warning',
          message: `${coId}: CO TPS Level (${co.tpsLevel}) differs from standard PI TPS Level (${matchedPis.map(p => p!.tpsLevel).join(', ')}).`,
          fixHint: `Align TPS level with the Performance Indicator(s) if applicable.`,
        });
      }
    }

    // SDG Level consistency: if SDG is "NC" or empty, level must be 0
    const sdgStr = String(co.sdgNo || '').trim();
    if (!sdgStr || sdgStr === 'NC') {
      if (co.sdgLevel > 0) {
        results.push({
          id: `B5_CO_SDG_NC_LEVEL_${coId}`,
          field: `courseOutcomes.${idx}.sdgLevel`,
          severity: 'error',
          message: `${coId}: If SDG is "NC" (Not Covered), SDG Level must be 0.`,
          fixHint: 'Set SDG Level to 0 when no SDG is addressed.',
        });
      }
    } else {
      const sdgNums = sdgStr
        .split(/[,;\s]+/)
        .map(s => Number(s.replace(/[^0-9]/g, '')))
        .filter(n => !isNaN(n) && n > 0);
      const invalidSdgs = sdgNums.filter(n => n < 1 || n > 17);
      if (sdgNums.length === 0 || invalidSdgs.length > 0) {
        results.push({
          id: `B5_CO_SDG_INVALID_${coId}`,
          field: `courseOutcomes.${idx}.sdgNo`,
          severity: 'error',
          message: `${coId}: Each SDG must be between 1 and 17 or "NC".`,
          fixHint: 'Choose valid SDG(s) from 1 to 17 or select "NC".',
        });
      }
      if (co.sdgLevel < 1 || co.sdgLevel > 5) {
        results.push({
          id: `B5_CO_SDG_LEVEL_RANGE_${coId}`,
          field: `courseOutcomes.${idx}.sdgLevel`,
          severity: 'error',
          message: `${coId}: When SDG is specified, SDG Level must be between 1 and 5.`,
          fixHint: 'Set SDG Level from 1 (indirect) to 5 (action-oriented pedagogy).',
        });
      }
    }
  });

  // 70% rule for Theory & TCP: At least 70% of COs at TPS >= 3
  // Guideline Section 3.2: 6 COs -> min 4; 7 COs -> min 5; 8 COs -> min 5.
  if (courseType === 'THEORY' || courseType === 'TCP') {
    let requiredMin = Math.round(cos.length * 0.7);
    if (cos.length === 6) requiredMin = 4;
    else if (cos.length === 8) requiredMin = 5;

    if (tpsAtLeast3Count < requiredMin) {
      results.push({
        id: 'B5_TPS_70_PERCENT',
        field: 'courseOutcomes',
        severity: 'error',
        message: `At least 70% of COs must be at TPS >= 3 (${requiredMin} out of ${cos.length} required, found ${tpsAtLeast3Count}).`,
        fixHint: `Increase cognitive demand of at least ${requiredMin - tpsAtLeast3Count} CO(s) to TPS 3, 4, or 5.`,
      });
    }
  }

  // Maximum 2 COs at TPS 2 rule: User cannot select TPS 2 more than twice
  if (tps2Count > 2) {
    results.push({
      id: 'B5_TPS2_MAX_LIMIT',
      field: 'courseOutcomes',
      severity: 'error',
      message: `At most 2 Course Outcomes can be at TPS 2 (Understand level) (found ${tps2Count}).`,
      fixHint: 'Upgrade at least one TPS 2 outcome to TPS 3 (Apply) or higher so no more than 2 COs are at TPS 2.',
    });
  }

  // Weightage checks for Theory & TCP
  if (courseType === 'THEORY' || courseType === 'TCP') {
    let totalWeightage = 0;
    const weightages: number[] = [];

    cos.forEach((co, idx) => {
      const coId = co.coNo || `CO${idx + 1}`;
      const w = Number(co.weightage) || 0;
      totalWeightage += w;
      weightages.push(w);

      if (w < 5 || w > 25) {
        results.push({
          id: `B5_WEIGHTAGE_RANGE_${coId}`,
          field: `courseOutcomes.${idx}.weightage`,
          severity: 'error',
          message: `${coId}: Weightage must be between 5% and 25% (currently ${w}%).`,
          fixHint: 'Adjust weightage to fall within the 5% to 25% institutional limit.',
        });
      }
    });

    if (Math.abs(totalWeightage - 100) > 0.01) {
      results.push({
        id: 'B5_WEIGHTAGE_SUM',
        field: 'courseOutcomes',
        severity: 'error',
        message: `Total CO weightage must sum to 100% (currently ${totalWeightage}%).`,
        fixHint: 'Adjust individual CO weightages so their sum equals exactly 100%.',
      });
    }

    // Check all equal error
    const allEqual = weightages.length > 0 && weightages.every(w => Math.abs(w - weightages[0]) < 0.001);
    if (allEqual) {
      results.push({
        id: 'B5_WEIGHTAGE_ALL_EQUAL',
        field: 'courseOutcomes',
        severity: 'error',
        message: 'Equal weightage across all COs is prohibited. Weightage must reflect differing cognitive complexity.',
        fixHint: 'Differentiate weightages (higher TPS COs should carry proportionally higher weightage).',
      });
    }

    // Check higher-TPS having lower weightage than lower-TPS
    for (let i = 0; i < cos.length; i++) {
      for (let j = 0; j < cos.length; j++) {
        if (cos[i].tpsLevel > cos[j].tpsLevel && (cos[i].weightage || 0) < (cos[j].weightage || 0)) {
          results.push({
            id: 'B5_WEIGHTAGE_TPS_ORDER',
            field: 'courseOutcomes',
            severity: 'warning',
            message: `${cos[i].coNo || 'CO' + (i + 1)} (TPS ${cos[i].tpsLevel}) has lower weightage (${cos[i].weightage}%) than ${cos[j].coNo || 'CO' + (j + 1)} (TPS ${cos[j].tpsLevel}, ${cos[j].weightage}%).`,
            fixHint: 'Higher TPS-level COs should generally carry higher weightage to reflect greater cognitive demand.',
          });
          break;
        }
      }
    }
  }

  // PRACTICAL specific CO checks
  if (courseType === 'PRACTICAL') {
    let cogCount = 0;
    let affCount = 0;
    let psyCount = 0;

    cos.forEach((co, idx) => {
      const coId = co.coNo || `CO${idx + 1}`;
      if (co.domain === 'Cognitive') cogCount++;
      if (co.domain === 'Affective') affCount++;
      if (co.domain === 'Psychomotor') psyCount++;

      // Objective check (1 to 13)
      const objNo = co.objectiveNo || 1;
      if (objNo < 1 || objNo > 13) {
        results.push({
          id: `B5_PRACTICAL_OBJ_${coId}`,
          field: `courseOutcomes.${idx}.objectiveNo`,
          severity: 'warning',
          message: `${coId}: Must specify an associated Laboratory Objective (1 to 13).`,
          fixHint: 'Select the primary laboratory objective addressed by this CO.',
        });
      }
    });

    // Domain distribution guidance for practical courses with 6+ COs
    if (cos.length >= 6) {
      if (cogCount < 2 || cogCount > 4) {
        results.push({
          id: 'B5_LAB_COG_RANGE',
          field: 'courseOutcomes',
          severity: 'warning',
          message: `Recommended: Practical courses with 6+ COs typically include 2 to 4 Cognitive domain COs (found ${cogCount}).`,
          fixHint: 'Adjust Cognitive domain COs to be between 2 and 4.',
        });
      }

      if (affCount < 2 || affCount > 3) {
        results.push({
          id: 'B5_LAB_AFF_RANGE',
          field: 'courseOutcomes',
          severity: 'warning',
          message: `Recommended: Practical courses with 6+ COs typically include 2 to 3 Affective domain COs (found ${affCount}).`,
          fixHint: 'Adjust Affective domain COs to be between 2 and 3.',
        });
      }

      if (psyCount < 2 || psyCount > 3) {
        results.push({
          id: 'B5_LAB_PSY_RANGE',
          field: 'courseOutcomes',
          severity: 'warning',
          message: `Recommended: Practical courses with 6+ COs typically include 2 to 3 Psychomotor domain COs (found ${psyCount}).`,
          fixHint: 'Adjust Psychomotor domain COs to be between 2 and 3.',
        });
      }
    }
  }

  // TCP specific CO checks: At least 2 COs address PO6 to PO11
  if (courseType === 'TCP') {
    let po6To11Count = 0;
    cos.forEach(co => {
      if (co.pi) {
        const pis = co.pi.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
        const hasPo6To11 = pis.some(p => {
          const firstDigit = parseInt(p.split('.')[0], 10);
          return firstDigit >= 6 && firstDigit <= 11;
        });
        if (hasPo6To11) {
          po6To11Count++;
        }
      }
    });

    if (po6To11Count < 2) {
      results.push({
        id: 'B5_TCP_PO6_11',
        field: 'courseOutcomes',
        severity: 'error',
        message: `TCP courses require at least 2 COs mapped to competencies PO6 to PO11 (found ${po6To11Count}).`,
        fixHint: 'Ensure at least 2 COs have Performance Indicators starting with 6 through 11 (e.g. 6.4.1, 7.2.1, 8.2.1).',
      });
    }
  }

  return results;
}

// B6: Assessment Pattern Validation
export function validateAssessmentPattern(
  courseType: CourseType,
  cos: CourseOutcome[],
  matrix: AssessmentMatrixCell[],
  tolerance = 3,
  componentWeights = DEFAULT_CONFIG_SETTINGS.assessmentComponentWeights
): ValidationRuleResult[] {
  const results: ValidationRuleResult[] = [];

  if (!matrix || matrix.length === 0) {
    results.push({
      id: 'B6_EMPTY_MATRIX',
      field: 'assessmentMatrix',
      severity: 'error',
      message: 'Assessment pattern table is required.',
      fixHint: 'Fill in the assessment mark percentages for each Course Outcome.',
    });
    return results;
  }

  if (courseType === 'THEORY') {
    // Columns: CAT1, Assignment 1, CAT2, Assignment 2, Terminal Exam
    const colTotals = {
      cat1: 0,
      assignment1: 0,
      cat2: 0,
      assignment2: 0,
      terminalExam: 0,
    };

    const coAppearance: Record<string, number> = {};

    matrix.forEach(row => {
      colTotals.cat1 += Number(row.cat1) || 0;
      colTotals.assignment1 += Number(row.assignment1) || 0;
      colTotals.cat2 += Number(row.cat2) || 0;
      colTotals.assignment2 += Number(row.assignment2) || 0;
      colTotals.terminalExam += Number(row.terminalExam) || 0;

      const totalMarksForCo = (row.cat1 || 0) + (row.assignment1 || 0) + (row.cat2 || 0) + (row.assignment2 || 0) + (row.terminalExam || 0);
      coAppearance[row.coNo] = totalMarksForCo;
    });

    const columns: Array<{ name: keyof typeof colTotals; label: string }> = [
      { name: 'cat1', label: 'CAT 1' },
      { name: 'assignment1', label: 'Assignment 1' },
      { name: 'cat2', label: 'CAT 2' },
      { name: 'assignment2', label: 'Assignment 2' },
      { name: 'terminalExam', label: 'Terminal Exam' },
    ];

    columns.forEach(col => {
      const total = colTotals[col.name];
      if (Math.abs(total - 100) > 0.01) {
        results.push({
          id: `B6_COL_SUM_${col.name}`,
          field: `assessmentMatrix.${col.name}`,
          severity: 'error',
          message: `Assessment column "${col.label}" must total 100% (currently ${total}%).`,
          fixHint: `Adjust row values so that ${col.label} column sum equals exactly 100%.`,
        });
      }
    });

    // Every CO must appear in at least one component
    cos.forEach(co => {
      if (!coAppearance[co.coNo] || coAppearance[co.coNo] <= 0) {
        results.push({
          id: `B6_CO_MISSING_${co.coNo}`,
          field: 'assessmentMatrix',
          severity: 'error',
          message: `${co.coNo} does not appear in any assessment component.`,
          fixHint: `Allocate marks for ${co.coNo} in at least one CAT, Assignment, or Terminal Exam.`,
        });
      }
    });

    // CO Overall Share check vs Weightage
    // Overall share = sum over components (cell% * component weight / 100)
    const totalCompWeight = componentWeights.cat1 + componentWeights.assignment1 + componentWeights.cat2 + componentWeights.assignment2 + componentWeights.terminal;

    matrix.forEach(row => {
      const co = cos.find(c => c.coNo === row.coNo);
      if (co && co.weightage !== undefined) {
        const share = (
          (row.cat1 || 0) * componentWeights.cat1 +
          (row.assignment1 || 0) * componentWeights.assignment1 +
          (row.cat2 || 0) * componentWeights.cat2 +
          (row.assignment2 || 0) * componentWeights.assignment2 +
          (row.terminalExam || 0) * componentWeights.terminal
        ) / (totalCompWeight || 100);

        const diff = Math.abs(share - co.weightage);
        if (diff > tolerance) {
          results.push({
            id: `B6_CO_SHARE_TOLERANCE_${row.coNo}`,
            field: 'assessmentMatrix',
            severity: 'warning',
            message: `${row.coNo}: Computed assessment share (${share.toFixed(1)}%) differs from CO weightage (${co.weightage}%) by ${diff.toFixed(1)}% (exceeds ${tolerance}% tolerance).`,
            fixHint: `Rebalance assessment marks for ${row.coNo} across components to align closely with its weightage.`,
          });
        }
      }
    });

    // TPS Question Level Split check (Section 4.2)
    cos.forEach(co => {
      if (co.questionLevelSplit) {
        const own = co.questionLevelSplit.ownLevelPercent;
        const lower = co.questionLevelSplit.lowerLevelPercent;
        if (own < 70 || own > 100) {
          results.push({
            id: `B6_TPS_SPLIT_OWN_${co.coNo}`,
            field: 'questionLevelSplit',
            severity: 'error',
            message: `${co.coNo}: Question weightage at own TPS level must be between 70% and 100% (currently ${own}%).`,
            fixHint: `Set own TPS level question allocation to at least 70%.`,
          });
        }
        if (lower < 0 || lower > 30) {
          results.push({
            id: `B6_TPS_SPLIT_LOWER_${co.coNo}`,
            field: 'questionLevelSplit',
            severity: 'error',
            message: `${co.coNo}: Question weightage at lower TPS levels must be between 0% and 30% (currently ${lower}%).`,
            fixHint: `Ensure lower TPS level question allocation does not exceed 30%.`,
          });
        }
        if (Math.abs(own + lower - 100) > 0.01) {
          results.push({
            id: `B6_TPS_SPLIT_SUM_${co.coNo}`,
            field: 'questionLevelSplit',
            severity: 'error',
            message: `${co.coNo}: Question level split must sum to 100% (currently ${own + lower}%).`,
            fixHint: `Ensure own level % + lower level % = 100%.`,
          });
        }
      }
    });
  }

  if (courseType === 'TCP') {
    // Columns: Theory CAT1, Theory CAT2, Practical Continuous Assessment, Practical Model Test, Terminal Exam
    const colTotals = {
      theoryCat1: 0,
      theoryCat2: 0,
      practicalCa: 0,
      practicalModel: 0,
      tcpTerminal: 0,
    };

    matrix.forEach(row => {
      colTotals.theoryCat1 += Number(row.theoryCat1) || 0;
      colTotals.theoryCat2 += Number(row.theoryCat2) || 0;
      colTotals.practicalCa += Number(row.practicalCa) || 0;
      colTotals.practicalModel += Number(row.practicalModel) || 0;
      colTotals.tcpTerminal += Number(row.tcpTerminal) || 0;
    });

    const columns: Array<{ name: keyof typeof colTotals; label: string }> = [
      { name: 'theoryCat1', label: 'Theory CAT 1' },
      { name: 'theoryCat2', label: 'Theory CAT 2' },
      { name: 'practicalCa', label: 'Practical CA' },
      { name: 'practicalModel', label: 'Model Test CO-wise' },
      { name: 'tcpTerminal', label: 'Terminal Exam' },
    ];

    columns.forEach(col => {
      const total = colTotals[col.name];
      if (Math.abs(total - 100) > 0.01) {
        results.push({
          id: `B6_TCP_COL_SUM_${col.name}`,
          field: `assessmentMatrix.${col.name}`,
          severity: 'error',
          message: `TCP Assessment column "${col.label}" must total 100% (currently ${total}%).`,
          fixHint: `Adjust row values so that ${col.label} column sum equals exactly 100%.`,
        });
      }
    });
  }

  if (courseType === 'PRACTICAL') {
    // Columns: Theory CAT1, Theory CAT2, Practical Continuous Assessment, Practical Model Test, Terminal Exam (Practical)
    const colTotals = {
      theoryCat1: 0,
      theoryCat2: 0,
      practicalCa: 0,
      practicalModel: 0,
      terminalExam: 0,
    };

    const coAppearance: Record<string, number> = {};

    matrix.forEach(row => {
      const c1 = Number(row.theoryCat1 !== undefined ? row.theoryCat1 : row.cat1) || 0;
      const c2 = Number(row.theoryCat2 !== undefined ? row.theoryCat2 : (row.cat2 || row.assignment1)) || 0;
      const c3 = Number(row.practicalCa) || 0;
      const c4 = Number(row.practicalModel) || 0;
      const c5 = Number(row.terminalExam !== undefined ? row.terminalExam : row.tcpTerminal) || 0;

      colTotals.theoryCat1 += c1;
      colTotals.theoryCat2 += c2;
      colTotals.practicalCa += c3;
      colTotals.practicalModel += c4;
      colTotals.terminalExam += c5;

      coAppearance[row.coNo] = (coAppearance[row.coNo] || 0) + c1 + c2 + c3 + c4 + c5;
    });

    const columns: Array<{ name: keyof typeof colTotals; label: string }> = [
      { name: 'theoryCat1', label: 'CAT1' },
      { name: 'theoryCat2', label: 'CAT2' },
      { name: 'practicalCa', label: 'OCR/Continuous Assessment' },
      { name: 'practicalModel', label: 'Model Test CO-wise' },
      { name: 'terminalExam', label: 'Terminal Exam (Practical)' },
    ];

    columns.forEach(col => {
      const total = colTotals[col.name];
      if (Math.abs(total - 100) > 0.01) {
        results.push({
          id: `B6_LAB_COL_SUM_${col.name}`,
          field: `assessmentMatrix.${col.name}`,
          severity: 'error',
          message: `Assessment column "${col.label}" must total 100% (currently ${total}%).`,
          fixHint: `Adjust row values so that ${col.label} column sum equals exactly 100%.`,
        });
      }
    });

    // Every CO must appear in at least one component
    cos.forEach(co => {
      if (!coAppearance[co.coNo] || coAppearance[co.coNo] <= 0) {
        results.push({
          id: `B6_LAB_CO_MISSING_${co.coNo}`,
          field: 'assessmentMatrix',
          severity: 'error',
          message: `${co.coNo} does not appear in any assessment component.`,
          fixHint: `Allocate marks for ${co.coNo} in at least one assessment component.`,
        });
      }
    });
  }

  return results;
}

// B7: Syllabus Modules Validation
export function validateSyllabusModules(modules: SyllabusModule[], cos: CourseOutcome[]): ValidationRuleResult[] {
  const results: ValidationRuleResult[] = [];

  if (!modules || modules.length === 0) {
    results.push({
      id: 'B7_EMPTY',
      field: 'modules',
      severity: 'error',
      message: 'At least one syllabus module is required.',
      fixHint: 'Add course modules with main topic, subtopics, and CO mapping.',
    });
    return results;
  }

  const coveredCoNos = new Set<string>();

  modules.forEach((mod, idx) => {
    const modNum = mod.moduleNo || idx + 1;
    if (!mod.mainTopic || !mod.mainTopic.trim()) {
      results.push({
        id: `B7_MOD_TOPIC_EMPTY_${modNum}`,
        field: `modules.${idx}.mainTopic`,
        severity: 'error',
        message: `Module ${modNum}: Main topic is required.`,
        fixHint: 'Enter a descriptive main topic title.',
      });
    }

    if (!mod.subtopics || mod.subtopics.length === 0 || mod.subtopics.every(s => !s.trim())) {
      results.push({
        id: `B7_MOD_SUBTOPICS_EMPTY_${modNum}`,
        field: `modules.${idx}.subtopics`,
        severity: 'error',
        message: `Module ${modNum}: Must contain at least one subtopic.`,
        fixHint: 'Add subtopics separated by dashes.',
      });
    }

    if (mod.coMapping && mod.coMapping.length > 0) {
      mod.coMapping.forEach(coNo => coveredCoNos.add(coNo));
    }
  });

  return results;
}

// B8: Lab-specific Sections Validation
export function validateExperimentsAndPlan(
  experiments: LabExperiment[],
  coursePlan: LabCoursePlanItem[],
  cos: CourseOutcome[]
): ValidationRuleResult[] {
  const results: ValidationRuleResult[] = [];

  if (!experiments || experiments.length === 0) {
    results.push({
      id: 'B8_EXPERIMENTS_EMPTY',
      field: 'experiments',
      severity: 'error',
      message: 'List of experiments is required for practical/TCP courses.',
      fixHint: 'Add laboratory experiments with names, openness levels, and CO mapping.',
    });
    return results;
  }

  const coveredCoNos = new Set<string>();
  let allLevel1 = true;

  experiments.forEach((exp, idx) => {
    const slNo = exp.slNo || idx + 1;
    if (!exp.name || !exp.name.trim()) {
      results.push({
        id: `B8_EXP_NAME_EMPTY_${slNo}`,
        field: `experiments.${idx}.name`,
        severity: 'error',
        message: `Experiment ${slNo}: Name is required.`,
        fixHint: 'Enter the experiment title.',
      });
    }

    if (![1, 2, 3].includes(exp.level)) {
      results.push({
        id: `B8_EXP_LEVEL_INVALID_${slNo}`,
        field: `experiments.${idx}.level`,
        severity: 'error',
        message: `Experiment ${slNo}: Level must be 1, 2, or 3 (Schwab/Herron inquiry openness).`,
        fixHint: 'Set openness level: 1 (structured), 2 (guided), or 3 (open-ended).',
      });
    } else if (exp.level > 1) {
      allLevel1 = false;
    }

    if (!exp.coNos || exp.coNos.length === 0) {
      results.push({
        id: `B8_EXP_CO_EMPTY_${slNo}`,
        field: `experiments.${idx}.coNos`,
        severity: 'error',
        message: `Experiment ${slNo}: Must map to at least one Course Outcome.`,
        fixHint: 'Select COs addressed by this experiment.',
      });
    } else {
      exp.coNos.forEach(coNo => coveredCoNos.add(coNo));
    }
  });

  if (allLevel1 && experiments.length > 1) {
    results.push({
      id: 'B8_ALL_LEVEL_1_WARNING',
      field: 'experiments',
      severity: 'warning',
      message: 'All experiments are set to Level 1 (Structured/Verification).',
      fixHint: 'Institutional guidelines encourage higher inquiry openness (Level 2 Guided or Level 3 Open-ended) for deeper learning.',
    });
  }

  // Every CO must be mapped to at least one experiment
  cos.forEach(co => {
    if (!coveredCoNos.has(co.coNo)) {
      results.push({
        id: `B8_CO_NOT_MAPPED_EXP_${co.coNo}`,
        field: 'experiments',
        severity: 'error',
        message: `${co.coNo} is not mapped to any experiment.`,
        fixHint: `Ensure ${co.coNo} is practiced in at least one laboratory experiment.`,
      });
    }
  });

  // Annexure 1: Course plan assessment marks check (must sum to 75 per experiment)
  if (coursePlan && coursePlan.length > 0) {
    coursePlan.forEach((planItem, idx) => {
      const expNo = planItem.experimentNo || idx + 1;
      const sum = (planItem.preMarks || 0) + (planItem.inMarks || 0) + (planItem.postMarks || 0);
      if (Math.abs(sum - 75) > 0.01) {
        results.push({
          id: `B8_PLAN_MARKS_SUM_${expNo}`,
          field: `coursePlan.${idx}`,
          severity: 'error',
          message: `Experiment ${expNo} assessment marks must sum to 75 (Pre: ${planItem.preMarks}, In: ${planItem.inMarks}, Post: ${planItem.postMarks} -> Total: ${sum}).`,
          fixHint: 'Adjust Pre-Lab, In-Lab, and Post-Lab marks so their sum equals exactly 75.',
        });
      }
    });
  }

  return results;
}

// B9: Contact Hours Criteria Helper
export interface CourseHoursCriteria {
  minHours: number;
  maxHours: number;
  description: string;
}

export function getExpectedHoursCriteria(credits: number): CourseHoursCriteria {
  const c = Number(credits) || 0;
  if (c === 1) {
    return { minHours: 12, maxHours: 14, description: '12 to 14 hours (1 credit)' };
  }
  if (c === 2) {
    return { minHours: 24, maxHours: 28, description: '24 to 28 hours (2 credits)' };
  }
  if (c === 3) {
    return { minHours: 36, maxHours: 36, description: '36 hours (3 credits)' };
  }
  if (c === 4) {
    return { minHours: 48, maxHours: 48, description: '48 hours (4 credits)' };
  }
  const exp = c * 12;
  return { minHours: exp, maxHours: exp, description: `${exp} hours (${c} credits)` };
}

// B9: Lecture Schedule Validation
export function validateLectureSchedule(
  courseType: CourseType,
  modules: SyllabusModule[],
  credits: number,
  L = 0,
  lectureScheduleItems?: LectureScheduleItem[]
): ValidationRuleResult[] {
  const results: ValidationRuleResult[] = [];

  const totalPeriods = (modules || []).reduce((sum, m) => sum + (Number(m.periods) || 0), 0);
  const effectiveCredits = courseType === 'TCP' && L > 0 ? L : credits;
  const criteria = getExpectedHoursCriteria(effectiveCredits);

  if (courseType === 'THEORY' || courseType === 'TCP') {
    if (totalPeriods > 0 && (totalPeriods < criteria.minHours || totalPeriods > criteria.maxHours)) {
      const diffText = totalPeriods < criteria.minHours
        ? `short by ${criteria.minHours - totalPeriods} hours (min: ${criteria.minHours} hrs)`
        : `exceeds by ${totalPeriods - criteria.maxHours} hours (max: ${criteria.maxHours} hrs)`;
      results.push({
        id: 'B9_THEORY_PERIODS_MISMATCH',
        field: 'modules.periods',
        severity: 'error',
        message: `Total lecture hours (${totalPeriods} hrs) does not match required criteria (${criteria.description}). Total hours is ${diffText}. Please correct module hours.`,
        fixHint: `Adjust periods across modules so the total satisfies ${criteria.description}.`,
      });
    }

    if (lectureScheduleItems && lectureScheduleItems.length > 0) {
      const scheduleTotal = lectureScheduleItems.reduce((sum, item) => sum + (Number(item.periods) || 0), 0);
      if (scheduleTotal < criteria.minHours || scheduleTotal > criteria.maxHours) {
        const diffText = scheduleTotal < criteria.minHours
          ? `short by ${criteria.minHours - scheduleTotal} hours (min: ${criteria.minHours} hrs)`
          : `exceeds by ${scheduleTotal - criteria.maxHours} hours (max: ${criteria.maxHours} hrs)`;
        results.push({
          id: 'B9_SCHEDULE_PERIODS_MISMATCH',
          field: 'lectureScheduleItems',
          severity: 'error',
          message: `Total lecture schedule hours (${scheduleTotal} hrs) does not match required criteria (${criteria.description}). Total hours is ${diffText}. Please correct lecture schedule rows.`,
          fixHint: `Adjust periods across lecture schedule rows so the total satisfies ${criteria.description}.`,
        });
      }

      lectureScheduleItems.forEach((item, rIdx) => {
        if (item.periods && Number(item.periods) > 2) {
          results.push({
            id: `B9_SCHEDULE_ROW_PERIODS_MAX_${rIdx}`,
            field: `lectureScheduleItems.${rIdx}.periods`,
            severity: 'error',
            message: `Topic ${item.moduleNo || rIdx + 1}: Number of periods cannot be more than 2 (found ${item.periods}).`,
            fixHint: 'Reduce periods for this topic to at most 2 periods.',
          });
        }
      });
    }
  }

  return results;
}

// B10: Learning Resources Validation
export function validateLearningResources(
  textBooks: LearningResource[],
  referenceBooks: LearningResource[],
  regulationYear = 2026,
  isAdvanced = false,
  courseType?: CourseType
): ValidationRuleResult[] {
  const results: ValidationRuleResult[] = [];
  const textList = textBooks || [];
  const refList = referenceBooks || [];
  const isLab = courseType === 'PRACTICAL';

  // Text books:
  // For Theory / TCP: strictly 1 to 2 Text Books required
  // For Practical (Laboratory): Text Books are optional (0 to 2), as lab courses rely on Reference Books & Manuals
  if (!isLab) {
    if (textList.length < 1 || textList.length > 2) {
      results.push({
        id: 'B10_TEXTBOOK_COUNT',
        field: 'textBooks',
        severity: 'error',
        message: `A theory course must list 1 to 2 Text Books (currently ${textList.length}).`,
        fixHint: 'Ensure exactly 1 or 2 text books are specified.',
      });
    }
  } else {
    if (textList.length > 2) {
      results.push({
        id: 'B10_TEXTBOOK_COUNT',
        field: 'textBooks',
        severity: 'error',
        message: `A laboratory course can list up to 2 Text Books (currently ${textList.length}).`,
        fixHint: 'Ensure at most 2 text books are specified.',
      });
    }
  }

  // Reference books:
  // For Theory / TCP: 3 to 6 Reference Books
  // For Practical (Laboratory): at least 1 and up to 6 Reference Books / Lab Manuals
  if (isLab) {
    if (refList.length < 1 || refList.length > 6) {
      results.push({
        id: 'B10_REFBOOK_COUNT',
        field: 'referenceBooks',
        severity: 'error',
        message: `A laboratory course must list at least 1 Reference Book or Lab Manual (currently ${refList.length}).`,
        fixHint: 'Add 1 to 6 reference books or laboratory manuals.',
      });
    }
  } else {
    if (refList.length < 3 || refList.length > 6) {
      results.push({
        id: 'B10_REFBOOK_COUNT',
        field: 'referenceBooks',
        severity: 'error',
        message: `A course must list 3 to 6 Reference Books (currently ${refList.length}).`,
        fixHint: 'Add or remove reference books to have between 3 and 6 titles.',
      });
    }
  }

  const allBooks = [
    ...textList.map((b, idx) => ({ ...b, idx, section: 'textBooks', label: `Text Book ${idx + 1}` })),
    ...refList.map((b, idx) => ({ ...b, idx, section: 'referenceBooks', label: `Reference Book ${idx + 1}` })),
  ];

  let hasRecentBook = false;

  allBooks.forEach(book => {
    if (!book.authors || !book.authors.trim()) {
      results.push({
        id: `B10_AUTHOR_MISSING_${book.label}`,
        field: `${book.section}.${book.idx}.authors`,
        severity: 'error',
        message: `${book.label}: Author name(s) is required.`,
        fixHint: 'Enter author name(s).',
      });
    }

    if (!book.title || !book.title.trim()) {
      results.push({
        id: `B10_TITLE_MISSING_${book.label}`,
        field: `${book.section}.${book.idx}.title`,
        severity: 'error',
        message: `${book.label}: Title is required.`,
        fixHint: 'Enter publication title.',
      });
    }

    if (!book.year) {
      results.push({
        id: `B10_YEAR_MISSING_${book.label}`,
        field: `${book.section}.${book.idx}.year`,
        severity: 'error',
        message: `${book.label}: Publication year is mandatory.`,
        fixHint: 'Enter publication year (e.g. 2021).',
      });
    } else {
      const yearNum = parseInt(String(book.year), 10);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > regulationYear + 1) {
        results.push({
          id: `B10_YEAR_INVALID_${book.label}`,
          field: `${book.section}.${book.idx}.year`,
          severity: 'error',
          message: `${book.label}: Publication year is invalid (${book.year}).`,
          fixHint: 'Provide a valid 4-digit calendar year.',
        });
      } else {
        const isRecent = regulationYear - yearNum <= 5;
        if (isRecent) {
          hasRecentBook = true;
        } else if (isAdvanced) {
          results.push({
            id: `B10_RECENCY_ADVANCED_${book.label}`,
            field: `${book.section}.${book.idx}.year`,
            severity: 'error',
            message: `${book.label} (${yearNum}) exceeds 5-year recency limit for advanced/elective courses (syllabus year: ${regulationYear}).`,
            fixHint: `For advanced courses, publications should be ${regulationYear - 5} or newer. If retaining classic reference, provide at least one recent edition.`,
          });
        }
      }
    }
  });

  if (isAdvanced && !hasRecentBook && allBooks.length > 0) {
    results.push({
      id: 'B10_NO_RECENT_BOOK_ADVANCED',
      field: 'textBooks',
      severity: 'error',
      message: `Advanced course requires at least one publication within 5 years (${regulationYear - 5} or newer).`,
      fixHint: 'Add a recent book publication (2021 or newer).',
    });
  }

  return results;
}

// B11: SDG Alignment Validation
export function validateSdgAlignment(
  cos: CourseOutcome[],
  sdgActivities: SdgActivity[],
  modules: SyllabusModule[]
): ValidationRuleResult[] {
  const results: ValidationRuleResult[] = [];

  // Gather SDGs addressed in COs
  const activeSdgs = new Set<number>();
  cos.forEach(co => {
    if (co.sdgNo && co.sdgNo !== 'NC') {
      const nums = String(co.sdgNo)
        .split(/[,;\s]+/)
        .map(s => Number(s.replace(/[^0-9]/g, '')))
        .filter(n => !isNaN(n) && n >= 1 && n <= 17);
      nums.forEach(n => activeSdgs.add(n));
    }
  });

  const acts = sdgActivities || [];
  const coveredSdgs = new Set<number>();
  const moduleNumbers = new Set(modules.map(m => m.moduleNo));

  acts.forEach((act, idx) => {
    const actNum = idx + 1;
    coveredSdgs.add(act.sdgNo);

    if (!act.activity || !act.activity.trim()) {
      results.push({
        id: `B11_ACTIVITY_EMPTY_${actNum}`,
        field: `sdgActivities.${idx}.activity`,
        severity: 'error',
        message: `SDG Activity ${actNum}: Description is required.`,
        fixHint: 'Enter an academic activity (case study, problem set, simulation, etc.) addressing SDG ' + act.sdgNo + '.',
      });
    }

    if (!act.deliverable || !act.deliverable.trim()) {
      results.push({
        id: `B11_DELIVERABLE_EMPTY_${actNum}`,
        field: `sdgActivities.${idx}.deliverable`,
        severity: 'error',
        message: `SDG Activity ${actNum}: Deliverable is required.`,
        fixHint: 'Specify deliverable (e.g. Report, Presentation, Design Exercise).',
      });
    }

    if (act.linkedModuleNo !== undefined && act.linkedModuleNo !== null) {
      if (!moduleNumbers.has(act.linkedModuleNo)) {
        results.push({
          id: `B11_MODULE_LINK_INVALID_${actNum}`,
          field: `sdgActivities.${idx}.linkedModuleNo`,
          severity: 'error',
          message: `SDG Activity ${actNum}: Linked Module ${act.linkedModuleNo} does not exist in syllabus.`,
          fixHint: 'Select an existing module number from the course syllabus.',
        });
      }
    } else {
      results.push({
        id: `B11_MODULE_LINK_WARN_${actNum}`,
        field: `sdgActivities.${idx}.linkedModuleNo`,
        severity: 'warning',
        message: `SDG Activity ${actNum} is not linked to any specific syllabus module.`,
        fixHint: 'Link the SDG activity to an existing module topic to avoid looking "bolted on".',
      });
    }
  });

  // Every SDG in CO table must have an activity
  activeSdgs.forEach(sdg => {
    if (!coveredSdgs.has(sdg)) {
      results.push({
        id: `B11_SDG_MISSING_ACTIVITY_${sdg}`,
        field: 'sdgActivities',
        severity: 'warning',
        message: `SDG ${sdg} is assigned in Course Outcomes. Add a corresponding academic activity when configuring modules.`,
        fixHint: `Add at least one concrete academic activity for SDG ${sdg} with deliverable and linked module.`,
      });
    }
  });

  return results;
}

// B12: Prerequisites and Designers Validation
export function validatePrerequisitesAndDesigners(
  prerequisites: any,
  designers: CourseDesigner[]
): ValidationRuleResult[] {
  const results: ValidationRuleResult[] = [];

  // Designers check
  if (!designers || designers.length === 0) {
    results.push({
      id: 'B12_NO_DESIGNERS',
      field: 'designers',
      severity: 'error',
      message: 'At least one Course Designer must be listed.',
      fixHint: 'Add designer details (Name, Designation, Department, Email).',
    });
  } else {
    designers.forEach((des, idx) => {
      const dNum = idx + 1;
      if (!des.name || !des.name.trim()) {
        results.push({
          id: `B12_DESIGNER_NAME_${dNum}`,
          field: `designers.${idx}.name`,
          severity: 'error',
          message: `Designer ${dNum}: Name is required.`,
          fixHint: 'Enter faculty designer name.',
        });
      }
      if (!des.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(des.email)) {
        results.push({
          id: `B12_DESIGNER_EMAIL_${dNum}`,
          field: `designers.${idx}.email`,
          severity: 'error',
          message: `Designer ${dNum}: Valid institutional email is required.`,
          fixHint: 'Enter a valid email address (e.g. faculty@institution.edu).',
        });
      }
    });
  }

  return results;
}

// B13: 17-Point Theory Compliance Checklist Auto-Evaluation
export function evaluateTheoryChecklist(course: Course): Array<{ id: number; title: string; passed: boolean; reason?: string }> {
  const items = [
    {
      id: 1,
      title: 'Course Name uses only alphanumeric characters and spaces; no special characters.',
      passed: /^[a-zA-Z0-9\s]+$/.test((course.courseName || '').trim()),
      reason: 'Course name must have no hyphens, slashes, or special symbols.',
    },
    {
      id: 2,
      title: 'Course Name is in Title Case and does not exceed 60 characters.',
      passed: (course.courseName || '').trim().length > 0 && (course.courseName || '').trim().length <= 60,
      reason: `Length: ${(course.courseName || '').trim().length}/60.`,
    },
    {
      id: 3,
      title: 'Preamble is a single paragraph without CO list (max 90 words).',
      passed: (course.preamble || '').trim().length > 0 &&
        (course.preamble || '').split(/\n\s*\n/).length === 1 &&
        countWords(course.preamble || '') <= 90,
      reason: (course.preamble || '').trim().length > 0
        ? `Words: ${countWords(course.preamble || '')} / 90 words max.`
        : 'Preamble missing.',
    },
    {
      id: 4,
      title: Number(course.credits) < 3
        ? `Number of COs meets minimum requirement (${Number(course.credits) <= 1 ? 3 : 4} to 8).`
        : 'Number of COs is between 6 and 8.',
      passed: (() => {
        const count = (course.courseOutcomes || []).length;
        const minReq = Number(course.credits) <= 1 ? 3 : (Number(course.credits) === 2 ? 4 : 6);
        return count >= minReq && count <= 8;
      })(),
      reason: `Count: ${(course.courseOutcomes || []).length} COs.`,
    },
    {
      id: 5,
      title: 'At least 70% of COs are at or above TPS 3.',
      passed: (() => {
        const cos = course.courseOutcomes || [];
        if (cos.length === 0) return false;
        const count = cos.filter(c => c.tpsLevel >= 3).length;
        let req = Math.round(cos.length * 0.7);
        if (cos.length === 6) req = 4;
        else if (cos.length === 8) req = 5;
        return count >= req;
      })(),
      reason: 'Minimum 70% must be TPS 3, 4, or 5.',
    },
    {
      id: 6,
      title: 'Every CO begins with an action verb appropriate to its TPS level.',
      passed: (() => {
        const cos = course.courseOutcomes || [];
        if (cos.length === 0) return false;
        return cos.every(co => {
          const firstWord = (co.statement || '').trim().split(/\s+/)[0]?.replace(/[^a-zA-Z]/g, '') || '';
          const valid = TPS_VERBS[co.tpsLevel] || [];
          return valid.some(v => v.toLowerCase() === firstWord.toLowerCase());
        });
      })(),
      reason: 'Verbs must match the TPS taxonomy dictionary.',
    },
    {
      id: 7,
      title: 'Each CO has a distinct, measurable Performance Indicator.',
      passed: (() => {
        const pis = (course.courseOutcomes || []).map(c => (c.pi || '').trim()).filter(Boolean);
        return pis.length === (course.courseOutcomes || []).length;
      })(),
      reason: 'All COs should have Performance Indicator(s) assigned.',
    },
    {
      id: 8,
      title: 'CO Weightage values are unequal, sum to 100, and range 5–25% per CO.',
      passed: (() => {
        const cos = course.courseOutcomes || [];
        if (cos.length === 0) return false;
        const sum = cos.reduce((acc, c) => acc + (c.weightage || 0), 0);
        if (Math.abs(sum - 100) > 0.01) return false;
        const allInRange = cos.every(c => (c.weightage || 0) >= 5 && (c.weightage || 0) <= 25);
        if (!allInRange) return false;
        const allSame = cos.every(c => Math.abs((c.weightage || 0) - (cos[0].weightage || 0)) < 0.01);
        return !allSame;
      })(),
      reason: 'Weightage sum = 100%, 5-25% each, non-uniform.',
    },
    {
      id: 9,
      title: 'Higher TPS-level COs carry proportionally higher weightage.',
      passed: (() => {
        const cos = course.courseOutcomes || [];
        for (let i = 0; i < cos.length; i++) {
          for (let j = 0; j < cos.length; j++) {
            if (cos[i].tpsLevel > cos[j].tpsLevel && (cos[i].weightage || 0) < (cos[j].weightage || 0)) {
              return false;
            }
          }
        }
        return true;
      })(),
      reason: 'Higher cognitive demand maps to higher weightage.',
    },
    {
      id: 10,
      title: 'Assessment Pattern: COs have 70% - 100% marks in same-level TPS, 0-30% lower-level questions.',
      passed: (() => {
        const cos = course.courseOutcomes || [];
        return cos.every(co => {
          if (!co.questionLevelSplit) return true; // advisory if empty
          return co.questionLevelSplit.ownLevelPercent >= 70 && co.questionLevelSplit.lowerLevelPercent <= 30;
        });
      })(),
      reason: 'Question distribution adheres to TPS cognitive standards.',
    },
    {
      id: 11,
      title: 'SDGs listed are genuinely connected to course domain (not forced).',
      passed: (() => {
        const cos = course.courseOutcomes || [];
        return cos.some(c => {
          if (!c.sdgNo || c.sdgNo === 'NC') return false;
          const nums = String(c.sdgNo)
            .split(/[,;\s]+/)
            .map(s => Number(s.replace(/[^0-9]/g, '')))
            .filter(n => !isNaN(n) && n >= 1 && n <= 17);
          return nums.length > 0;
        });
      })(),
      reason: 'At least one SDG addressed with domain justification.',
    },
    {
      id: 12,
      title: 'Every SDG has at least one corresponding academic activity listed.',
      passed: (() => {
        const cos = course.courseOutcomes || [];
        const sdgs = new Set<number>();
        cos.forEach(c => {
          if (c.sdgNo && c.sdgNo !== 'NC') {
            const nums = String(c.sdgNo)
              .split(/[,;\s]+/)
              .map(s => Number(s.replace(/[^0-9]/g, '')))
              .filter(n => !isNaN(n) && n >= 1 && n <= 17);
            nums.forEach(n => sdgs.add(n));
          }
        });
        const acts = new Set((course.sdgActivities || []).map(a => a.sdgNo));
        for (const s of sdgs) {
          if (!acts.has(s)) return false;
        }
        return true;
      })(),
      reason: 'Actionable deliverable exists for each addressed SDG.',
    },
    {
      id: 13,
      title: 'SDG activities are integrated with module topics (not standalone).',
      passed: (() => {
        const acts = course.sdgActivities || [];
        if (acts.length === 0) return false;
        const modNos = new Set((course.modules || []).map(m => m.moduleNo));
        return acts.every(a => a.linkedModuleNo !== undefined && modNos.has(a.linkedModuleNo));
      })(),
      reason: 'All activities link to an active syllabus module.',
    },
    {
      id: 14,
      title: '1–2 Text Books listed with chapter references per module.',
      passed: (course.textBooks || []).length >= 1 && (course.textBooks || []).length <= 2,
      reason: `Text books count: ${(course.textBooks || []).length} (required: 1-2).`,
    },
    {
      id: 15,
      title: 'For advanced courses: all books published within 5 years of syllabus year.',
      passed: (() => {
        if (!course.isAdvanced && course.categoryAbbr !== 'PEC' && course.categoryAbbr !== 'OEC') return true;
        const books = [...(course.textBooks || []), ...(course.referenceBooks || [])];
        if (books.length === 0) return false;
        const year = course.regulationYear || 2026;
        return books.some(b => {
          const y = parseInt(String(b.year), 10);
          return !isNaN(y) && year - y <= 5;
        });
      })(),
      reason: 'At least one publication within 5 years for advanced/elective courses.',
    },
    {
      id: 16,
      title: 'Reference books follow standard citation format with year (3–6 titles).',
      passed: (course.referenceBooks || []).length >= 3 && (course.referenceBooks || []).length <= 6 && (course.referenceBooks || []).every(b => !!b.year),
      reason: `Reference books count: ${(course.referenceBooks || []).length} (required: 3-6) with publication year.`,
    },
    {
      id: 17,
      title: 'Total number of lecture hours is strictly assigned according to credit criteria (1 credit: 12–14 hrs, 2 credits: 24–28 hrs, 3 credits: 36 hrs, 4 credits: 48 hrs).',
      passed: (() => {
        const totalPeriods = (course.modules || []).reduce((sum, m) => sum + (Number(m.periods) || 0), 0);
        if (totalPeriods === 0) return true; // Periods omitted from syllabus modules
        const criteria = getExpectedHoursCriteria(course.credits);
        return totalPeriods >= criteria.minHours && totalPeriods <= criteria.maxHours;
      })(),
      reason: (() => {
        const totalPeriods = (course.modules || []).reduce((sum, m) => sum + (Number(m.periods) || 0), 0);
        if (totalPeriods === 0) {
          return 'Periods not mentioned in syllabus modules (as per institutional format).';
        }
        const criteria = getExpectedHoursCriteria(course.credits);
        if (totalPeriods < criteria.minHours) {
          return `Error: ${totalPeriods} hrs assigned; short by ${criteria.minHours - totalPeriods} hrs (required criteria: ${criteria.description}). Please correct module hours.`;
        }
        if (totalPeriods > criteria.maxHours) {
          return `Error: ${totalPeriods} hrs assigned; exceeds by ${totalPeriods - criteria.maxHours} hrs (allowed criteria: ${criteria.description}). Please correct module hours.`;
        }
        return `Periods: ${totalPeriods} hrs matches required criteria (${criteria.description}).`;
      })(),
    },
  ];

  return items;
}

// Master Composite Course Validator
export function validateCourse(
  course: Course,
  existingProgrammeCodes: string[] = [],
  tolerance = DEFAULT_CONFIG_SETTINGS.coShareTolerance,
  componentWeights = DEFAULT_CONFIG_SETTINGS.assessmentComponentWeights,
  allowTps1 = DEFAULT_CONFIG_SETTINGS.allowTps1
): CourseValidationReport {
  const allResults: ValidationRuleResult[] = [];

  // B1: Course Name
  allResults.push(...validateCourseName(course.courseName, course.courseType));

  // B2: Course Code
  allResults.push(...validateCourseCode({
    regulationCode: course.regulationCode,
    programmeCode: course.programmeCode,
    categoryLetter: course.categoryLetter,
    uniqueLetter: course.uniqueLetter,
    version: course.version,
  }, existingProgrammeCodes.filter(c => c !== course.courseCode)));

  // B3: Category, L-T-P, Credits
  allResults.push(...validateLtpCredits(
    course.courseType,
    course.categoryAbbr,
    course.L,
    course.T,
    course.P,
    course.credits
  ));

  // B4: Preamble
  allResults.push(...validatePreamble(
    course.preamble,
    (course.courseOutcomes || []).map(c => c.statement)
  ));

  // B5: Course Outcomes
  allResults.push(...validateCourseOutcomes(
    course.courseOutcomes,
    course.courseType,
    allowTps1,
    course.credits
  ));

  // B6: Assessment Pattern
  allResults.push(...validateAssessmentPattern(
    course.courseType,
    course.courseOutcomes || [],
    course.assessmentMatrix || [],
    tolerance,
    componentWeights
  ));

  // B7: Syllabus Modules (Theory / TCP, and optional for Practical if modules provided)
  if (course.courseType === 'THEORY' || course.courseType === 'TCP') {
    allResults.push(...validateSyllabusModules(course.modules, course.courseOutcomes || []));
  } else if (course.courseType === 'PRACTICAL' && course.modules && course.modules.length > 0) {
    allResults.push(...validateSyllabusModules(course.modules, course.courseOutcomes || []));
  }

  // B8: Lab-specific Sections (Practical / TCP)
  if (course.courseType === 'PRACTICAL' || course.courseType === 'TCP') {
    allResults.push(...validateExperimentsAndPlan(
      course.experiments || [],
      course.coursePlan || [],
      course.courseOutcomes || []
    ));
  }

  // B9: Lecture Schedule (Theory / TCP)
  if (course.courseType === 'THEORY' || course.courseType === 'TCP') {
    allResults.push(...validateLectureSchedule(
      course.courseType,
      course.modules || [],
      course.credits,
      course.L,
      course.lectureScheduleItems
    ));
  }

  // B10: Learning Resources
  allResults.push(...validateLearningResources(
    course.textBooks,
    course.referenceBooks,
    course.regulationYear,
    course.isAdvanced || course.categoryAbbr === 'PEC' || course.categoryAbbr === 'OEC',
    course.courseType
  ));

  // B11: SDG Alignment (Theory and TCP only)
  if (course.courseType === 'THEORY' || course.courseType === 'TCP') {
    allResults.push(...validateSdgAlignment(
      course.courseOutcomes || [],
      course.sdgActivities || [],
      course.modules || []
    ));
  }

  // B12: Prerequisites and Designers
  allResults.push(...validatePrerequisitesAndDesigners(
    course.prerequisites,
    course.designers || []
  ));

  const errors = allResults.filter(r => r.severity === 'error');
  const warnings = allResults.filter(r => r.severity === 'warning');

  const checklist = course.courseType === 'THEORY'
    ? evaluateTheoryChecklist(course)
    : [];

  return {
    isValid: errors.length === 0,
    hasWarnings: warnings.length > 0,
    errors,
    warnings,
    checklist,
  };
}

// Helper: Suggest CO weightages proportioned by TPS level summing to 100
export function suggestCoWeightages(cos: CourseOutcome[], minWeight = 5, maxWeight = 25): number[] {
  if (!cos || cos.length === 0) return [];
  const n = cos.length;
  if (n === 1) return [100];

  // Assign base score based on TPS level: TPS 2 -> 2, TPS 3 -> 3, TPS 4 -> 4, TPS 5 -> 5
  const tpsScores = cos.map(c => Math.max(2, c.tpsLevel || 3));
  const totalScore = tpsScores.reduce((a, b) => a + b, 0) || 1;

  // Initial proportioning clamped to [minWeight, maxWeight]
  let weights = tpsScores.map(score => Math.max(minWeight, Math.min(maxWeight, Math.floor((score / totalScore) * 100))));

  // Adjust remainder to sum to exactly 100 while respecting minWeight and maxWeight
  let remainder = 100 - weights.reduce((a, b) => a + b, 0);
  let iterations = 0;
  while (remainder !== 0 && iterations < 300) {
    iterations++;
    if (remainder > 0) {
      const candidates = weights
        .map((w, i) => ({ w, i, tps: tpsScores[i] }))
        .filter(x => x.w < maxWeight)
        .sort((a, b) => b.tps - a.tps);
      if (candidates.length === 0) break;
      weights[candidates[0].i]++;
      remainder--;
    } else {
      const candidates = weights
        .map((w, i) => ({ w, i, tps: tpsScores[i] }))
        .filter(x => x.w > minWeight)
        .sort((a, b) => a.tps - b.tps);
      if (candidates.length === 0) break;
      weights[candidates[0].i]--;
      remainder++;
    }
  }

  // Differentiate slightly if all equal and n >= 2
  const allEqual = weights.every(w => w === weights[0]);
  if (allEqual && n >= 2 && weights[0] + 1 <= maxWeight && weights[n - 1] - 1 >= minWeight) {
    weights[0] += 1;
    weights[n - 1] -= 1;
  }

  return weights;
}

