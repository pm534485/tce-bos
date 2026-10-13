// Type definitions for SyllabusForge

import { CategoryAbbreviation } from './constants.js';

export type CourseType = 'THEORY' | 'PRACTICAL' | 'TCP' | 'AUDIT';

export type CourseStatus = 'DRAFT' | 'SUBMITTED' | 'RETURNED' | 'APPROVED' | 'FINALIZED';

export type UserRole = 'FACULTY' | 'HOD' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation: string;
  programmeAccess: string[];
  avatar?: string;
  authProvider?: 'local' | 'google';
}

export interface Prerequisite {
  courseCode: string;
  courseName: string;
}

export interface CourseOutcome {
  coNo: string; // e.g., 'CO1', 'CO2'
  statement: string;
  tpsLevel: number; // 2, 3, 4, 5
  pi: string; // e.g., '5.2.1'
  weightage?: number; // 8 to 20 for Theory / TCP
  objectiveNo?: number; // 1 to 13 for Practical
  objectiveName?: string;
  domain?: 'Cognitive' | 'Psychomotor' | 'Affective';
  generalCoRef?: string; // e.g., 'CO-C1'
  sdgNo: number | 'NC'; // 1-17 or 'NC'
  sdgLevel: number; // 0-5
  // Optional question level split (Section 4.2)
  questionLevelSplit?: {
    ownLevelPercent: number; // 70-100%
    lowerLevelPercent: number; // 0-30%
  };
}

export interface AssessmentMatrixCell {
  coNo: string;
  cat1?: number; // % of marks
  assignment1?: number; // % of marks
  cat2?: number; // % of marks
  assignment2?: number; // % of marks
  terminalExam?: number; // % of marks
  // TCP specific columns
  theoryCat1?: number;
  theoryCat2?: number;
  practicalCa?: number; // OCR/Continuous Assessment
  practicalModel?: number; // Model Test CO-wise
  tcpTerminal?: number;
}

export interface PoPsoMappingRow {
  coNo: string;
  po1?: string;
  po2?: string;
  po3?: string;
  po4?: string;
  po5?: string;
  po6?: string;
  po7?: string;
  po8?: string;
  po9?: string;
  po10?: string;
  po11?: string;
  po12?: string;
  pso1?: string;
  pso2?: string;
  pso3?: string;
}

export interface CognitiveAssessmentRow {
  level: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  cat1: number;
  cat2: number;
  cat3: number;
  terminalExam: number;
}

export interface CourseOutcomeQuestions {
  coNo: string;
  questions: string[];
}

export interface LectureScheduleItem {
  moduleNo: string;
  topic: string;
  periods?: number | string;
  coMapping?: string[] | string;
}

export interface SyllabusModule {
  moduleNo: number;
  mainTopic: string;
  subtopics: string[];
  periods?: number;
  coMapping?: string[]; // ['CO1', 'CO2'] (optional)
}

export interface LearningResource {
  type: 'TEXT' | 'REFERENCE' | 'WEB';
  authors: string;
  title: string;
  publisher?: string;
  edition?: string;
  year: number | string;
  chapters?: string;
  url?: string;
  caseStudy?: string;
}

export interface SdgActivity {
  sdgNo: number;
  activity: string;
  linkedModuleNo?: number;
  deliverable: string; // 'Report' | 'Presentation' | 'Case Analysis' | 'Problem Set' | 'Design Exercise'
}

export interface LabExperiment {
  slNo: number;
  name: string;
  level: 1 | 2 | 3;
  objectiveNos: number[]; // 1 to 13
  coNos: string[]; // ['CO1', 'CO2']
}

export interface LabCoursePlanItem {
  experimentNo: number;
  name: string;
  preLabActivity: string;
  inLabActivity: string;
  postLabActivity: string;
  level: 1 | 2 | 3;
  preMarks: number;
  inMarks: number;
  postMarks: number;
}

export interface CourseDesigner {
  name: string;
  designation: string;
  department: string;
  email: string;
}

export interface ReviewComment {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  section: string;
  comment: string;
  createdAt: string;
  resolved?: boolean;
}

export interface Course {
  _id?: string;
  id?: string;
  courseType: CourseType;
  regulationYear: number;
  regulationCode: string; // '26'
  programmeCode: string; // 'CA'
  categoryLetter: string; // 'C'
  uniqueLetter: string; // 'A'
  version: number; // 0
  courseCode: string; // '26EECA0'
  courseName: string; // Stored in Title Case
  categoryAbbr: CategoryAbbreviation;
  semester: number;
  L: number;
  T: number;
  P: number;
  credits: number; // L + T + P/2
  teExamType?: 'TCP-T' | 'TCP-P';
  preamble: string;
  isAdvanced?: boolean;
  prerequisites: Prerequisite[] | 'Nil' | string;
  courseOutcomes: CourseOutcome[];
  assessmentMatrix: AssessmentMatrixCell[];
  modules: SyllabusModule[];
  textBooks: LearningResource[];
  referenceBooks: LearningResource[];
  webResources: LearningResource[];
  sdgActivities: SdgActivity[];
  experiments?: LabExperiment[];
  coursePlan?: LabCoursePlanItem[];
  poPsoMapping?: PoPsoMappingRow[];
  cognitiveAssessmentPattern?: CognitiveAssessmentRow[];
  courseAssessmentQuestions?: CourseOutcomeQuestions[];
  lectureScheduleItems?: LectureScheduleItem[];
  designers: CourseDesigner[];
  status: CourseStatus;
  createdBy: string;
  department: string;
  comments: ReviewComment[];
  revisionOf?: string;
  history?: Array<{
    version: number;
    updatedBy: string;
    updatedAt: string;
    changesSummary: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ValidationRuleResult {
  id: string;
  field: string;
  severity: 'error' | 'warning';
  message: string;
  fixHint: string;
}

export interface CourseValidationReport {
  isValid: boolean;
  hasWarnings: boolean;
  errors: ValidationRuleResult[];
  warnings: ValidationRuleResult[];
  checklist: Array<{
    id: number;
    title: string;
    passed: boolean;
    reason?: string;
  }>;
}
