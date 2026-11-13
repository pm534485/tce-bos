import { PerformanceIndicator } from './constants.js';
export declare const MECHANICAL_PERFORMANCE_INDICATORS: PerformanceIndicator[];
export declare const CSE_BRANCHES_PERFORMANCE_INDICATORS: PerformanceIndicator[];
export declare const MECHATRONICS_PERFORMANCE_INDICATORS: PerformanceIndicator[];
export declare const EEE_PERFORMANCE_INDICATORS: PerformanceIndicator[];
export declare const ECE_PERFORMANCE_INDICATORS: PerformanceIndicator[];
export declare const CIVIL_PERFORMANCE_INDICATORS: PerformanceIndicator[];
export declare const AMCS_PERFORMANCE_INDICATORS: PerformanceIndicator[];
/**
 * Helper to retrieve department-specific Performance Indicators.
 * If department/programme is provided and has custom indicators, returns those.
 * Otherwise falls back to the default institutional list.
 */
export declare function getDepartmentPerformanceIndicators(department?: string, programmeCode?: string, defaultList?: PerformanceIndicator[]): PerformanceIndicator[];
//# sourceMappingURL=departmentPerformanceIndicators.d.ts.map