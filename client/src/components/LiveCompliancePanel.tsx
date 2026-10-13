import React, { useState } from 'react';
import { CourseValidationReport, ValidationRuleResult } from '@syllabusforge/shared';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface LiveCompliancePanelProps {
  report: CourseValidationReport;
  currentStepIndex: number;
  onNavigateToStep?: (stepId: string) => void;
  isSubmitting?: boolean;
  onSubmit?: () => void;
  courseStatus?: string;
}

export const LiveCompliancePanel: React.FC<LiveCompliancePanelProps> = ({
  report,
  onNavigateToStep,
  onSubmit,
  isSubmitting,
  courseStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'errors' | 'warnings' | 'checklist'>('errors');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const errorCount = report.errors.length;
  const warningCount = report.warnings.length;
  const checklistPassed = report.checklist.filter(c => c.passed).length;
  const checklistTotal = report.checklist.length;

  return (
    <div className="w-80 xl:w-96 flex-shrink-0 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden sticky top-20 max-h-[calc(100vh-6rem)] border-t-4 border-t-[#0F2942]">
      {/* Panel Header */}
      <div className="p-4 border-b border-[#C59B27]/40 bg-[#0F2942] text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className={`w-5 h-5 ${report.isValid ? 'text-[#E2BF53]' : 'text-rose-400'}`} />
            <div>
              <h3 className="font-bold text-white text-xs sm:text-sm font-tce">Live Compliance Panel</h3>
              <div className="text-[10px] text-slate-300">TCE Regulation 2026 Audit</div>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              report.isValid
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-red-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            {report.isValid ? 'BoS Ready' : `${errorCount} Issues`}
          </span>
        </div>

        {/* Progress Bar / Checklist badge */}
        {checklistTotal > 0 && (
          <div className="mt-2 text-slate-200">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span>ACM 17-Point Audit</span>
              <span className="font-bold text-[#E2BF53]">
                {checklistPassed}/{checklistTotal} Passed
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  checklistPassed === checklistTotal ? 'bg-[#E2BF53]' : 'bg-amber-400'
                }`}
                style={{ width: `${(checklistPassed / checklistTotal) * 100}%` }}
              />
            </div>
          </div>
        )}


        {/* Tabs */}
        <div className="flex space-x-1 mt-3 bg-slate-200/60 p-1 rounded-lg text-xs font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('errors')}
            className={`flex-1 py-1.5 rounded-md flex items-center justify-center space-x-1 transition-all ${
              activeTab === 'errors'
                ? 'bg-white shadow text-rose-700 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Errors ({errorCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('warnings')}
            className={`flex-1 py-1.5 rounded-md flex items-center justify-center space-x-1 transition-all ${
              activeTab === 'warnings'
                ? 'bg-white shadow text-amber-700 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Warn ({warningCount})</span>
          </button>
          {checklistTotal > 0 && (
            <button
              onClick={() => setActiveTab('checklist')}
              className={`flex-1 py-1.5 rounded-md flex items-center justify-center space-x-1 transition-all ${
                activeTab === 'checklist'
                  ? 'bg-white shadow text-emerald-700 font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Checklist</span>
            </button>
          )}
        </div>
      </div>

      {/* Issues / Checklist Content Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 text-xs">
        {activeTab === 'errors' && (
          <>
            {errorCount === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <div className="font-semibold text-slate-800 text-sm">Zero Blocking Errors!</div>
                <div className="text-xs text-slate-500 mt-1">
                  All institutional rules are satisfied. You may submit this course for review.
                </div>
              </div>
            ) : (
              report.errors.map(err => (
                <div
                  key={err.id}
                  className="p-3 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 transition-all text-slate-800"
                >
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpandedCard(expandedCard === err.id ? null : err.id)}
                  >
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-red-900">{err.message}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-mono">Field: {err.field}</div>
                      </div>
                    </div>
                    {expandedCard === err.id ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  {expandedCard === err.id && (
                    <div className="mt-2.5 pt-2 border-t border-red-200/80 text-[11px] text-slate-700">
                      <div className="font-semibold text-red-800 flex items-center space-x-1 mb-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Fix Hint:</span>
                      </div>
                      <p className="bg-white/80 p-2 rounded-lg border border-red-200/60 text-slate-800">
                        {err.fixHint}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'warnings' && (
          <>
            {warningCount === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <div className="font-semibold text-slate-800 text-sm">No Advisory Warnings</div>
                <div className="text-xs text-slate-500 mt-1">Everything looks exceptionally clean and compliant.</div>
              </div>
            ) : (
              report.warnings.map(warn => (
                <div
                  key={warn.id}
                  className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-all text-slate-800"
                >
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpandedCard(expandedCard === warn.id ? null : warn.id)}
                  >
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-amber-900">{warn.message}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-mono">Field: {warn.field}</div>
                      </div>
                    </div>
                    {expandedCard === warn.id ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  {expandedCard === warn.id && (
                    <div className="mt-2.5 pt-2 border-t border-amber-200/80 text-[11px] text-slate-700">
                      <div className="font-semibold text-amber-800 flex items-center space-x-1 mb-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Recommendation:</span>
                      </div>
                      <p className="bg-white/80 p-2 rounded-lg border border-amber-200/60 text-slate-800">
                        {warn.fixHint}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'checklist' && (
          <div className="space-y-2">
            {report.checklist.map(item => (
              <div
                key={item.id}
                className={`p-2.5 rounded-xl border flex items-start space-x-2.5 ${
                  item.passed
                    ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                <div className="mt-0.5">
                  {item.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={`text-[11px] leading-tight font-medium ${item.passed ? 'text-emerald-900' : 'text-slate-700'}`}>
                    <span className="font-bold mr-1">#{item.id}</span>
                    {item.title}
                  </div>
                  {item.reason && (
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.reason}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submission CTA footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <button
          onClick={onSubmit}
          disabled={!report.isValid || isSubmitting || courseStatus === 'FINALIZED'}
          className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all ${
            report.isValid && courseStatus !== 'FINALIZED'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>
            {courseStatus === 'SUBMITTED'
              ? 'Re-submit for Review'
              : courseStatus === 'APPROVED' || courseStatus === 'FINALIZED'
              ? 'Course Approved / Locked'
              : 'Submit for Review'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
        {!report.isValid && (
          <p className="text-[11px] text-center text-rose-600 mt-1.5">
            Resolve {errorCount} blocking error{errorCount > 1 ? 's' : ''} to enable submission.
          </p>
        )}
      </div>
    </div>
  );
};
