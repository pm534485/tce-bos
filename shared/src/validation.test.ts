import { describe, it, expect } from 'vitest';
import {
  validateCourseName,
  validateCourseCode,
  computeCourseCode,
  validateLtpCredits,
  computeCredits,
  validatePreamble,
  validateCourseOutcomes,
  validateAssessmentPattern,
  validateSyllabusModules,
  validateExperimentsAndPlan,
  validateLectureSchedule,
  validateLearningResources,
  validateSdgAlignment,
  validatePrerequisitesAndDesigners,
  evaluateTheoryChecklist,
  validateCourse,
  suggestCoWeightages,
} from './validation.js';
import { Course, CourseOutcome, SyllabusModule, LearningResource, SdgActivity } from './types.js';

describe('B1: Course Name Validation', () => {
  it('should accept valid alphanumeric Title Case name <= 60 chars', () => {
    const res = validateCourseName('Data Structures and Applications', 'THEORY');
    expect(res.filter(r => r.severity === 'error')).toHaveLength(0);
  });

  it('should reject special characters like hyphens, ampersands, slashes', () => {
    const res = validateCourseName('Data Structures & Algorithms - Part 1', 'THEORY');
    const errors = res.filter(r => r.severity === 'error');
    expect(errors.some(e => e.id === 'B1_SPECIAL_CHARS')).toBe(true);
  });

  it('should reject names longer than 60 characters', () => {
    const longName = 'Advanced Artificial Intelligence And Machine Learning For Intelligent Robotics Systems';
    const res = validateCourseName(longName, 'THEORY');
    expect(res.some(e => e.id === 'B1_MAX_LENGTH')).toBe(true);
  });

  it('should reject standalone word "Lab" and require "Laboratory"', () => {
    const res = validateCourseName('Microprocessor Lab', 'PRACTICAL');
    expect(res.some(e => e.id === 'B1_LAB_FORBIDDEN')).toBe(true);
  });

  it('should require practical course name to end with "Laboratory"', () => {
    const res = validateCourseName('Microprocessor Practical Work', 'PRACTICAL');
    expect(res.some(e => e.id === 'B1_PRACTICAL_SUFFIX')).toBe(true);
  });

  it('should accept practical course ending with "Laboratory"', () => {
    const res = validateCourseName('AC Machines Laboratory', 'PRACTICAL');
    expect(res.filter(r => r.severity === 'error')).toHaveLength(0);
  });

  it('should warn on redundant "Introduction to"', () => {
    const res = validateCourseName('Introduction to Data Structures', 'THEORY');
    expect(res.some(w => w.id === 'B1_REDUNDANT_INTRO' && w.severity === 'warning')).toBe(true);
  });

  it('should warn on all-caps acronyms like DSP or VLSI', () => {
    const res = validateCourseName('Advanced DSP Systems', 'THEORY');
    expect(res.some(w => w.id === 'B1_ACRONYMS' && w.severity === 'warning')).toBe(true);
  });
});

describe('B2: Course Code Validation (RR AA C U V)', () => {
  it('should compose course code correctly', () => {
    const code = computeCourseCode({
      regulationCode: '26',
      programmeCode: 'EE',
      categoryLetter: 'C',
      uniqueLetter: 'A',
      version: 0,
    });
    expect(code).toBe('26EECA0');
  });

  it('should validate valid course code components', () => {
    const res = validateCourseCode({
      regulationCode: '26',
      programmeCode: 'CA',
      categoryLetter: 'C',
      uniqueLetter: 'A',
      version: 0,
    });
    expect(res.filter(r => r.severity === 'error')).toHaveLength(0);
  });

  it('should accept EL (ECE VLSI) as a valid programme code', () => {
    const res = validateCourseCode({
      regulationCode: '26',
      programmeCode: 'EL',
      categoryLetter: 'C',
      uniqueLetter: 'A',
      version: 0,
    });
    expect(res.filter(r => r.severity === 'error')).toHaveLength(0);
  });

  it('should reject invalid regulation code (not 2 digits)', () => {
    const res = validateCourseCode({
      regulationCode: '2026',
      programmeCode: 'CA',
      categoryLetter: 'C',
      uniqueLetter: 'A',
      version: 0,
    });
    expect(res.some(e => e.id === 'B2_REGULATION_CODE')).toBe(true);
  });

  it('should reject invalid programme code', () => {
    const res = validateCourseCode({
      regulationCode: '26',
      programmeCode: 'ZZ',
      categoryLetter: 'C',
      uniqueLetter: 'A',
      version: 0,
    });
    expect(res.some(e => e.id === 'B2_PROGRAMME_CODE')).toBe(true);
  });

  it('should reject unique letter I and O', () => {
    const resI = validateCourseCode({
      regulationCode: '26',
      programmeCode: 'CA',
      categoryLetter: 'C',
      uniqueLetter: 'I',
      version: 0,
    });
    expect(resI.some(e => e.id === 'B2_UNIQUE_LETTER')).toBe(true);

    const resO = validateCourseCode({
      regulationCode: '26',
      programmeCode: 'CA',
      categoryLetter: 'C',
      uniqueLetter: 'O',
      version: 0,
    });
    expect(resO.some(e => e.id === 'B2_UNIQUE_LETTER')).toBe(true);
  });

  it('should reject letter "O" used as version instead of digit 0', () => {
    const res = validateCourseCode({
      regulationCode: '26',
      programmeCode: 'CA',
      categoryLetter: 'C',
      uniqueLetter: 'A',
      version: 'O',
    });
    expect(res.some(e => e.id === 'B2_VERSION_DIGIT')).toBe(true);
  });

  it('should check course code uniqueness in programme', () => {
    const res = validateCourseCode(
      {
        regulationCode: '26',
        programmeCode: 'CA',
        categoryLetter: 'C',
        uniqueLetter: 'A',
        version: 0,
      },
      ['26EECA0', '26CACA0']
    );
    expect(res.some(e => e.id === 'B2_UNIQUE_CONFLICT')).toBe(true);
  });
});

describe('B3: Category, L-T-P, Credits Validation', () => {
  it('should compute credits according to formula L + T + P/2', () => {
    expect(computeCredits(3, 1, 0)).toBe(4);
    expect(computeCredits(2, 1, 0)).toBe(3);
    expect(computeCredits(1, 0, 2)).toBe(2);
    expect(computeCredits(1, 0, 3)).toBe(2.5);
    expect(computeCredits(2, 0, 3)).toBe(3.5);
    expect(computeCredits(1, 0, 6)).toBe(4);
    expect(computeCredits(0, 0, 3)).toBe(1.5);
  });

  it('should reject negative L, T, or P', () => {
    const res = validateLtpCredits('THEORY', 'PCC', -1, 0, 0, 0);
    expect(res.some(e => e.id === 'B3_NEGATIVE_LTP')).toBe(true);
  });

  it('should reject Practical courses with L > 0 or T > 0', () => {
    const res = validateLtpCredits('PRACTICAL', 'PCC', 1, 0, 3, 2.5);
    expect(res.some(e => e.id === 'B3_PRACTICAL_LT_ZERO')).toBe(true);
  });

  it('should reject credit mismatch with LTP values', () => {
    const res = validateLtpCredits('THEORY', 'PCC', 3, 1, 0, 3.5);
    expect(res.some(e => e.id === 'B3_CREDIT_MISMATCH')).toBe(true);
  });
});

describe('B4: Preamble Validation', () => {
  const compliantPreamble =
    'Wireless Communication addresses the principles and design of modern radio communication systems, encompassing modulation techniques, channel modelling, diversity schemes, and multiple access technologies. The course bridges fundamental signal processing theory with contemporary wireless standards such as 5G and Wi-Fi, equipping students to analyse and evaluate real-world system performance. It lays the foundation for advanced specialisations in telecommunications and embedded IoT systems.';

  it('should accept valid single-paragraph preamble regardless of word count', () => {
    const res = validatePreamble(compliantPreamble);
    expect(res.filter(r => r.severity === 'error')).toHaveLength(0);

    const shortText = 'This is a short preamble about computer science principles and software development fundamentals.';
    const shortRes = validatePreamble(shortText);
    expect(shortRes.filter(r => r.severity === 'error')).toHaveLength(0);
  });

  it('should reject multiple paragraphs in preamble', () => {
    const multiPara = `${compliantPreamble}\n\nSecond paragraph should not be present here.`;
    const res = validatePreamble(multiPara);
    expect(res.some(e => e.id === 'B4_SINGLE_PARAGRAPH')).toBe(true);
  });

  it('should warn on generic cliché phrases', () => {
    const clicheText =
      'This course covers important topics in data structures and algorithm design. Students will learn about trees, graphs, sorting methods, complexity analysis, and modern hashing techniques. The course also bridges fundamental algorithmic concepts with contemporary industry practices, equipping students to analyse and evaluate real-world system performance across distributed computing platforms and scalable database management systems.';
    const res = validatePreamble(clicheText);
    expect(res.some(w => w.id === 'B4_CLICHE_PHRASE' && w.severity === 'warning')).toBe(true);
  });
});

describe('B5: Course Outcomes Validation', () => {
  const validTheoryCos: CourseOutcome[] = [
    { coNo: 'CO1', statement: 'Explain the fundamentals of linear and non-linear data structures with space complexity.', tpsLevel: 2, pi: '2.1.1', weightage: 12, sdgNo: 4, sdgLevel: 2 },
    { coNo: 'CO2', statement: 'Describe tree balancing operations and priority queue mechanisms.', tpsLevel: 2, pi: '12.1.1', weightage: 12, sdgNo: 4, sdgLevel: 2 },
    { coNo: 'CO3', statement: 'Solve sorting and searching problems using balanced search trees and hashing.', tpsLevel: 3, pi: '1.1.1', weightage: 18, sdgNo: 9, sdgLevel: 3 },
    { coNo: 'CO4', statement: 'Compute asymptotic performance bounds for multiway tree traversals and graph algorithms.', tpsLevel: 3, pi: '1.2.1', weightage: 18, sdgNo: 9, sdgLevel: 3 },
    { coNo: 'CO5', statement: 'Analyse collision resolution strategies and disjoint set union algorithms for efficiency.', tpsLevel: 4, pi: '2.2.1', weightage: 20, sdgNo: 9, sdgLevel: 4 },
    { coNo: 'CO6', statement: 'Evaluate trade-offs between memory footprint and execution latency in enterprise data structures.', tpsLevel: 5, pi: '3.3.1', weightage: 20, sdgNo: 9, sdgLevel: 4 },
  ];

  it('should accept 6 valid theory COs with >=70% TPS>=3 and proper weightage sum', () => {
    const res = validateCourseOutcomes(validTheoryCos, 'THEORY');
    expect(res.filter(r => r.severity === 'error')).toHaveLength(0);
  });

  it('should reject CO count less than 6 or greater than 8', () => {
    const tooFew = validTheoryCos.slice(0, 5);
    const res = validateCourseOutcomes(tooFew, 'THEORY');
    expect(res.some(e => e.id === 'B5_COUNT_RANGE')).toBe(true);
  });

  it('should reject TPS 1 by default', () => {
    const cosWithTps1 = [...validTheoryCos];
    cosWithTps1[0] = { ...cosWithTps1[0], tpsLevel: 1 };
    const res = validateCourseOutcomes(cosWithTps1, 'THEORY');
    expect(res.some(e => e.id.includes('B5_CO_TPS1_DISALLOWED'))).toBe(true);
  });

  it('should reject CO when first verb does not match TPS level', () => {
    const cosMismatchedVerb = [...validTheoryCos];
    // "Explain" is TPS 2, but level set to 4
    cosMismatchedVerb[4] = { ...cosMismatchedVerb[4], statement: 'Explain collision resolution strategies in hash tables.', tpsLevel: 4 };
    const res = validateCourseOutcomes(cosMismatchedVerb, 'THEORY');
    expect(res.some(e => e.id.includes('B5_CO_VERB_MISMATCH'))).toBe(true);
  });

  it('should reject CO when TPS does not match PI TPS level', () => {
    const cosMismatchedPi = [...validTheoryCos];
    // PI 1.1.1 is TPS 3, set to TPS 2
    cosMismatchedPi[0] = { ...cosMismatchedPi[0], tpsLevel: 2, pi: '1.1.1' };
    const res = validateCourseOutcomes(cosMismatchedPi, 'THEORY');
    expect(res.some(e => e.id.includes('B5_CO_PI_TPS_MISMATCH'))).toBe(true);
  });

  it('should reject when less than 70% of COs are TPS >= 3', () => {
    const cosLowTps: CourseOutcome[] = [
      { coNo: 'CO1', statement: 'Explain concept one.', tpsLevel: 2, pi: '2.1.1', weightage: 16, sdgNo: 'NC', sdgLevel: 0 },
      { coNo: 'CO2', statement: 'Describe concept two.', tpsLevel: 2, pi: '2.1.1', weightage: 16, sdgNo: 'NC', sdgLevel: 0 },
      { coNo: 'CO3', statement: 'Classify concept three.', tpsLevel: 2, pi: '2.1.1', weightage: 16, sdgNo: 'NC', sdgLevel: 0 },
      { coNo: 'CO4', statement: 'Interpret concept four.', tpsLevel: 2, pi: '2.1.1', weightage: 16, sdgNo: 'NC', sdgLevel: 0 },
      { coNo: 'CO5', statement: 'Solve problem five.', tpsLevel: 3, pi: '1.1.1', weightage: 18, sdgNo: 'NC', sdgLevel: 0 },
      { coNo: 'CO6', statement: 'Compute result six.', tpsLevel: 3, pi: '1.2.1', weightage: 18, sdgNo: 'NC', sdgLevel: 0 },
    ];
    const res = validateCourseOutcomes(cosLowTps, 'THEORY');
    expect(res.some(e => e.id === 'B5_TPS_70_PERCENT')).toBe(true);
  });

  it('should reject when CO weightage does not sum to 100', () => {
    const cosBadWeightSum = validTheoryCos.map((c, i) => i === 0 ? { ...c, weightage: 10 } : c);
    const res = validateCourseOutcomes(cosBadWeightSum, 'THEORY');
    expect(res.some(e => e.id === 'B5_WEIGHTAGE_SUM')).toBe(true);
  });

  it('should reject when all CO weightages are equal', () => {
    const cosEqualWeights = validTheoryCos.map(c => ({ ...c, weightage: 16.67 }));
    const res = validateCourseOutcomes(cosEqualWeights, 'THEORY');
    expect(res.some(e => e.id === 'B5_WEIGHTAGE_ALL_EQUAL')).toBe(true);
  });

  it('should suggest valid proportional CO weightages summing to 100', () => {
    const suggested = suggestCoWeightages(validTheoryCos);
    expect(suggested).toHaveLength(validTheoryCos.length);
    const sum = suggested.reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
    expect(suggested.every(w => w >= 8 && w <= 20)).toBe(true);
    expect(new Set(suggested).size).toBeGreaterThan(1);
  });

  it('should validate Practical CO domain requirements (Cognitive 2-4, Affective 2-3, Psychomotor 2-3)', () => {
    const labCos: CourseOutcome[] = [
      { coNo: 'CO1', statement: 'Operate instruments properly.', tpsLevel: 3, pi: '5.2.1', domain: 'Cognitive', objectiveNo: 1, sdgNo: 'NC', sdgLevel: 0 },
      { coNo: 'CO2', statement: 'Analyse experimental data.', tpsLevel: 4, pi: '4.3.1', domain: 'Cognitive', objectiveNo: 4, sdgNo: 'NC', sdgLevel: 0 },
      { coNo: 'CO3', statement: 'Apply safety protocols.', tpsLevel: 3, pi: '6.4.1', domain: 'Affective', objectiveNo: 10, sdgNo: 'NC', sdgLevel: 0 },
      { coNo: 'CO4', statement: 'Demonstrate ethical responsibility.', tpsLevel: 3, pi: '7.2.1', domain: 'Affective', objectiveNo: 13, sdgNo: 'NC', sdgLevel: 0 },
      { coNo: 'CO5', statement: 'Operate laboratory instruments with precision.', tpsLevel: 3, pi: '5.2.1', domain: 'Psychomotor', objectiveNo: 6, sdgNo: 'NC', sdgLevel: 0 },
      { coNo: 'CO6', statement: 'Apply sensory judgment.', tpsLevel: 3, pi: '4.1.1', domain: 'Psychomotor', objectiveNo: 7, sdgNo: 'NC', sdgLevel: 0 },
    ];
    const res = validateCourseOutcomes(labCos, 'PRACTICAL');
    expect(res.filter(r => r.severity === 'error')).toHaveLength(0);
  });

  it('should require at least 2 COs addressing PO6 to PO11 in TCP courses', () => {
    const tcpCosNoPo6_11: CourseOutcome[] = validTheoryCos.map(c => ({ ...c, pi: '1.1.1' }));
    const res = validateCourseOutcomes(tcpCosNoPo6_11, 'TCP');
    expect(res.some(e => e.id === 'B5_TCP_PO6_11')).toBe(true);
  });
});

describe('B6: Assessment Pattern Validation', () => {
  const dummyCos: CourseOutcome[] = [
    { coNo: 'CO1', statement: 'Explain one', tpsLevel: 2, pi: '2.1.1', weightage: 12, sdgNo: 'NC', sdgLevel: 0 },
    { coNo: 'CO2', statement: 'Describe two', tpsLevel: 2, pi: '12.1.1', weightage: 12, sdgNo: 'NC', sdgLevel: 0 },
    { coNo: 'CO3', statement: 'Solve three', tpsLevel: 3, pi: '1.1.1', weightage: 18, sdgNo: 'NC', sdgLevel: 0 },
    { coNo: 'CO4', statement: 'Compute four', tpsLevel: 3, pi: '1.2.1', weightage: 18, sdgNo: 'NC', sdgLevel: 0 },
    { coNo: 'CO5', statement: 'Analyse five', tpsLevel: 4, pi: '2.2.1', weightage: 20, sdgNo: 'NC', sdgLevel: 0 },
    { coNo: 'CO6', statement: 'Evaluate six', tpsLevel: 5, pi: '3.3.1', weightage: 20, sdgNo: 'NC', sdgLevel: 0 },
  ];

  const validMatrix = [
    { coNo: 'CO1', cat1: 30, assignment1: 20, cat2: 0, assignment2: 0, terminalExam: 10 },
    { coNo: 'CO2', cat1: 30, assignment1: 20, cat2: 0, assignment2: 0, terminalExam: 10 },
    { coNo: 'CO3', cat1: 40, assignment1: 30, cat2: 10, assignment2: 10, terminalExam: 15 },
    { coNo: 'CO4', cat1: 0, assignment1: 30, cat2: 30, assignment2: 20, terminalExam: 20 },
    { coNo: 'CO5', cat1: 0, assignment1: 0, cat2: 30, assignment2: 35, terminalExam: 20 },
    { coNo: 'CO6', cat1: 0, assignment1: 0, cat2: 30, assignment2: 35, terminalExam: 25 },
  ];

  it('should accept valid assessment matrix where columns sum to 100', () => {
    const res = validateAssessmentPattern('THEORY', dummyCos, validMatrix);
    expect(res.filter(r => r.severity === 'error')).toHaveLength(0);
  });

  it('should reject matrix when any column does not sum to 100', () => {
    const badMatrix = validMatrix.map((r, i) => i === 0 ? { ...r, cat1: 50 } : r);
    const res = validateAssessmentPattern('THEORY', dummyCos, badMatrix);
    expect(res.some(e => e.id === 'B6_COL_SUM_cat1')).toBe(true);
  });

  it('should reject when a CO is missing from all assessment components', () => {
    const missingCoMatrix = validMatrix.map((r, i) => i === 0 ? { coNo: 'CO1', cat1: 0, assignment1: 0, cat2: 0, assignment2: 0, terminalExam: 0 } : r);
    const res = validateAssessmentPattern('THEORY', dummyCos, missingCoMatrix);
    expect(res.some(e => e.id === 'B6_CO_MISSING_CO1')).toBe(true);
  });

  it('should validate question level split (70-100% own TPS, 0-30% lower)', () => {
    const cosWithSplit: CourseOutcome[] = [
      {
        ...dummyCos[0],
        questionLevelSplit: { ownLevelPercent: 60, lowerLevelPercent: 40 },
      },
    ];
    const res = validateAssessmentPattern('THEORY', cosWithSplit, validMatrix);
    expect(res.some(e => e.id.includes('B6_TPS_SPLIT_OWN'))).toBe(true);
    expect(res.some(e => e.id.includes('B6_TPS_SPLIT_LOWER'))).toBe(true);
  });
});

describe('B7: Syllabus Modules Validation', () => {
  const cos: CourseOutcome[] = [
    { coNo: 'CO1', statement: 'CO 1', tpsLevel: 2, pi: '2.1.1', sdgNo: 'NC', sdgLevel: 0 },
    { coNo: 'CO2', statement: 'CO 2', tpsLevel: 3, pi: '1.1.1', sdgNo: 'NC', sdgLevel: 0 },
  ];

  const validModules: SyllabusModule[] = [
    { moduleNo: 1, mainTopic: 'Introduction to Algorithms', subtopics: ['Asymptotic notations', 'Divide and conquer'], coMapping: ['CO1'], periods: 6 },
    { moduleNo: 2, mainTopic: 'Advanced Data Structures', subtopics: ['Red-black trees', 'B-trees'], coMapping: ['CO2'], periods: 6 },
  ];

  it('should accept valid modules covering all COs', () => {
    const res = validateSyllabusModules(validModules, cos);
    expect(res.filter(r => r.severity === 'error')).toHaveLength(0);
  });

  it('should accept modules without mandatory CO mapping', () => {
    const modulesWithoutCoMapping: SyllabusModule[] = [
      { moduleNo: 1, mainTopic: 'Introduction to Algorithms', subtopics: ['Asymptotic notations', 'Divide and conquer'] },
    ];
    const res = validateSyllabusModules(modulesWithoutCoMapping, cos);
    expect(res.filter(r => r.severity === 'error')).toHaveLength(0);
  });
});

describe('B8: Lab-specific Sections Validation', () => {
  const cos: CourseOutcome[] = [
    { coNo: 'CO1', statement: 'CO 1', tpsLevel: 3, pi: '5.2.1', sdgNo: 'NC', sdgLevel: 0 },
    { coNo: 'CO2', statement: 'CO 2', tpsLevel: 4, pi: '4.3.1', sdgNo: 'NC', sdgLevel: 0 },
  ];

  const experiments = [
    { slNo: 1, name: 'Measurement of Machine Parameters', level: 1 as const, objectiveNos: [1], coNos: ['CO1'] },
    { slNo: 2, name: 'Investigation of Induction Motor Loading', level: 2 as const, objectiveNos: [4], coNos: ['CO2'] },
  ];

  const plan = [
    { experimentNo: 1, name: 'Exp 1', preLabActivity: 'Quiz', inLabActivity: 'Wiring', postLabActivity: 'Report', level: 1 as const, preMarks: 20, inMarks: 35, postMarks: 20 },
    { experimentNo: 2, name: 'Exp 2', preLabActivity: 'Quiz', inLabActivity: 'Loading', postLabActivity: 'Analysis', level: 2 as const, preMarks: 15, inMarks: 30, postMarks: 30 },
  ];

  it('should accept valid experiments and Annexure 1 plan summing to 75 marks', () => {
    const res = validateExperimentsAndPlan(experiments, plan, cos);
    expect(res.filter(r => r.severity === 'error')).toHaveLength(0);
  });

  it('should error when experiment plan marks do not sum to 75', () => {
    const badPlan = [{ ...plan[0], preMarks: 10, inMarks: 10, postMarks: 10 }];
    const res = validateExperimentsAndPlan(experiments, badPlan, cos);
    expect(res.some(e => e.id === 'B8_PLAN_MARKS_SUM_1')).toBe(true);
  });
});

describe('B9: Lecture Schedule Validation', () => {
  it('should enforce 1 credit criteria (12 to 14 hours)', () => {
    const mod12: SyllabusModule[] = [{ moduleNo: 1, mainTopic: 'M1', subtopics: ['S1'], coMapping: ['CO1'], periods: 12 }];
    expect(validateLectureSchedule('THEORY', mod12, 1).filter(r => r.severity === 'error')).toHaveLength(0);

    const mod14: SyllabusModule[] = [{ moduleNo: 1, mainTopic: 'M1', subtopics: ['S1'], coMapping: ['CO1'], periods: 14 }];
    expect(validateLectureSchedule('THEORY', mod14, 1).filter(r => r.severity === 'error')).toHaveLength(0);

    const mod11: SyllabusModule[] = [{ moduleNo: 1, mainTopic: 'M1', subtopics: ['S1'], coMapping: ['CO1'], periods: 11 }];
    expect(validateLectureSchedule('THEORY', mod11, 1).some(e => e.id === 'B9_THEORY_PERIODS_MISMATCH')).toBe(true);

    const mod15: SyllabusModule[] = [{ moduleNo: 1, mainTopic: 'M1', subtopics: ['S1'], coMapping: ['CO1'], periods: 15 }];
    expect(validateLectureSchedule('THEORY', mod15, 1).some(e => e.id === 'B9_THEORY_PERIODS_MISMATCH')).toBe(true);
  });

  it('should enforce 2 credits criteria (24 to 28 hours)', () => {
    const mod24: SyllabusModule[] = [{ moduleNo: 1, mainTopic: 'M1', subtopics: ['S1'], coMapping: ['CO1'], periods: 24 }];
    expect(validateLectureSchedule('THEORY', mod24, 2).filter(r => r.severity === 'error')).toHaveLength(0);

    const mod28: SyllabusModule[] = [{ moduleNo: 1, mainTopic: 'M1', subtopics: ['S1'], coMapping: ['CO1'], periods: 28 }];
    expect(validateLectureSchedule('THEORY', mod28, 2).filter(r => r.severity === 'error')).toHaveLength(0);

    const mod23: SyllabusModule[] = [{ moduleNo: 1, mainTopic: 'M1', subtopics: ['S1'], coMapping: ['CO1'], periods: 23 }];
    expect(validateLectureSchedule('THEORY', mod23, 2).some(e => e.id === 'B9_THEORY_PERIODS_MISMATCH')).toBe(true);

    const mod29: SyllabusModule[] = [{ moduleNo: 1, mainTopic: 'M1', subtopics: ['S1'], coMapping: ['CO1'], periods: 29 }];
    expect(validateLectureSchedule('THEORY', mod29, 2).some(e => e.id === 'B9_THEORY_PERIODS_MISMATCH')).toBe(true);
  });

  it('should enforce 3 credits criteria (strictly 36 hours)', () => {
    const mod36: SyllabusModule[] = [{ moduleNo: 1, mainTopic: 'M1', subtopics: ['S1'], coMapping: ['CO1'], periods: 36 }];
    expect(validateLectureSchedule('THEORY', mod36, 3).filter(r => r.severity === 'error')).toHaveLength(0);

    const mod35: SyllabusModule[] = [{ moduleNo: 1, mainTopic: 'M1', subtopics: ['S1'], coMapping: ['CO1'], periods: 35 }];
    expect(validateLectureSchedule('THEORY', mod35, 3).some(e => e.id === 'B9_THEORY_PERIODS_MISMATCH')).toBe(true);

    const mod37: SyllabusModule[] = [{ moduleNo: 1, mainTopic: 'M1', subtopics: ['S1'], coMapping: ['CO1'], periods: 37 }];
    expect(validateLectureSchedule('THEORY', mod37, 3).some(e => e.id === 'B9_THEORY_PERIODS_MISMATCH')).toBe(true);
  });

  it('should enforce 4 credits criteria (strictly 48 hours)', () => {
    const mod48: SyllabusModule[] = [
      { moduleNo: 1, mainTopic: 'M1', subtopics: ['S1'], coMapping: ['CO1'], periods: 24 },
      { moduleNo: 2, mainTopic: 'M2', subtopics: ['S2'], coMapping: ['CO2'], periods: 24 },
    ];
    expect(validateLectureSchedule('THEORY', mod48, 4).filter(r => r.severity === 'error')).toHaveLength(0);

    const mod47: SyllabusModule[] = [{ moduleNo: 1, mainTopic: 'M1', subtopics: ['S1'], coMapping: ['CO1'], periods: 47 }];
    expect(validateLectureSchedule('THEORY', mod47, 4).some(e => e.id === 'B9_THEORY_PERIODS_MISMATCH')).toBe(true);

    const mod49: SyllabusModule[] = [{ moduleNo: 1, mainTopic: 'M1', subtopics: ['S1'], coMapping: ['CO1'], periods: 49 }];
    expect(validateLectureSchedule('THEORY', mod49, 4).some(e => e.id === 'B9_THEORY_PERIODS_MISMATCH')).toBe(true);
  });
});

describe('B10: Learning Resources Validation', () => {
  const validBooks: LearningResource[] = [
    { type: 'TEXT', authors: 'Mark Allen Weiss', title: 'Data Structures and Algorithm Analysis in C++', publisher: 'Pearson', year: 2022 },
  ];

  const validRefs: LearningResource[] = [
    { type: 'REFERENCE', authors: 'Thomas H. Cormen', title: 'Introduction to Algorithms', publisher: 'MIT Press', year: 2022 },
    { type: 'REFERENCE', authors: 'Robert Sedgewick', title: 'Algorithms', publisher: 'Addison-Wesley', year: 2021 },
    { type: 'REFERENCE', authors: 'Michael T. Goodrich', title: 'Data Structures and Algorithms in Java', publisher: 'Wiley', year: 2023 },
  ];

  it('should accept 1-2 text books and 3-6 reference books with publication years', () => {
    const res = validateLearningResources(validBooks, validRefs, 2026);
    expect(res.filter(r => r.severity === 'error')).toHaveLength(0);
  });

  it('should reject missing publication year', () => {
    const missingYear: LearningResource[] = [{ ...validBooks[0], year: '' }];
    const res = validateLearningResources(missingYear, validRefs, 2026);
    expect(res.some(e => e.id.includes('B10_YEAR_MISSING'))).toBe(true);
  });

  it('should enforce 5-year recency rule for advanced/elective courses', () => {
    const oldBooks: LearningResource[] = [
      { type: 'TEXT', authors: 'Old Author', title: 'Classic Algorithms', publisher: 'Old Press', year: 2010 },
    ];
    const oldRefs: LearningResource[] = [
      { type: 'REFERENCE', authors: 'Ref 1', title: 'Ref Title 1', year: 2012 },
      { type: 'REFERENCE', authors: 'Ref 2', title: 'Ref Title 2', year: 2014 },
      { type: 'REFERENCE', authors: 'Ref 3', title: 'Ref Title 3', year: 2015 },
    ];
    const res = validateLearningResources(oldBooks, oldRefs, 2026, true);
    expect(res.some(e => e.id.includes('B10_RECENCY_ADVANCED'))).toBe(true);
  });
});

describe('B11: SDG Alignment Validation', () => {
  const cos: CourseOutcome[] = [
    { coNo: 'CO1', statement: 'CO 1', tpsLevel: 3, pi: '1.1.1', sdgNo: 9, sdgLevel: 3 },
  ];

  const modules: SyllabusModule[] = [
    { moduleNo: 1, mainTopic: 'M1', subtopics: ['S1'], coMapping: ['CO1'] },
  ];

  const activities: SdgActivity[] = [
    { sdgNo: 9, activity: 'Analyze algorithmic energy efficiency for sustainable computing infrastructure.', deliverable: 'Report', linkedModuleNo: 1 },
  ];

  it('should accept active SDG with concrete module-linked activity and deliverable', () => {
    const res = validateSdgAlignment(cos, activities, modules);
    expect(res.filter(r => r.severity === 'error')).toHaveLength(0);
  });

  it('should error when an SDG assigned to COs lacks an activity', () => {
    const res = validateSdgAlignment(cos, [], modules);
    expect(res.some(e => e.id === 'B11_SDG_MISSING_ACTIVITY_9')).toBe(true);
  });
});

describe('B12: Prerequisites and Designers Validation', () => {
  it('should require at least one designer with valid email', () => {
    const res = validatePrerequisitesAndDesigners('Nil', []);
    expect(res.some(e => e.id === 'B12_NO_DESIGNERS')).toBe(true);

    const validDesigners = [
      { name: 'Dr. Jane Doe', designation: 'Professor', department: 'Computer Applications', email: 'jane@univ.edu' },
    ];
    const okRes = validatePrerequisitesAndDesigners('Nil', validDesigners);
    expect(okRes.filter(r => r.severity === 'error')).toHaveLength(0);
  });
});

describe('B13: 17-Point Theory Compliance Checklist Auto-Evaluation', () => {
  it('should correctly evaluate all 17 checklist items', () => {
    const testCourse: Course = {
      courseType: 'THEORY',
      regulationYear: 2026,
      regulationCode: '26',
      programmeCode: 'CA',
      categoryLetter: 'C',
      uniqueLetter: 'A',
      version: 0,
      courseCode: '26CACA0',
      courseName: 'Data Structures and Applications',
      categoryAbbr: 'PCC',
      semester: 3,
      L: 3,
      T: 1,
      P: 0,
      credits: 4,
      preamble:
        'Data Structures and Applications covers the foundational principles and design of linear and hierarchical data organizations, including balanced search trees, priority queues, and collision resolution techniques. The course bridges theoretical asymptotic analysis with contemporary enterprise software engineering, equipping students to analyse and evaluate real-world algorithmic performance across data-intensive computing systems. It establishes the mathematical and algorithmic foundation for advanced specialisations in artificial intelligence and distributed systems.',
      prerequisites: 'Nil',
      courseOutcomes: [
        { coNo: 'CO1', statement: 'Explain linear data structures and asymptotic space complexity.', tpsLevel: 2, pi: '2.1.1', weightage: 12, sdgNo: 4, sdgLevel: 2 },
        { coNo: 'CO2', statement: 'Describe tree balancing operations and priority queue mechanisms.', tpsLevel: 2, pi: '12.1.1', weightage: 12, sdgNo: 4, sdgLevel: 2 },
        { coNo: 'CO3', statement: 'Solve sorting and searching problems using balanced search trees.', tpsLevel: 3, pi: '1.1.1', weightage: 18, sdgNo: 9, sdgLevel: 3 },
        { coNo: 'CO4', statement: 'Compute asymptotic performance bounds for multiway tree traversals.', tpsLevel: 3, pi: '1.2.1', weightage: 18, sdgNo: 9, sdgLevel: 3 },
        { coNo: 'CO5', statement: 'Analyse collision resolution strategies and disjoint set union algorithms.', tpsLevel: 4, pi: '2.2.1', weightage: 20, sdgNo: 9, sdgLevel: 4 },
        { coNo: 'CO6', statement: 'Evaluate trade-offs between memory footprint and execution latency.', tpsLevel: 5, pi: '3.3.1', weightage: 20, sdgNo: 9, sdgLevel: 4 },
      ],
      assessmentMatrix: [
        { coNo: 'CO1', cat1: 30, assignment1: 20, cat2: 0, assignment2: 0, terminalExam: 10 },
        { coNo: 'CO2', cat1: 30, assignment1: 20, cat2: 0, assignment2: 0, terminalExam: 10 },
        { coNo: 'CO3', cat1: 40, assignment1: 30, cat2: 10, assignment2: 10, terminalExam: 15 },
        { coNo: 'CO4', cat1: 0, assignment1: 30, cat2: 30, assignment2: 20, terminalExam: 20 },
        { coNo: 'CO5', cat1: 0, assignment1: 0, cat2: 30, assignment2: 35, terminalExam: 20 },
        { coNo: 'CO6', cat1: 0, assignment1: 0, cat2: 30, assignment2: 35, terminalExam: 25 },
      ],
      modules: [
        { moduleNo: 1, mainTopic: 'Elementary Data Types and Complexity', subtopics: ['ADT', 'Asymptotic analysis'], periods: 12, coMapping: ['CO1'] },
        { moduleNo: 2, mainTopic: 'Trees and Priority Queues', subtopics: ['Binary trees', 'Heaps'], periods: 12, coMapping: ['CO2', 'CO3'] },
        { moduleNo: 3, mainTopic: 'Search Trees and Multiway Structures', subtopics: ['AVL', 'B-trees'], periods: 12, coMapping: ['CO4'] },
        { moduleNo: 4, mainTopic: 'Hashing and Advanced Sets', subtopics: ['Open hashing', 'Disjoint sets'], periods: 12, coMapping: ['CO5', 'CO6'] },
      ],
      textBooks: [
        { type: 'TEXT', authors: 'Mark Allen Weiss', title: 'Data Structures and Algorithm Analysis in C++', publisher: 'Pearson', year: 2022 },
      ],
      referenceBooks: [
        { type: 'REFERENCE', authors: 'Thomas H. Cormen', title: 'Introduction to Algorithms', publisher: 'MIT Press', year: 2022 },
        { type: 'REFERENCE', authors: 'Robert Sedgewick', title: 'Algorithms', publisher: 'Addison-Wesley', year: 2021 },
        { type: 'REFERENCE', authors: 'Michael T. Goodrich', title: 'Data Structures in Java', publisher: 'Wiley', year: 2023 },
      ],
      webResources: [],
      sdgActivities: [
        { sdgNo: 4, activity: 'Inclusive e-learning indexing case study', deliverable: 'Report', linkedModuleNo: 1 },
        { sdgNo: 9, activity: 'Infrastructure data caching optimization', deliverable: 'Case Analysis', linkedModuleNo: 4 },
      ],
      designers: [
        { name: 'Dr. P. Sharmila', designation: 'Associate Professor', department: 'Computer Applications', email: 'psaca@tce.edu' },
      ],
      status: 'DRAFT',
      createdBy: 'user1',
      department: 'Computer Applications',
      comments: [],
    };

    const checklist = evaluateTheoryChecklist(testCourse);
    expect(checklist).toHaveLength(17);
    const passedAll = checklist.every(item => item.passed);
    expect(passedAll).toBe(true);

    const report = validateCourse(testCourse);
    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);
  });
});
