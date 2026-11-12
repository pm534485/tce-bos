import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Course,
  CourseType,
  CourseOutcome,
  SyllabusModule,
  LearningResource,
  SdgActivity,
  LabExperiment,
  LabCoursePlanItem,
  CourseDesigner,
  Prerequisite,
  LectureScheduleItem,
  validateCourse,
  computeCourseCode,
  computeCredits,
  suggestCoWeightages,
  countWords,
  PROGRAMME_CODES,
  DEPARTMENT_OPTIONS,
  getProgrammesForDepartment,
  getDepartmentForProgramme,
  getDisplayTeType,
  CATEGORY_CODES,
  CATEGORY_ABBREVIATIONS,
  CATEGORY_OPTIONS,
  COURSE_CATEGORIES_TABLE_3,
  TPS_VERBS,
  LAB_OBJECTIVES,
  GENERAL_CO_POOL,
  PERFORMANCE_INDICATORS,
  SDG_LIST,
  DOMAIN_TO_SDG_MAP,
  TCP_WEIGHTAGE_TABLE,
  LAB_ACTIVITY_CHIPS,
  SCHWAB_HERRON_LEVELS,
  LAB_ASSESSMENT_SPLITS,
  getExpectedHoursCriteria,
  SALUTATION_OPTIONS,
  formatDesignerName,
} from '@syllabusforge/shared';
import { LiveCompliancePanel } from '../components/LiveCompliancePanel';
import { DocumentPreview } from '../components/DocumentPreview';
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Save,
  Send,
  Eye,
  Edit3,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Sparkles,
  RotateCcw,
  Info,
  Check,
  RefreshCw,
  Copy,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  X,
  Search,
  CheckSquare,
  Menu,
  Lock,
  ExternalLink,
} from 'lucide-react';

export const VALID_UNIQUE_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M',
  'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

// Helper: split subtopic strings by commas, dashes/hyphens (-), en/em dashes (–, —), semicolons, or newlines
export const splitSubtopics = (raw: string | string[]): string[] => {
  if (!raw) return [];
  const parts = Array.isArray(raw) ? raw : [raw];
  const out: string[] = [];
  for (const p of parts) {
    if (typeof p !== 'string') continue;
    const items = p
      .split(/[,;\n\r–—]+|\s*-\s*|\s*•\s*/)
      .map(s => s.trim().replace(/^[-–—•*]\s*/, '').trim())
      .filter(Boolean);
    out.push(...items);
  }
  return out;
};

// Helper: Synchronize syllabus modules to lectureScheduleItems preserving manual edits and manual rows
export const syncModulesToSchedule = (
  modules: SyllabusModule[] = [],
  currentSchedule: LectureScheduleItem[] = [],
  courseOutcomes: CourseOutcome[] = []
): LectureScheduleItem[] => {
  if (!modules || modules.length === 0) {
    return (currentSchedule || []).filter(item => item.source === 'manual');
  }

  const result: LectureScheduleItem[] = [];

  modules.forEach((mod, mIdx) => {
    const modNo = String(mod.moduleNo || mIdx + 1);
    const defaultCo = (Array.isArray(mod.coMapping) && mod.coMapping.length > 0)
      ? mod.coMapping.join(', ')
      : (courseOutcomes[mIdx]?.coNo || courseOutcomes[0]?.coNo || '');

    const moduleTitle = mod.mainTopic?.trim() || `Module ${modNo}`;

    // 1. Module Header Row
    const existingHeader = currentSchedule.find(x => x.moduleNo === modNo);
    if (existingHeader) {
      result.push({
        ...existingHeader,
        moduleNo: modNo,
        topic: existingHeader.isEdited ? existingHeader.topic : moduleTitle,
        originalTopic: moduleTitle,
        source: existingHeader.source || 'auto',
        coMapping: existingHeader.coMapping || defaultCo,
      });
    } else {
      result.push({
        moduleNo: modNo,
        topic: moduleTitle,
        periods: mod.periods !== undefined && mod.periods !== null ? mod.periods : '',
        coMapping: defaultCo,
        source: 'auto',
        isEdited: false,
        originalTopic: moduleTitle,
      });
    }

    // 2. Subtopic Rows
    const rawSubtopics = mod.subtopics || [];
    const subtopics = splitSubtopics(rawSubtopics);
    subtopics.forEach((sub, sIdx) => {
      const subNo = `${modNo}.${sIdx + 1}`;
      const existingSub = currentSchedule.find(x => x.moduleNo === subNo);
      if (existingSub) {
        result.push({
          ...existingSub,
          moduleNo: subNo,
          topic: existingSub.isEdited ? existingSub.topic : sub,
          originalTopic: sub,
          source: existingSub.source || 'auto',
          coMapping: existingSub.coMapping || defaultCo,
        });
      } else {
        result.push({
          moduleNo: subNo,
          topic: sub,
          periods: '',
          coMapping: defaultCo,
          source: 'auto',
          isEdited: false,
          originalTopic: sub,
        });
      }
    });

    // 3. Keep manual rows belonging to this module (e.g. added via "Add Topic")
    const manualSubtopics = currentSchedule.filter(
      x => x.source === 'manual' &&
           x.moduleNo.startsWith(`${modNo}.`) &&
           !result.some(r => r === x || (r.moduleNo === x.moduleNo && r.topic === x.topic))
    );
    manualSubtopics.forEach(m => result.push(m));
  });

  // 4. Standalone manual rows (custom rows not matching any active module)
  const standaloneManual = currentSchedule.filter(
    x => x.source === 'manual' &&
         !modules.some((m, mIdx) => {
           const modNo = String(m.moduleNo || mIdx + 1);
           return x.moduleNo === modNo || x.moduleNo.startsWith(`${modNo}.`);
         })
  );
  standaloneManual.forEach(s => result.push(s));

  return result;
};

// Performance Indicator (PI) Creatable Multi-Select Combobox Component
interface PiCheckboxSelectorProps {
  value: string;
  onChange: (newPi: string, matchedTpsLevel?: number) => void;
  coNo: string;
}

const PiCheckboxSelector: React.FC<PiCheckboxSelectorProps> = ({ value, onChange, coNo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  // Parse existing selected PIs from the comma/semicolon/space-separated string
  const selectedPis = (value || '')
    .split(/[,;\s]+/)
    .map(s => s.trim())
    .filter(Boolean);

  // Close dropdown on click outside; commit any typed text before closing
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (inputValue.trim()) {
          commitInput(inputValue.trim());
        }
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, inputValue, selectedPis]);

  // Scroll keyboard-navigated item into view
  useEffect(() => {
    if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Live filter standard PIs based on input text
  const trimmedInput = inputValue.trim();
  const filteredPis = PERFORMANCE_INDICATORS.filter(pi => {
    if (!trimmedInput) return true;
    const q = trimmedInput.toLowerCase();
    return (
      pi.piNumber.toLowerCase().includes(q) ||
      pi.descriptor.toLowerCase().includes(q) ||
      `tps ${pi.tpsLevel}`.includes(q)
    );
  });

  // Check if typed text matches an existing standard PI or is already selected
  const hasExactChecklistMatch = PERFORMANCE_INDICATORS.some(
    pi => pi.piNumber.toLowerCase() === trimmedInput.toLowerCase()
  );
  const isInputAlreadySelected = selectedPis.some(
    p => p.toLowerCase() === trimmedInput.toLowerCase()
  );
  // Show "Add <typed text> as custom PI" option if non-empty, not already selected, and not an exact standard match
  const showCustomOption = trimmedInput.length > 0 && !hasExactChecklistMatch && !isInputAlreadySelected;

  // Navigable items count: if custom option is shown, index 0 is custom option, 1..N are filtered items
  const totalNavItems = (showCustomOption ? 1 : 0) + filteredPis.length;

  const commitInput = (raw: string) => {
    const tokens = raw
      .split(/[,;\n\r]+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (tokens.length === 0) {
      setInputValue('');
      return;
    }

    let updatedList = [...selectedPis];
    let lastMatchedTpsLevel: number | undefined;

    for (const token of tokens) {
      if (!token) continue;
      // Prevent duplicates (case-insensitive check)
      if (!updatedList.some(p => p.toLowerCase() === token.toLowerCase())) {
        updatedList.push(token);
        const matched = PERFORMANCE_INDICATORS.find(
          p => p.piNumber.toLowerCase() === token.toLowerCase()
        );
        if (matched?.tpsLevel) {
          lastMatchedTpsLevel = matched.tpsLevel;
        }
      }
    }

    if (updatedList.length !== selectedPis.length) {
      onChange(updatedList.join(', '), lastMatchedTpsLevel);
    }
    setInputValue('');
    setActiveIndex(-1);
  };

  const togglePi = (piCode: string) => {
    const trimmed = piCode.trim();
    if (!trimmed) return;
    const exists = selectedPis.some(p => p.toLowerCase() === trimmed.toLowerCase());
    let nextList: string[];
    let matchedTpsLevel: number | undefined;

    if (exists) {
      nextList = selectedPis.filter(p => p.toLowerCase() !== trimmed.toLowerCase());
    } else {
      nextList = [...selectedPis, trimmed];
      const matched = PERFORMANCE_INDICATORS.find(
        p => p.piNumber.toLowerCase() === trimmed.toLowerCase()
      );
      matchedTpsLevel = matched?.tpsLevel;
    }

    onChange(nextList.join(', '), matchedTpsLevel);
  };

  const removePi = (piCode: string) => {
    const nextList = selectedPis.filter(p => p.toLowerCase() !== piCode.toLowerCase());
    onChange(nextList.join(', '));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && inputValue === '' && selectedPis.length > 0) {
      // Remove last chip on backspace with empty input
      e.preventDefault();
      const nextList = selectedPis.slice(0, -1);
      onChange(nextList.join(', '));
      return;
    }

    if (e.key === ',') {
      e.preventDefault();
      if (trimmedInput) {
        commitInput(trimmedInput);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(0);
      } else if (totalNavItems > 0) {
        setActiveIndex(prev => (prev + 1 < totalNavItems ? prev + 1 : 0));
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(totalNavItems - 1);
      } else if (totalNavItems > 0) {
        setActiveIndex(prev => (prev > 0 ? prev - 1 : totalNavItems - 1));
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && activeIndex >= 0) {
        if (showCustomOption && activeIndex === 0) {
          commitInput(trimmedInput);
        } else {
          const piIndex = showCustomOption ? activeIndex - 1 : activeIndex;
          if (filteredPis[piIndex]) {
            togglePi(filteredPis[piIndex].piNumber);
          }
        }
      } else if (trimmedInput) {
        commitInput(trimmedInput);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (e.key === 'Tab') {
      if (trimmedInput) {
        commitInput(trimmedInput);
      }
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (containerRef.current && containerRef.current.contains(e.relatedTarget as Node)) {
      return;
    }
    if (trimmedInput) {
      commitInput(trimmedInput);
    }
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[11px] font-bold text-slate-600">
          Performance Indicators (PIs)
        </label>
        {selectedPis.length > 0 && (
          <span className="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded font-semibold border border-sky-200">
            {selectedPis.length} indicator(s)
          </span>
        )}
      </div>

      <div
        onClick={handleContainerClick}
        className={`w-full min-h-[38px] px-2 py-1 border rounded-lg text-xs bg-white flex items-center transition-all cursor-text ${
          isOpen
            ? 'border-sky-500 ring-2 ring-sky-500/20'
            : 'border-slate-300 hover:border-slate-400'
        }`}
        title={`Type or choose Performance Indicators for ${coNo}`}
      >
        <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0 py-0.5">
          {selectedPis.map(piCode => (
            <span
              key={piCode}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[11px] font-mono font-semibold shadow-2xs"
            >
              <span>{piCode}</span>
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  removePi(piCode);
                }}
                className="text-sky-600 hover:text-rose-600 hover:bg-sky-200/60 rounded p-0.5 transition-colors cursor-pointer leading-none flex items-center justify-center"
                title={`Remove ${piCode}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value);
              if (!isOpen) setIsOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => {
              if (!isOpen) setIsOpen(true);
            }}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedPis.length === 0 ? 'Type or choose PIs (e.g. 5.2.1)' : 'Add PI...'
            }
            className="flex-1 min-w-[70px] border-none outline-none p-0 text-xs font-mono text-slate-800 placeholder:text-slate-400 placeholder:font-sans bg-transparent focus:ring-0"
          />
        </div>
        <button
          type="button"
          tabIndex={-1}
          onClick={e => {
            e.stopPropagation();
            if (isOpen) {
              setIsOpen(false);
            } else {
              setIsOpen(true);
              inputRef.current?.focus();
            }
          }}
          className="ml-1 p-1 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 cursor-pointer rounded"
          title={isOpen ? 'Close PI dropdown' : 'Open PI checklist dropdown'}
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-sky-600' : ''
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <div
          onMouseDown={e => e.preventDefault()}
          className="absolute z-50 right-0 top-full mt-1 w-[calc(100vw-3rem)] max-w-sm sm:w-96 bg-white border border-slate-200 rounded-xl shadow-2xl p-2.5 animate-in fade-in duration-150 text-slate-800"
          style={{ minWidth: '280px' }}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900 flex items-center space-x-1">
              <CheckSquare className="w-3.5 h-3.5 text-sky-600 mr-1" />
              <span>PI Checklist ({coNo})</span>
            </span>
            <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
              {selectedPis.length} active
            </span>
          </div>

          {/* Custom PI Add Option (if typed text doesn't match standard checklist item) */}
          {showCustomOption && (
            <button
              type="button"
              ref={el => { itemRefs.current[0] = el; }}
              onClick={() => {
                commitInput(trimmedInput);
                inputRef.current?.focus();
              }}
              onMouseEnter={() => setActiveIndex(0)}
              className={`w-full text-left px-2.5 py-1.5 mb-2 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors border border-dashed cursor-pointer ${
                activeIndex === 0
                  ? 'bg-sky-100 border-sky-400 text-sky-900 ring-1 ring-sky-400'
                  : 'bg-sky-50/80 border-sky-300 text-sky-800 hover:bg-sky-100'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
              <span className="truncate">
                Add <strong className="font-mono font-bold">"{trimmedInput}"</strong> as custom PI
              </span>
            </button>
          )}

          {/* Standard PI Checklist Scrollable Area */}
          <div ref={listRef} className="max-h-56 overflow-y-auto space-y-1 pr-1 text-xs divide-y divide-slate-100">
            {filteredPis.length === 0 ? (
              !showCustomOption ? (
                <div className="p-3 text-center text-slate-400 text-xs">
                  No matching standard performance indicators
                </div>
              ) : null
            ) : (
              filteredPis.map((pi, pIdx) => {
                const itemIndex = showCustomOption ? pIdx + 1 : pIdx;
                const isChecked = selectedPis.some(p => p.toLowerCase() === pi.piNumber.toLowerCase());
                const isActive = activeIndex === itemIndex;

                return (
                  <div
                    key={pi.piNumber}
                    ref={el => { itemRefs.current[itemIndex] = el; }}
                    onClick={() => {
                      togglePi(pi.piNumber);
                      inputRef.current?.focus();
                    }}
                    onMouseEnter={() => setActiveIndex(itemIndex)}
                    className={`flex items-start space-x-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-sky-100/90 ring-1 ring-sky-300'
                        : isChecked
                        ? 'bg-sky-50/90 text-sky-950 font-medium'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      tabIndex={-1}
                      className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 h-3.5 w-3.5 cursor-pointer flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sky-900 text-xs">{pi.piNumber}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-semibold ml-2">
                          TPS {pi.tpsLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-tight mt-0.5 line-clamp-2">
                        {pi.descriptor}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Dropdown Footer */}
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            {selectedPis.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  inputRef.current?.focus();
                }}
                className="text-[11px] text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
              >
                Clear All
              </button>
            ) : (
              <span className="text-[10px] text-slate-400">Press Enter or comma to add custom</span>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer ml-auto"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Sustainable Development Goals (SDGs) Checkbox Multi-Selector Component
interface SdgCheckboxSelectorProps {
  sdgNo: number | string | 'NC';
  onChange: (newSdgNo: string | number | 'NC', defaultLevel?: number) => void;
  coNo: string;
}

const SdgCheckboxSelector: React.FC<SdgCheckboxSelectorProps> = ({ sdgNo, onChange, coNo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const isNc = !sdgNo || sdgNo === 'NC';
  const selectedSdgs: number[] = isNc
    ? []
    : String(sdgNo)
        .split(/[,;\s]+/)
        .map(s => Number(s.replace(/[^0-9]/g, '')))
        .filter(n => !isNaN(n) && n >= 1 && n <= 17);

  const toggleSdg = (num: number) => {
    let nextList: number[];
    if (selectedSdgs.includes(num)) {
      nextList = selectedSdgs.filter(s => s !== num);
    } else {
      nextList = [...selectedSdgs, num].sort((a, b) => a - b);
    }

    if (nextList.length === 0) {
      onChange('NC', 0);
    } else {
      onChange(nextList.join(', '), 1);
    }
  };

  const selectNc = () => {
    onChange('NC', 0);
  };

  const filteredSdgs = SDG_LIST.filter(sdg => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      `sdg ${sdg.no}`.includes(q) ||
      sdg.name.toLowerCase().includes(q) ||
      sdg.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative" ref={popoverRef}>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[11px] font-bold text-slate-600">
          SDG(s) Addressed
        </label>
        {selectedSdgs.length > 0 ? (
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
            {selectedSdgs.length} active
          </span>
        ) : (
          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
            NC (Not Covered)
          </span>
        )}
      </div>

      <div
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full min-h-[38px] p-1.5 border border-slate-300 rounded-lg text-xs bg-white hover:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500 cursor-pointer flex flex-wrap items-center gap-1 transition-all"
        title={`Click to select SDGs with checkboxes for ${coNo}`}
      >
        {isNc || selectedSdgs.length === 0 ? (
          <span className="text-slate-500 text-xs px-1 font-semibold flex items-center">
            <CheckSquare className="w-3 h-3 mr-1 text-slate-400" />
            NC (Not Covered)
          </span>
        ) : (
          selectedSdgs.map(num => (
            <span
              key={num}
              className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold shadow-2xs"
            >
              SDG {num}
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  toggleSdg(num);
                }}
                className="ml-1 text-emerald-700 hover:text-emerald-950 font-bold"
                title={`Remove SDG ${num}`}
              >
                ×
              </button>
            </span>
          ))
        )}
        <span className="ml-auto text-slate-400 text-[11px] px-1">
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 sm:right-auto sm:w-84 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl p-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900 flex items-center space-x-1">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600 mr-1" />
              <span>Select SDGs Addressed</span>
            </span>
            <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
              {selectedSdgs.length > 0 ? `${selectedSdgs.length} selected` : 'None (NC)'}
            </span>
          </div>

          {/* NC Option */}
          <div className="mb-2 pb-2 border-b border-slate-100">
            <label
              className={`flex items-center space-x-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                isNc || selectedSdgs.length === 0 ? 'bg-amber-50 border border-amber-200 font-bold text-amber-900' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={isNc || selectedSdgs.length === 0}
                onChange={selectNc}
                className="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
              />
              <span className="text-xs font-bold">NC (Not Covered)</span>
            </label>
          </div>

          <div className="relative mb-2">
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search SDGs..."
              className="w-full pl-7 pr-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 text-xs divide-y divide-slate-100">
            {filteredSdgs.map(sdg => {
              const isChecked = selectedSdgs.includes(sdg.no);
              return (
                <label
                  key={sdg.no}
                  className={`flex items-start space-x-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                    isChecked ? 'bg-emerald-50/90 text-emerald-950 font-medium' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSdg(sdg.no)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-slate-900 text-xs">
                      SDG {sdg.no}: {sdg.name}
                    </span>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-1">
                      {sdg.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={selectNc}
              className="text-[11px] text-slate-500 hover:text-amber-700 font-semibold"
            >
              Reset to NC
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper to determine a CO's domain
export const getDomainForCourseOutcome = (co?: CourseOutcome): 'Cognitive' | 'Affective' | 'Psychomotor' => {
  if (!co) return 'Cognitive';
  if (co.domain === 'Cognitive' || co.domain === 'Affective' || co.domain === 'Psychomotor') {
    return co.domain;
  }
  if (co.objectiveNo) {
    if (co.objectiveNo >= 1 && co.objectiveNo <= 7) return 'Cognitive';
    if (co.objectiveNo >= 8 && co.objectiveNo <= 9) return 'Affective';
    if (co.objectiveNo >= 10 && co.objectiveNo <= 13) return 'Psychomotor';
  }
  return 'Cognitive';
};

export const getDomainPillClass = (domain: 'Cognitive' | 'Affective' | 'Psychomotor'): string => {
  if (domain === 'Affective') return 'bg-emerald-600 text-white shadow-xs';
  if (domain === 'Psychomotor') return 'bg-violet-600 text-white shadow-xs';
  return 'bg-blue-600 text-white shadow-xs';
};

// ── CO Mapping Popup — full document-preview-style CO table in a modal ──
interface CoMappingPopupProps {
  expLabel: string;
  courseOutcomes: CourseOutcome[];
  selectedCoNos: string[];
  onToggle: (coNo: string) => void;
}
const CoMappingPopup: React.FC<CoMappingPopupProps> = ({ expLabel, courseOutcomes, selectedCoNos, onToggle }) => {
  const [open, setOpen] = useState(false);
  const getDomainForCo = (co: CourseOutcome) => getDomainForCourseOutcome(co);

  const domainStyleMap: Record<'Cognitive' | 'Affective' | 'Psychomotor', {
    pill: string;
    unselectedPill: string;
    selectedRow: string;
    hoverRow: string;
    checkColor: string;
    badge: string;
  }> = {
    Cognitive: {
      pill: 'bg-blue-600 text-white shadow-xs',
      unselectedPill: 'bg-blue-100 text-blue-800 border border-blue-200',
      selectedRow: 'bg-blue-100/70 hover:bg-blue-100/90',
      hoverRow: 'hover:bg-blue-50/50',
      checkColor: 'text-blue-600',
      badge: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    Affective: {
      pill: 'bg-emerald-600 text-white shadow-xs',
      unselectedPill: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      selectedRow: 'bg-emerald-100/70 hover:bg-emerald-100/90',
      hoverRow: 'hover:bg-emerald-50/50',
      checkColor: 'text-emerald-600',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    Psychomotor: {
      pill: 'bg-violet-600 text-white shadow-xs',
      unselectedPill: 'bg-violet-100 text-violet-800 border border-violet-200',
      selectedRow: 'bg-violet-100/70 hover:bg-violet-100/90',
      hoverRow: 'hover:bg-violet-50/50',
      checkColor: 'text-violet-600',
      badge: 'bg-violet-50 text-violet-800 border-violet-200',
    },
  };

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-300 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition-all cursor-pointer"
      >
        <Plus className="w-3 h-3" />
        Select COs
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Course Outcomes — {expLabel}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Click a row to map or unmap it to this experiment</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Table */}
            <div className="overflow-auto flex-1">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-700 w-16">No.</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-700">Course Outcome</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-700 w-20">TPS Level</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-700 w-28">Performance Indicator</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-700 w-24">CO Weightage</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-700 w-24">SDG addressed</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-700 w-20">SDG Level</th>
                    <th className="px-4 py-3 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courseOutcomes.map(co => {
                    const isSelected = selectedCoNos.includes(co.coNo);
                    const domain = getDomainForCo(co);
                    const dStyle = domainStyleMap[domain];
                    return (
                      <tr
                        key={co.coNo}
                        onClick={() => onToggle(co.coNo)}
                        className={`cursor-pointer transition-colors ${isSelected ? dStyle.selectedRow : dStyle.hoverRow}`}
                      >
                        <td className="px-4 py-3 align-top">
                          <span className={`inline-block px-2.5 py-0.5 rounded font-black text-[11px] ${isSelected ? dStyle.pill : dStyle.unselectedPill}`}>
                            {co.coNo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-800 leading-snug align-top font-medium">{co.statement}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-700 align-top">TPS{co.tpsLevel}</td>
                        <td className="px-4 py-3 text-center text-slate-600 align-top">{co.pi || '—'}</td>
                        <td className="px-4 py-3 text-center text-slate-600 align-top">{(co as any).weightage ? `${(co as any).weightage}%` : '—'}</td>
                        <td className="px-4 py-3 text-center text-slate-600 align-top">{co.sdgNo || 'NC'}</td>
                        <td className="px-4 py-3 text-center text-slate-600 align-top">{co.sdgLevel ?? 0}</td>
                        <td className="px-4 py-3 text-center align-top">
                          {isSelected ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-xs">
                              <Check className={`w-4 h-4 ${dStyle.checkColor}`} />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400 shadow-xs">
                              <Plus className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal footer — selected summary with domain-colored tags + Done */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex-shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Mapped:</span>
                {selectedCoNos.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">None</span>
                ) : (
                  selectedCoNos.map(cNo => {
                    const matchedCo = courseOutcomes.find(c => c.coNo === cNo);
                    const domain = matchedCo ? getDomainForCo(matchedCo) : 'Cognitive';
                    const dStyle = domainStyleMap[domain];
                    return (
                      <span key={cNo} className={`px-2.5 py-0.5 rounded-md text-[11px] font-black ${dStyle.pill}`}>
                        {cNo}
                      </span>
                    );
                  })
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ── CO Domain Picker sub-component (must be a real component to use useState) ──
interface CoDomainPickerProps {
  courseOutcomes: CourseOutcome[];
  onAdd: (co: CourseOutcome) => void;
}
const CoDomainPicker: React.FC<CoDomainPickerProps> = ({ courseOutcomes, onAdd }) => {
  const [openDomain, setOpenDomain] = useState<'Cognitive' | 'Affective' | 'Psychomotor' | null>(null);

  const cogPool = GENERAL_CO_POOL.filter(g => g.domain === 'Cognitive');
  const affPool = GENERAL_CO_POOL.filter(g => g.domain === 'Affective');
  const psyPool = GENERAL_CO_POOL.filter(g => g.domain === 'Psychomotor');
  const addedRefs = courseOutcomes.map(c => c.generalCoRef).filter(Boolean);
  const cogCount = courseOutcomes.filter(c => c.domain === 'Cognitive').length;

  const domainColors: Record<string, {
    btn: string;
    active: string;
    badge: string;
    modalBorder: string;
    modalHeader: string;
    modalHeaderTitle: string;
    modalHeaderSubtitle: string;
    modalCloseBtn: string;
    tableThead: string;
    tableTh: string;
    tableDivider: string;
    rowBg: string;
    rowHover: string;
    codeText: string;
    statementText: string;
    tpsText: string;
    objText: string;
    addedRowBg: string;
    modalFooter: string;
    modalFooterLabel: string;
    modalDoneBtn: string;
  }> = {
    Cognitive: {
      btn: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm',
      active: 'bg-blue-700 text-white border-blue-700 ring-2 ring-blue-300 shadow-md',
      badge: 'bg-white/25 text-white',
      modalBorder: 'border-blue-200',
      modalHeader: 'bg-blue-600 text-white border-blue-700',
      modalHeaderTitle: 'text-white',
      modalHeaderSubtitle: 'text-blue-100',
      modalCloseBtn: 'text-white/80 hover:text-white hover:bg-white/20',
      tableThead: 'bg-blue-100/80 border-b border-blue-200',
      tableTh: 'text-blue-900',
      tableDivider: 'divide-blue-100',
      rowBg: 'bg-blue-50/30',
      rowHover: 'hover:bg-blue-100/60',
      codeText: 'text-blue-900',
      statementText: 'text-slate-800',
      tpsText: 'text-blue-900 font-bold',
      objText: 'text-blue-800/80',
      addedRowBg: 'bg-blue-100/70 opacity-90',
      modalFooter: 'bg-blue-50 border-t border-blue-200',
      modalFooterLabel: 'text-blue-900 font-bold',
      modalDoneBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    Affective: {
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm',
      active: 'bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-300 shadow-md',
      badge: 'bg-white/25 text-white',
      modalBorder: 'border-emerald-200',
      modalHeader: 'bg-emerald-600 text-white border-emerald-700',
      modalHeaderTitle: 'text-white',
      modalHeaderSubtitle: 'text-emerald-100',
      modalCloseBtn: 'text-white/80 hover:text-white hover:bg-white/20',
      tableThead: 'bg-emerald-100/80 border-b border-emerald-200',
      tableTh: 'text-emerald-900',
      tableDivider: 'divide-emerald-100',
      rowBg: 'bg-emerald-50/30',
      rowHover: 'hover:bg-emerald-100/60',
      codeText: 'text-emerald-900',
      statementText: 'text-slate-800',
      tpsText: 'text-emerald-900 font-bold',
      objText: 'text-emerald-800/80',
      addedRowBg: 'bg-emerald-100/70 opacity-90',
      modalFooter: 'bg-emerald-50 border-t border-emerald-200',
      modalFooterLabel: 'text-emerald-900 font-bold',
      modalDoneBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    Psychomotor: {
      btn: 'bg-violet-600 hover:bg-violet-700 text-white border-violet-600 shadow-sm',
      active: 'bg-violet-700 text-white border-violet-700 ring-2 ring-violet-300 shadow-md',
      badge: 'bg-white/25 text-white',
      modalBorder: 'border-violet-200',
      modalHeader: 'bg-violet-600 text-white border-violet-700',
      modalHeaderTitle: 'text-white',
      modalHeaderSubtitle: 'text-violet-100',
      modalCloseBtn: 'text-white/80 hover:text-white hover:bg-white/20',
      tableThead: 'bg-violet-100/80 border-b border-violet-200',
      tableTh: 'text-violet-900',
      tableDivider: 'divide-violet-100',
      rowBg: 'bg-violet-50/30',
      rowHover: 'hover:bg-violet-100/60',
      codeText: 'text-violet-900',
      statementText: 'text-slate-800',
      tpsText: 'text-violet-900 font-bold',
      objText: 'text-violet-800/80',
      addedRowBg: 'bg-violet-100/70 opacity-90',
      modalFooter: 'bg-violet-50 border-t border-violet-200',
      modalFooterLabel: 'text-violet-900 font-bold',
      modalDoneBtn: 'bg-violet-600 hover:bg-violet-700 text-white',
    },
  };
  const poolMap: Record<string, typeof cogPool> = { Cognitive: cogPool, Affective: affPool, Psychomotor: psyPool };
  const tableTitle: Record<string, string> = {
    Cognitive:   'Table 7.1 — Suggested General COs: Cognitive Domain',
    Affective:   'Table 7.2.1 — Suggested General COs: Affective Domain',
    Psychomotor: 'Table 7.2.2 — Suggested General COs: Psychomotor Domain',
  };

  const domainGuidance: Record<string, string> = {
    Cognitive:   'Covers Laboratory Objectives 1–5. Select 2–4 COs per course depending on the nature and scope of experiments.',
    Affective:   'Covers Laboratory Objectives 8–13. 7 COs provided; select 2–3 per course ensuring balanced coverage of ethics, safety, teamwork, and communication.',
    Psychomotor: 'Covers Objectives 6–7. 6 COs provided; select 2–3 per course ensuring coverage of instrument operation, sensory awareness, and procedural skill.',
  };

  const handleAdd = (g: typeof GENERAL_CO_POOL[0]) => {
    if (addedRefs.includes(g.code)) return;
    const newCo: CourseOutcome = {
      coNo: `CO${courseOutcomes.length + 1}`,
      statement: g.statement,
      tpsLevel: g.tpsLevel,
      pi: g.pi,
      objectiveNo: g.objectiveNo,
      objectiveName: g.objectiveName,
      domain: g.domain,
      generalCoRef: g.code,
      sdgNo: 'NC',
      sdgLevel: 0,
    };
    onAdd(newCo);
  };

  return (
    <div className="space-y-3">
      {/* 3 domain buttons */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-slate-700">Add CO from:</span>
        {(['Cognitive', 'Affective', 'Psychomotor'] as const).map(domain => {
          const count = courseOutcomes.filter(c => c.domain === domain).length;
          const isOpen = openDomain === domain;
          const col = domainColors[domain];
          return (
            <button
              key={domain}
              type="button"
              onClick={() => setOpenDomain(isOpen ? null : domain)}
              className={`no-glass inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${isOpen ? col.active : col.btn}`}
            >
              {domain}
              {count > 0 && <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${isOpen ? 'bg-white/30' : col.badge}`}>{count}</span>}
              <span className="text-[10px] text-white/80 font-medium">(min 2)</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          );
        })}
      </div>

      {/* Domain table modal dialog */}
      {openDomain && (() => {
        const col = domainColors[openDomain];
        const currentDomainCount = courseOutcomes.filter(c => c.domain === openDomain).length;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setOpenDomain(null)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border ${col.modalBorder} animate-in fade-in zoom-in-95 duration-150`}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header with solid domain color */}
              <div className={`flex items-center justify-between px-6 py-4 ${col.modalHeader}`}>
                <div className="space-y-1 pr-4">
                  <h3 className={`font-bold text-sm tracking-wide ${col.modalHeaderTitle}`}>{tableTitle[openDomain]}</h3>
                  <p className={`text-xs ${col.modalHeaderSubtitle} opacity-95 leading-relaxed`}>
                    {domainGuidance[openDomain]}
                  </p>
                  <p className={`text-[11px] font-semibold text-white/90`}>
                    Currently selected: {currentDomainCount} (minimum 2 required)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenDomain(null)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${col.modalCloseBtn}`}
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable table body styled with rich domain background tint */}
              <div className={`overflow-auto flex-1 ${col.rowBg}`}>
                <table className="w-full text-xs border-collapse">
                  <thead className={`sticky top-0 z-10 ${col.tableThead}`}>
                    <tr>
                      <th className={`px-4 py-3 text-left font-bold ${col.tableTh} w-20`}>CO</th>
                      <th className={`px-4 py-3 text-left font-bold ${col.tableTh}`}>Outcome Statement</th>
                      <th className={`px-4 py-3 text-center font-bold ${col.tableTh} w-16`}>TPS</th>
                      <th className={`px-4 py-3 text-left font-bold ${col.tableTh} w-36 hidden sm:table-cell`}>Objective</th>
                      <th className="px-4 py-3 text-center w-16"></th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${col.tableDivider}`}>
                    {poolMap[openDomain].map(g => {
                      const alreadyAdded = addedRefs.includes(g.code);
                      return (
                        <tr
                          key={g.code}
                          className={`transition-colors ${
                            alreadyAdded
                              ? `${col.addedRowBg} font-medium`
                              : `${col.rowHover} cursor-pointer bg-white/60`
                          }`}
                          onClick={() => { if (!alreadyAdded) handleAdd(g); }}
                        >
                          <td className={`px-4 py-3 font-black align-top ${col.codeText}`}>{g.code}</td>
                          <td className={`px-4 py-3 leading-snug align-top ${col.statementText}`}>{g.statement}</td>
                          <td className={`px-4 py-3 text-center align-top ${col.tpsText}`}>{g.tpsLevel}</td>
                          <td className={`px-4 py-3 hidden sm:table-cell align-top ${col.objText}`}>{g.objectiveName}</td>
                          <td className="px-4 py-3 text-center align-top">
                            {alreadyAdded ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-xs">
                                <Check className="w-4 h-4 text-emerald-600" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 shadow-xs transition-all">
                                <Plus className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Modal footer — themed status summary + Done button */}
              <div className={`flex items-center justify-between px-6 py-3.5 ${col.modalFooter}`}>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={col.modalFooterLabel}>Added:</span>
                  {courseOutcomes.filter(c => c.domain === openDomain).length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic">None yet</span>
                  ) : (
                    courseOutcomes.filter(c => c.domain === openDomain).map(c => (
                      <span
                        key={c.coNo}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-black shadow-xs ${
                          openDomain === 'Cognitive'
                            ? 'bg-blue-600 text-white'
                            : openDomain === 'Affective'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-violet-600 text-white'
                        }`}
                      >
                        {c.coNo} ({c.generalCoRef || c.domain})
                      </span>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOpenDomain(null)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer ${col.modalDoneBtn}`}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export const CourseWizard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const courseTypeParam = (searchParams.get('type') as CourseType) || 'THEORY';

  // State
  const [activeTab, setActiveTab] = useState<'wizard' | 'preview'>('wizard');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('syllabusforge_autosave');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleAutoSave = (enabled: boolean) => {
    setIsAutoSaveEnabled(enabled);
    localStorage.setItem('syllabusforge_autosave', String(enabled));
  };

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [existingCodes, setExistingCodes] = useState<string[]>([]);

  // Close sidebar on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Local draft state for module subtopics input to allow typing smoothly
  const [subtopicsDraft, setSubtopicsDraft] = useState<Record<number, string>>({});

  // Local draft state for bulk experiments text input (single field auto-divides by numbers)
  const [bulkExperimentsText, setBulkExperimentsText] = useState<string>('');

  // Admin configured active regulation state
  const [adminRegulation, setAdminRegulation] = useState<{ year: number; code: string }>({ year: 2026, code: '26' });

  // Active popover for Course Outcome action verbs (holds CO identifier e.g. 'CO1' or null)
  const [openVerbPopoverCo, setOpenVerbPopoverCo] = useState<string | null>(null);



  // Track which fields the user has interacted with (to show errors only after interaction)
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const touchField = (field: string) => {
    setTouchedFields(prev => new Set(prev).add(field));
  };

  // Safe back handler: steps to previous wizard section when step > 0, otherwise goes to previous browser page
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  };

  // Loading state when opening an existing course document
  const [isLoadingCourse, setIsLoadingCourse] = useState<boolean>(Boolean(id));
  const [loadError, setLoadError] = useState<string | null>(null);

  // "New or Existing revision?" intent modal (only for new courses, i.e. no id in URL)
  // 'pending' = not yet chosen, 'new' = brand-new course (ver 0, locked), 'revision' = revision of existing
  const [courseIntent, setCourseIntent] = useState<'pending' | 'new' | 'revision'>(id ? 'new' : 'pending');
  const [showRevisionInput, setShowRevisionInput] = useState<boolean>(false);
  const [prevCodeInput, setPrevCodeInput] = useState<string>('');
  const [prevCodeError, setPrevCodeError] = useState<string>('');
  // Version resolved from intent: locked once confirmed
  const [versionLocked, setVersionLocked] = useState<boolean>(Boolean(id));

  // Guidelines doc viewer modal state (null = closed, string = docx public path to view)
  const [guidelinesDocOpen, setGuidelinesDocOpen] = useState<boolean>(false);

  // Handler: user chose "New Course" → version = 0, locked
  const handleIntentNew = () => {
    setCourseIntent('new');
    setVersionLocked(true);
    setShowRevisionInput(false);
    setPrevCodeInput('');
    setPrevCodeError('');
    setCourse(prev => ({ ...prev, version: 0 }));
  };

  // Handler: user confirmed the previous code for a revision
  const handleIntentRevisionConfirm = () => {
    const code = prevCodeInput.trim().toUpperCase();
    if (!code) {
      setPrevCodeError('Please enter the previous course code.');
      return;
    }
    // The last character of a course code is the version digit (0, 1, 2)
    const lastChar = code.slice(-1);
    const prevVer = parseInt(lastChar, 10);
    if (isNaN(prevVer) || prevVer < 0 || prevVer > 1) {
      setPrevCodeError('Previous code must end with 0 or 1 (e.g. 26CECA0 or 26CECA1). Only versions 0 and 1 can be revised.');
      return;
    }
    const newVer = prevVer + 1; // 0 → 1, 1 → 2
    setPrevCodeError('');
    setCourseIntent('revision');
    setVersionLocked(true);
    setCourse(prev => ({ ...prev, version: newVer }));
  };

  // Course Form State - Starts empty with no pre-selected values for new courses; version defaults to 0
  const [course, setCourse] = useState<Course>({
    courseType: courseTypeParam,
    regulationYear: 2026,
    regulationCode: '26',
    programmeCode: '',
    categoryLetter: '',
    uniqueLetter: '',
    version: 0,
    courseCode: '',
    courseName: '',
    courseSubtitle: '',
    categoryAbbr: '' as any,
    semester: 1,
    semesterType: 'ODD',
    L: courseTypeParam === 'PRACTICAL' ? 0 : ('' as any),
    T: courseTypeParam === 'PRACTICAL' ? 0 : ('' as any),
    P: courseTypeParam === 'THEORY' ? 0 : ('' as any),
    credits: '' as any,
    teExamType: courseTypeParam === 'TCP' ? ('' as any) : undefined,
    preamble: '',
    isAdvanced: false,
    prerequisites: '',
    courseOutcomes: [],
    assessmentMatrix: [],
    modules: [],
    textBooks: [],
    referenceBooks: [],
    webResources: [],
    sdgActivities: [],
    experiments: [],
    coursePlan: [],
    designers: [
      {
        salutation: user?.name?.match(/^(Dr\.|Mr\.|Ms\.|Mrs\.|Er\.|Prof\.)/i)?.[1] || '',
        name: user?.name ? user.name.replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.|Er\.|Prof\.)\s*/i, '') : '',
        designation: user?.designation || '',
        department: user?.department || '',
        email: user?.email || '',
      },
    ],
    status: 'DRAFT',
    createdBy: user?.email || '',
    department: '',
    comments: [],
  });

  // Load existing course or catalog codes, and active regulation
  useEffect(() => {
    async function loadData() {
      if (id) {
        setIsLoadingCourse(true);
        setLoadError(null);
      }
      try {
        const [allCourses, regRes] = await Promise.all([
          api.getCourses({ scope: 'all' }),
          api.getActiveRegulation().catch(() => ({ regulationYear: 2026, regulationCode: '26' }))
        ]);
        const codes = allCourses.map(c => c.courseCode);
        setExistingCodes(codes);

        if (regRes && regRes.regulationCode) {
          setAdminRegulation({ year: regRes.regulationYear, code: regRes.regulationCode });
        }

        if (id) {
          const fetched = await api.getCourse(id);
          if (fetched.courseType === 'THEORY') {
            fetched.P = 0;
          }
          if (fetched.courseType === 'PRACTICAL') {
            fetched.L = 0;
            fetched.T = 0;
            fetched.modules = [];
            fetched.lectureScheduleItems = [];
          }
          if (!fetched.categoryAbbr && fetched.categoryLetter) {
            const cat = CATEGORY_CODES.find(c => c.code === fetched.categoryLetter);
            if (cat) fetched.categoryAbbr = cat.defaultAbbr as any;
          }
          if (
            (fetched.courseType === 'THEORY' || fetched.courseType === 'TCP') &&
            fetched.modules && fetched.modules.length > 0 &&
            (!fetched.lectureScheduleItems || fetched.lectureScheduleItems.length === 0)
          ) {
            fetched.lectureScheduleItems = syncModulesToSchedule(
              fetched.modules,
              [],
              fetched.courseOutcomes || []
            );
          }
          if (fetched.lectureScheduleItems && fetched.lectureScheduleItems.length > 0) {
            fetched.lectureScheduleItems = fetched.lectureScheduleItems.map(item => {
              const isHeader = !item.moduleNo || !item.moduleNo.includes('.');
              const hasSubtopics = isHeader && fetched.lectureScheduleItems?.some(x => x.moduleNo.startsWith(`${item.moduleNo}.`));
              if (isHeader && hasSubtopics && (item.periods === '' || item.periods === undefined || item.periods === null)) {
                return item;
              }
              const p = Number(item.periods);
              if (p !== 1 && p !== 2) {
                return { ...item, periods: '' };
              }
              return item;
            });
          }
          if (fetched && fetched.programmeCode) {
            const expectedDept = getDepartmentForProgramme(fetched.programmeCode);
            if (expectedDept && fetched.department === 'Computer Applications' && expectedDept !== 'Computer Applications') {
              fetched.department = expectedDept;
            }
          }
          setCourse(fetched);
          setLastSaved(new Date());
          if (fetched.experiments && fetched.experiments.length > 0) {
            setBulkExperimentsText(fetched.experiments.map((e, idx) => `${e.slNo || idx + 1}. ${e.name}${e.hours ? ` (${e.hours} hrs)` : ''}`).join('\n'));
          }
        } else {
          // Auto-apply active regulation from admin and lock version to 0
          if (regRes && regRes.regulationCode) {
            setCourse(prev => ({
              ...prev,
              regulationYear: regRes.regulationYear,
              regulationCode: regRes.regulationCode,
              version: 0,
              L: prev.courseType === 'PRACTICAL' ? 0 : prev.L,
              T: prev.courseType === 'PRACTICAL' ? 0 : prev.T,
              P: prev.courseType === 'THEORY' ? 0 : prev.P,
            }));
          } else {
            setCourse(prev => ({ ...prev, version: 0 }));
          }
        }
      } catch (err: any) {
        console.error('Failed to load course or regulation:', err);
        if (id) {
          setLoadError(err?.response?.data?.message || err?.message || 'Unable to open course document. Please check the course ID or your connection.');
        }
      } finally {
        setIsLoadingCourse(false);
      }
    }
    loadData();
  }, [id]);

  // Compute live validation report
  const otherCodes = course._id
    ? existingCodes.filter(c => c !== course.courseCode)
    : existingCodes;
  const validationReport = validateCourse(course, otherCodes);

  // Real-time field-level validation helpers (only show errors for touched fields)
  const getFieldErrors = (fieldName: string) => {
    const isTouched = touchedFields.has(fieldName) || [...touchedFields].some(f => f === fieldName || f.startsWith(`${fieldName}.`));
    if (!isTouched) return [];
    return validationReport.errors.filter(e => e.field === fieldName || e.field.startsWith(`${fieldName}.`));
  };

  const hasFieldError = (fieldName: string) => {
    const isTouched = touchedFields.has(fieldName) || [...touchedFields].some(f => f === fieldName || f.startsWith(`${fieldName}.`));
    if (!isTouched) return false;
    return validationReport.errors.some(e => e.field === fieldName || e.field.startsWith(`${fieldName}.`));
  };

  // Compute live subject code with dash before user enters anything
  const hasEnteredAnyCode = Boolean(
    course.programmeCode ||
    course.categoryLetter ||
    course.uniqueLetter ||
    (course.version !== undefined && course.version !== null && course.version !== ('' as any))
  );
  const regPart = course.regulationCode || adminRegulation.code || '26';
  const progPart = course.programmeCode ? course.programmeCode : '—';
  const catPart = course.categoryLetter ? course.categoryLetter : '—';
  const uniquePart = course.uniqueLetter ? course.uniqueLetter : '—';
  const verPart = (course.version !== undefined && course.version !== null && course.version !== ('' as any)) ? String(course.version) : '—';
  // Always show reg code + hyphens for unfilled parts (never collapse to single dash)
  const displaySubjectCode = `${regPart}${progPart}${catPart}${uniquePart}${verPart}`;

  // Filter designated programme codes based on the chosen department
  const availableProgrammeCodes = useMemo(() => {
    const currentDept = course.department || getDepartmentForProgramme(course.programmeCode);
    return getProgrammesForDepartment(currentDept);
  }, [course.department, course.programmeCode]);

  // Handler for selecting department
  const handleDepartmentChange = (dept: string) => {
    const progs = getProgrammesForDepartment(dept);
    const isCurrentValid = progs.some(p => p.code === course.programmeCode);
    const nextProg = isCurrentValid ? course.programmeCode : '';
    setCourse(prev => {
      const updated = {
        ...prev,
        department: dept,
        programmeCode: nextProg,
      };
      updated.courseCode = computeCourseCode({
        regulationCode: updated.regulationCode,
        programmeCode: updated.programmeCode,
        categoryLetter: updated.categoryLetter,
        uniqueLetter: updated.uniqueLetter,
        version: updated.version,
      });
      return updated;
    });
    touchField('department');
  };

  // Active Table 3 Category matching course.categoryLetter or course.categoryAbbr
  const activeTable3Category = useMemo(() => {
    if (course.categoryLetter) {
      const matchByLetter = COURSE_CATEGORIES_TABLE_3.find(c => c.codes.includes(course.categoryLetter));
      if (matchByLetter) return matchByLetter;
    }
    if (course.categoryAbbr) {
      return COURSE_CATEGORIES_TABLE_3.find(c => c.defaultAbbr === course.categoryAbbr) || null;
    }
    return null;
  }, [course.categoryLetter, course.categoryAbbr]);

  // Available letter codes for the currently selected category
  const availableCategoryCodes = useMemo(() => {
    if (activeTable3Category) {
      return activeTable3Category.codes.map(code => ({
        code,
        name: activeTable3Category.name,
      }));
    }
    if (course.categoryAbbr) {
      const filtered = CATEGORY_CODES.filter(c => c.defaultAbbr === course.categoryAbbr);
      if (filtered.length > 0) return filtered;
    }
    return CATEGORY_CODES;
  }, [activeTable3Category, course.categoryAbbr]);

  // Descriptive course type metadata for prominent display across all headers
  const courseTypeInfo = useMemo(() => {
    const type = course.courseType;
    switch (type) {
      case 'THEORY':
        return {
          label: 'Theory Course',
          badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
          dotClass: 'bg-blue-500',
        };
      case 'PRACTICAL':
        return {
          label: 'Practical Course',
          badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
          dotClass: 'bg-emerald-500',
        };
      case 'TCP':
        return {
          label: 'Theory Cum Practical (TCP)',
          badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200',
          dotClass: 'bg-purple-500',
        };
      case 'AUDIT':
        return {
          label: 'Audit Course',
          badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
          dotClass: 'bg-amber-500',
        };
      default:
        return {
          label: 'Theory Course',
          badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
          dotClass: 'bg-blue-500',
        };
    }
  }, [course.courseType]);

  // Step 0 validation: Next button enabled ONLY when all details in the first page are entered and valid
  const isStep0Complete = Boolean(
    (course.regulationCode || adminRegulation.code) &&
    (course.regulationYear || adminRegulation.year) &&
    course.programmeCode &&
    course.programmeCode.trim() &&
    course.categoryLetter &&
    course.categoryLetter.trim() &&
    course.uniqueLetter &&
    course.uniqueLetter.trim() &&
    course.version !== undefined &&
    course.version !== null &&
    course.version !== ('' as any) &&
    course.courseName &&
    course.courseName.trim().length >= 3 &&
    course.categoryAbbr &&
    String(course.categoryAbbr).trim() &&
    (course.courseType === 'PRACTICAL' || (typeof course.L === 'number' && course.L >= 0 && course.L !== ('' as any))) &&
    (course.courseType === 'PRACTICAL' || (typeof course.T === 'number' && course.T >= 0 && course.T !== ('' as any))) &&
    (course.courseType === 'THEORY' || (typeof course.P === 'number' && course.P >= 0 && course.P !== ('' as any))) &&
    course.credits !== undefined &&
    course.credits !== null &&
    course.credits !== ('' as any) &&
    Number(course.credits) > 0 &&
    (course.courseType !== 'TCP' || (course.teExamType && String(course.teExamType).trim())) &&
    !hasFieldError('courseName') &&
    !hasFieldError('uniqueLetter') &&
    !hasFieldError('courseCode') &&
    !hasFieldError('credits')
  );

  // Step 1 validation: Preamble & Prerequisites
  // Preamble must have at least 1 word and strictly maximum 90 words; no minimum limit
  const isStep1Complete = Boolean(
    (course.preamble || '').trim().length > 0 &&
    countWords(course.preamble || '') <= 90 &&
    (course.preamble || '').split(/\n\s*\n/).length === 1 &&
    !validationReport.errors.some(e => e.field.startsWith('preamble') || e.field.startsWith('prerequisites'))
  );

  // Step 2 validation: Course Outcomes
  // Requirements:
  // - Practical 1 credit: minimum 3 COs
  // - Practical 2 credits: minimum 4 COs
  // - Theory (3 credits): minimum 6 COs
  const cosList = course.courseOutcomes || [];
  const numCredits = Number(course.credits) || 0;

  let minCosRequired = 6;
  if (course.courseType === 'PRACTICAL') {
    minCosRequired = numCredits <= 1 ? 3 : 4;
  } else {
    minCosRequired = numCredits > 0 && numCredits < 3 ? (numCredits === 1 ? 3 : 4) : 6;
  }

  // Check valid COs that have non-empty statements
  const validCos = cosList.filter(co => Boolean((co.statement || '').trim()));
  const isStep2Complete = validCos.length >= minCosRequired;

  // Step 3 validation: Assessment Pattern
  const isStep3Complete = Boolean(
    course.courseType === 'PRACTICAL'
      ? !validationReport.errors.some(e => e.field.startsWith('assessmentMatrix'))
      : (course.assessmentMatrix || []).length > 0 &&
        !validationReport.errors.some(e => e.field.startsWith('assessmentMatrix'))
  );

  // Step 4 validation: Syllabus & Content (or Lab Experiments)
  const isStep4Complete = Boolean(
    course.courseType === 'PRACTICAL'
      ? (course.experiments || []).length > 0 &&
        (course.experiments || []).every(exp => (exp.name || '').trim().length > 0) &&
        !validationReport.errors.some(e => e.field.startsWith('experiments'))
      : (course.modules || []).length > 0 &&
        (course.modules || []).every(m => (m.mainTopic || '').trim().length > 0 && ((m.subtopics || []).length > 0 || (course.lectureScheduleItems || []).some(it => it.moduleNo.startsWith(`${m.moduleNo}.`)))) &&
        !validationReport.errors.some(e => e.field.startsWith('modules') || e.field.startsWith('lectureScheduleItems'))
  );

  // Step 5 validation: Learning Resources
  const isStep5Complete = Boolean(
    course.courseType === 'PRACTICAL'
      ? (course.referenceBooks || []).length >= 1 &&
        (course.referenceBooks || []).length <= 6 &&
        (course.referenceBooks || []).every(rb => (rb.title || '').trim().length > 0 && (rb.authors || '').trim().length > 0 && Boolean(rb.year)) &&
        ((course.textBooks || []).length === 0 || ((course.textBooks || []).length <= 2 && (course.textBooks || []).every(tb => (tb.title || '').trim().length > 0 && (tb.authors || '').trim().length > 0 && Boolean(tb.year)))) &&
        !validationReport.errors.some(e => e.field.startsWith('textBooks') || e.field.startsWith('referenceBooks'))
      : (course.textBooks || []).length >= 1 &&
        (course.textBooks || []).length <= 2 &&
        (course.textBooks || []).every(tb => (tb.title || '').trim().length > 0 && (tb.authors || '').trim().length > 0 && Boolean(tb.year)) &&
        (course.referenceBooks || []).length >= 3 &&
        (course.referenceBooks || []).length <= 6 &&
        (course.referenceBooks || []).every(rb => (rb.title || '').trim().length > 0 && (rb.authors || '').trim().length > 0 && Boolean(rb.year)) &&
        !validationReport.errors.some(e => e.field.startsWith('textBooks') || e.field.startsWith('referenceBooks'))
  );

  // Step 6 validation: Course Designers
  const isStep6Complete = Boolean(
    (course.designers || []).length > 0 &&
    (course.designers || []).every(d => (d.name || '').trim().length > 0 && (d.email || '').trim().length > 0) &&
    !validationReport.errors.some(e => e.field.startsWith('designers'))
  );

  const isStepComplete = (stepIdx: number): boolean => {
    const sid = steps[stepIdx]?.id ?? '';
    switch (sid) {
      case 'identity':   return isStep0Complete;
      case 'preamble':   return isStep1Complete;
      case 'cos':        return isStep2Complete;
      case 'assessment': return isStep3Complete;
      case 'syllabus':   return isStep4Complete;
      case 'resources':  return isStep5Complete;
      case 'designers':  return isStep6Complete;
      default: return true;
    }
  };

  const getStepIncompleteMessage = (stepIdx: number): string => {
    const sid = steps[stepIdx]?.id ?? '';
    switch (sid) {
      case 'identity': return 'Complete all required course code & credits details to continue';
      case 'preamble': return 'Complete preamble (max 90 words) to continue';
      case 'cos': {
        const numCr = Number(course.credits) || 0;
        const validCount = (course.courseOutcomes || []).filter(co => Boolean((co.statement || '').trim())).length;
        if (course.courseType === 'PRACTICAL') {
          const req = numCr <= 1 ? 3 : 4;
          return `Practical (${numCr || 1} credit${numCr === 1 ? '' : 's'}) requires at least ${req} Course Outcomes with statements to continue (currently ${validCount}/${req})`;
        }
        const req = numCr < 3 && numCr > 0 ? (numCr === 1 ? 3 : 4) : 6;
        return `Theory (${numCr || 3} credits) requires minimum ${req} Course Outcomes with statements to continue (currently ${validCount}/${req})`;
      }
      case 'assessment': return 'Complete assessment marks distribution (each component must total 100%) to continue';
      case 'syllabus': {
        if (course.courseType === 'PRACTICAL') {
          const exps = course.experiments || [];
          if (exps.length === 0) return 'Add at least one laboratory experiment to continue';
          const emptyExp = exps.find(e => !(e.name || '').trim());
          if (emptyExp) return `Experiment ${emptyExp.slNo || 1} title is missing - enter a title to continue`;
          const expErrs = validationReport.errors.filter(e => e.field.startsWith('experiments'));
          if (expErrs.length > 0) return `${expErrs[0].message} (${expErrs[0].fixHint || 'Map all COs to continue'})`;
          return 'Complete laboratory experiments to continue';
        }

        const mods = course.modules || [];
        if (mods.length === 0) {
          return 'Add at least one Syllabus Module (Module Title & Topics) in the section above the Lecture Schedule to continue';
        }
        const emptyTopicMod = mods.find(m => !(m.mainTopic || '').trim());
        if (emptyTopicMod) {
          return `Module ${emptyTopicMod.moduleNo || 1}: Title is missing - scroll up and enter a title to continue`;
        }
        const emptySubtopicsMod = mods.find(m => !(m.subtopics || []).some(s => s.trim()));
        if (emptySubtopicsMod) {
          return `Module ${emptySubtopicsMod.moduleNo || 1}: Topics are missing - scroll up and enter topics to continue`;
        }

        const scheduleErrors = validationReport.errors.filter(e => e.field.startsWith('lectureScheduleItems'));
        if (scheduleErrors.length > 0) {
          const rowErrs = scheduleErrors.filter(e => e.id?.includes('B9_SCHEDULE_ROW_PERIODS'));
          if (rowErrs.length > 0) {
            return `Some topics need hours (1 or 2): ${rowErrs.map(r => r.message.split(':')[0]).join(', ')}. Enter 1 or 2 hours to continue.`;
          }
          return `${scheduleErrors[0].message}`;
        }

        if (course.courseType === 'TCP') {
          const exps = course.experiments || [];
          if (exps.length === 0) return 'Add at least one laboratory experiment below to continue';
          const emptyExp = exps.find(e => !(e.name || '').trim());
          if (emptyExp) return `Experiment ${emptyExp.slNo || 1} title is missing - enter a title to continue`;
          const expErrs = validationReport.errors.filter(e => e.field.startsWith('experiments'));
          if (expErrs.length > 0) return `${expErrs[0].message}`;
        }

        return 'Complete all syllabus modules & topics to continue';
      }
      case 'resources': {
        const isLab = course.courseType === 'PRACTICAL';
        const tbs = course.textBooks || [];
        const rbs = course.referenceBooks || [];

        // Check textbooks for Theory
        if (!isLab) {
          if (tbs.length === 0) return 'Add at least 1 Text Book (1–2 required) to continue';
          if (tbs.length > 2) return `A course can have at most 2 Text Books (currently ${tbs.length})`;
        } else {
          if (tbs.length > 2) return `A laboratory course can have at most 2 Text Books (currently ${tbs.length})`;
        }
        for (let i = 0; i < tbs.length; i++) {
          const b = tbs[i];
          if (!b.title?.trim()) return `Text Book ${i + 1} title is missing - enter title to continue`;
          if (!b.authors?.trim()) return `Text Book ${i + 1} author is missing - enter author name(s) to continue`;
          if (!b.year) return `Text Book ${i + 1} publication year is missing - enter year to continue`;
        }

        // Check reference books
        if (isLab) {
          if (rbs.length === 0) return 'Add at least 1 Reference Book or Lab Manual to continue';
          if (rbs.length > 6) return `A laboratory course can have at most 6 Reference Books (currently ${rbs.length})`;
        } else {
          if (rbs.length < 3) return `Add at least 3 Reference Books (currently ${rbs.length}/3) to continue`;
          if (rbs.length > 6) return `A course can have at most 6 Reference Books (currently ${rbs.length})`;
        }
        for (let i = 0; i < rbs.length; i++) {
          const b = rbs[i];
          if (!b.title?.trim()) return `Reference Book ${i + 1} title is missing - enter title to continue`;
          if (!b.authors?.trim()) return `Reference Book ${i + 1} author is missing - enter author name(s) to continue`;
          if (!b.year) return `Reference Book ${i + 1} publication year is missing - enter year to continue`;
        }

        const resErrs = validationReport.errors.filter(e => e.field.startsWith('textBooks') || e.field.startsWith('referenceBooks'));
        if (resErrs.length > 0) return `${resErrs[0].message} (${resErrs[0].fixHint || 'Correct learning resource'})`;

        return 'Add required textbook(s) & learning resources to continue';
      }
      case 'designers': return 'Add course designer details (name and email) to continue';
      default: return 'Please complete required details to continue';
    }
  };

  // Debounced auto-save (Local + Backend)
  const saveTimeoutRef = useRef<any>(null);
  const isCreatingDraftRef = useRef<boolean>(false);

  const canAutoCreateDraft = Boolean(
    course.courseName &&
    course.courseName.trim().length >= 3 &&
    course.programmeCode &&
    course.categoryLetter &&
    course.uniqueLetter
  );

  useEffect(() => {
    if (!isAutoSaveEnabled) return;

    // Cache local draft copy in localStorage
    try {
      const localKey = course._id ? `draft_course_${course._id}` : `draft_new_${course.courseType}`;
      localStorage.setItem(localKey, JSON.stringify(course));
    } catch (e) {
      // ignore
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      if (course._id) {
        try {
          setIsSaving(true);
          const updated = await api.updateCourse(course._id, course);
          setLastSaved(new Date());
          setIsSaving(false);
        } catch (e) {
          setIsSaving(false);
        }
      } else if ((isStep0Complete || canAutoCreateDraft) && course.courseName?.trim()) {
        if (isCreatingDraftRef.current) return;
        try {
          isCreatingDraftRef.current = true;
          setIsSaving(true);
          const saved = await api.createCourse(course);
          setCourse(saved);
          setLastSaved(new Date());
          setIsSaving(false);
          isCreatingDraftRef.current = false;
          navigate(`/courses/${saved._id}`, { replace: true });
        } catch (e) {
          setIsSaving(false);
          isCreatingDraftRef.current = false;
        }
      }
    }, 2500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [course, isAutoSaveEnabled, isStep0Complete, canAutoCreateDraft]);

  // Handle Initial Draft Creation
  const handleSaveDraft = async (): Promise<Course | null> => {
    try {
      setIsSaving(true);
      let savedCourse: Course;
      if (course._id) {
        savedCourse = await api.updateCourse(course._id, course);
      } else {
        savedCourse = await api.createCourse(course);
        navigate(`/courses/${savedCourse._id}`, { replace: true });
      }
      setCourse(savedCourse);
      setLastSaved(new Date());
      return savedCourse;
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Submit for Review
  const handleSubmitForReview = async () => {
    let targetCourse = course;
    if (!targetCourse._id) {
      const saved = await handleSaveDraft();
      if (!saved || !saved._id) return;
      targetCourse = saved;
    }

    try {
      setIsSaving(true);
      const res = await api.submitCourse(targetCourse._id!);
      setCourse(res.course);
      setSubmitSuccess('Syllabus submitted successfully to Department Review Queue (HoD)!');
      alert('Syllabus submitted successfully to the HoD review queue!');
    } catch (err: any) {
      alert(`Submission blocked: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Clone Revision
  const handleRevise = async () => {
    if (!course._id) return;
    try {
      const res = await api.reviseCourse(course._id);
      navigate(`/courses/${res.course._id}`);
    } catch (err: any) {
      alert(`Revision error: ${err.message}`);
    }
  };

  // Update field helpers
  const updateField = (field: keyof Course | 'categoryTable3', value: any) => {
    // Mark field as touched when user changes it
    setTouchedFields(prev => new Set(prev).add(field as string));
    setCourse(prev => {
      const updated = { ...prev, [field]: value };

      // For theory courses, practical is strictly 0
      if (updated.courseType === 'THEORY') {
        updated.P = 0;
      } else if (updated.courseType === 'PRACTICAL') {
        updated.L = 0;
        updated.T = 0;
      }

      // Recalculate courseCode
      if (['regulationCode', 'programmeCode', 'categoryLetter', 'uniqueLetter', 'version'].includes(field)) {
        if (field === 'programmeCode') {
          const matchedDept = getDepartmentForProgramme(value);
          if (matchedDept) {
            updated.department = matchedDept;
          }
        }
        updated.courseCode = computeCourseCode({
          regulationCode: updated.regulationCode,
          programmeCode: updated.programmeCode,
          categoryLetter: updated.categoryLetter,
          uniqueLetter: updated.uniqueLetter,
          version: updated.version,
        });
      }

      // Handle Table 3 category selection
      if (field === 'categoryTable3') {
        const cat = COURSE_CATEGORIES_TABLE_3.find(c => c.name === value);
        if (cat) {
          updated.categoryAbbr = cat.defaultAbbr as any;
          if (!cat.codes.includes(updated.categoryLetter)) {
            updated.categoryLetter = cat.codes[0];
          }
          updated.courseCode = computeCourseCode({
            regulationCode: updated.regulationCode,
            programmeCode: updated.programmeCode,
            categoryLetter: updated.categoryLetter,
            uniqueLetter: updated.uniqueLetter,
            version: updated.version,
          });
        }
      }

      // Handle category selection: when category abbreviation changes (e.g. PCC, PEC, BSC, etc.)
      if (field === 'categoryAbbr') {
        updated.categoryAbbr = value as any;
        const matchingCodes = CATEGORY_CODES.filter(c => c.defaultAbbr === value);
        // If current categoryLetter doesn't belong to this newly selected category, default to its first designated letter
        if (matchingCodes.length > 0 && !matchingCodes.some(c => c.code === updated.categoryLetter)) {
          updated.categoryLetter = matchingCodes[0].code;
        }
        updated.courseCode = computeCourseCode({
          regulationCode: updated.regulationCode,
          programmeCode: updated.programmeCode,
          categoryLetter: updated.categoryLetter,
          uniqueLetter: updated.uniqueLetter,
          version: updated.version,
        });
      }

      // Auto-suggest category abbreviation when category letter changes
      if (field === 'categoryLetter') {
        updated.categoryLetter = value;
        const cat = CATEGORY_CODES.find(c => c.code === value);
        if (cat) {
          updated.categoryAbbr = cat.defaultAbbr as any;
        }
        updated.courseCode = computeCourseCode({
          regulationCode: updated.regulationCode,
          programmeCode: updated.programmeCode,
          categoryLetter: updated.categoryLetter,
          uniqueLetter: updated.uniqueLetter,
          version: updated.version,
        });
      }

      // Recalculate credits
      if (['L', 'T', 'P'].includes(field)) {
        if (updated.courseType === 'PRACTICAL') {
          updated.L = 0;
          updated.T = 0;
          updated.modules = [];
          updated.lectureScheduleItems = [];
        }
        if (updated.courseType === 'THEORY') {
          updated.P = 0;
        }
        const effL = Number(updated.L) || 0;
        const effT = Number(updated.T) || 0;
        const effP = Number(updated.P) || 0;
        updated.credits = computeCredits(effL, effT, effP, updated.courseType);
      }

      // Auto-sync semesterType
      if (field === 'semester') {
        const s = Number(value) || 1;
        updated.semesterType = s % 2 === 0 ? 'EVEN' : 'ODD';
      }

      // Live sync syllabus modules to lectureScheduleItems
      if (field === 'modules') {
        updated.modules = value;
        if (updated.courseType === 'THEORY' || updated.courseType === 'TCP') {
          updated.lectureScheduleItems = syncModulesToSchedule(
            value,
            updated.lectureScheduleItems || [],
            updated.courseOutcomes || []
          );
        }
      }

      return updated;
    });
  };

  // Action verb selector: inserts or replaces the starting action verb of a CO outcome statement
  const handleSelectVerb = (verb: string, idx: number) => {
    const cos = course.courseOutcomes || [];
    const co = cos[idx];
    if (!co) return;

    const currentStatement = (co.statement || '').trimStart();
    const currentLevelVerbs = TPS_VERBS[co.tpsLevel] || [];
    const allTpsVerbs = Object.values(TPS_VERBS).flat();
    const recognizedVerbs = Array.from(new Set([...currentLevelVerbs, ...allTpsVerbs]));

    let newStatement = '';
    if (!currentStatement) {
      newStatement = `${verb} `;
    } else {
      // Find if statement currently begins with any recognized TPS verb
      const matchedExistingVerb = recognizedVerbs
        .slice()
        .sort((a, b) => b.length - a.length)
        .find(v => {
          const vLower = v.toLowerCase();
          const sLower = currentStatement.toLowerCase();
          return (
            sLower === vLower ||
            sLower.startsWith(vLower + ' ') ||
            sLower.startsWith(vLower + ',') ||
            sLower.startsWith(vLower + '-')
          );
        });

      if (matchedExistingVerb) {
        // Replace existing first verb
        const rest = currentStatement.slice(matchedExistingVerb.length).replace(/^[\s,\-]+/, '');
        newStatement = `${verb} ${rest}`;
      } else {
        // Prepend verb followed by a space
        newStatement = `${verb} ${currentStatement}`;
      }
    }

    const updated = [...cos];
    updated[idx] = { ...updated[idx], statement: newStatement };
    updateField('courseOutcomes', updated);
    touchField(`courseOutcomes.${idx}.statement`);
  };

  // Auto-fill Assessment Pattern table based on Course Outcomes
  const handleAutoFillAssessment = () => {
    const cos = course.courseOutcomes || [];
    if (cos.length === 0) {
      alert('Please add Course Outcomes in Step 3 first before auto-filling the assessment pattern.');
      return;
    }

    const n = cos.length;
    let weights = cos.map(c => Number(c.weightage) || 0);
    const totalW = weights.reduce((a, b) => a + b, 0);
    if (totalW !== 100) {
      weights = suggestCoWeightages(cos);
    }
    if (!weights || weights.length !== n || weights.reduce((a, b) => a + b, 0) !== 100) {
      const base = Math.floor(100 / n);
      weights = new Array(n).fill(base);
      weights[n - 1] += 100 - base * n;
    }

    if (course.courseType === 'PRACTICAL') {
      const distribute = (indices: number[], targetTotal: number) => {
        const col = new Array(n).fill(0);
        if (indices.length === 0) return col;
        const subW = indices.map(i => weights[i]);
        const sum = subW.reduce((a, b) => a + b, 0) || 1;
        let acc = 0;
        indices.forEach((idx, k) => {
          if (k === indices.length - 1) {
            col[idx] = targetTotal - acc;
          } else {
            const v = Math.round((weights[idx] / sum) * targetTotal);
            col[idx] = v;
            acc += v;
          }
        });
        return col;
      };

      const cogIndices: number[] = [];
      const affIndices: number[] = [];
      const psyIndices: number[] = [];

      cos.forEach((c, idx) => {
        const dom = getDomainForCourseOutcome(c);
        if (dom === 'Affective') affIndices.push(idx);
        else if (dom === 'Psychomotor') psyIndices.push(idx);
        else cogIndices.push(idx);
      });

      // Target distribution across all components (OCR CA, Model Test, Terminal Exam):
      // 60% Cognitive, 20% Affective, 20% Psychomotor
      const caCol = new Array(n).fill(0);
      const cogCa = distribute(cogIndices, 60);
      const affCa = distribute(affIndices, 20);
      const psyCa = distribute(psyIndices, 20);
      cogIndices.forEach(i => { caCol[i] = cogCa[i]; });
      affIndices.forEach(i => { caCol[i] = affCa[i]; });
      psyIndices.forEach(i => { caCol[i] = psyCa[i]; });

      const modelCol = new Array(n).fill(0);
      const cogModel = distribute(cogIndices, 60);
      const affModel = distribute(affIndices, 20);
      const psyModel = distribute(psyIndices, 20);
      cogIndices.forEach(i => { modelCol[i] = cogModel[i]; });
      affIndices.forEach(i => { modelCol[i] = affModel[i]; });
      psyIndices.forEach(i => { modelCol[i] = psyModel[i]; });

      const termCol = new Array(n).fill(0);
      const cogTerm = distribute(cogIndices, 60);
      const affTerm = distribute(affIndices, 20);
      const psyTerm = distribute(psyIndices, 20);
      cogIndices.forEach(i => { termCol[i] = cogTerm[i]; });
      affIndices.forEach(i => { termCol[i] = affTerm[i]; });
      psyIndices.forEach(i => { termCol[i] = psyTerm[i]; });

      const matrix = cos.map((c, i) => ({
        coNo: c.coNo,
        practicalCa: caCol[i],
        practicalModel: modelCol[i],
        terminalExam: termCol[i],
        tcpTerminal: termCol[i],
      }));
      updateField('assessmentMatrix', matrix);
      return;
    }

    if (course.courseType === 'TCP') {
      const mid = Math.max(1, Math.floor(n / 2));
      const distribute = (indices: number[]) => {
        const col = new Array(n).fill(0);
        const subW = indices.map(i => weights[i]);
        const sum = subW.reduce((a, b) => a + b, 0) || 1;
        let acc = 0;
        indices.forEach((idx, k) => {
          if (k === indices.length - 1) {
            col[idx] = 100 - acc;
          } else {
            const v = Math.round((weights[idx] / sum) * 100);
            col[idx] = v;
            acc += v;
          }
        });
        return col;
      };

      const t1Indices = Array.from({ length: mid }, (_, i) => i);
      const t2Indices = Array.from({ length: n - mid }, (_, i) => i + mid);
      const allIndices = Array.from({ length: n }, (_, i) => i);

      const t1 = distribute(t1Indices);
      const t2 = distribute(t2Indices);
      const ca = distribute(allIndices);
      const model = distribute(allIndices);
      const term = [...weights];
      term[term.length - 1] += 100 - term.reduce((a, b) => a + b, 0);

      const matrix = cos.map((c, i) => ({
        coNo: c.coNo,
        theoryCat1: t1[i],
        theoryCat2: t2[i],
        practicalCa: ca[i],
        practicalModel: model[i],
        tcpTerminal: term[i],
      }));
      updateField('assessmentMatrix', matrix);
      return;
    }

    // Default THEORY course type
    if (n === 1) {
      updateField('assessmentMatrix', [
        {
          coNo: cos[0].coNo,
          cat1: 100,
          assignment1: 100,
          cat2: 100,
          assignment2: 100,
          terminalExam: 100,
        },
      ]);
      return;
    }

    const mid = Math.max(1, Math.floor(n / 2));
    const distributeColumn = (indices: number[]) => {
      const col = new Array(n).fill(0);
      const subsetWeights = indices.map(i => weights[i]);
      const sumW = subsetWeights.reduce((a, b) => a + b, 0) || 1;
      let allocated = 0;
      indices.forEach((idx, k) => {
        if (k === indices.length - 1) {
          col[idx] = 100 - allocated;
        } else {
          const val = Math.round((weights[idx] / sumW) * 100);
          col[idx] = val;
          allocated += val;
        }
      });
      return col;
    };

    const cat1Indices = Array.from({ length: mid }, (_, i) => i);
    const assign1Indices = Array.from({ length: Math.min(n, mid + 1) }, (_, i) => i);
    const cat2Indices = Array.from({ length: n - mid }, (_, i) => i + mid);
    const assign2Indices = Array.from({ length: n - Math.max(0, mid > 2 ? mid : mid - 1) }, (_, i) => i + Math.max(0, mid > 2 ? mid : mid - 1));

    const cat1Col = distributeColumn(cat1Indices);
    const assign1Col = distributeColumn(assign1Indices);
    const cat2Col = distributeColumn(cat2Indices);
    const assign2Col = distributeColumn(assign2Indices);
    const terminalCol = [...weights];
    const tDiff = 100 - terminalCol.reduce((a, b) => a + b, 0);
    terminalCol[terminalCol.length - 1] += tDiff;

    const matrix = cos.map((c, i) => ({
      coNo: c.coNo,
      cat1: cat1Col[i],
      assignment1: assign1Col[i],
      cat2: cat2Col[i],
      assignment2: assign2Col[i],
      terminalExam: terminalCol[i],
    }));

    updateField('assessmentMatrix', matrix);
  };

  // Reset Assessment Pattern table for manual entry
  const handleResetAssessment = () => {
    const cos = course.courseOutcomes || [];
    if (course.courseType === 'PRACTICAL') {
      const resetMatrix = cos.map(c => ({
        coNo: c.coNo,
        practicalCa: 0,
        practicalModel: 0,
        terminalExam: 0,
        tcpTerminal: 0,
      }));
      updateField('assessmentMatrix', resetMatrix);
    } else if (course.courseType === 'TCP') {
      const resetMatrix = cos.map(c => ({
        coNo: c.coNo,
        theoryCat1: 0,
        theoryCat2: 0,
        practicalCa: 0,
        practicalModel: 0,
        tcpTerminal: 0,
      }));
      updateField('assessmentMatrix', resetMatrix);
    } else {
      const resetMatrix = cos.map(c => ({
        coNo: c.coNo,
        cat1: 0,
        assignment1: 0,
        cat2: 0,
        assignment2: 0,
        terminalExam: 0,
      }));
      updateField('assessmentMatrix', resetMatrix);
    }
  };

  // Stepper definition — Learning Resources step is skipped for PRACTICAL courses
  const isPracticalCourse = course.courseType === 'PRACTICAL';
  const steps = [
    { id: 'identity',   title: '1. Course Code & Credits',      desc: 'Code, title, L-T-P & credits' },
    { id: 'preamble',   title: '2. Preamble & Prerequisites',   desc: 'Course context & prior courses' },
    { id: 'cos',        title: '3. Course Outcomes',            desc: 'TPS taxonomy & weightages' },
    { id: 'assessment', title: '4. Assessment Pattern',         desc: 'Continuous & Terminal exam' },
    {
      id: 'syllabus',
      title: isPracticalCourse ? '5. List of Experiments with CO Mapping' : (course.courseType === 'TCP' ? '5. Syllabus & Experiments' : '5. Syllabus & Content'),
      desc:  isPracticalCourse ? 'Experiments with CO Mapping' : (course.courseType === 'TCP' ? 'Modules, Schedule & Experiments' : 'Modules & Schedule'),
    },
    ...(isPracticalCourse ? [] : [{ id: 'resources', title: '6. Learning Resources', desc: 'Text & reference books' }]),
    { id: 'designers', title: isPracticalCourse ? '6. Course Designers' : '7. Course Designers', desc: 'Faculty details & emails' },
    { id: 'review',    title: isPracticalCourse ? '7. Review & Submit'  : '8. Review & Submit',  desc: '17-point compliance audit' },
  ];

  // Derive current step id so rendering is index-independent
  const activeStepId = steps[currentStep]?.id ?? '';

  // Auto-populate lecture schedule items if empty but modules exist, or derive modules if schedule exists
  useEffect(() => {
    if (activeStepId === 'syllabus' && (course.courseType === 'THEORY' || course.courseType === 'TCP')) {
      if (course.modules && course.modules.length > 0 && (!course.lectureScheduleItems || course.lectureScheduleItems.length === 0)) {
        const synced = syncModulesToSchedule(course.modules, [], course.courseOutcomes || []);
        if (synced.length > 0) {
          updateField('lectureScheduleItems', synced);
        }
      } else if ((!course.modules || course.modules.length === 0) && course.lectureScheduleItems && course.lectureScheduleItems.length > 0) {
        // Auto-generate modules from schedule items if user entered topics in the schedule table first
        const moduleMap: Record<number, { mainTopic: string; subtopics: string[] }> = {};
        course.lectureScheduleItems.forEach(item => {
          const parts = (item.moduleNo || '1').split('.');
          const mNum = parseInt(parts[0], 10) || 1;
          if (!moduleMap[mNum]) {
            const headerRow = course.lectureScheduleItems?.find(h => h.moduleNo === String(mNum));
            moduleMap[mNum] = { mainTopic: headerRow?.topic || `Module ${mNum}`, subtopics: [] };
          }
          const cleanTopic = item.topic.replace(/^[^:]+:\s*/, '').trim();
          if (cleanTopic && parts.length > 1 && !moduleMap[mNum].subtopics.includes(cleanTopic)) {
            moduleMap[mNum].subtopics.push(cleanTopic);
          }
        });
        const derived: SyllabusModule[] = Object.keys(moduleMap)
          .map(Number)
          .sort((a, b) => a - b)
          .map(mNum => ({
            moduleNo: mNum,
            mainTopic: moduleMap[mNum].mainTopic || `Module ${mNum}`,
            subtopics: moduleMap[mNum].subtopics.length > 0 ? moduleMap[mNum].subtopics : [moduleMap[mNum].mainTopic || `Module ${mNum}`],
          }));
        if (derived.length > 0) {
          updateField('modules', derived);
        }
      }
    }
  }, [activeStepId, course.modules, course.lectureScheduleItems]);

  // Inline highlighted error component directly below the field
  const InlineFieldError: React.FC<{ field: string; fixHint?: boolean }> = ({ field, fixHint = true }) => {
    const errs = getFieldErrors(field);
    if (errs.length === 0) return null;
    return (
      <div className="mt-1.5 p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2 animate-in fade-in duration-150">
        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-0.5">
          {errs.map(err => (
            <div key={err.id}>
              <span className="font-semibold">{err.message}</span>
              {fixHint && err.fixHint && (
                <span className="block text-[11px] text-red-600 mt-0.5">{err.fixHint}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Inline verified success badge component
  const InlineFieldSuccess: React.FC<{ message?: string }> = ({ message = 'Verified & compliant' }) => (
    <div className="mt-1 text-xs text-emerald-600 font-medium flex items-center space-x-1 animate-in fade-in duration-150">
      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );

  // 1. Load Error State if document failed to retrieve

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-rose-200 rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 flex items-center justify-center text-[#7B1113]">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Unable to Open Course</h2>
            <p className="text-xs text-rose-600 mt-1 leading-relaxed">{loadError}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 px-4 bg-[#7B1113] hover:bg-[#5E0D0E] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 flex flex-col">
      {/* Minimal Sleek Header Bar - Compact single row, no redundant details */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-6 lg:px-8 py-1.5 sticky top-[46px] z-30 flex items-center justify-between shadow-xs h-11 print:hidden">
        <div className="flex items-center space-x-2.5 min-w-0">
          <button
            onClick={() => setIsSidebarOpen(prev => !prev)}
            aria-label="Open sections menu"
            className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
          <button
            onClick={handleBack}
            className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title={currentStep > 0 ? 'Previous Section' : 'Back to Courses'}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-2 min-w-0">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 flex-shrink-0">
              {displaySubjectCode}
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 flex items-center space-x-1.5 shadow-2xs ${courseTypeInfo.badgeClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${courseTypeInfo.dotClass}`} />
              <span>{courseTypeInfo.label}</span>
            </span>
            <span className="font-bold text-slate-900 text-sm truncate max-w-[180px] sm:max-w-xs">
              {course.courseName?.trim() ? course.courseName : '—'}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded font-semibold flex-shrink-0 ${
                course.status === 'APPROVED' || course.status === 'FINALIZED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : course.status === 'SUBMITTED'
                  ? 'bg-amber-100 text-amber-800'
                  : course.status === 'RETURNED'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {course.status}
            </span>
            {/* Circular loading spinner shown while fetching existing course */}
            {isLoadingCourse && (
              <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[#7B1113] text-xs font-medium flex-shrink-0 animate-pulse" title="Loading course...">
                <Loader2 className="w-3.5 h-3.5 text-[#7B1113] animate-spin flex-shrink-0" />
                <span className="text-[11px] font-semibold">Loading course...</span>
              </span>
            )}
          </div>
        </div>

        {/* Tab & Action Bar */}
        <div className="flex items-center space-x-2.5 flex-shrink-0">


          {/* Guidelines Reference Button — type-specific, shown in header */}
          {course.courseType === 'THEORY' && (
            <a
              href="https://www.tce.edu/sites/default/files/PDF/ACADEMIC-REGULATIONS-2026-BE-BTech-Programmes-Full-Time.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 text-[11px] font-bold transition-colors shadow-xs flex-shrink-0"
              title="Academic Regulations 2026 — B.E / B.Tech Programmes (Full-Time)"
            >
              <span>📄</span>
              <span>Regulations</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          )}
          {(course.courseType === 'PRACTICAL' || course.courseType === 'TCP') && (
            <button
              type="button"
              onClick={() => setGuidelinesDocOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold transition-colors shadow-xs flex-shrink-0 cursor-pointer"
              title={course.courseType === 'PRACTICAL' ? '002 — Guidelines for Lab Course Design' : '003 — Guidelines for TCP Course Design'}
            >
              <span>📋</span>
              <span>Guidelines</span>
              <FileText className="w-3 h-3 opacity-70" />
            </button>
          )}

          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('wizard')}
              className={`px-2.5 py-1 rounded-md flex items-center space-x-1 transition-all ${
                activeTab === 'wizard' ? 'bg-[#7B1113] text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Form Wizard</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-2.5 py-1 rounded-md flex items-center space-x-1 transition-all ${
                activeTab === 'preview' ? 'bg-[#7B1113] text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Document Preview</span>
            </button>
          </div>

          {/* Auto Save Option */}
          <label className="flex items-center space-x-1.5 cursor-pointer bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors select-none">
            <input
              type="checkbox"
              checked={isAutoSaveEnabled}
              onChange={e => toggleAutoSave(e.target.checked)}
              className="rounded text-[#7B1113] focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5 cursor-pointer"
            />
            <span className="font-bold text-slate-800">Auto-save</span>
            {isAutoSaveEnabled && (
              <span className="hidden sm:inline-flex items-center space-x-1 text-[10px] font-normal ml-1">
                {isSaving ? (
                  <span className="flex items-center text-amber-600 animate-pulse font-medium">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin mr-0.5" /> Saving...
                  </span>
                ) : lastSaved ? (
                  <span className="text-emerald-700 font-medium" title={`Last saved at ${lastSaved.toLocaleTimeString()}`}>
                    • Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : (
                  <span className="text-emerald-600 font-medium">• ON</span>
                )}
              </span>
            )}
          </label>

          {(course.status === 'APPROVED' || course.status === 'FINALIZED') && (
            <button
              onClick={handleRevise}
              className="px-2.5 py-1 rounded-md bg-[#0F2942] hover:bg-[#091A2A] text-[#E2BF53] text-xs font-semibold shadow-xs flex items-center space-x-1"
            >
              <Copy className="w-3 h-3" />
              <span>Clone (v{course.version + 1})</span>
            </button>
          )}
        </div>
      </div>

      {/* Guidelines Doc Viewer Modal — for PRACTICAL and TCP courses */}
      {guidelinesDocOpen && (course.courseType === 'PRACTICAL' || course.courseType === 'TCP') && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setGuidelinesDocOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-base">📋</span>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {course.courseType === 'PRACTICAL'
                      ? '002 — Guidelines for Lab Course Design'
                      : '003 — Guidelines for Theory cum Practical Course Design'}
                  </p>
                  <p className="text-[11px] text-slate-500">Thiagarajar College of Engineering — Reference Document</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={course.courseType === 'PRACTICAL'
                    ? '/docs/002_Guidelines_for_Lab_Course_design.docx'
                    : '/docs/003_Guidelines_for_TCP_Course_Design.docx'}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors"
                >
                  <Save className="w-3 h-3" /> Download
                </a>
                <button
                  type="button"
                  onClick={() => setGuidelinesDocOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Iframe: Microsoft Office Online viewer for the .docx */}
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=https://tce-bos.vercel.app${course.courseType === 'PRACTICAL'
                ? '/docs/002_Guidelines_for_Lab_Course_design.docx'
                : '/docs/003_Guidelines_for_TCP_Course_Design.docx'}`}
              className="flex-1 w-full border-0"
              title="Guidelines Document Viewer"
              allow="fullscreen"
            />
          </div>
        </div>
      )}

      {submitSuccess && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-sm text-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{submitSuccess}</span>
          </div>
          <button onClick={() => setSubmitSuccess(null)} className="text-xs font-bold text-emerald-700">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace - Full width to fit all screen sizes without side margins */}
      <div className="w-full px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex flex-col">
        {activeTab === 'preview' ? (
          <div>
            <DocumentPreview course={course} />
          </div>
        ) : (
          <>
            {/* Drawer Backdrop */}
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-slate-900/20 z-40 transition-opacity" 
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden="true"
              />
            )}

            {/* Left Stepper List (Collapsible Drawer) */}
            <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-[280px] bg-white shadow-2xl flex flex-col`}>
              <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between sticky top-0 z-10">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-[#800020] block">
                    Syllabus Sections
                  </span>
                  <span className="text-[10px] text-slate-500">Regulation 2026 Navigation</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {steps.map((st, idx) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      if (idx > currentStep && !isStepComplete(currentStep)) {
                        alert(`Please complete all required details in Step ${currentStep + 1} (${steps[currentStep].title}) before proceeding.`);
                        return;
                      }
                      setCurrentStep(idx);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-3 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                      currentStep === idx
                        ? 'bg-[#800020]/10 text-[#800020] font-bold border-l-4 border-[#800020] shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div>
                      <div>{st.title}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-1">{st.desc}</div>
                    </div>
                    {/* Status indicator */}
                    <div className="ml-2 flex-shrink-0">
                      {idx < currentStep ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Center Wizard Form Container — Content hugs natural height without bottom void */}
            <div className="w-full bg-white border-2 border-[#7B1113] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-start">
              <div>
                {/* ============================================================== */}
                {/* PERSISTENT TCE INSTITUTIONAL COURSE HEADER (OFFICIAL TABLE)   */}
                {/* ============================================================== */}
                <div className="mb-4">
                  {/* Official 3-Column Header Table matching TCE Standard */}
                  <div className="border-2 border-slate-900 bg-white shadow-xs overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-12 border-collapse">
                      {/* Column 1: Course Code */}
                      <div
                        onClick={() => setCurrentStep(0)}
                        className="md:col-span-3 p-3.5 sm:p-4 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-900 bg-white cursor-pointer hover:bg-slate-50 transition-colors group"
                        title="Click to configure Course Code in Step 1"
                      >
                        <span className="font-mono text-xl sm:text-2xl font-black text-slate-950 tracking-wider group-hover:text-[#7B1113] transition-colors">
                          {displaySubjectCode}
                        </span>
                      </div>

                      {/* Column 2: Course Title */}
                      <div
                        onClick={() => setCurrentStep(0)}
                        className="md:col-span-5 p-3.5 sm:p-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-900 bg-white cursor-pointer hover:bg-slate-50 transition-colors group"
                        title="Click to edit Course Title in Step 1"
                      >
                        <span className="font-bold text-sm sm:text-base md:text-lg text-slate-950 uppercase tracking-wide leading-tight group-hover:text-[#7B1113] transition-colors">
                          {course.courseName?.trim() ? (
                            course.courseName.toUpperCase()
                          ) : (
                            <span className="text-slate-400 font-bold select-none">
                              —
                            </span>
                          )}
                        </span>
                        {course.courseSubtitle && course.courseSubtitle.trim() && (
                          <span className="text-xs sm:text-sm font-normal normal-case text-slate-600 mt-1 tracking-normal group-hover:text-[#7B1113] transition-colors">
                            {course.courseSubtitle.trim().startsWith('(') && course.courseSubtitle.trim().endsWith(')')
                              ? course.courseSubtitle.trim()
                              : `(${course.courseSubtitle.trim()})`}
                          </span>
                        )}
                      </div>

                      {/* Column 3: Category, LTP & Credits Table */}
                      <div
                        onClick={() => setCurrentStep(0)}
                        className={`md:col-span-4 grid ${course.courseType === 'TCP' ? 'grid-cols-6' : 'grid-cols-5'} border-collapse text-center cursor-pointer hover:bg-slate-50 transition-colors`}
                        title="Click to edit Category, L-T-P and Credits"
                      >
                        {/* Header Row */}
                        <div className="p-2 text-xs font-semibold text-slate-800 border-b border-r border-slate-900 bg-white">
                          Category
                        </div>
                        <div className="p-2 text-xs font-semibold text-slate-800 border-b border-r border-slate-900 bg-white">
                          L
                        </div>
                        <div className="p-2 text-xs font-semibold text-slate-800 border-b border-r border-slate-900 bg-white">
                          T
                        </div>
                        <div className="p-2 text-xs font-semibold text-slate-800 border-b border-r border-slate-900 bg-white">
                          P
                        </div>
                        <div className={`p-2 text-xs font-semibold text-slate-800 border-b ${course.courseType === 'TCP' ? 'border-r' : ''} border-slate-900 bg-white`}>
                          Credits
                        </div>
                        {course.courseType === 'TCP' && (
                          <div className="p-2 text-xs font-semibold text-slate-800 border-b border-slate-900 bg-white">
                            TE Type
                          </div>
                        )}

                        {/* Value Row */}
                        <div className="p-2.5 text-xs sm:text-sm font-bold text-slate-900 border-r border-slate-900 flex items-center justify-center">
                          {course.categoryAbbr ? (
                            course.categoryAbbr
                          ) : (
                            <span className="text-slate-400 font-bold select-none">—</span>
                          )}
                        </div>
                        <div className="p-2.5 text-xs sm:text-sm font-bold text-slate-900 border-r border-slate-900 flex items-center justify-center">
                          {course.L !== undefined && course.L !== null && course.L !== ('' as any) ? (
                            course.L
                          ) : (
                            <span className="text-slate-400 font-bold select-none">—</span>
                          )}
                        </div>
                        <div className="p-2.5 text-xs sm:text-sm font-bold text-slate-900 border-r border-slate-900 flex items-center justify-center">
                          {course.T !== undefined && course.T !== null && course.T !== ('' as any) ? (
                            course.T
                          ) : (
                            <span className="text-slate-400 font-bold select-none">—</span>
                          )}
                        </div>
                        <div className="p-2.5 text-xs sm:text-sm font-bold text-slate-900 border-r border-slate-900 flex items-center justify-center">
                          {course.P !== undefined && course.P !== null && course.P !== ('' as any) ? (
                            course.P
                          ) : (
                            <span className="text-slate-400 font-bold select-none">—</span>
                          )}
                        </div>
                        <div className={`p-2.5 text-xs sm:text-sm font-black text-slate-950 flex items-center justify-center ${course.courseType === 'TCP' ? 'border-r border-slate-900' : ''}`}>
                          {course.credits !== undefined && course.credits !== null && course.credits !== ('' as any) && Number(course.credits) > 0 ? (
                            course.credits
                          ) : (
                            <span className="text-slate-400 font-bold select-none">—</span>
                          )}
                        </div>
                        {course.courseType === 'TCP' && (
                          <div className="p-2.5 text-xs sm:text-sm font-black text-[#7B1113] flex items-center justify-center">
                            {getDisplayTeType(course.teExamType)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 1: Course Code & Credits */}
                {activeStepId === 'identity' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h2 className="text-xl font-bold text-slate-900">Course Code &amp; Credits</h2>
                    </div>

                    {/* Course Code 7-Component Direct Selector: Differentiated Colors & Crisp Borders */}
                    <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-xs">
                      <div className="flex flex-wrap items-center gap-2.5 text-center text-xs">
                        {/* 1. RR: Regulation — Maroon Institutional Theme */}
                        <div className="p-2 bg-rose-50/70 rounded-xl border-2 border-[#7B1113]/30 hover:border-[#7B1113] transition-all flex flex-col items-center justify-center min-w-[62px] h-[74px] shadow-2xs">
                          <span className="font-black text-xl text-[#7B1113] block leading-tight" title="Institutional Regulation Code">
                            {course.regulationCode || adminRegulation.code}
                          </span>
                          <span className="text-[10px] text-[#7B1113] font-bold mt-1 tracking-wide">Regulation</span>
                        </div>

                        {/* 2. Dept: Department Selector — Blue / Navy Theme */}
                        <div className={`p-2 bg-sky-50/50 rounded-xl border-2 transition-all flex flex-col justify-between flex-1 min-w-[150px] h-[74px] shadow-2xs ${
                          !(course.department || getDepartmentForProgramme(course.programmeCode))
                            ? 'border-amber-400 ring-2 ring-amber-200/50'
                            : 'border-sky-300 hover:border-sky-500'
                        }`}>
                          <div className="w-full flex-1 flex items-center justify-center">
                            <select
                              value={course.department || getDepartmentForProgramme(course.programmeCode) || ''}
                              onChange={e => handleDepartmentChange(e.target.value)}
                              className="w-full text-center font-bold text-xs text-sky-950 bg-transparent border-0 focus:ring-0 rounded cursor-pointer p-0"
                              title="Department"
                            >
                              <option value="" disabled>Department</option>
                              {DEPARTMENT_OPTIONS.map(d => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>
                          </div>
                          <span className="text-[10px] text-sky-800 font-bold block tracking-wide">Department</span>
                        </div>

                        {/* 3. AA: Programme Code — Indigo Theme */}
                        <div className={`p-2 rounded-xl border-2 transition-all flex flex-col justify-between flex-1 min-w-[150px] h-[74px] shadow-2xs ${
                          !(course.department || course.programmeCode)
                            ? 'bg-slate-50 border-slate-300 opacity-60'
                            : 'bg-indigo-50/50 border-indigo-300 hover:border-indigo-500'
                        }`}>
                          <div className="w-full flex-1 flex items-center justify-center">
                            <select
                              value={course.programmeCode || ''}
                              onChange={e => updateField('programmeCode', e.target.value)}
                              disabled={!(course.department || course.programmeCode)}
                              className="w-full text-center font-bold text-xs text-indigo-950 bg-transparent border-0 focus:ring-0 rounded cursor-pointer p-0 disabled:cursor-not-allowed"
                              title="Programme"
                            >
                              <option value="" disabled>{(course.department || course.programmeCode) ? 'Programme' : 'Pick Dept First'}</option>
                              {availableProgrammeCodes.map(p => (
                                <option key={p.code} value={p.code}>
                                  {p.code} — {p.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <span className="text-[10px] text-indigo-800 font-bold block tracking-wide">Programme</span>
                        </div>

                        {/* 4. Course Category (Table 3) — Emerald Green Theme */}
                        <div className={`p-2 bg-emerald-50/50 rounded-xl border-2 transition-all flex flex-col justify-between flex-1 min-w-[210px] sm:min-w-[260px] h-[74px] shadow-2xs ${
                          !activeTable3Category && !course.categoryAbbr
                            ? 'border-amber-400 ring-2 ring-amber-200/50'
                            : 'border-emerald-300 hover:border-emerald-500'
                        }`}>
                          <div className="w-full flex-1 flex items-center justify-center">
                            <select
                              value={activeTable3Category?.name || ''}
                              onChange={e => updateField('categoryTable3', e.target.value)}
                              className="w-full text-center font-bold text-xs text-emerald-950 bg-transparent border-0 focus:ring-0 rounded cursor-pointer p-0 truncate"
                              title="Course Category (Table 3)"
                            >
                              <option value="" disabled>Select Course Category (Table 3)</option>
                              {COURSE_CATEGORIES_TABLE_3.map(cat => (
                                <option key={cat.name} value={cat.name}>
                                  {cat.name} ({cat.codes.join(', ')})
                                </option>
                              ))}
                            </select>
                          </div>
                          <span className="text-[10px] text-emerald-800 font-bold block tracking-wide">
                            Category {activeTable3Category ? `(${activeTable3Category.defaultAbbr})` : ''}
                          </span>
                        </div>

                        {/* 5. C: Letter Code — Purple Theme */}
                        <div className={`p-2 rounded-xl border-2 transition-all flex flex-col justify-between min-w-[80px] h-[74px] shadow-2xs ${
                          !activeTable3Category && !course.categoryLetter
                            ? 'bg-slate-50 border-slate-300 opacity-60'
                            : 'bg-purple-50/50 border-purple-300 hover:border-purple-500'
                        }`}>
                          <div className="w-full flex-1 flex items-center justify-center">
                            <select
                              value={course.categoryLetter || ''}
                              onChange={e => updateField('categoryLetter', e.target.value)}
                              disabled={!activeTable3Category && !course.categoryLetter}
                              className="w-full text-center font-black text-base text-purple-950 bg-transparent border-0 focus:ring-0 rounded cursor-pointer p-0 disabled:cursor-not-allowed"
                              title="Category Letter"
                            >
                              <option value="" disabled>Letter</option>
                              {availableCategoryCodes.map(c => (
                                <option key={c.code} value={c.code}>
                                  {c.code}
                                </option>
                              ))}
                            </select>
                          </div>
                          <span className="text-[10px] text-purple-800 font-bold block tracking-wide">Letter</span>
                        </div>

                        {/* 6. U: Unique Letter Sequence — Amber / Orange Theme */}
                        <div className="p-2 bg-amber-50/60 rounded-xl border-2 border-amber-300 hover:border-amber-500 transition-all flex flex-col justify-between min-w-[76px] h-[74px] shadow-2xs">
                          <div className="w-full flex-1 flex items-center justify-center">
                            <select
                              value={course.uniqueLetter || ''}
                              onChange={e => updateField('uniqueLetter', e.target.value.toUpperCase())}
                              className="w-full text-center font-black text-lg text-amber-950 bg-transparent border-0 focus:ring-0 rounded cursor-pointer p-0"
                              title="Sequence"
                            >
                              <option value="" disabled>Seq</option>
                              {VALID_UNIQUE_LETTERS.map(letter => (
                                <option key={letter} value={letter}>
                                  {letter}
                                </option>
                              ))}
                            </select>
                          </div>
                          <span className="text-[10px] text-amber-800 font-bold block tracking-wide">Sequence</span>
                        </div>

                        {/* 7. V: Version — Slate Theme */}
                        <div className="p-2 rounded-xl border-2 border-slate-300 bg-slate-100 flex flex-col justify-between min-w-[62px] h-[74px] shadow-2xs">
                          <div className="w-full flex-1 flex items-center justify-center">
                            <span className="w-full text-center font-black text-lg text-slate-900 select-none">
                              {course.version !== undefined && course.version !== null && course.version !== ('' as any) ? course.version : '0'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-700 font-bold block tracking-wide">Version</span>
                        </div>
                      </div>

                      {/* Bright Sequence Guidance Banner */}
                      <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl flex items-center space-x-2.5 text-xs text-amber-950 font-bold shadow-xs">
                        <span className="text-base flex-shrink-0">📌</span>
                        <div className="leading-snug">
                          <span className="text-amber-900 font-extrabold uppercase text-[11px] tracking-wide block">Sequence Letter Guideline</span>
                          <span>Enter the unique letter assigned to the course by the BOS Coordinator. If you are unsure, refer to the course schedule.</span>
                        </div>
                      </div>

                      {(hasFieldError('uniqueLetter') || hasFieldError('courseCode')) && (
                        <div className="mt-2 text-xs text-red-600 font-semibold flex items-center space-x-1">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          <span>Code configuration error</span>
                        </div>
                      )}
                    </div>

                    {/* Course Title and L-T-P-Credits inline row */}
                    <div className="pt-1">
                      <div className="flex flex-col lg:flex-row items-start gap-3.5">
                        {/* Course Title Field (flex-1) */}
                        <div className="flex-1 w-full">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-slate-700">
                              Course Title <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[11px] text-slate-400">
                              {(course.courseName || '').length}/60 characters
                            </span>
                          </div>
                          <input
                            type="text"
                            value={course.courseName || ''}
                            onChange={e => updateField('courseName', e.target.value)}
                            onBlur={() => {
                              if (course.courseType === 'PRACTICAL') {
                                let raw = (course.courseName || '').trim();
                                if (raw) {
                                  // Strip any variations / misspellings of laboratory/lab from the end
                                  raw = raw.replace(/\s*(?:lab|laboratry|labrotary|laboratary|laborotary|labortory|labratory|laboratorie|laboratories|laboratory)\s*$/i, '').trim();
                                  if (raw) {
                                    updateField('courseName', `${raw} Laboratory`);
                                  }
                                }
                              }
                            }}
                            placeholder={course.courseType === 'PRACTICAL' ? "e.g. Data Structures Laboratory" : "Course Name"}
                            className={`w-full px-3.5 py-2 border-2 rounded-xl text-sm font-semibold transition-all h-[42px] ${
                              hasFieldError('courseName')
                                ? 'border-red-400 bg-red-50/20 text-slate-900 focus:ring-2 focus:ring-red-200 focus:border-red-500'
                                : 'border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 bg-white'
                            }`}
                          />
                        </div>

                        {/* Compact & Highlighted L-T-P & Credits Boxes */}
                        <div className="flex items-start gap-2 flex-shrink-0">
                          {/* Lecture (L) - Blue Theme */}
                          <div className="flex flex-col items-center">
                            <label className="block text-[10px] font-bold text-sky-800 uppercase tracking-wide mb-1 text-center">
                              L
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={8}
                              value={course.courseType === 'PRACTICAL' ? 0 : (course.L === ('' as any) ? '' : (course.L ?? ''))}
                              disabled={course.courseType === 'PRACTICAL'}
                              onChange={e => updateField('L', e.target.value === '' ? ('' as any) : Math.min(8, Math.max(0, parseInt(e.target.value) || 0)))}
                              onBlur={() => touchField('L')}
                              placeholder="0"
                              className="w-13 h-[42px] px-1 border-2 border-sky-300 bg-sky-50/70 hover:border-sky-500 focus:border-sky-600 focus:ring-2 focus:ring-sky-200 rounded-xl text-sm text-center font-black text-sky-950 disabled:bg-slate-100 disabled:border-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed shadow-2xs transition-all"
                              title={course.courseType === 'PRACTICAL' ? 'Lecture (L) is fixed at 0 for practical courses' : 'Lecture contact hours (L)'}
                            />
                          </div>

                          {/* Tutorial (T) - Indigo Theme */}
                          <div className="flex flex-col items-center">
                            <label className="block text-[10px] font-bold text-indigo-800 uppercase tracking-wide mb-1 text-center">
                              T
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={6}
                              value={course.courseType === 'PRACTICAL' ? 0 : (course.T === ('' as any) ? '' : (course.T ?? ''))}
                              disabled={course.courseType === 'PRACTICAL'}
                              onChange={e => updateField('T', e.target.value === '' ? ('' as any) : Math.min(6, Math.max(0, parseInt(e.target.value) || 0)))}
                              onBlur={() => touchField('T')}
                              placeholder="0"
                              className="w-13 h-[42px] px-1 border-2 border-indigo-300 bg-indigo-50/70 hover:border-indigo-500 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 rounded-xl text-sm text-center font-black text-indigo-950 disabled:bg-slate-100 disabled:border-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed shadow-2xs transition-all"
                              title={course.courseType === 'PRACTICAL' ? 'Tutorial (T) is fixed at 0 for practical courses' : 'Tutorial contact hours (T)'}
                            />
                          </div>

                          {/* Practical (P) - Emerald Theme */}
                          <div className="flex flex-col items-center">
                            <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wide mb-1 text-center">
                              P
                            </label>
                            <input
                              type="number"
                              min={course.courseType === 'PRACTICAL' ? 2 : 0}
                              max={course.courseType === 'PRACTICAL' ? 4 : 10}
                              value={course.courseType === 'THEORY' ? 0 : (course.P === ('' as any) ? '' : (course.P ?? ''))}
                              disabled={course.courseType === 'THEORY'}
                              onChange={e => {
                                if (e.target.value === '') {
                                  updateField('P', '' as any);
                                  return;
                                }
                                const raw = parseInt(e.target.value, 10);
                                if (isNaN(raw)) return;
                                if (course.courseType === 'PRACTICAL') {
                                  const clamped = Math.min(4, Math.max(2, raw));
                                  updateField('P', clamped);
                                } else {
                                  updateField('P', Math.min(10, Math.max(0, raw)));
                                }
                              }}
                              onBlur={() => touchField('P')}
                              placeholder={course.courseType === 'PRACTICAL' ? '2–4' : '0'}
                              className="w-13 h-[42px] px-1 border-2 border-emerald-300 bg-emerald-50/70 hover:border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 rounded-xl text-sm text-center font-black text-emerald-950 disabled:bg-slate-100 disabled:border-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed shadow-2xs transition-all"
                              title={
                                course.courseType === 'THEORY'
                                  ? 'Practical is disabled for theory courses'
                                  : course.courseType === 'PRACTICAL'
                                  ? 'Practical contact hours must be 2, 3, or 4'
                                  : 'Practical contact hours (P)'
                              }
                            />
                          </div>

                          {/* Credits Box - Golden / Amber Institutional Highlight */}
                          <div className="flex flex-col items-center">
                            <label className="block text-[10px] font-black text-amber-900 uppercase tracking-wide mb-1 text-center">
                              Credits
                            </label>
                            <div 
                              className="min-w-[62px] h-[42px] px-2.5 bg-amber-50/80 border-2 border-amber-400 rounded-xl flex items-center justify-center shadow-2xs"
                              title="Calculated Course Credits"
                            >
                              <span className="text-base font-black text-amber-950">
                                {course.credits !== undefined && course.credits !== null && course.credits !== ('' as any) ? course.credits : '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Helper text and errors underneath */}
                      {course.courseType === 'PRACTICAL' && (
                        <p className="text-[11px] text-slate-500 mt-1.5">
                          Practical course titles must end with the full word <strong className="text-slate-700">"Laboratory"</strong>. (If omitted or misspelled, it will automatically normalize to "Laboratory").
                        </p>
                      )}
                      <InlineFieldError field="courseName" />
                    </div>

                    {/* Course Subtitle / Additional Specification Note (Optional) */}
                    <div className="pt-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Course Subtitle / Offering Note <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <span className="text-[11px] text-slate-400">
                          {(course.courseSubtitle || '').length}/100 characters
                        </span>
                      </div>
                      <input
                        type="text"
                        value={course.courseSubtitle || ''}
                        onChange={e => updateField('courseSubtitle', e.target.value)}
                        placeholder="e.g. Common to all courses"
                        className="w-full px-3.5 py-2 border-2 border-slate-300 rounded-xl text-sm font-medium transition-all h-[42px] focus:border-sky-500 focus:ring-2 focus:ring-sky-100 bg-white placeholder:text-slate-400"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Optional line added below the course title in the syllabus document (e.g. <span className="font-semibold text-slate-600">Common to all courses</span> or <span className="font-semibold text-slate-600">Common to CSE, IT and AI&DS</span>).
                      </p>
                    </div>

                    {/* TCP TE Exam Type */}
                    {course.courseType === 'TCP' && (
                      <div className="pt-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Terminal Examination Type (TE Type) <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={course.teExamType || ''}
                          onChange={e => updateField('teExamType', e.target.value as any)}
                          className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-sky-500"
                        >
                          <option value="" disabled>Select TE Exam Type</option>
                          <option value="TCP-T">TCP-T (Theory Examination 50%)</option>
                          <option value="100% Theory">TCP-T (100% Theory)</option>
                          <option value="TCP-P">TCP-P (Practical Examination 50%)</option>
                          <option value="100% Practical">TCP-P (100% Practical)</option>
                        </select>
                      </div>
                    )}

                    {/* Inline error feedback */}
                    <InlineFieldError field="credits" />
                    <InlineFieldError field="L" />
                    <InlineFieldError field="T" />
                    <InlineFieldError field="P" />
                  </div>
                )}

                {/* Step 2: Preamble & Prerequisites */}
                {activeStepId === 'preamble' && (() => {
                  const getPrereqsArray = (prereqs: any): Prerequisite[] => {
                    if (!prereqs) return [];
                    if (Array.isArray(prereqs)) {
                      return prereqs
                        .filter(p => p && (typeof p === 'string' ? p.trim().toLowerCase() !== 'nil' : true))
                        .map(p => {
                          if (typeof p === 'string') {
                            const match = p.match(/^([A-Za-z0-9]+)\s*[:\-–]?\s*(.*)$/);
                            if (match && match[1]) {
                              return { courseCode: match[1].trim(), courseName: (match[2] || '').trim() };
                            }
                            return { courseCode: '', courseName: p.trim() };
                          }
                          return { courseCode: p.courseCode || '', courseName: p.courseName || '' };
                        });
                    }
                    if (typeof prereqs === 'string') {
                      const trimmed = prereqs.trim();
                      if (!trimmed || trimmed.toLowerCase() === 'nil') return [];
                      if (trimmed.includes('\n')) {
                        return trimmed
                          .split('\n')
                          .map(line => line.trim().replace(/^[•\-\*]\s*/, ''))
                          .filter(line => line && line.toLowerCase() !== 'nil')
                          .map(line => {
                            const match = line.match(/^([A-Za-z0-9]+)\s*[:\-–]?\s*(.*)$/);
                            if (match && match[1]) {
                              return { courseCode: match[1].trim(), courseName: (match[2] || '').trim() };
                            }
                            return { courseCode: '', courseName: line };
                          });
                      }
                      const match = trimmed.match(/^([A-Za-z0-9]+)\s*[:\-–]?\s*(.*)$/);
                      if (match && match[1] && (match[2] || /^[0-9]{2}[A-Za-z]{2}/.test(match[1]))) {
                        return [{ courseCode: match[1].trim(), courseName: (match[2] || '').trim() }];
                      }
                      return [{ courseCode: '', courseName: trimmed }];
                    }
                    return [];
                  };

                  const prereqsArray = getPrereqsArray(course.prerequisites);

                  return (
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">2. Course Preamble & Prerequisites</h2>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-700">
                            Preamble Statement <span className="text-rose-500">*</span>
                          </label>
                          {countWords(course.preamble || '') === 0 ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              0 / 90 words max
                            </span>
                          ) : countWords(course.preamble || '') <= 90 ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {countWords(course.preamble || '')} / 90 words — Compliant
                            </span>
                          ) : (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                              {countWords(course.preamble || '')} / 90 words (exceeds 90-word maximum limit)
                            </span>
                          )}
                        </div>
                        <textarea
                          rows={6}
                          value={course.preamble}
                          onChange={e => updateField('preamble', e.target.value)}
                          placeholder="Course preamble (strictly maximum 90 words, single coherent paragraph)..."
                          className={`w-full p-3.5 border rounded-xl text-sm leading-relaxed transition-all ${
                            hasFieldError('preamble')
                              ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-200 focus:border-red-500'
                              : countWords(course.preamble || '') >= 1 && countWords(course.preamble || '') <= 90
                              ? 'border-emerald-400 bg-emerald-50/10 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500'
                              : 'border-slate-300 focus:ring-2 focus:ring-sky-500'
                          }`}
                        />
                        <InlineFieldError field="preamble" />
                        {!hasFieldError('preamble') && countWords(course.preamble || '') >= 1 && countWords(course.preamble || '') <= 90 && (
                          <InlineFieldSuccess message="Preamble word count (within 90 words limit) and structure verified compliant" />
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">
                            Prerequisites
                          </label>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {prereqsArray.length > 0 ? `${prereqsArray.length} added` : 'None (NIL)'}
                          </span>
                        </div>

                        {prereqsArray.length === 0 ? (
                          <div className="p-3 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                            No prerequisites specified (will appear as <span className="font-semibold text-slate-700">NIL</span> on official syllabus document).
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {prereqsArray.map((p, pIdx) => (
                              <div key={pIdx} className="flex items-center space-x-2 p-2 border border-slate-200 rounded-xl bg-slate-50/50">
                                <span className="text-slate-400 font-black text-sm pl-1">•</span>
                                <input
                                  type="text"
                                  value={p.courseCode}
                                  onChange={e => {
                                    const updated = [...prereqsArray];
                                    updated[pIdx] = { ...updated[pIdx], courseCode: e.target.value.toUpperCase() };
                                    updateField('prerequisites', updated);
                                  }}
                                  placeholder="Course Code"
                                  className="w-1/3 p-2 border border-slate-300 rounded-lg text-xs font-mono font-semibold uppercase bg-white focus:ring-2 focus:ring-sky-500"
                                />
                                <input
                                  type="text"
                                  value={p.courseName}
                                  onChange={e => {
                                    const updated = [...prereqsArray];
                                    updated[pIdx] = { ...updated[pIdx], courseName: e.target.value };
                                    updateField('prerequisites', updated);
                                  }}
                                  placeholder="Course Name"
                                  className="flex-1 p-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-sky-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = prereqsArray.filter((_, i) => i !== pIdx);
                                    updateField('prerequisites', updated.length > 0 ? updated : 'Nil');
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                                  title="Remove Prerequisite"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            const newPrereq: Prerequisite = { courseCode: '', courseName: '' };
                            updateField('prerequisites', [...prereqsArray, newPrereq]);
                          }}
                          className="w-full py-2 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:text-sky-700 hover:border-sky-300 text-xs font-semibold transition-colors flex items-center justify-center space-x-1"
                        >
                          <span>+ Add Prerequisite</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Step 3: Course Outcomes */}
                {activeStepId === 'cos' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">3. Course Outcomes (COs)</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {course.courseType === 'PRACTICAL'
                            ? `Practical course (${Number(course.credits) || 1} credit${Number(course.credits) === 1 ? '' : 's'}) requires at least ${Number(course.credits) <= 1 ? 3 : 4} Course Outcomes.`
                            : `Theory course (${Number(course.credits) || 3} credits) requires minimum ${Number(course.credits) < 3 && Number(course.credits) > 0 ? (Number(course.credits) === 1 ? 3 : 4) : 6} Course Outcomes.`}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {(() => {
                          const totalWeightage = (course.courseOutcomes || []).reduce((acc, c) => acc + (Number(c.weightage) || 0), 0);
                          return (
                            <div className="flex items-center space-x-1.5">
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                                totalWeightage === 100
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : totalWeightage > 0
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                Weightage: {totalWeightage}% {totalWeightage === 100 ? '✓' : ''}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const cos = course.courseOutcomes || [];
                                  if (cos.length === 0) return;
                                  const baseWeight = Math.floor(100 / cos.length);
                                  const remainder = 100 - (baseWeight * cos.length);
                                  const updated = cos.map((c, i) => ({
                                    ...c,
                                    weightage: baseWeight + (i < remainder ? 1 : 0),
                                  }));
                                  updateField('courseOutcomes', updated);
                                }}
                                className="px-2 py-1 text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors cursor-pointer"
                                title="Distribute weightage evenly to equal 100%"
                              >
                                Auto-balance 100%
                              </button>
                            </div>
                          );
                        })()}
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                          isStep2Complete
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {(course.courseOutcomes || []).length} COs entered
                          {isStep2Complete ? ' • Requirement Met' : ' • In Progress'}
                        </span>
                      </div>
                    </div>

                    {/* Practical General CO Pool Picker — 3 domain buttons */}
                    {course.courseType === 'PRACTICAL' && (
                      <CoDomainPicker
                        courseOutcomes={course.courseOutcomes || []}
                        onAdd={(newCo) => updateField('courseOutcomes', [...(course.courseOutcomes || []), newCo])}
                      />
                    )}

                    {/* CO Table Rows */}
                    <div className="space-y-4">
                      {(course.courseOutcomes || []).map((co, idx) => {
                        // Determine domain: from co.domain or infer from objectiveNo (1-7: Cognitive, 8-9: Affective, 10-13: Psychomotor)
                        let coDomain = co.domain;
                        if (!coDomain && co.objectiveNo) {
                          if (co.objectiveNo >= 1 && co.objectiveNo <= 7) coDomain = 'Cognitive';
                          else if (co.objectiveNo >= 8 && co.objectiveNo <= 9) coDomain = 'Affective';
                          else if (co.objectiveNo >= 10 && co.objectiveNo <= 13) coDomain = 'Psychomotor';
                        }
                        if (!coDomain) coDomain = 'Cognitive';

                        const domainTheme = {
                          Cognitive: {
                            card: 'bg-blue-100/80 border-2 border-blue-400 shadow-sm',
                            pill: 'bg-blue-600 text-white',
                            badge: 'bg-blue-200/90 text-blue-900 border border-blue-400 font-extrabold',
                          },
                          Affective: {
                            card: 'bg-emerald-100/80 border-2 border-emerald-400 shadow-sm',
                            pill: 'bg-emerald-600 text-white',
                            badge: 'bg-emerald-200/90 text-emerald-900 border border-emerald-400 font-extrabold',
                          },
                          Psychomotor: {
                            card: 'bg-violet-100/80 border-2 border-violet-400 shadow-sm',
                            pill: 'bg-violet-600 text-white',
                            badge: 'bg-violet-200/90 text-violet-900 border border-violet-400 font-extrabold',
                          },
                        }[coDomain as 'Cognitive' | 'Affective' | 'Psychomotor'] || {
                          card: 'bg-blue-100/80 border-2 border-blue-400 shadow-sm',
                          pill: 'bg-blue-600 text-white',
                          badge: 'bg-blue-200/90 text-blue-900 border border-blue-400 font-extrabold',
                        };

                        return (
                          <div
                            key={idx}
                            className={`p-4 border rounded-xl space-y-3 transition-all ${domainTheme.card}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className={`font-bold text-xs px-2.5 py-1 rounded-md shadow-2xs ${domainTheme.pill}`}>
                                  {co.coNo || `CO${idx + 1}`}
                                </span>
                                {course.courseType === 'PRACTICAL' && (
                                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${domainTheme.badge}`}>
                                    {coDomain} Domain
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    const updated = (course.courseOutcomes || []).filter((_, i) => i !== idx);
                                    // renumber
                                    const renumbered = updated.map((c, i) => ({ ...c, coNo: `CO${i + 1}` }));
                                    updateField('courseOutcomes', renumbered);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                  title="Delete Course Outcome"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* ROW 1: Objective (if Practical), Outcome Statement, TPS Level */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                              {/* Objective (1-13) - appears first on row 1 for Practical */}
                              {course.courseType === 'PRACTICAL' && (
                                <div className="md:col-span-4">
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-[11px] font-bold text-slate-700">
                                      Objective (1–13)
                                    </label>
                                    <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                                      Aligns domain
                                    </span>
                                  </div>
                                  <select
                                    value={co.objectiveNo || 1}
                                    onChange={e => {
                                      const objNum = parseInt(e.target.value);
                                      const matched = LAB_OBJECTIVES.find(o => o.no === objNum);
                                      const updated = [...(course.courseOutcomes || [])];
                                      updated[idx] = {
                                        ...updated[idx],
                                        objectiveNo: objNum,
                                        objectiveName: matched?.name,
                                        domain: matched?.domain,
                                      };
                                      updateField('courseOutcomes', updated);
                                    }}
                                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-sky-500"
                                  >
                                    {LAB_OBJECTIVES.map(o => (
                                      <option key={o.no} value={o.no}>
                                        {o.no}. {o.name} ({o.domain})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {/* Outcome Statement */}
                              <div className={course.courseType === 'PRACTICAL' ? 'md:col-span-6' : 'md:col-span-9'}>
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <label className="block text-[11px] font-bold text-slate-700">
                                    Outcome Statement (must start with TPS {co.tpsLevel} verb)
                                  </label>
                                  {TPS_VERBS[co.tpsLevel]?.length > 0 && (
                                    <div className="relative inline-block">
                                      <button
                                        type="button"
                                        onClick={() => setOpenVerbPopoverCo(openVerbPopoverCo === (co.coNo || `CO${idx + 1}`) ? null : (co.coNo || `CO${idx + 1}`))}
                                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-2xs cursor-pointer transition-colors"
                                        title="Click to view and choose from all verbs for this TPS level"
                                      >
                                        <span>Verbs:</span>
                                        <span className="ml-1 font-black text-amber-950 underline decoration-amber-400">
                                          {TPS_VERBS[co.tpsLevel]?.join(', ')}
                                        </span>
                                        <span className="ml-1 text-[9px] text-amber-800">▾</span>
                                      </button>

                                      {openVerbPopoverCo === (co.coNo || `CO${idx + 1}`) && (
                                        <div className="absolute left-0 top-full mt-1.5 z-30 w-72 sm:w-80 p-2.5 bg-white border-2 border-amber-300 rounded-xl shadow-xl animate-in fade-in zoom-in-95">
                                          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-amber-200 text-xs">
                                            <span className="font-bold text-amber-900 text-[11px] flex items-center gap-1">
                                              <span>⚡ Tap verb to insert (TPS {co.tpsLevel})</span>
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => setOpenVerbPopoverCo(null)}
                                              className="text-slate-400 hover:text-slate-700 text-xs px-1 rounded hover:bg-slate-100 cursor-pointer"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-0.5">
                                            {(TPS_VERBS[co.tpsLevel] || []).map(verb => (
                                              <button
                                                key={verb}
                                                type="button"
                                                onClick={() => {
                                                  handleSelectVerb(verb, idx);
                                                  setOpenVerbPopoverCo(null);
                                                }}
                                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-200 text-amber-900 border border-amber-300 hover:border-amber-400 transition-all cursor-pointer shadow-2xs active:scale-95"
                                                title={`Click to insert "${verb}"`}
                                              >
                                                {verb}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <textarea
                                  rows={2}
                                  value={co.statement || ''}
                                  onChange={e => {
                                    const updated = [...(course.courseOutcomes || [])];
                                    updated[idx] = { ...updated[idx], statement: e.target.value };
                                    updateField('courseOutcomes', updated);
                                  }}
                                  placeholder="Course Outcome statement"
                                  className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                                />
                              </div>

                              {/* TPS Level */}
                              <div className={course.courseType === 'PRACTICAL' ? 'md:col-span-2' : 'md:col-span-3'}>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                                    TPS Level
                                  </label>
                                  {(co.tpsLevel === 2 || co.tpsLevel === 1) && (
                                    <span className={`text-[9px] font-bold px-1 rounded ${
                                      (course.courseOutcomes || []).filter(c => c.tpsLevel === 2 || c.tpsLevel === 1).length >= 2
                                        ? 'text-amber-800 bg-amber-100'
                                        : 'text-slate-500 bg-slate-100'
                                    }`}>
                                      {((course.courseOutcomes || []).filter(c => c.tpsLevel === 2 || c.tpsLevel === 1).length)}/2
                                    </span>
                                  )}
                                </div>
                                <select
                                  value={co.tpsLevel}
                                  onChange={e => {
                                    const level = parseInt(e.target.value);
                                    const updated = [...(course.courseOutcomes || [])];
                                    updated[idx] = { ...updated[idx], tpsLevel: level };
                                    updateField('courseOutcomes', updated);
                                  }}
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-[11px] font-semibold bg-white focus:ring-2 focus:ring-sky-500"
                                >
                                  <option value={1} disabled className="text-slate-400 bg-slate-100">TPS 1 (Remember)</option>
                                  <option
                                    value={2}
                                    disabled={co.tpsLevel !== 2 && (course.courseOutcomes || []).filter(c => c.tpsLevel === 2).length >= 2}
                                    className={co.tpsLevel !== 2 && (course.courseOutcomes || []).filter(c => c.tpsLevel === 2).length >= 2 ? "text-slate-400 bg-slate-100" : ""}
                                  >
                                    {co.tpsLevel !== 2 && (course.courseOutcomes || []).filter(c => c.tpsLevel === 2).length >= 2
                                      ? "TPS 2 (Understand) (Max 2)"
                                      : "TPS 2 (Understand)"}
                                  </option>
                                  <option value={3}>TPS 3 (Apply)</option>
                                  <option value={4}>TPS 4 (Analyze)</option>
                                  <option value={5}>TPS 5 (Evaluate)</option>
                                  <option value={6}>TPS 6 (Create)</option>
                                </select>
                              </div>
                            </div>

                            {/* ROW 2: Performance Indicators, CO Weightage, SDG Addressed, SDG Level */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1 items-start">
                              {/* Performance Indicators */}
                              <div className="sm:col-span-4">
                                <PiCheckboxSelector
                                  value={co.pi || ''}
                                  coNo={co.coNo}
                                  onChange={(newPi, matchedTpsLevel) => {
                                    const updated = [...(course.courseOutcomes || [])];
                                    const otherTps2 = (course.courseOutcomes || []).filter((c, i) => i !== idx && c.tpsLevel === 2).length;
                                    const canApplyMatchedTps = matchedTpsLevel !== 2 || otherTps2 < 2;
                                    updated[idx] = {
                                      ...updated[idx],
                                      pi: newPi,
                                      ...(matchedTpsLevel && canApplyMatchedTps ? { tpsLevel: matchedTpsLevel } : {}),
                                    };
                                    updateField('courseOutcomes', updated);
                                  }}
                                />
                              </div>

                              {/* CO Weightage (%) */}
                              <div className="sm:col-span-3">
                                <div className="flex items-center justify-between mb-1">
                                  <label className="block text-[11px] font-bold text-slate-600">
                                    CO Weightage (%)
                                  </label>
                                  <span className="text-[10px] text-slate-400 font-semibold">5%–25%</span>
                                </div>
                                <input
                                  type="number"
                                  min={5}
                                  max={25}
                                  value={co.weightage !== undefined && co.weightage !== null ? co.weightage : ''}
                                  onChange={e => {
                                    let val = e.target.value === '' ? ('' as any) : parseInt(e.target.value);
                                    if (typeof val === 'number') {
                                      if (isNaN(val)) val = '' as any;
                                      else if (val > 25) val = 25;
                                      else if (val < 0) val = 0;
                                    }
                                    const updated = [...(course.courseOutcomes || [])];
                                    updated[idx] = { ...updated[idx], weightage: val };
                                    updateField('courseOutcomes', updated);
                                  }}
                                  onBlur={e => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val) && val > 0 && val < 5) {
                                      const updated = [...(course.courseOutcomes || [])];
                                      updated[idx] = { ...updated[idx], weightage: 5 };
                                      updateField('courseOutcomes', updated);
                                    }
                                  }}
                                  placeholder="5-25"
                                  className={`w-full p-2 border rounded-lg text-xs text-center font-bold bg-white ${
                                    co.weightage !== undefined && co.weightage !== null && (Number(co.weightage) < 5 || Number(co.weightage) > 25)
                                      ? 'border-red-400 bg-red-50 text-red-700'
                                      : 'border-slate-300'
                                  }`}
                                />
                              </div>

                              {/* SDG(s) Addressed */}
                              <div className="sm:col-span-3">
                                <SdgCheckboxSelector
                                  sdgNo={co.sdgNo || 'NC'}
                                  coNo={co.coNo}
                                  onChange={(newSdgNo, defaultLevel) => {
                                    const updated = [...(course.courseOutcomes || [])];
                                    const isNc = !newSdgNo || newSdgNo === 'NC';
                                    updated[idx] = {
                                      ...updated[idx],
                                      sdgNo: newSdgNo,
                                      sdgLevel: isNc ? 0 : (updated[idx].sdgLevel && updated[idx].sdgLevel > 0 ? updated[idx].sdgLevel : (defaultLevel || 1)),
                                    };
                                    updateField('courseOutcomes', updated);
                                  }}
                                />
                              </div>

                              {/* SDG Level (0–5) */}
                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                  SDG Level (0–5)
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  max={5}
                                  disabled={!co.sdgNo || co.sdgNo === 'NC'}
                                  value={co.sdgLevel || 0}
                                  onChange={e => {
                                    const val = parseInt(e.target.value) || 0;
                                    const updated = [...(course.courseOutcomes || [])];
                                    updated[idx] = { ...updated[idx], sdgLevel: val };
                                    updateField('courseOutcomes', updated);
                                  }}
                                  className="w-full p-2 border border-slate-300 rounded-lg text-xs text-center font-bold bg-white disabled:bg-slate-100 disabled:text-slate-400"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add CO Button */}
                      <button
                        onClick={() => {
                          const n = (course.courseOutcomes || []).length + 1;
                          const newCo: CourseOutcome = {
                            coNo: `CO${n}`,
                            statement: '',
                            tpsLevel: 3,
                            pi: '',
                            weightage: 0,
                            sdgNo: 'NC',
                            sdgLevel: 0,
                            ...(course.courseType === 'PRACTICAL'
                              ? {
                                  objectiveNo: 1,
                                  objectiveName: LAB_OBJECTIVES[0]?.name,
                                  domain: LAB_OBJECTIVES[0]?.domain,
                                }
                              : {}),
                          };
                          updateField('courseOutcomes', [...(course.courseOutcomes || []), newCo]);
                        }}
                        className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-sky-500 text-slate-600 hover:text-sky-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Course Outcome</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Assessment Pattern */}
                {activeStepId === 'assessment' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">4. Assessment Pattern</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Configure mark distribution across continuous assessment and terminal examination. Each component column must total 100%.
                      </p>
                    </div>

                    {/* Theory: Assessment Pattern CO-wise Matrix & Questions */}
                    {course.courseType === 'THEORY' && (
                      <div className="space-y-6">
                        {/* Course Outcomes Assessment Matrix Table */}
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h3 className="text-base font-bold text-slate-900">
                                Assessment Pattern (Course Outcomes Mark Distribution)
                              </h3>
                              <p className="text-xs text-slate-500">
                                Mark percentage distribution across Continuous Assessment Tests (CAT 1, CAT 2), Assignments (1, 2), and Terminal Examination for each Course Outcome. Each column must sum to exactly 100%.
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={handleAutoFillAssessment}
                                className="px-3 py-1.5 rounded-lg border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
                                title="Automatically populate marks distribution based on Course Outcomes"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                                <span>Fill based on COs</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleResetAssessment}
                                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
                                title="Reset all values to 0 to fill manually"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                <span>Reset (Fill Manually)</span>
                              </button>
                              <div className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                                {(course.courseOutcomes || []).length} COs Configured
                              </div>
                            </div>
                          </div>

                          {(course.courseOutcomes || []).length === 0 ? (
                            <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
                              <p className="text-xs text-amber-800 font-semibold">
                                No Course Outcomes defined yet. Please return to Step 3 (Course Outcomes) to add COs first.
                              </p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                              <table className="w-full text-xs text-left border-collapse">
                                <thead className="bg-slate-100 text-slate-700 font-bold">
                                  <tr>
                                    <th className="p-2.5 border-b w-28 bg-slate-200 text-slate-800 text-center">CO</th>
                                    <th className="p-2.5 border-b text-center">CAT 1 (%)</th>
                                    <th className="p-2.5 border-b text-center">Assignment 1 (%)</th>
                                    <th className="p-2.5 border-b text-center">CAT 2 (%)</th>
                                    <th className="p-2.5 border-b text-center">Assignment 2 (%)</th>
                                    <th className="p-2.5 border-b text-center bg-sky-50 text-sky-900">Terminal Exam (%)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(course.courseOutcomes || []).map(co => {
                                    const rowData = (course.assessmentMatrix || []).find(r => r.coNo === co.coNo) || {
                                      coNo: co.coNo,
                                      cat1: 0,
                                      assignment1: 0,
                                      cat2: 0,
                                      assignment2: 0,
                                      terminalExam: 0,
                                    };

                                    const updateCell = (col: 'cat1' | 'assignment1' | 'cat2' | 'assignment2' | 'terminalExam', val: number) => {
                                      const matrix = [...(course.assessmentMatrix || [])];
                                      const idx = matrix.findIndex(r => r.coNo === co.coNo);
                                      if (idx >= 0) {
                                        matrix[idx] = { ...matrix[idx], [col]: val };
                                      } else {
                                        matrix.push({ ...rowData, [col]: val });
                                      }
                                      updateField('assessmentMatrix', matrix);
                                    };

                                    return (
                                      <tr key={co.coNo} className="border-b border-slate-100 hover:bg-slate-50/50">
                                        <td className="p-2.5 font-bold text-slate-800 bg-slate-50/60 text-center">
                                          <div>
                                            <span className="font-extrabold text-sky-900">{co.coNo}</span>
                                            <span className="block text-[10px] text-slate-500 font-medium">
                                              TPS {co.tpsLevel}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="p-2 text-center">
                                          <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={rowData.cat1 === 0 ? '' : rowData.cat1}
                                            placeholder="0"
                                            onChange={e => updateCell('cat1', parseInt(e.target.value) || 0)}
                                            className="w-16 p-1.5 border border-slate-300 rounded text-center text-xs font-semibold placeholder:text-slate-300 placeholder:font-normal"
                                          />
                                        </td>
                                        <td className="p-2 text-center">
                                          <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={rowData.assignment1 === 0 ? '' : rowData.assignment1}
                                            placeholder="0"
                                            onChange={e => updateCell('assignment1', parseInt(e.target.value) || 0)}
                                            className="w-16 p-1.5 border border-slate-300 rounded text-center text-xs font-semibold placeholder:text-slate-300 placeholder:font-normal"
                                          />
                                        </td>
                                        <td className="p-2 text-center">
                                          <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={rowData.cat2 === 0 ? '' : rowData.cat2}
                                            placeholder="0"
                                            onChange={e => updateCell('cat2', parseInt(e.target.value) || 0)}
                                            className="w-16 p-1.5 border border-slate-300 rounded text-center text-xs font-semibold placeholder:text-slate-300 placeholder:font-normal"
                                          />
                                        </td>
                                        <td className="p-2 text-center">
                                          <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={rowData.assignment2 === 0 ? '' : rowData.assignment2}
                                            placeholder="0"
                                            onChange={e => updateCell('assignment2', parseInt(e.target.value) || 0)}
                                            className="w-16 p-1.5 border border-slate-300 rounded text-center text-xs font-semibold placeholder:text-slate-300 placeholder:font-normal"
                                          />
                                        </td>
                                        <td className="p-2 text-center bg-sky-50/30">
                                          <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={rowData.terminalExam === 0 ? '' : rowData.terminalExam}
                                            placeholder="0"
                                            onChange={e => updateCell('terminalExam', parseInt(e.target.value) || 0)}
                                            className="w-16 p-1.5 border border-sky-300 bg-white rounded text-center text-xs font-bold text-sky-900 placeholder:text-sky-200 placeholder:font-normal"
                                          />
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                                  <tr>
                                    <td className="p-2.5 font-extrabold text-slate-900 text-center">Total (%):</td>
                                    {(['cat1', 'assignment1', 'cat2', 'assignment2', 'terminalExam'] as const).map(col => {
                                      const cos = course.courseOutcomes || [];
                                      const sum = cos.reduce((acc, co) => {
                                        const row = (course.assessmentMatrix || []).find(r => r.coNo === co.coNo);
                                        return acc + (Number((row as any)?.[col]) || 0);
                                      }, 0);
                                      const isOk = sum === 100;
                                      return (
                                        <td
                                          key={col}
                                          className={`p-2.5 text-center text-xs font-extrabold ${
                                            isOk ? 'text-emerald-700 bg-emerald-50' : 'text-rose-600 bg-red-50'
                                          }`}
                                        >
                                          <div className="flex items-center justify-center space-x-1">
                                            <span>{sum}%</span>
                                            {isOk ? (
                                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                                            ) : (
                                              <span className="text-[10px] text-rose-500 font-normal">(!=100)</span>
                                            )}
                                          </div>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}
                          <InlineFieldError field="assessmentMatrix" />
                          {!hasFieldError('assessmentMatrix') && (course.assessmentMatrix || []).length > 0 && (
                            <InlineFieldSuccess message="Assessment matrix marks distribution verified" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Practical Component Table (Assessment Pattern Grid) */}
                    {course.courseType === 'PRACTICAL' && (
                      <div className="space-y-5">
                        {/* Laboratory Assessment Pattern Grid */}
                        <div className="space-y-3 pt-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h3 className="text-base font-bold text-slate-900">
                                Laboratory Assessment Pattern (Mark Distribution)
                              </h3>
                              <p className="text-xs text-slate-500">
                                Mark percentage distribution across Practical components (OCR/Continuous Assessment, Model Test CO-wise), and Terminal Exam (Practical). Each column must sum to exactly 100%.
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={handleAutoFillAssessment}
                                className="px-3 py-1.5 rounded-lg border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
                                title="Automatically populate marks distribution based on Course Outcomes"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                                <span>Fill based on COs</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleResetAssessment}
                                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
                                title="Reset all values to 0 to fill manually"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                <span>Reset (Fill Manually)</span>
                              </button>
                              <div className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                                {(course.courseOutcomes || []).length} COs Configured
                              </div>
                            </div>
                          </div>

                          {(course.courseOutcomes || []).length === 0 ? (
                            <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
                              <p className="text-xs text-amber-800 font-semibold">
                                No Course Outcomes defined yet. Please return to Step 3 (Course Outcomes) to add COs first.
                              </p>
                            </div>
                          ) : (
                            <div>
                              {/* Title bar: full-width light-gray bar */}
                              <div className="bg-[#D9D9D9] font-bold px-3 py-1.5 text-black text-xs sm:text-sm w-full text-left">
                                Assessment Pattern
                              </div>

                              {/* Table with two-level grouped header */}
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse border border-black table-fixed bg-white">
                                  <thead>
                                    <tr>
                                      <th
                                        rowSpan={3}
                                        className="border border-black p-2 text-center align-middle font-bold text-black w-[16%]"
                                      >
                                        CO
                                      </th>
                                      <th
                                        colSpan={2}
                                        className="border border-black p-2 text-center font-bold text-black"
                                      >
                                        Practical
                                      </th>
                                      <th
                                        rowSpan={2}
                                        className="border border-black p-2 text-center align-middle font-bold text-black w-[28%]"
                                      >
                                        Terminal Exam<br />(Practical)
                                      </th>
                                    </tr>
                                    <tr>
                                      <th className="border border-black p-2 text-center font-bold text-black w-[28%]">
                                        OCR/Continuous Assessment
                                      </th>
                                      <th className="border border-black p-2 text-center font-bold text-black w-[28%]">
                                        Model Test CO-wise
                                      </th>
                                    </tr>
                                    <tr>
                                      <th className="border border-black p-1 text-center font-bold text-black text-[10px]">
                                        % of Marks
                                      </th>
                                      <th className="border border-black p-1 text-center font-bold text-black text-[10px]">
                                        % of Marks
                                      </th>
                                      <th className="border border-black p-1 text-center font-bold text-black text-[10px]">
                                        % of Marks
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(course.courseOutcomes || []).map(co => {
                                      const rawRow = (course.assessmentMatrix || []).find(r => r.coNo === co.coNo);
                                      const caVal = rawRow?.practicalCa !== undefined
                                        ? rawRow.practicalCa
                                        : '';
                                      const modelVal = rawRow?.practicalModel !== undefined
                                        ? rawRow.practicalModel
                                        : '';
                                      const termVal = rawRow?.terminalExam !== undefined
                                        ? rawRow.terminalExam
                                        : (rawRow?.tcpTerminal !== undefined ? rawRow.tcpTerminal : '');

                                      const coDomain = getDomainForCourseOutcome(co);
                                      const domainBadge = {
                                        Cognitive: {
                                          pill: 'bg-blue-600 text-white',
                                          badge: 'bg-blue-100 text-blue-800 border border-blue-200',
                                        },
                                        Affective: {
                                          pill: 'bg-emerald-600 text-white',
                                          badge: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
                                        },
                                        Psychomotor: {
                                          pill: 'bg-violet-600 text-white',
                                          badge: 'bg-violet-100 text-violet-800 border border-violet-200',
                                        },
                                      }[coDomain];

                                      const updateCell = (col: 'practicalCa' | 'practicalModel' | 'terminalExam', valStr: string) => {
                                        const numVal = valStr === '' ? 0 : Math.max(0, Math.min(100, parseInt(valStr, 10) || 0));
                                        const matrix = [...(course.assessmentMatrix || [])];
                                        const idx = matrix.findIndex(r => r.coNo === co.coNo);
                                        if (idx >= 0) {
                                          const existing = matrix[idx];
                                          matrix[idx] = {
                                            ...existing,
                                            coNo: co.coNo,
                                            practicalCa: col === 'practicalCa' ? numVal : (existing.practicalCa ?? 0),
                                            practicalModel: col === 'practicalModel' ? numVal : (existing.practicalModel ?? 0),
                                            terminalExam: col === 'terminalExam' ? numVal : (existing.terminalExam ?? existing.tcpTerminal ?? 0),
                                            tcpTerminal: col === 'terminalExam' ? numVal : (existing.tcpTerminal ?? existing.terminalExam ?? 0),
                                            [col]: numVal,
                                          };
                                        } else {
                                          matrix.push({
                                            coNo: co.coNo,
                                            practicalCa: col === 'practicalCa' ? numVal : 0,
                                            practicalModel: col === 'practicalModel' ? numVal : 0,
                                            terminalExam: col === 'terminalExam' ? numVal : 0,
                                            tcpTerminal: col === 'terminalExam' ? numVal : 0,
                                            [col]: numVal,
                                          });
                                        }
                                        updateField('assessmentMatrix', matrix);
                                      };

                                      return (
                                        <tr key={co.coNo} className="hover:bg-slate-50/50">
                                          <td className="border border-black p-2 text-left pl-3 font-normal text-black">
                                            <div className="flex items-center space-x-2">
                                              <span className={`font-bold text-xs px-2 py-0.5 rounded shadow-2xs ${domainBadge.pill}`}>
                                                {co.coNo}
                                              </span>
                                              <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${domainBadge.badge}`}>
                                                {coDomain}
                                              </span>
                                            </div>
                                            {co.tpsLevel && (
                                              <span className="block text-[10px] text-slate-500 font-medium mt-1">
                                                TPS {co.tpsLevel}
                                              </span>
                                            )}
                                          </td>
                                          <td className="border border-black p-1.5 text-center">
                                            <input
                                              type="number"
                                              min={0}
                                              max={100}
                                              value={caVal && Number(caVal) > 0 ? caVal : ''}
                                              placeholder="0"
                                              onChange={e => updateCell('practicalCa', e.target.value)}
                                              className="w-20 p-1 border border-slate-300 rounded text-center text-xs font-semibold focus:outline-sky-500"
                                            />
                                          </td>
                                          <td className="border border-black p-1.5 text-center">
                                            <input
                                              type="number"
                                              min={0}
                                              max={100}
                                              value={modelVal && Number(modelVal) > 0 ? modelVal : ''}
                                              placeholder="0"
                                              onChange={e => updateCell('practicalModel', e.target.value)}
                                              className="w-20 p-1 border border-slate-300 rounded text-center text-xs font-semibold focus:outline-sky-500"
                                            />
                                          </td>
                                          <td className="border border-black p-1.5 text-center">
                                            <input
                                              type="number"
                                              min={0}
                                              max={100}
                                              value={termVal && Number(termVal) > 0 ? termVal : ''}
                                              placeholder="0"
                                              onChange={e => updateCell('terminalExam', e.target.value)}
                                              className="w-20 p-1 border border-slate-300 rounded text-center text-xs font-semibold focus:outline-sky-500"
                                            />
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  <tfoot>
                                    {(() => {
                                      const cos = course.courseOutcomes || [];
                                      const sumCa = cos.reduce((acc, co) => {
                                        const r = (course.assessmentMatrix || []).find(x => x.coNo === co.coNo);
                                        const v = r?.practicalCa !== undefined ? r.practicalCa : 0;
                                        return acc + (Number(v) || 0);
                                      }, 0);
                                      const sumModel = cos.reduce((acc, co) => {
                                        const r = (course.assessmentMatrix || []).find(x => x.coNo === co.coNo);
                                        const v = r?.practicalModel !== undefined ? r.practicalModel : 0;
                                        return acc + (Number(v) || 0);
                                      }, 0);
                                      const sumTerm = cos.reduce((acc, co) => {
                                        const r = (course.assessmentMatrix || []).find(x => x.coNo === co.coNo);
                                        const v = r?.terminalExam !== undefined ? r.terminalExam : (r?.tcpTerminal || 0);
                                        return acc + (Number(v) || 0);
                                      }, 0);

                                      return (
                                        <tr>
                                          <td className="border border-black p-2 text-left pl-3 font-bold text-black">
                                            Total
                                          </td>
                                          <td
                                            className={`border border-black p-2 text-center font-bold ${
                                              sumCa === 100 ? 'text-emerald-700 bg-emerald-50/50' : 'text-rose-600 bg-rose-50/50'
                                            }`}
                                          >
                                            {sumCa}%
                                          </td>
                                          <td
                                            className={`border border-black p-2 text-center font-bold ${
                                              sumModel === 100 ? 'text-emerald-700 bg-emerald-50/50' : 'text-rose-600 bg-rose-50/50'
                                            }`}
                                          >
                                            {sumModel}%
                                          </td>
                                          <td
                                            className={`border border-black p-2 text-center font-bold ${
                                              sumTerm === 100 ? 'text-emerald-700 bg-emerald-50/50' : 'text-rose-600 bg-rose-50/50'
                                            }`}
                                          >
                                            {sumTerm}%
                                          </td>
                                        </tr>
                                      );
                                    })()}
                                  </tfoot>
                                </table>
                              </div>

                              {(() => {
                                const cos = course.courseOutcomes || [];
                                const cogCos = cos.filter(c => getDomainForCourseOutcome(c) === 'Cognitive');
                                const affCos = cos.filter(c => getDomainForCourseOutcome(c) === 'Affective');
                                const psyCos = cos.filter(c => getDomainForCourseOutcome(c) === 'Psychomotor');

                                const components: Array<{ col: 'practicalCa' | 'practicalModel' | 'terminalExam'; label: string }> = [
                                  { col: 'practicalCa', label: 'OCR/Continuous Assessment' },
                                  { col: 'practicalModel', label: 'Model Test CO-wise' },
                                  { col: 'terminalExam', label: 'Terminal Exam (Practical)' },
                                ];

                                return (
                                  <div className="mt-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/80 space-y-2 text-xs">
                                    <div className="font-bold text-slate-700">
                                      Domain Weightage Distribution (Required for all components: 60% Cognitive, 20% Affective, 20% Psychomotor):
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                      {components.map(comp => {
                                        const cogSum = cogCos.reduce((acc, c) => {
                                          const r = (course.assessmentMatrix || []).find(x => x.coNo === c.coNo);
                                          return acc + (Number((r as any)?.[comp.col]) || 0);
                                        }, 0);
                                        const affSum = affCos.reduce((acc, c) => {
                                          const r = (course.assessmentMatrix || []).find(x => x.coNo === c.coNo);
                                          return acc + (Number((r as any)?.[comp.col]) || 0);
                                        }, 0);
                                        const psySum = psyCos.reduce((acc, c) => {
                                          const r = (course.assessmentMatrix || []).find(x => x.coNo === c.coNo);
                                          return acc + (Number((r as any)?.[comp.col]) || 0);
                                        }, 0);

                                        const allValid = cogSum === 60 && affSum === 20 && psySum === 20;

                                        return (
                                          <div key={comp.col} className="p-2 bg-white rounded-md border border-slate-200 space-y-1.5 shadow-2xs">
                                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
                                              <span>{comp.label}</span>
                                              {allValid ? (
                                                <span className="text-[10px] text-emerald-600 font-bold">✓ 60/20/20</span>
                                              ) : (
                                                <span className="text-[10px] text-rose-500 font-bold">Pending</span>
                                              )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-1">
                                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                cogSum === 60 ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                                              }`}>
                                                Cog: {cogSum}% / 60%
                                              </span>
                                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                affSum === 20 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                                              }`}>
                                                Aff: {affSum}% / 20%
                                              </span>
                                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                psySum === 20 ? 'bg-violet-100 text-violet-800 border border-violet-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                                              }`}>
                                                Psy: {psySum}% / 20%
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}

                              <div className="mt-3 space-y-1">
                                <InlineFieldError field="assessmentMatrix" />
                                {!hasFieldError('assessmentMatrix') && (course.assessmentMatrix || []).length > 0 && (
                                  <InlineFieldSuccess message="Laboratory assessment matrix marks distribution verified (all columns total 100%)" />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* TCP Dual Matrix */}
                    {course.courseType === 'TCP' && (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h3 className="text-base font-bold text-slate-900">
                              TCP Assessment Pattern (Theory & Practical Mark Distribution)
                            </h3>
                            <p className="text-xs text-slate-500">
                              Mark percentage distribution across Theory CATs, Practical CA, Model Test, and Terminal Exam.
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={handleAutoFillAssessment}
                              className="px-3 py-1.5 rounded-lg border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
                              title="Automatically populate marks distribution based on Course Outcomes"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                              <span>Fill based on COs</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleResetAssessment}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
                              title="Reset all values to 0 to fill manually"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                              <span>Reset (Fill Manually)</span>
                            </button>
                            <div className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                              {(course.courseOutcomes || []).length} COs Configured
                            </div>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                          <thead className="bg-slate-100 text-slate-700 font-bold">
                            <tr>
                              <th className="p-2.5 border-b">CO</th>
                              <th className="p-2.5 border-b text-center">Theory CAT1 (%)</th>
                              <th className="p-2.5 border-b text-center">Theory CAT2 (%)</th>
                              <th className="p-2.5 border-b text-center">Practical CA (%)</th>
                              <th className="p-2.5 border-b text-center">Model Test (%)</th>
                              <th className="p-2.5 border-b text-center">Terminal (%)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(course.courseOutcomes || []).map(co => {
                              const cell = (course.assessmentMatrix || []).find(r => r.coNo === co.coNo) || {
                                coNo: co.coNo,
                                theoryCat1: 0,
                                theoryCat2: 0,
                                practicalCa: 0,
                                practicalModel: 0,
                                tcpTerminal: 0,
                              };

                              return (
                                <tr key={co.coNo} className="border-b border-slate-100 hover:bg-slate-50/50">
                                  <td className="p-2.5 font-bold text-slate-800 bg-slate-50/60 text-center">
                                    <div>
                                      <span className="font-extrabold text-sky-900">{co.coNo}</span>
                                      <span className="block text-[10px] text-slate-500 font-medium">
                                        TPS {co.tpsLevel}
                                      </span>
                                    </div>
                                  </td>
                                  {['theoryCat1', 'theoryCat2', 'practicalCa', 'practicalModel', 'tcpTerminal'].map(colKey => (
                                    <td key={colKey} className="p-2 text-center">
                                      <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={(cell as any)[colKey] === 0 ? '' : (cell as any)[colKey]}
                                        placeholder="0"
                                        onChange={e => {
                                          const val = parseInt(e.target.value) || 0;
                                          const matrix = [...(course.assessmentMatrix || [])];
                                          const idx = matrix.findIndex(r => r.coNo === co.coNo);
                                          if (idx >= 0) {
                                            matrix[idx] = { ...matrix[idx], [colKey]: val };
                                          } else {
                                            matrix.push({ coNo: co.coNo, [colKey]: val });
                                          }
                                          updateField('assessmentMatrix', matrix);
                                        }}
                                        className="w-16 p-1.5 border border-slate-300 rounded text-center text-xs placeholder:text-slate-300 placeholder:font-normal"
                                      />
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                            <tr>
                              <td className="p-2.5 font-extrabold text-slate-900 text-center">Total (%):</td>
                              {(['theoryCat1', 'theoryCat2', 'practicalCa', 'practicalModel', 'tcpTerminal'] as const).map(col => {
                                const cos = course.courseOutcomes || [];
                                const sum = cos.reduce((acc, co) => {
                                  const row = (course.assessmentMatrix || []).find(r => r.coNo === co.coNo);
                                  return acc + (Number((row as any)?.[col]) || 0);
                                }, 0);
                                const isOk = sum === 100;
                                return (
                                  <td
                                    key={col}
                                    className={`p-2.5 text-center text-xs font-extrabold ${
                                      isOk ? 'text-emerald-700 bg-emerald-50' : 'text-rose-600 bg-red-50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-center space-x-1">
                                      <span>{sum}%</span>
                                      {isOk ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <span className="text-[10px] text-rose-500 font-normal">(!=100)</span>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                  </div>
                )}

                {/* Step 5: Syllabus Modules & Experiments */}
                {activeStepId === 'syllabus' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {course.courseType === 'PRACTICAL'
                          ? '5. Laboratory Experiments'
                          : (course.courseType === 'TCP' ? '5. Syllabus, Schedule & Experiments' : '5. Syllabus Modules & Lecture Schedule')}
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        {course.courseType === 'PRACTICAL'
                          ? 'Configure laboratory experiments with inquiry openness levels (1/2/3) and Course Outcome mappings.'
                          : 'Modules must contain main topic and ordered subtopics.'}
                      </p>
                    </div>

                    {/* Syllabus Modules & Lecture Schedule (Theory and TCP courses only; Practical courses only have experiments) */}
                    {(course.courseType === 'THEORY' || course.courseType === 'TCP') && (
                      <div className="space-y-2.5">
                        {(course.modules || []).map((mod, idx) => (
                          <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-slate-800">
                                Module {mod.moduleNo || idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const modNo = String(mod.moduleNo || idx + 1);
                                  const currentSchedule = course.lectureScheduleItems || [];
                                  const manualRows = currentSchedule.filter(
                                    x => (x.moduleNo === modNo || x.moduleNo.startsWith(`${modNo}.`)) &&
                                         (x.source === 'manual' || x.isEdited)
                                  );
                                  if (manualRows.length > 0) {
                                    const confirmed = window.confirm(
                                      `Module ${modNo} contains ${manualRows.length} manually added or edited row(s) in the lecture schedule table. Are you sure you want to delete this module and its schedule items?`
                                    );
                                    if (!confirmed) return;
                                  }

                                  const remainingSchedule = currentSchedule.filter(
                                    x => x.moduleNo !== modNo && !x.moduleNo.startsWith(`${modNo}.`)
                                  );

                                  const updated = (course.modules || []).filter((_, i) => i !== idx);
                                  const renumbered = updated.map((m, i) => ({ ...m, moduleNo: i + 1 }));

                                  const renumberedSchedule = remainingSchedule.map(item => {
                                    const parts = item.moduleNo.split('.');
                                    const mNum = parseInt(parts[0], 10);
                                    const delNum = parseInt(modNo, 10);
                                    if (!isNaN(mNum) && !isNaN(delNum) && mNum > delNum) {
                                      parts[0] = String(mNum - 1);
                                      return { ...item, moduleNo: parts.join('.') };
                                    }
                                    return item;
                                  });

                                  setCourse(prev => ({
                                    ...prev,
                                    modules: renumbered,
                                    lectureScheduleItems: syncModulesToSchedule(renumbered, renumberedSchedule, prev.courseOutcomes || [])
                                  }));
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                title={`Delete Module ${mod.moduleNo || idx + 1}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Module Title
                              </label>
                              <input
                                type="text"
                                value={mod.mainTopic || ''}
                                onChange={e => {
                                  const updated = [...(course.modules || [])];
                                  updated[idx] = { ...updated[idx], mainTopic: e.target.value };
                                  updateField('modules', updated);
                                }}
                                placeholder={`Module ${mod.moduleNo || idx + 1} Title`}
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Topics
                              </label>
                              <input
                                type="text"
                                value={
                                  subtopicsDraft[idx] !== undefined
                                    ? subtopicsDraft[idx]
                                    : (mod.subtopics || []).join(', ')
                                }
                                onChange={e => {
                                  const raw = e.target.value;
                                  setSubtopicsDraft(prev => ({ ...prev, [idx]: raw }));
                                  const list = splitSubtopics(raw);
                                  const updated = [...(course.modules || [])];
                                  updated[idx] = { ...updated[idx], subtopics: list };
                                  updateField('modules', updated);
                                }}
                                onBlur={() => {
                                  setSubtopicsDraft(prev => {
                                    const next = { ...prev };
                                    delete next[idx];
                                    return next;
                                  });
                                }}
                                placeholder="Topics (comma, dash or newline separated)"
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                              />
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            const n = (course.modules || []).length + 1;
                            const newMod: SyllabusModule = {
                              moduleNo: n,
                              mainTopic: '',
                              subtopics: [],
                            };
                            updateField('modules', [...(course.modules || []), newMod]);
                          }}
                          className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-sky-500 text-slate-600 hover:text-sky-700 text-xs font-semibold flex items-center justify-center space-x-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Module</span>
                        </button>

                        {/* Hierarchical Course Contents and Lecture Schedule */}
                        <div className="pt-6 border-t border-slate-200 space-y-4">
                          {(() => {
                            const effectiveLectureCredits = ((course.courseType === 'TCP') && (course.L || 0) > 0) ? course.L : course.credits;
                            const lectureCriteria = getExpectedHoursCriteria(effectiveLectureCredits);

                            const handleSyncFromModules = () => {
                              if (!course.modules || course.modules.length === 0) return;
                              const items: LectureScheduleItem[] = [];
                              const updatedModules = [...(course.modules || [])];
                              let modulesUpdated = false;

                              course.modules.forEach((mod, mIdx) => {
                                const modNo = String(mod.moduleNo || mIdx + 1);
                                const modCos = Array.isArray(mod.coMapping) && mod.coMapping.length > 0
                                  ? mod.coMapping.join(', ')
                                  : (course.courseOutcomes && course.courseOutcomes[mIdx] ? course.courseOutcomes[mIdx].coNo : (course.courseOutcomes?.[0]?.coNo || ''));

                                items.push({
                                  moduleNo: modNo,
                                  topic: mod.mainTopic || `Module ${modNo}`,
                                  periods: mod.periods ? mod.periods : '',
                                  coMapping: modCos,
                                });

                                const rawSubtopics = subtopicsDraft[mIdx] !== undefined ? subtopicsDraft[mIdx] : (mod.subtopics || []);
                                const parsedSubtopics = splitSubtopics(rawSubtopics);

                                if (JSON.stringify(parsedSubtopics) !== JSON.stringify(mod.subtopics)) {
                                  updatedModules[mIdx] = { ...updatedModules[mIdx], subtopics: parsedSubtopics };
                                  modulesUpdated = true;
                                }

                                if (parsedSubtopics && parsedSubtopics.length > 0) {
                                  parsedSubtopics.forEach((sub, sIdx) => {
                                    items.push({
                                      moduleNo: `${modNo}.${sIdx + 1}`,
                                      topic: sub,
                                      periods: '',
                                      coMapping: modCos,
                                    });
                                  });
                                }
                              });

                              if (modulesUpdated) {
                                updateField('modules', updatedModules);
                              }
                              updateField('lectureScheduleItems', items);
                            };

                            const handleAutoRenumberAll = () => {
                              const list = [...(course.lectureScheduleItems || [])];
                              if (list.length === 0) return;

                              let currentMod = 0;
                              let currentSub = 0;

                              const renumbered = list.map(item => {
                                const isHeader = !item.moduleNo.includes('.');
                                if (isHeader || currentMod === 0) {
                                  currentMod += 1;
                                  currentSub = 0;
                                  return { ...item, moduleNo: String(currentMod) };
                                } else {
                                  currentSub += 1;
                                  return { ...item, moduleNo: `${currentMod}.${currentSub}` };
                                }
                              });

                              updateField('lectureScheduleItems', renumbered);
                            };

                            const handleAddModule = () => {
                              const list = [...(course.lectureScheduleItems || [])];
                              let maxMod = 0;
                              list.forEach(x => {
                                const n = parseInt(x.moduleNo.split('.')[0]);
                                if (!isNaN(n) && n > maxMod) maxMod = n;
                              });
                              const nextMod = String(maxMod + 1);
                              const defaultCo = course.courseOutcomes && course.courseOutcomes[maxMod]
                                ? course.courseOutcomes[maxMod].coNo
                                : (course.courseOutcomes?.[0]?.coNo || '');

                              list.push({
                                moduleNo: nextMod,
                                topic: '',
                                periods: '',
                                coMapping: defaultCo,
                                source: 'manual',
                                isEdited: false,
                              });

                              for (let i = 1; i <= 3; i++) {
                                list.push({
                                  moduleNo: `${nextMod}.${i}`,
                                  topic: '',
                                  periods: '',
                                  coMapping: defaultCo,
                                  source: 'manual',
                                  isEdited: false,
                                });
                              }

                              updateField('lectureScheduleItems', list);
                            };

                            const handleAddSubtopicToModule = (modNo: string) => {
                              const list = [...(course.lectureScheduleItems || [])];
                              const headerIdx = list.findIndex(x => x.moduleNo === modNo);
                              const headerItem = headerIdx !== -1 ? list[headerIdx] : undefined;
                              const headerCo = headerItem
                                ? (Array.isArray(headerItem.coMapping) ? headerItem.coMapping.join(', ') : (headerItem.coMapping || ''))
                                : '';

                              let lastIdx = headerIdx;
                              let subCount = 0;
                              list.forEach((x, idx) => {
                                if (x.moduleNo.startsWith(`${modNo}.`)) {
                                  lastIdx = idx;
                                  subCount++;
                                }
                              });

                              const newItem: LectureScheduleItem = {
                                moduleNo: `${modNo}.${subCount + 1}`,
                                topic: '',
                                periods: '',
                                coMapping: headerCo,
                                source: 'manual',
                                isEdited: false,
                              };

                              if (lastIdx !== -1) {
                                list.splice(lastIdx + 1, 0, newItem);
                              } else {
                                list.push(newItem);
                              }
                              updateField('lectureScheduleItems', list);
                            };

                            const handleSetSubtopicsCount = (modNo: string, targetCount: number) => {
                              const list = [...(course.lectureScheduleItems || [])];
                              const headerIdx = list.findIndex(x => x.moduleNo === modNo);
                              if (headerIdx === -1) return;

                              const headerItem = list[headerIdx];
                              const headerCo = Array.isArray(headerItem.coMapping)
                                ? headerItem.coMapping.join(', ')
                                : (headerItem.coMapping || '');

                              const subtopicIndices: number[] = [];
                              list.forEach((x, idx) => {
                                if (x.moduleNo.startsWith(`${modNo}.`)) {
                                  subtopicIndices.push(idx);
                                }
                              });

                              const currentCount = subtopicIndices.length;
                              if (targetCount === currentCount) return;

                              if (targetCount > currentCount) {
                                const diff = targetCount - currentCount;
                                const insertAfterIdx = subtopicIndices.length > 0
                                  ? subtopicIndices[subtopicIndices.length - 1]
                                  : headerIdx;
                                const newItems: LectureScheduleItem[] = [];
                                for (let k = 1; k <= diff; k++) {
                                  newItems.push({
                                    moduleNo: `${modNo}.${currentCount + k}`,
                                    topic: '',
                                    periods: '',
                                    coMapping: headerCo,
                                  });
                                }
                                list.splice(insertAfterIdx + 1, 0, ...newItems);
                                updateField('lectureScheduleItems', list);
                              } else {
                                const toRemove = subtopicIndices.slice(targetCount);
                                const filtered = list.filter((_, idx) => !toRemove.includes(idx));
                                updateField('lectureScheduleItems', filtered);
                              }
                            };

                            const handleDeleteScheduleItem = (idxToDelete: number) => {
                              const list = [...(course.lectureScheduleItems || [])];
                              const item = list[idxToDelete];
                              if (!item) return;

                              if (!item.moduleNo.includes('.')) {
                                const modNo = item.moduleNo;
                                const filtered = list.filter((_, i) => i !== idxToDelete && !list[i].moduleNo.startsWith(`${modNo}.`));
                                updateField('lectureScheduleItems', filtered);
                                return;
                              }

                              const modNo = item.moduleNo.split('.')[0];
                              const remaining = list.filter((_, i) => i !== idxToDelete);

                              let sCount = 0;
                              const updated = remaining.map(x => {
                                if (x.moduleNo.startsWith(`${modNo}.`)) {
                                  sCount++;
                                  return { ...x, moduleNo: `${modNo}.${sCount}` };
                                }
                                return x;
                              });

                              updateField('lectureScheduleItems', updated);
                            };

                            const handleApplyCoToModuleSubtopics = (modNo: string, coStr: string) => {
                              const list = [...(course.lectureScheduleItems || [])];
                              const updated = list.map(item => {
                                if (item.moduleNo === modNo || item.moduleNo.startsWith(`${modNo}.`)) {
                                  return { ...item, coMapping: coStr };
                                }
                                return item;
                              });
                              updateField('lectureScheduleItems', updated);
                            };

                            const scheduleItems = course.lectureScheduleItems || [];

                            return (
                              <>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                  <div>
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                                      <span>Course Contents and Lecture Schedule</span>
                                      {course.courseType === 'TCP' && (
                                        <span className="text-[11px] font-semibold px-2 py-0.5 bg-sky-100 text-sky-800 rounded-md">
                                          TCP Theory Component (L = {course.L || 0})
                                        </span>
                                      )}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      Total hours must satisfy {lectureCriteria.description}: 1 cr = 12–14 hrs, 2 cr = 24–28 hrs, 3 cr = 36 hrs, 4 cr = 48 hrs.
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={handleAddModule}
                                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                                    >
                                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Add Module</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={handleAutoRenumberAll}
                                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                                      title="Normalize all numbers sequentially (1, 1.1, 1.2 ... 2, 2.1, 2.2 ...)"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                                      <span>Auto-renumber All</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Bright Notice: Hours must be 1 or 2 for a topic */}
                                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-amber-950 shadow-xs">
                                  <div className="flex items-center space-x-2.5">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-400 text-amber-950 font-black text-sm flex-shrink-0 shadow-xs">
                                      ⚡
                                    </span>
                                    <div className="text-xs">
                                      <span className="font-extrabold text-amber-950 text-sm tracking-tight block">
                                        Topic Period Limit: 1–2 Hours per Topic
                                      </span>
                                      <span className="text-amber-800 font-medium">
                                        In accordance with TCE guidelines, lecture periods for an individual topic or subtopic must be 1 or 2 hours (valid values: 1 or 2 periods).
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-1.5 self-start sm:self-center">
                                    <span className="px-2.5 py-1 bg-amber-200 border border-amber-400 text-amber-950 text-[11px] font-black rounded-lg uppercase tracking-wider shadow-xs whitespace-nowrap">
                                      LIMIT: 1–2 HRS / TOPIC
                                    </span>
                                  </div>
                                </div>

                                {/* Attention Banner: Some topics need hours (1 or 2) */}
                                {(() => {
                                  const invalidScheduleRows = scheduleItems.filter((x) => {
                                    const isHeader = !x.moduleNo || !x.moduleNo.includes('.');
                                    const hasSubtopics = isHeader && scheduleItems.some(sub => sub.moduleNo.startsWith(`${x.moduleNo}.`));
                                    if (isHeader && hasSubtopics && (x.periods === '' || x.periods === undefined || x.periods === null)) {
                                      return false;
                                    }
                                    return x.periods !== 1 && x.periods !== 2;
                                  });

                                  if (invalidScheduleRows.length === 0) return null;

                                  return (
                                    <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3 flex items-start space-x-2.5 text-rose-950 shadow-xs animate-in fade-in">
                                      <span className="flex items-center justify-center w-6 h-6 rounded-md bg-rose-200 text-rose-800 font-bold text-xs flex-shrink-0 mt-0.5">
                                        ⚠️
                                      </span>
                                      <div className="text-xs space-y-0.5">
                                        <span className="font-extrabold text-rose-900 block text-sm">
                                          Some topics need hours (1 or 2)
                                        </span>
                                        <span className="text-rose-700">
                                          The following topic(s) require 1 or 2 hours to be selected:{' '}
                                          <strong className="text-rose-900">
                                            {invalidScheduleRows.map(r => r.moduleNo ? `Topic ${r.moduleNo}` : 'Custom topic').join(', ')}
                                          </strong>. Please select 1 or 2 hours for each topic row.
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })()}

                                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm -mx-1 sm:mx-0">
                                  <table className="w-full text-xs text-left border-collapse min-w-[620px]">
                                    <thead className="bg-slate-100 text-slate-700 font-bold">
                                      <tr>
                                        <th className="p-2.5 border-b w-28 text-center">Module No.</th>
                                        <th className="p-2.5 border-b min-w-[280px]">Topics</th>
                                        <th className="p-2.5 border-b w-32 text-center">
                                          <div className="flex flex-col items-center">
                                            <span>No. of Periods</span>
                                            <span className="mt-0.5 px-1.5 py-0.2 bg-amber-200 border border-amber-400 text-amber-950 text-[10px] font-black rounded uppercase tracking-wider">
                                              1–2 hrs
                                            </span>
                                          </div>
                                        </th>
                                        <th className="p-2.5 border-b w-36 text-center">Course Outcomes</th>
                                        <th className="p-2.5 border-b w-14 text-center">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {scheduleItems.length === 0 ? (
                                        <tr>
                                          <td colSpan={5} className="p-8 text-center text-slate-500 bg-slate-50/50">
                                            <p className="text-sm font-semibold text-slate-700 mb-2">No lecture schedule items entered yet.</p>
                                            <p className="text-xs text-slate-500 mb-4">
                                              Create modules and topics to build your lecture schedule.
                                            </p>
                                            <div className="flex items-center justify-center space-x-3">
                                              <button
                                                type="button"
                                                onClick={handleAddModule}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow"
                                              >
                                                <Plus className="w-4 h-4" />
                                                <span>Add Module 1</span>
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ) : (
                                        scheduleItems.map((item, idx) => {
                                          const isHeader = !item.moduleNo.includes('.');
                                          const modNo = item.moduleNo.split('.')[0] || '1';
                                          const subtopicsCount = scheduleItems.filter(x => x.moduleNo.startsWith(`${modNo}.`)).length;

                                          return (
                                            <tr
                                              key={idx}
                                              className={`border-b transition-colors ${
                                                isHeader
                                                  ? 'bg-slate-100/95 font-bold border-t-2 border-slate-300'
                                                  : 'bg-white hover:bg-slate-50/70 border-slate-100'
                                              }`}
                                            >
                                              {/* Module No column */}
                                              <td className="p-2 text-center align-middle">
                                                <div className="flex items-center justify-center space-x-1">
                                                  <input
                                                    type="text"
                                                    value={item.moduleNo}
                                                    onChange={e => {
                                                      const list = [...scheduleItems];
                                                      list[idx] = { ...list[idx], moduleNo: e.target.value };
                                                      updateField('lectureScheduleItems', list);
                                                    }}
                                                    className={`w-16 p-1 border rounded text-center text-xs font-bold ${
                                                      isHeader
                                                        ? 'bg-slate-200/80 border-slate-400 text-slate-900'
                                                        : 'border-slate-300 text-slate-800 bg-slate-50/50'
                                                    }`}
                                                  />
                                                </div>
                                              </td>

                                              {/* Topic column */}
                                              <td className="p-2 align-middle">
                                                <div className="space-y-1">
                                                  <div className="flex items-center space-x-1.5">
                                                    {!isHeader && (
                                                      <span className="text-slate-300 font-bold text-xs select-none">↳</span>
                                                    )}
                                                    <input
                                                      type="text"
                                                      value={item.topic || ''}
                                                      onChange={e => {
                                                        const list = [...scheduleItems];
                                                        const wasAuto = !list[idx].source || list[idx].source === 'auto';
                                                        list[idx] = {
                                                          ...list[idx],
                                                          topic: e.target.value,
                                                          isEdited: wasAuto ? true : list[idx].isEdited,
                                                        };
                                                        updateField('lectureScheduleItems', list);
                                                      }}
                                                      placeholder={
                                                        isHeader
                                                          ? `Enter Module ${item.moduleNo} title`
                                                          : 'Enter topic / subtopic'
                                                      }
                                                      className={`w-full p-1.5 border rounded text-xs transition-colors ${
                                                        isHeader
                                                          ? 'font-bold text-slate-900 border-slate-300 bg-white shadow-sm'
                                                          : 'text-slate-700 border-slate-200 bg-white'
                                                      }`}
                                                    />
                                                    {item.isEdited && (
                                                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                                          ✏️ Edited manually
                                                        </span>
                                                        {item.originalTopic !== undefined && item.originalTopic !== item.topic && (
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              const list = [...scheduleItems];
                                                              list[idx] = {
                                                                ...list[idx],
                                                                topic: item.originalTopic || '',
                                                                isEdited: false,
                                                              };
                                                              updateField('lectureScheduleItems', list);
                                                            }}
                                                            className="text-[10px] text-sky-600 hover:text-sky-800 underline font-medium cursor-pointer"
                                                            title={`Reset to module value: "${item.originalTopic}"`}
                                                          >
                                                            ↺ Reset to module value
                                                          </button>
                                                        )}
                                                      </div>
                                                    )}
                                                    {item.source === 'manual' && !item.isEdited && (
                                                      <div className="flex items-center gap-1 pt-0.5">
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                                          + Manual row
                                                        </span>
                                                      </div>
                                                    )}
                                                  </div>

                                                  {/* Module Header Controls: Topics count selector */}
                                                  {isHeader && (
                                                    <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 font-normal">
                                                      <span className="font-semibold text-slate-700">Topics inside Module {modNo}:</span>
                                                      <select
                                                        value={subtopicsCount}
                                                        onChange={e => handleSetSubtopicsCount(modNo, parseInt(e.target.value))}
                                                        className="px-2 py-0.5 border border-slate-300 rounded bg-white text-xs font-bold text-sky-800 shadow-sm cursor-pointer"
                                                        title="Select how many subtopics to create inside this module"
                                                      >
                                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20].map(cnt => (
                                                          <option key={cnt} value={cnt}>
                                                            {cnt === 0 ? '0 topics (none)' : cnt === 1 ? '1 topic' : `${cnt} topics inside`}
                                                          </option>
                                                        ))}
                                                      </select>

                                                      <button
                                                        type="button"
                                                        onClick={() => handleAddSubtopicToModule(modNo)}
                                                        className="px-2 py-0.5 bg-white hover:bg-sky-50 text-sky-700 border border-slate-300 hover:border-sky-300 rounded text-[11px] font-semibold flex items-center space-x-1 shadow-sm transition-colors"
                                                      >
                                                        <Plus className="w-3 h-3 text-sky-600" />
                                                        <span>Add Topic</span>
                                                      </button>

                                                      {item.coMapping && (
                                                        <button
                                                          type="button"
                                                          onClick={() => handleApplyCoToModuleSubtopics(modNo, Array.isArray(item.coMapping) ? item.coMapping.join(', ') : (item.coMapping || ''))}
                                                          className="text-[10px] text-slate-500 hover:text-sky-700 underline"
                                                          title="Apply this module's Course Outcomes to all subtopics inside"
                                                        >
                                                          Apply CO to all topics
                                                        </button>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              </td>

                                              {/* Periods column: strictly 1 or 2, toggle buttons */}
                                              <td className="p-2 text-center align-middle">
                                                {(() => {
                                                  const isMissing = (!isHeader || !subtopicsCount) && item.periods !== 1 && item.periods !== 2;

                                                  if (isHeader && subtopicsCount > 0 && (item.periods === '' || item.periods === undefined || item.periods === null)) {
                                                    return (
                                                      <div className="flex flex-col items-center">
                                                        <span className="text-slate-400 text-[11px] font-semibold italic">—</span>
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            const list = [...scheduleItems];
                                                            list[idx] = { ...list[idx], periods: 1 };
                                                            updateField('lectureScheduleItems', list);
                                                            touchField(`lectureScheduleItems.${idx}.periods`);
                                                          }}
                                                          className="text-[9px] text-sky-600 hover:text-sky-800 underline mt-0.5 cursor-pointer"
                                                          title="Optional: Add periods to module header"
                                                        >
                                                          + add hrs
                                                        </button>
                                                      </div>
                                                    );
                                                  }

                                                  return (
                                                    <div className="flex flex-col items-center">
                                                      <div className={`inline-flex items-center rounded-lg p-0.5 border shadow-2xs transition-all ${
                                                        isMissing
                                                          ? 'border-rose-400 bg-rose-50/90 ring-2 ring-rose-200'
                                                          : 'border-slate-300 bg-slate-100'
                                                      }`}>
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            const list = [...scheduleItems];
                                                            list[idx] = { ...list[idx], periods: item.periods === 1 ? '' : 1 };
                                                            updateField('lectureScheduleItems', list);
                                                            touchField(`lectureScheduleItems.${idx}.periods`);
                                                          }}
                                                          className={`px-2 py-0.5 text-xs font-black rounded-md cursor-pointer transition-all ${
                                                            item.periods === 1
                                                              ? 'bg-emerald-600 text-white shadow-xs'
                                                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                                                          }`}
                                                          title="Select 1 hour for this topic"
                                                        >
                                                          1 hr
                                                        </button>
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            const list = [...scheduleItems];
                                                            list[idx] = { ...list[idx], periods: item.periods === 2 ? '' : 2 };
                                                            updateField('lectureScheduleItems', list);
                                                            touchField(`lectureScheduleItems.${idx}.periods`);
                                                          }}
                                                          className={`px-2 py-0.5 text-xs font-black rounded-md cursor-pointer transition-all ${
                                                            item.periods === 2
                                                              ? 'bg-emerald-600 text-white shadow-xs'
                                                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                                                          }`}
                                                          title="Select 2 hours for this topic"
                                                        >
                                                          2 hrs
                                                        </button>
                                                      </div>
                                                      {isMissing && (
                                                        <span className="text-[10px] text-rose-600 font-bold block mt-1 whitespace-nowrap">
                                                          Enter 1 or 2 hours
                                                        </span>
                                                      )}
                                                    </div>
                                                  );
                                                })()}
                                              </td>

                                              {/* Course Outcomes column */}
                                              <td className="p-2 text-center align-middle">
                                                <input
                                                  type="text"
                                                  value={Array.isArray(item.coMapping) ? item.coMapping.join(', ') : (item.coMapping || '')}
                                                  onChange={e => {
                                                    const list = [...scheduleItems];
                                                    list[idx] = { ...list[idx], coMapping: e.target.value };
                                                    updateField('lectureScheduleItems', list);
                                                  }}
                                                  placeholder="Mapped COs"
                                                  className="w-full p-1 border border-slate-300 rounded text-xs text-center font-semibold text-slate-800 bg-white"
                                                  title="Mapped Course Outcomes (e.g. CO1, CO6)"
                                                />
                                              </td>

                                              {/* Action column */}
                                              <td className="p-2 text-center align-middle">
                                                <button
                                                  type="button"
                                                  onClick={() => handleDeleteScheduleItem(idx)}
                                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                                  title={isHeader ? `Delete Module ${item.moduleNo} and all its topics` : `Delete Topic ${item.moduleNo}`}
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )}
                                    </tbody>
                                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                                      <tr>
                                        <td colSpan={2} className="p-2.5 text-right font-extrabold text-slate-900">
                                          Total No of Hours / Periods:
                                        </td>
                                        <td className="p-2.5 text-center font-extrabold text-xs">
                                          {(() => {
                                            const sum = scheduleItems.reduce(
                                              (acc, curr) => acc + (Number(curr.periods) || 0),
                                              0
                                            );
                                            const matches = sum >= lectureCriteria.minHours && sum <= lectureCriteria.maxHours;
                                            return (
                                              <div className="flex items-center justify-center space-x-1">
                                                <span className={matches ? 'text-emerald-700 font-extrabold' : 'text-rose-600 font-extrabold'}>
                                                  {sum} hrs / {lectureCriteria.minHours === lectureCriteria.maxHours ? `${lectureCriteria.minHours} hrs` : `${lectureCriteria.minHours}–${lectureCriteria.maxHours} hrs`}
                                                </span>
                                                {matches ? (
                                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                ) : (
                                                  <span className="text-[10px] text-rose-500 font-normal">
                                                    ({sum < lectureCriteria.minHours ? `short by ${lectureCriteria.minHours - sum}` : `exceeds by ${sum - lectureCriteria.maxHours}`})
                                                  </span>
                                                )}
                                              </div>
                                            );
                                          })()}
                                        </td>
                                        <td colSpan={2}></td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
                                  <button
                                    type="button"
                                    onClick={handleAddModule}
                                    className="w-full sm:w-auto px-4 py-2 rounded-xl border border-dashed border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Another Module</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const list = [...scheduleItems];
                                      list.push({
                                        moduleNo: '',
                                        topic: '',
                                        periods: '',
                                        coMapping: '',
                                        source: 'manual',
                                        isEdited: false,
                                      });
                                      updateField('lectureScheduleItems', list);
                                    }}
                                    className="w-full sm:w-auto px-4 py-2 rounded-xl border border-dashed border-slate-300 hover:border-sky-500 bg-white hover:bg-sky-50/50 text-slate-700 hover:text-sky-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Custom Row</span>
                                  </button>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Practical Experiments */}
                    {(course.courseType === 'PRACTICAL' || course.courseType === 'TCP') && (() => {
                      // Parser helper: Auto-splits single text by numbers (1., 2., 3., etc.) into individual experiments
                      const parseExperimentsText = (raw: string): LabExperiment[] => {
                        if (!raw || !raw.trim()) return [];
                        const text = raw.trim();
                        const numberPattern = /(?:^|\s+)(?:(?:Exp(?:eriment)?\s*)?(\d{1,3})[\.\)\:\-]\s*)/gi;
                        const matches: { index: number; end: number; num: number }[] = [];

                        let m: RegExpExecArray | null;
                        while ((m = numberPattern.exec(text)) !== null) {
                          matches.push({
                            index: m.index,
                            end: m.index + m[0].length,
                            num: parseInt(m[1], 10),
                          });
                        }

                        let items: string[] = [];
                        if (matches.length >= 2 || (matches.length === 1 && matches[0].index === 0)) {
                          for (let i = 0; i < matches.length; i++) {
                            const start = matches[i].end;
                            const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
                            const itemText = text.substring(start, end).trim();
                            if (itemText) items.push(itemText);
                          }
                        } else {
                          items = text
                            .split('\n')
                            .map(line => line.trim().replace(/^(?:(?:Exp(?:eriment)?\s*)?\d{1,3}[\.\)\:\-]\s*)/i, '').trim())
                            .filter(line => line.length > 0);
                        }

                        if (items.length === 0) return [];

                        const parsedItems = items.map(itemText => {
                          const hoursRegex = /(?:[\(\[\-–:]\s*)?(\d{1,2})\s*(?:hours?|hrs?|periods?|h)\b[\)\]]?\s*$/i;
                          const match = itemText.match(hoursRegex);
                          let parsedHours: number | undefined;
                          let cleanedName = itemText;
                          if (match) {
                            parsedHours = parseInt(match[1], 10);
                            cleanedName = itemText.replace(hoursRegex, '').trim();
                          }
                          return { name: cleanedName, hours: parsedHours };
                        });

                        const existing = course.experiments || [];
                        const cos = course.courseOutcomes || [];

                        return parsedItems.map((item, idx) => {
                          const prev = existing[idx];
                          const assignedCo = cos[idx % (cos.length || 1)]?.coNo || 'CO1';
                          return {
                            slNo: idx + 1,
                            name: item.name,
                            hours: item.hours !== undefined ? item.hours : prev?.hours,
                            level: prev?.level || 1,
                            objectiveNos: prev?.objectiveNos || [1],
                            coNos: prev?.coNos && prev.coNos.length > 0 ? prev.coNos : [assignedCo],
                          };
                        });
                      };

                      const handleBulkTextChange = (val: string) => {
                        setBulkExperimentsText(val);
                        if (!val.trim()) {
                          updateField('experiments', []);
                          return;
                        }
                        const parsed = parseExperimentsText(val);
                        updateField('experiments', parsed);
                      };

                      return (
                        <div className="space-y-4">
                          {/* Bulk Single Field Paste Box */}
                          <div className="p-4 bg-gradient-to-r from-sky-50/90 to-indigo-50/70 border-2 border-sky-300 rounded-xl space-y-3 shadow-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <Sparkles className="w-4 h-4 text-sky-600" />
                                  <span className="font-bold text-xs text-sky-950 uppercase tracking-wide">
                                    Paste Entire Experiments (Single Field - Auto-divides by numbers)
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 mt-0.5">
                                  Copy and paste the entire numbered list of experiments in a single field. The system automatically analyzes the numbers (1., 2., 3., etc.), divides them into individual experiments, and formats them across the document.
                                </p>
                              </div>
                              <div className="flex items-center space-x-2 self-start sm:self-auto">
                                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-100 text-sky-800 border border-sky-200">
                                  {(course.experiments || []).length} experiment{(course.experiments || []).length === 1 ? '' : 's'} identified
                                </span>
                              </div>
                            </div>

                            <textarea
                              rows={5}
                              value={bulkExperimentsText}
                              onChange={e => handleBulkTextChange(e.target.value)}
                              placeholder={`Paste entire experiments here. For example:\n1. Implement programs using simple statements and expressions - 2 hrs\n2. Implement programs using Scientific problems using Conditionals and Iterative loops - 2 hrs\n3. Implement programs using Strings - 2 hrs`}
                              className="w-full p-3 border border-sky-300 rounded-lg text-xs leading-relaxed font-sans bg-white focus:ring-2 focus:ring-sky-500 text-slate-800 shadow-inner"
                            />

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                              <div className="flex items-center space-x-2 text-slate-500">
                                <span>✓ Automatically parses <code>1.</code>, <code>2.</code>, <code>1)</code>, and optional hours like <code>(2 hrs)</code></span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {bulkExperimentsText && (
                                  <button
                                    type="button"
                                    onClick={() => handleBulkTextChange(bulkExperimentsText)}
                                    className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-md font-bold transition-colors cursor-pointer"
                                  >
                                    Re-analyze & Split
                                  </button>
                                )}
                                {(course.experiments || []).length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const text = (course.experiments || []).map((e, idx) => `${e.slNo || idx + 1}. ${e.name}${e.hours ? ` (${e.hours} hrs)` : ''}`).join('\n');
                                      setBulkExperimentsText(text);
                                    }}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md font-semibold transition-colors cursor-pointer"
                                    title="Sync text box with any edits made to cards below"
                                  >
                                    Sync Text from Cards
                                  </button>
                                )}
                                {bulkExperimentsText && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBulkExperimentsText('');
                                      updateField('experiments', []);
                                    }}
                                    className="px-2.5 py-1 text-rose-600 hover:text-rose-700 hover:underline font-semibold cursor-pointer"
                                  >
                                    Clear Field
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* List of Experiments Cards */}
                          {(() => {
                            const totalExpHours = (course.experiments || []).reduce((sum, e) => sum + (Number(e.hours) || 0), 0);
                            const targetPracticalHours = (course.P || 0) * 12;

                            return (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-xs text-slate-800">Divided Experiment Cards (Editable):</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      Total: {totalExpHours} hrs
                                      {course.courseType === 'TCP' && (course.P || 0) > 0 && (
                                        <span className="font-normal text-slate-500"> / Target ~{targetPracticalHours} hrs (P={course.P})</span>
                                      )}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-500 block mt-0.5">
                                    Specify contact hours, inquiry openness levels (1/2/3), and mapped Course Outcomes for each experiment.
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const cos = course.courseOutcomes || [];
                                    if (cos.length === 0) return;
                                    const updated = (course.experiments || []).map((exp, i) => {
                                      const assignedCo = cos[i % cos.length]?.coNo || 'CO1';
                                      const existing = (exp.coNos || []).filter(c => cos.some(x => x.coNo === c));
                                      const merged = existing.length > 0 ? existing : [assignedCo];
                                      return { ...exp, coNos: merged };
                                    });
                                    // Ensure all COs are covered across all experiments
                                    cos.forEach(co => {
                                      const covered = updated.some(e => (e.coNos || []).includes(co.coNo));
                                      if (!covered && updated.length > 0) {
                                        const target = updated[updated.length - 1];
                                        if (!target.coNos.includes(co.coNo)) {
                                          target.coNos.push(co.coNo);
                                        }
                                      }
                                    });
                                    updateField('experiments', updated);
                                  }}
                                  className="px-2.5 py-1 rounded-lg border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start sm:self-auto cursor-pointer shadow-xs"
                                  title="Automatically distribute Course Outcomes evenly across all experiments"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                                  <span>Auto-map COs</span>
                                </button>
                              </div>
                            );
                          })()}

                          {(course.experiments || []).map((exp, idx) => (
                            <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-700">Exp. {exp.slNo || idx + 1}</span>
                                <button
                                  onClick={() => {
                                    const updated = (course.experiments || []).filter((_, i) => i !== idx).map((e, i) => ({ ...e, slNo: i + 1 }));
                                    updateField('experiments', updated);
                                    setBulkExperimentsText(updated.map(e => `${e.slNo}. ${e.name}${e.hours ? ` (${e.hours} hrs)` : ''}`).join('\n'));
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                  title="Delete experiment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                <div className="md:col-span-7">
                                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                    Experiment Title <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={exp.name || ''}
                                    onChange={e => {
                                      const updated = [...(course.experiments || [])];
                                      updated[idx] = { ...updated[idx], name: e.target.value };
                                      updateField('experiments', updated);
                                      setBulkExperimentsText(updated.map((expItem, i) => `${expItem.slNo || i + 1}. ${expItem.name}${expItem.hours ? ` (${expItem.hours} hrs)` : ''}`).join('\n'));
                                    }}
                                    placeholder={`Experiment ${exp.slNo || idx + 1} Title`}
                                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-sky-500"
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                    Hours {course.courseType === 'TCP' && <span className="text-amber-600 font-bold">*</span>}
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={40}
                                    value={exp.hours ?? ''}
                                    onChange={e => {
                                      const val = e.target.value === '' ? undefined : Math.max(1, parseInt(e.target.value, 10) || 0);
                                      const updated = [...(course.experiments || [])];
                                      updated[idx] = { ...updated[idx], hours: val };
                                      updateField('experiments', updated);
                                      setBulkExperimentsText(updated.map((expItem, i) => `${expItem.slNo || i + 1}. ${expItem.name}${expItem.hours ? ` (${expItem.hours} hrs)` : ''}`).join('\n'));
                                    }}
                                    placeholder="e.g. 2"
                                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-sky-500 text-center font-semibold"
                                  />
                                </div>

                                <div className="md:col-span-3">
                                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Inquiry Level</label>
                                  <select
                                    value={exp.level}
                                    onChange={e => {
                                      const val = parseInt(e.target.value) as 1 | 2 | 3;
                                      const updated = [...(course.experiments || [])];
                                      updated[idx] = { ...updated[idx], level: val };
                                      updateField('experiments', updated);
                                    }}
                                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-sky-500"
                                  >
                                    <option value={1}>Level 1: Structured (Open answers)</option>
                                    <option value={2}>Level 2: Guided (Open methods)</option>
                                    <option value={3}>Level 3: Inquiry (Fully open)</option>
                                  </select>
                                </div>
                              </div>

                              {/* CO Mapping — popup button + summary */}
                              <div className="pt-1.5 border-t border-slate-200/60">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[11px] font-semibold text-slate-500">Mapped COs:</span>
                                  {(exp.coNos || []).length === 0
                                    ? <span className="text-[11px] text-slate-400 italic">None</span>
                                    : (exp.coNos || []).map(coNo => {
                                      const matchedCo = (course.courseOutcomes || []).find(c => c.coNo === coNo);
                                      const domain = getDomainForCourseOutcome(matchedCo);
                                      const pillClass = getDomainPillClass(domain);
                                      return (
                                        <span key={coNo} className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${pillClass}`}>
                                          {coNo}
                                        </span>
                                      );
                                    })
                                  }
                                  <CoMappingPopup
                                    expLabel={`Exp. ${exp.slNo || idx + 1}`}
                                    courseOutcomes={course.courseOutcomes || []}
                                    selectedCoNos={exp.coNos || []}
                                    onToggle={(coNo) => {
                                      const updated = [...(course.experiments || [])];
                                      const current = updated[idx].coNos || [];
                                      const isSelected = current.includes(coNo);
                                      updated[idx] = { ...updated[idx], coNos: isSelected ? current.filter(c => c !== coNo) : [...current, coNo] };
                                      updateField('experiments', updated);
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => {
                              const n = (course.experiments || []).length + 1;
                              const cos = course.courseOutcomes || [];
                              const assignedCo = cos[(n - 1) % (cos.length || 1)]?.coNo || 'CO1';
                              const newExp: LabExperiment = {
                                slNo: n,
                                name: '',
                                hours: course.courseType === 'TCP' ? 2 : undefined,
                                level: 1,
                                objectiveNos: [1],
                                coNos: [assignedCo],
                              };
                              const updated = [...(course.experiments || []), newExp];
                              updateField('experiments', updated);
                              setBulkExperimentsText(updated.map((e, idx) => `${e.slNo || idx + 1}. ${e.name}${e.hours ? ` (${e.hours} hrs)` : ''}`).join('\n'));
                            }}
                            className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-sky-500 bg-white hover:bg-sky-50/50 text-slate-600 hover:text-sky-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Laboratory Experiment</span>
                          </button>

                          <div className="mt-2 space-y-1">
                            <InlineFieldError field="experiments" />
                            {!hasFieldError('experiments') && (course.experiments || []).length > 0 && (
                              <InlineFieldSuccess message="All laboratory experiments and Course Outcome mappings verified compliant" />
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Step 6: Learning Resources */}
                {activeStepId === 'resources' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">6. Learning Resources</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        {course.courseType === 'PRACTICAL'
                          ? 'Must specify at least 1 and up to 6 Reference Books or Laboratory Manuals with publication year. Text Books are optional for laboratory courses.'
                          : 'Must specify 1 to 2 Text Books and 3 to 6 Reference Books with mandatory publication year.'}
                      </p>
                    </div>

                    {/* Text Books */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800">
                          {course.courseType === 'PRACTICAL'
                            ? 'Text Books (Optional for Laboratory courses, up to 2):'
                            : 'Text Books (1–2 required, format: Author, "Title", Publisher, Edition, Year):'}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">
                          {(course.textBooks || []).length} / 2
                        </span>
                      </div>
                      {(course.textBooks || []).map((b, idx) => (
                        <div key={idx} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-700">Text Book {idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (course.textBooks || []).filter((_, i) => i !== idx);
                                updateField('textBooks', updated);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Delete Text Book"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                            <div className="md:col-span-3">
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Author(s) <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={b.authors}
                                onChange={e => {
                                  const updated = [...(course.textBooks || [])];
                                  updated[idx] = { ...updated[idx], authors: e.target.value };
                                  updateField('textBooks', updated);
                                }}
                                placeholder="e.g. A. Silberschatz, P. Galvin"
                                className={`w-full p-2 border rounded-lg text-xs bg-white ${
                                  !b.authors?.trim() ? 'border-amber-300 focus:border-sky-500' : 'border-slate-300'
                                }`}
                              />
                            </div>
                            <div className="md:col-span-4">
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Title <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={b.title}
                                onChange={e => {
                                  const updated = [...(course.textBooks || [])];
                                  updated[idx] = { ...updated[idx], title: e.target.value };
                                  updateField('textBooks', updated);
                                }}
                                placeholder="e.g. Operating System Concepts"
                                className={`w-full p-2 border rounded-lg text-xs bg-white ${
                                  !b.title?.trim() ? 'border-amber-300 focus:border-sky-500' : 'border-slate-300'
                                }`}
                              />
                            </div>
                            <div className="md:col-span-1">
                              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                                Edition
                              </label>
                              <input
                                type="text"
                                value={b.edition || ''}
                                onChange={e => {
                                  const updated = [...(course.textBooks || [])];
                                  updated[idx] = { ...updated[idx], edition: e.target.value };
                                  updateField('textBooks', updated);
                                }}
                                placeholder="10th"
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-center"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                                Publisher
                              </label>
                              <input
                                type="text"
                                value={b.publisher || ''}
                                onChange={e => {
                                  const updated = [...(course.textBooks || [])];
                                  updated[idx] = { ...updated[idx], publisher: e.target.value };
                                  updateField('textBooks', updated);
                                }}
                                placeholder="Wiley"
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Year <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="number"
                                min={1950}
                                max={2030}
                                value={b.year || ''}
                                onChange={e => {
                                  const updated = [...(course.textBooks || [])];
                                  updated[idx] = { ...updated[idx], year: parseInt(e.target.value) || '' };
                                  updateField('textBooks', updated);
                                }}
                                placeholder="2023"
                                className={`w-full p-2 border rounded-lg text-xs bg-white font-bold text-center ${
                                  !b.year ? 'border-amber-300 focus:border-sky-500' : 'border-slate-300'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {(course.textBooks || []).length < 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newBook: LearningResource = {
                              type: 'TEXT',
                              authors: '',
                              title: '',
                              edition: '',
                              publisher: '',
                              year: '' as any,
                            };
                            updateField('textBooks', [...(course.textBooks || []), newBook]);
                          }}
                          className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg bg-[#7B1113] hover:bg-[#5E0D0E] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          <span>+</span><span>Add Text Book</span>
                        </button>
                      )}
                    </div>

                    {/* Reference Books */}
                    <div className="space-y-3 pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800">
                          {course.courseType === 'PRACTICAL'
                            ? 'Reference Books / Lab Manuals (1–6 required):'
                            : 'Reference Books (3–6 required):'}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">
                          {(course.referenceBooks || []).length} / {course.courseType === 'PRACTICAL' ? '1–6' : '3–6'}
                        </span>
                      </div>
                      {(course.referenceBooks || []).map((b, idx) => (
                        <div key={idx} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-700">Reference Book {idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (course.referenceBooks || []).filter((_, i) => i !== idx);
                                updateField('referenceBooks', updated);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Delete Reference Book"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                            <div className="md:col-span-3">
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Author(s) <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={b.authors}
                                onChange={e => {
                                  const updated = [...(course.referenceBooks || [])];
                                  updated[idx] = { ...updated[idx], authors: e.target.value };
                                  updateField('referenceBooks', updated);
                                }}
                                placeholder="e.g. W. Stallings"
                                className={`w-full p-2 border rounded-lg text-xs bg-white ${
                                  !b.authors?.trim() ? 'border-amber-300 focus:border-sky-500' : 'border-slate-300'
                                }`}
                              />
                            </div>
                            <div className="md:col-span-4">
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Title <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={b.title}
                                onChange={e => {
                                  const updated = [...(course.referenceBooks || [])];
                                  updated[idx] = { ...updated[idx], title: e.target.value };
                                  updateField('referenceBooks', updated);
                                }}
                                placeholder="e.g. Operating Systems: Internals and Design Principles"
                                className={`w-full p-2 border rounded-lg text-xs bg-white ${
                                  !b.title?.trim() ? 'border-amber-300 focus:border-sky-500' : 'border-slate-300'
                                }`}
                              />
                            </div>
                            <div className="md:col-span-1">
                              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                                Edition
                              </label>
                              <input
                                type="text"
                                value={b.edition || ''}
                                onChange={e => {
                                  const updated = [...(course.referenceBooks || [])];
                                  updated[idx] = { ...updated[idx], edition: e.target.value };
                                  updateField('referenceBooks', updated);
                                }}
                                placeholder="9th"
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-center"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                                Publisher
                              </label>
                              <input
                                type="text"
                                value={b.publisher || ''}
                                onChange={e => {
                                  const updated = [...(course.referenceBooks || [])];
                                  updated[idx] = { ...updated[idx], publisher: e.target.value };
                                  updateField('referenceBooks', updated);
                                }}
                                placeholder="Pearson"
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Year <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="number"
                                min={1950}
                                max={2030}
                                value={b.year || ''}
                                onChange={e => {
                                  const updated = [...(course.referenceBooks || [])];
                                  updated[idx] = { ...updated[idx], year: parseInt(e.target.value) || '' };
                                  updateField('referenceBooks', updated);
                                }}
                                placeholder="2021"
                                className={`w-full p-2 border rounded-lg text-xs bg-white font-bold text-center ${
                                  !b.year ? 'border-amber-300 focus:border-sky-500' : 'border-slate-300'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {(course.referenceBooks || []).length < 6 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newBook: LearningResource = {
                              type: 'REFERENCE',
                              authors: '',
                              title: '',
                              edition: '',
                              publisher: '',
                              year: '' as any,
                            };
                            updateField('referenceBooks', [...(course.referenceBooks || []), newBook]);
                          }}
                          className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg bg-[#7B1113] hover:bg-[#5E0D0E] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          <span>+</span><span>Add Reference Book</span>
                        </button>
                      )}
                    </div>

                    {/* NPTEL Courses */}
                    <div className="space-y-3 pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-slate-800">
                            NPTEL Courses / Web Resources:
                          </span>
                          <p className="text-[11px] text-slate-500">
                            Format: Course Title; Instructor; Institute (or Web link)
                          </p>
                        </div>
                        <span className="text-xs text-slate-500 font-semibold">
                          {(course.webResources || []).length} added
                        </span>
                      </div>
                      {(course.webResources || []).map((w, idx) => (
                        <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-700">NPTEL Course {idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (course.webResources || []).filter((_, i) => i !== idx);
                                updateField('webResources', updated);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600"
                              title="Delete Course"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <input
                              type="text"
                              value={w.title}
                              onChange={e => {
                                const updated = [...(course.webResources || [])];
                                updated[idx] = { ...updated[idx], title: e.target.value };
                                updateField('webResources', updated);
                              }}
                              placeholder="Course Title / Resource Name"
                              className="p-2 border border-slate-300 rounded text-xs"
                            />
                            <input
                              type="text"
                              value={w.authors || ''}
                              onChange={e => {
                                const updated = [...(course.webResources || [])];
                                updated[idx] = { ...updated[idx], authors: e.target.value };
                                updateField('webResources', updated);
                              }}
                              placeholder="Instructor Name"
                              className="p-2 border border-slate-300 rounded text-xs"
                            />
                            <input
                              type="text"
                              value={w.publisher || ''}
                              onChange={e => {
                                const updated = [...(course.webResources || [])];
                                updated[idx] = { ...updated[idx], publisher: e.target.value };
                                updateField('webResources', updated);
                              }}
                              placeholder="Institute Name"
                              className="p-2 border border-slate-300 rounded text-xs"
                            />
                            <input
                              type="text"
                              value={w.url || ''}
                              onChange={e => {
                                const updated = [...(course.webResources || [])];
                                updated[idx] = { ...updated[idx], url: e.target.value };
                                updateField('webResources', updated);
                              }}
                              placeholder="URL / Web Link"
                              className="p-2 border border-slate-300 rounded text-xs"
                            />
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          const newResource: LearningResource = {
                            type: 'WEB',
                            authors: '',
                            title: '',
                            publisher: '',
                            url: '',
                            year: '' as any,
                          };
                          updateField('webResources', [...(course.webResources || []), newResource]);
                        }}
                        className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg bg-[#7B1113] hover:bg-[#5E0D0E] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                      >
                        <span>+</span><span>Add NPTEL Course</span>
                      </button>
                      <InlineFieldError field="textBooks" />
                      <InlineFieldError field="referenceBooks" />
                      {!hasFieldError('textBooks') && (course.textBooks || []).length > 0 && (
                        <InlineFieldSuccess message="Textbooks verified compliant with publication recency guidelines" />
                      )}
                    </div>
                  </div>
                )}

                {/* Step 7: Course Designers */}
                {activeStepId === 'designers' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">7. Course Designers</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        List course designers with institutional emails.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <span className="font-bold text-xs text-slate-800 block">Course Designers:</span>
                      {(course.designers || []).map((des, idx) => (
                        <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-700">Faculty {idx + 1}</span>
                            {(course.designers || []).length > 1 && (
                              <button
                                onClick={() => {
                                  const updated = (course.designers || []).filter((_, i) => i !== idx);
                                  updateField('designers', updated);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                            {/* Salutation & Faculty Name */}
                            <div className="flex space-x-1.5 md:col-span-4">
                              <select
                                value={
                                  des.salutation !== undefined && des.salutation !== ''
                                    ? des.salutation
                                    : (des.name?.match(/^(Dr\.|Mr\.|Ms\.|Mrs\.|Er\.|Prof\.)/i)?.[1] || '')
                                }
                                onChange={e => {
                                  const newSal = e.target.value;
                                  const updated = [...(course.designers || [])];
                                  const currentRawName = des.name || '';
                                  const cleanName = currentRawName.replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.|Er\.|Prof\.)\s*/i, '').trim();
                                  updated[idx] = {
                                    ...updated[idx],
                                    salutation: newSal,
                                    name: cleanName || currentRawName,
                                  };
                                  updateField('designers', updated);
                                }}
                                className="p-2 border border-slate-300 rounded text-xs bg-white text-slate-800 font-semibold w-24 shrink-0 cursor-pointer"
                                title="Salutation"
                              >
                                <option value="">Salutation</option>
                                <option value="Dr.">Dr.</option>
                                <option value="Mr.">Mr.</option>
                                <option value="Ms.">Ms.</option>
                                <option value="Mrs.">Mrs.</option>
                                <option value="Er.">Er.</option>
                                <option value="Prof.">Prof.</option>
                              </select>
                              <input
                                type="text"
                                value={(() => {
                                  const currentSal = des.salutation !== undefined && des.salutation !== ''
                                    ? des.salutation
                                    : (des.name?.match(/^(Dr\.|Mr\.|Ms\.|Mrs\.|Er\.|Prof\.)/i)?.[1] || '');
                                  if (currentSal) {
                                    return (des.name || '').replace(new RegExp(`^${currentSal.replace('.', '\\.')}\\s*`, 'i'), '');
                                  }
                                  return des.name || '';
                                })()}
                                onChange={e => {
                                  const updated = [...(course.designers || [])];
                                  updated[idx] = { ...updated[idx], name: e.target.value };
                                  updateField('designers', updated);
                                }}
                                placeholder="Faculty Name"
                                className="p-2 border border-slate-300 rounded text-xs font-semibold flex-1 min-w-0"
                              />
                            </div>
                            <div className="md:col-span-3">
                              <select
                                value={
                                  ['Assistant Professor', 'Associate Professor', 'Professor'].find(
                                    opt => opt.toLowerCase() === (des.designation || '').trim().toLowerCase()
                                  ) || des.designation || ''
                                }
                                onChange={e => {
                                  const updated = [...(course.designers || [])];
                                  updated[idx] = { ...updated[idx], designation: e.target.value };
                                  updateField('designers', updated);
                                }}
                                className={`w-full p-2 border border-slate-300 rounded text-xs bg-white ${
                                  !des.designation ? 'text-slate-400' : 'text-slate-800'
                                }`}
                              >
                                <option value="" disabled>
                                  Select Designation
                                </option>
                                {des.designation &&
                                  !['Assistant Professor', 'Associate Professor', 'Professor'].some(
                                    opt => opt.toLowerCase() === (des.designation || '').trim().toLowerCase()
                                  ) && (
                                    <option value={des.designation}>{des.designation}</option>
                                  )}
                                <option value="Assistant Professor" className="text-slate-800">
                                  Assistant Professor
                                </option>
                                <option value="Associate Professor" className="text-slate-800">
                                  Associate Professor
                                </option>
                                <option value="Professor" className="text-slate-800">
                                  Professor
                                </option>
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <input
                                type="text"
                                value={des.department}
                                onChange={e => {
                                  const updated = [...(course.designers || [])];
                                  updated[idx] = { ...updated[idx], department: e.target.value };
                                  updateField('designers', updated);
                                }}
                                placeholder="Department"
                                className="w-full p-2 border border-slate-300 rounded text-xs"
                              />
                            </div>
                            <div className="md:col-span-3">
                              <input
                                type="email"
                                value={des.email}
                                onChange={e => {
                                  const updated = [...(course.designers || [])];
                                  updated[idx] = { ...updated[idx], email: e.target.value };
                                  updateField('designers', updated);
                                }}
                                placeholder="Email ID"
                                className="w-full p-2 border border-slate-300 rounded text-xs font-mono text-[#0000FF] underline font-medium"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          const newDes: CourseDesigner = {
                            salutation: '',
                            name: '',
                            designation: '',
                            department: course.department || '',
                            email: '',
                          };
                          updateField('designers', [...(course.designers || []), newDes]);
                        }}
                        className="w-full py-2 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:text-sky-700 text-xs font-semibold"
                      >
                        + Add Additional Designer
                      </button>
                      <InlineFieldError field="designers" />
                      {!hasFieldError('designers') && (course.designers || []).length > 0 && (
                        <InlineFieldSuccess message="Course designers verified with institutional emails" />
                      )}
                    </div>
                  </div>
                )}

                {/* Step 8: Review & Compliance Audit */}
                {activeStepId === 'review' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">8. Review & Self-Audit</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Final institutional check. Ensure all compliance checklist items pass prior to submitting for Department review.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800">
                          Academic Council Meeting (ACM) Compliance Status:
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            validationReport.isValid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-red-800'
                          }`}
                        >
                          {validationReport.isValid ? 'Ready for Submission' : 'Requires Corrections'}
                        </span>
                      </div>

                      {validationReport.errors.length > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <span className="text-xs font-bold text-red-900 block mb-1">
                            Blocking Issues ({validationReport.errors.length}):
                          </span>
                          <ul className="list-disc pl-4 text-xs text-red-800 space-y-0.5">
                            {validationReport.errors.map(e => (
                              <li key={e.id}>{e.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {validationReport.warnings.length > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <span className="text-xs font-bold text-amber-900 block mb-1">
                            Advisories ({validationReport.warnings.length}):
                          </span>
                          <ul className="list-disc pl-4 text-xs text-amber-800 space-y-0.5">
                            {validationReport.warnings.map(w => (
                              <li key={w.id}>{w.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Wizard Bottom Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-4">
                <button
                  onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                  disabled={currentStep === 0}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="text-xs text-slate-500 font-medium">
                  Step {currentStep + 1} of {steps.length}
                </div>

                {currentStep < steps.length - 1 ? (
                  <div className="flex items-center space-x-3">
                    {!isStepComplete(currentStep) && (
                      <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg hidden sm:inline-flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span>{getStepIncompleteMessage(currentStep)}</span>
                      </span>
                    )}
                    <button
                      onClick={() => {
                        if (!isStepComplete(currentStep)) return;
                        setCurrentStep(prev => Math.min(steps.length - 1, prev + 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={!isStepComplete(currentStep)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${
                        !isStepComplete(currentStep)
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                          : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm active:scale-95 cursor-pointer'
                      }`}
                      title={!isStepComplete(currentStep) ? getStepIncompleteMessage(currentStep) : 'Next Step'}
                    >
                      <span>Next</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSubmitForReview}
                    disabled={!validationReport.isValid || course.status === 'FINALIZED'}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all ${
                      validationReport.isValid && course.status !== 'FINALIZED'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit for Review</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};







