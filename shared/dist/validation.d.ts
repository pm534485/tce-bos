import { Course, CourseType, CourseOutcome, AssessmentMatrixCell, SyllabusModule, LearningResource, SdgActivity, LabExperiment, LabCoursePlanItem, CourseDesigner, LectureScheduleItem, ValidationRuleResult, CourseValidationReport } from './types.js';
export declare function countWords(text: string): number;
export declare function validateCourseName(name: string, courseType: CourseType): ValidationRuleResult[];
export interface CourseCodeParts {
    regulationCode: string;
    programmeCode: string;
    categoryLetter: string;
    uniqueLetter: string;
    version: number | string;
}
export declare function computeCourseCode(parts: CourseCodeParts): string;
export declare function validateCourseCode(parts: CourseCodeParts, existingProgrammeCodes?: string[]): ValidationRuleResult[];
export declare function computeCredits(L: number, T: number, P: number, courseType?: CourseType): number;
export declare function validateLtpCredits(courseType: CourseType, categoryAbbr: string, L: number, T: number, P: number, credits: number): ValidationRuleResult[];
export declare function validatePreamble(preamble: string, coStatements?: string[]): ValidationRuleResult[];
export declare function validateCourseOutcomes(cos: CourseOutcome[], courseType: CourseType, allowTps1?: boolean, credits?: number | string): ValidationRuleResult[];
export declare function validateAssessmentPattern(courseType: CourseType, cos: CourseOutcome[], matrix: AssessmentMatrixCell[], tolerance?: number, componentWeights?: {
    cat1: number;
    assignment1: number;
    cat2: number;
    assignment2: number;
    terminal: number;
}): ValidationRuleResult[];
export declare function validateSyllabusModules(modules: SyllabusModule[], cos: CourseOutcome[]): ValidationRuleResult[];
export declare function validateExperimentsAndPlan(experiments: LabExperiment[], coursePlan: LabCoursePlanItem[], cos: CourseOutcome[]): ValidationRuleResult[];
export interface CourseHoursCriteria {
    minHours: number;
    maxHours: number;
    description: string;
}
export declare function getExpectedHoursCriteria(credits: number): CourseHoursCriteria;
export declare function validateLectureSchedule(courseType: CourseType, modules: SyllabusModule[], credits: number, L?: number, lectureScheduleItems?: LectureScheduleItem[]): ValidationRuleResult[];
export declare function validateLearningResources(textBooks: LearningResource[], referenceBooks: LearningResource[], regulationYear?: number, isAdvanced?: boolean, courseType?: CourseType): ValidationRuleResult[];
export declare function validateSdgAlignment(cos: CourseOutcome[], sdgActivities: SdgActivity[], modules: SyllabusModule[]): ValidationRuleResult[];
export declare function validatePrerequisitesAndDesigners(prerequisites: any, designers: CourseDesigner[]): ValidationRuleResult[];
export declare function evaluateTheoryChecklist(course: Course): Array<{
    id: number;
    title: string;
    passed: boolean;
    reason?: string;
}>;
export declare function validateCourse(course: Course, existingProgrammeCodes?: string[], tolerance?: number, componentWeights?: {
    cat1: number;
    assignment1: number;
    cat2: number;
    assignment2: number;
    terminal: number;
}, allowTps1?: boolean): CourseValidationReport;
export declare function suggestCoWeightages(cos: CourseOutcome[]): number[];
//# sourceMappingURL=validation.d.ts.map