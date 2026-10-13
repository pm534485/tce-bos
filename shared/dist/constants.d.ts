export interface ProgrammeCode {
    code: string;
    name: string;
    department: string;
}
export declare const PROGRAMME_CODES: ProgrammeCode[];
export interface CategoryCode {
    code: string;
    name: string;
    defaultAbbr: string;
    allowedTypes: ('THEORY' | 'PRACTICAL' | 'TCP')[];
}
export declare const CATEGORY_CODES: CategoryCode[];
export declare const CATEGORY_ABBREVIATIONS: readonly ["HSMC", "BSC", "ESC", "PCC", "PEC", "OEC", "EEC", "AC"];
export type CategoryAbbreviation = typeof CATEGORY_ABBREVIATIONS[number];
export declare const TPS_VERBS: Record<number, string[]>;
export interface LabObjective {
    no: number;
    name: string;
    description: string;
    domain: 'Cognitive' | 'Psychomotor' | 'Affective';
}
export declare const LAB_OBJECTIVES: LabObjective[];
export interface GeneralCo {
    code: string;
    statement: string;
    tpsLevel: number;
    pi: string;
    objectiveNo: number;
    objectiveName: string;
    domain: 'Cognitive' | 'Psychomotor' | 'Affective';
    firstVerb: string;
}
export declare const GENERAL_CO_POOL: GeneralCo[];
export interface PerformanceIndicator {
    piNumber: string;
    descriptor: string;
    tpsLevel: number;
}
export declare const PERFORMANCE_INDICATORS: PerformanceIndicator[];
export interface SdgInfo {
    no: number;
    name: string;
    description: string;
}
export declare const SDG_LIST: SdgInfo[];
export interface DomainSdgMap {
    domain: string;
    suggestedSdgs: number[];
    rationale: string;
}
export declare const DOMAIN_TO_SDG_MAP: DomainSdgMap[];
export interface TcpWeightageRow {
    ltp: string;
    credits: number;
    teType: 'TCP-T' | 'TCP-P';
    caTheoryPercent: number;
    caPracticalPercent: number;
    eseTheoryPercent: number;
    esePracticalPercent: number;
}
export declare const TCP_WEIGHTAGE_TABLE: TcpWeightageRow[];
export interface CourseCategoryWeightage {
    category: string;
    continuousAssessmentPercent: number;
    endSemesterExaminationPercent: number;
}
export declare const REGULATION_ASSESSMENT_SUMMARY: CourseCategoryWeightage[];
export declare const LAB_ASSESSMENT_SPLITS: Record<number, {
    preLab: number;
    inLab: number;
    postLab: number;
    total: number;
}>;
export declare const LAB_ACTIVITY_CHIPS: {
    preLab: string[];
    inLab: string[];
    postLab: string[];
};
export declare const SCHWAB_HERRON_LEVELS: {
    level: number;
    problem: string;
    waysMeans: string;
    answers: string;
    description: string;
}[];
export declare const DEFAULT_CONFIG_SETTINGS: {
    regulationYear: number;
    regulationCode: string;
    bosDate: string;
    acmText: string;
    acmDate: string;
    acmMeetingName: string;
    coShareTolerance: number;
    allowTps1: boolean;
    assessmentComponentWeights: {
        cat1: number;
        assignment1: number;
        cat2: number;
        assignment2: number;
        terminal: number;
    };
    labCoRanges: {
        cognitiveMin: number;
        cognitiveMax: number;
        affectiveMin: number;
        affectiveMax: number;
        psychomotorMin: number;
        psychomotorMax: number;
        totalMin: number;
        totalMax: number;
    };
};
//# sourceMappingURL=constants.d.ts.map