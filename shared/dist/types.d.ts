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
    coNo: string;
    statement: string;
    tpsLevel: number;
    pi: string;
    weightage?: number;
    objectiveNo?: number;
    objectiveName?: string;
    domain?: 'Cognitive' | 'Psychomotor' | 'Affective';
    generalCoRef?: string;
    sdgNo: number | 'NC';
    sdgLevel: number;
    questionLevelSplit?: {
        ownLevelPercent: number;
        lowerLevelPercent: number;
    };
}
export interface AssessmentMatrixCell {
    coNo: string;
    cat1?: number;
    assignment1?: number;
    cat2?: number;
    assignment2?: number;
    terminalExam?: number;
    theoryCat1?: number;
    theoryCat2?: number;
    practicalCa?: number;
    practicalModel?: number;
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
    coMapping?: string[];
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
    deliverable: string;
}
export interface LabExperiment {
    slNo: number;
    name: string;
    level: 1 | 2 | 3;
    objectiveNos: number[];
    coNos: string[];
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
    regulationCode: string;
    programmeCode: string;
    categoryLetter: string;
    uniqueLetter: string;
    version: number;
    courseCode: string;
    courseName: string;
    categoryAbbr: CategoryAbbreviation;
    semester: number;
    semesterType?: 'ODD' | 'EVEN';
    L: number;
    T: number;
    P: number;
    credits: number;
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
//# sourceMappingURL=types.d.ts.map