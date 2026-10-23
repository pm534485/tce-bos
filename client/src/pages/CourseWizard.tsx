import React, { useState, useEffect, useRef } from 'react';
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
  CATEGORY_CODES,
  CATEGORY_ABBREVIATIONS,
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
} from '@syllabusforge/shared';
import { LiveCompliancePanel } from '../components/LiveCompliancePanel';
import { DocumentPreview } from '../components/DocumentPreview';
import {
  CheckCircle,
  AlertCircle,
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

  // Admin configured active regulation state
  const [adminRegulation, setAdminRegulation] = useState<{ year: number; code: string }>({ year: 2026, code: '26' });

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

  // Course Form State - Starts empty with no pre-selected values for new courses
  const [course, setCourse] = useState<Course>({
    courseType: courseTypeParam,
    regulationYear: 2026,
    regulationCode: '26',
    programmeCode: '',
    categoryLetter: '',
    uniqueLetter: '',
    version: '' as any,
    courseCode: '',
    courseName: '',
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
        name: user?.name || '',
        designation: user?.designation || '',
        department: user?.department || '',
        email: user?.email || '',
      },
    ],
    status: 'DRAFT',
    createdBy: user?.email || '',
    department: user?.department || '',
    comments: [],
  });

  // Load existing course or catalog codes, and active regulation
  useEffect(() => {
    async function loadData() {
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
          setCourse(fetched);
          setLastSaved(new Date());
        } else {
          // Auto-apply active regulation from admin
          if (regRes && regRes.regulationCode) {
            setCourse(prev => ({
              ...prev,
              regulationYear: regRes.regulationYear,
              regulationCode: regRes.regulationCode,
              P: prev.courseType === 'THEORY' ? 0 : prev.P,
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load course or regulation:', err);
      }
    }
    loadData();
  }, [id]);

  // Compute live validation report
  const otherCodes = course._id
    ? existingCodes.filter(c => c !== course.courseCode)
    : existingCodes;
  const validationReport = validateCourse(course, otherCodes);

  // Real-time field-level validation helpers
  const getFieldErrors = (fieldName: string) => {
    return validationReport.errors.filter(e => e.field === fieldName || e.field.startsWith(`${fieldName}.`));
  };

  const hasFieldError = (fieldName: string) => {
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
  const displaySubjectCode = hasEnteredAnyCode ? `${regPart}${progPart}${catPart}${uniquePart}${verPart}` : '—';

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
        ((course.modules || []).length === 0 || (course.modules || []).every(m => (m.mainTopic || '').trim().length > 0)) &&
        !validationReport.errors.some(e => e.field.startsWith('experiments') || e.field.startsWith('coursePlan'))
      : (course.modules || []).length > 0 &&
        (course.modules || []).every(m => (m.mainTopic || '').trim().length > 0 && (m.subtopics || []).length > 0) &&
        !validationReport.errors.some(e => e.field.startsWith('modules'))
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
    switch (stepIdx) {
      case 0: return isStep0Complete;
      case 1: return isStep1Complete;
      case 2: return isStep2Complete;
      case 3: return isStep3Complete;
      case 4: return isStep4Complete;
      case 5: return isStep5Complete;
      case 6: return isStep6Complete;
      case 7: return true;
      default: return true;
    }
  };

  const getStepIncompleteMessage = (stepIdx: number): string => {
    switch (stepIdx) {
      case 0: return 'Complete all required course code & credits details to continue';
      case 1: return 'Complete preamble (max 90 words) to continue';
      case 2: {
        const numCr = Number(course.credits) || 0;
        const validCount = (course.courseOutcomes || []).filter(co => Boolean((co.statement || '').trim())).length;
        if (course.courseType === 'PRACTICAL') {
          const req = numCr <= 1 ? 3 : 4;
          return `Practical (${numCr || 1} credit${numCr === 1 ? '' : 's'}) requires at least ${req} Course Outcomes with statements to continue (currently ${validCount}/${req})`;
        }
        const req = numCr < 3 && numCr > 0 ? (numCr === 1 ? 3 : 4) : 6;
        return `Theory (${numCr || 3} credits) requires minimum ${req} Course Outcomes with statements to continue (currently ${validCount}/${req})`;
      }
      case 3: return 'Complete assessment marks distribution (each component must total 100%) to continue';
      case 4: {
        if (course.courseType === 'PRACTICAL') {
          const exps = course.experiments || [];
          if (exps.length === 0) return 'Add at least one laboratory experiment to continue';
          const emptyExp = exps.find(e => !(e.name || '').trim());
          if (emptyExp) return `Experiment ${emptyExp.slNo || 1} title is missing - enter a title to continue`;
          const expErrs = validationReport.errors.filter(e => e.field.startsWith('experiments'));
          if (expErrs.length > 0) return `${expErrs[0].message} (${expErrs[0].fixHint || 'Map all COs to continue'})`;
          return 'Complete laboratory experiments to continue';
        }
        return 'Complete all syllabus modules & topics to continue';
      }
      case 5: {
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
      case 6: return 'Add course designer details (name and email) to continue';
      default: return 'Please complete required details to continue';
    }
  };

  // Debounced auto-save (Local + Backend)
  const saveTimeoutRef = useRef<any>(null);
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
      } else if (isStep0Complete && course.courseName?.trim()) {
        try {
          setIsSaving(true);
          const saved = await api.createCourse(course);
          setCourse(saved);
          setLastSaved(new Date());
          setIsSaving(false);
          navigate(`/courses/${saved._id}`, { replace: true });
        } catch (e) {
          setIsSaving(false);
        }
      }
    }, 2500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [course, isAutoSaveEnabled, isStep0Complete]);

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
  const updateField = (field: keyof Course, value: any) => {
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
        const cat = CATEGORY_CODES.find(c => c.code === value);
        if (cat) {
          updated.categoryAbbr = cat.defaultAbbr as any;
        }
      }

      // Recalculate credits
      if (['L', 'T', 'P'].includes(field)) {
        updated.credits = computeCredits(Number(updated.L) || 0, Number(updated.T) || 0, Number(updated.P) || 0, updated.courseType);
      }

      // Auto-sync semesterType
      if (field === 'semester') {
        const s = Number(value) || 1;
        updated.semesterType = s % 2 === 0 ? 'EVEN' : 'ODD';
      }

      return updated;
    });
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
      const term = distribute(allIndices);

      const matrix = cos.map((c, i) => ({
        coNo: c.coNo,
        cat1: t1[i],
        theoryCat1: t1[i],
        cat2: t2[i],
        theoryCat2: t2[i],
        practicalCa: ca[i],
        practicalModel: model[i],
        terminalExam: term[i],
        tcpTerminal: term[i],
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
        cat1: 0,
        theoryCat1: 0,
        cat2: 0,
        theoryCat2: 0,
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

  // Stepper definition
  const steps = [
    { id: 'identity', title: '1. Course Code & Credits', desc: 'Code, title, L-T-P & credits' },
    { id: 'preamble', title: '2. Preamble & Prerequisites', desc: 'Course context & prior courses' },
    { id: 'cos', title: '3. Course Outcomes', desc: 'TPS taxonomy & weightages' },
    { id: 'assessment', title: '4. Assessment Pattern', desc: 'Continuous & Terminal exam' },
    {
      id: 'syllabus',
      title: course.courseType === 'PRACTICAL' ? '5. Syllabus & Experiments' : '5. Syllabus & Content',
      desc: course.courseType === 'PRACTICAL' ? 'Modules, Schedule & Experiments' : 'Modules & Schedule',
    },
    { id: 'resources', title: '6. Learning Resources', desc: 'Text & reference books' },
    { id: 'designers', title: '7. Course Designers', desc: 'Faculty details & emails' },
    { id: 'review', title: '8. Review & Submit', desc: '17-point compliance audit' },
  ];

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Minimal Sleek Header Bar - Compact single row, no redundant details */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-6 lg:px-8 py-1.5 sticky top-[46px] z-30 flex items-center justify-between shadow-xs h-11">
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
          </div>
        </div>

        {/* Tab & Action Bar */}
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          {/* Live Validation Pill */}
          {validationReport.errors.length > 0 ? (
            <span className="hidden sm:inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 mr-1" />
              {validationReport.errors.length} Issue{validationReport.errors.length === 1 ? '' : 's'}
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mr-1" />
              Regulation 2026 Ready
            </span>
          )}

          {/* Autosave Status */}
          <div className="text-xs text-slate-500 hidden md:flex items-center space-x-1">
            {isSaving ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin text-sky-600" />
                <span>Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Saved</span>
              </>
            ) : null}
          </div>

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

          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="px-3 py-1 rounded-md border border-[#C59B27]/40 bg-white hover:bg-[#FAF7F2] text-[#7B1113] text-xs font-bold shadow-xs flex items-center space-x-1 transition-colors"
          >
            <Save className="w-3 h-3 text-[#C59B27]" />
            <span>Save Draft</span>
          </button>

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
      <div className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col">
        {activeTab === 'preview' ? (
          <div className="flex-1">
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

            {/* Center Wizard Form Container */}
            <div className="flex-1 w-full bg-white border border-slate-200 border-t-4 border-t-[#800020] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div>
                {/* ============================================================== */}
                {/* PERSISTENT TCE INSTITUTIONAL COURSE HEADER (OFFICIAL TABLE)   */}
                {/* ============================================================== */}
                <div className="mb-6">
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
                        className="md:col-span-5 p-3.5 sm:p-4 flex items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-900 bg-white cursor-pointer hover:bg-slate-50 transition-colors group"
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
                      </div>

                      {/* Column 3: Category, LTP & Credits Table */}
                      <div
                        onClick={() => setCurrentStep(0)}
                        className="md:col-span-4 grid grid-cols-5 border-collapse text-center cursor-pointer hover:bg-slate-50 transition-colors"
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
                        <div className="p-2 text-xs font-semibold text-slate-800 border-b border-slate-900 bg-white">
                          Credits
                        </div>

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
                        <div className="p-2.5 text-xs sm:text-sm font-black text-slate-950 flex items-center justify-center">
                          {course.credits !== undefined && course.credits !== null && course.credits !== ('' as any) && Number(course.credits) > 0 ? (
                            course.credits
                          ) : (
                            <span className="text-slate-400 font-bold select-none">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 1: Course Code & Credits */}
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Course Code & Credits</h2>
                    </div>

                    {/* Course Code 5-Component Direct Selector */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="grid grid-cols-12 gap-2.5 text-center text-xs">
                        {/* 1. RR: Regulation (Admin Configured, Read-Only, Narrower) */}
                        <div className="col-span-4 sm:col-span-2 p-2.5 bg-slate-100/90 rounded-xl border-2 border-slate-200 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">RR</span>
                            <span className="text-[9px] text-slate-600 font-bold bg-slate-200/90 px-1 py-0.5 rounded flex items-center space-x-0.5" title="Regulation is set by Administrator and cannot be changed by staff">
                              <Lock className="w-2.5 h-2.5 inline mr-0.5" />
                              Fixed
                            </span>
                          </div>
                          <div className="my-1">
                            <span className="font-black text-base sm:text-lg text-slate-900 block text-center" title="Institutional Regulation (Admin Configured)">
                              {course.regulationCode || adminRegulation.code}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 block font-medium">Reg. {course.regulationYear || adminRegulation.year}</span>
                        </div>

                        {/* 2. AA: Programme Code (Wider / Longer) */}
                        <div className="col-span-8 sm:col-span-3 p-2.5 bg-white rounded-xl border-2 border-slate-200 hover:border-[#7B1113] hover:shadow-xs transition-all flex flex-col justify-between group">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">AA</span>
                            <span className="text-[9px] text-[#0F2942] font-bold bg-[#0F2942]/10 px-1 rounded">Prog</span>
                          </div>
                          <div className="my-1">
                            <select
                              value={course.programmeCode || ''}
                              onChange={e => updateField('programmeCode', e.target.value)}
                              className="w-full text-center font-black text-sm sm:text-base text-[#0F2942] bg-transparent border-0 focus:ring-2 focus:ring-[#0F2942] rounded cursor-pointer p-0"
                              title="Click to select Programme"
                            >
                              <option value="" disabled>Select programme</option>
                              {PROGRAMME_CODES.map(p => (
                                <option key={p.code} value={p.code}>
                                  {p.code} — {p.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <span
                            className="text-[10px] text-slate-600 block font-medium truncate"
                            title={PROGRAMME_CODES.find(p => p.code === course.programmeCode)?.name || 'Select programme'}
                          >
                            {PROGRAMME_CODES.find(p => p.code === course.programmeCode)?.name || 'Select programme'}
                          </span>
                        </div>

                        {/* 3. C: Category Code (Wider / Longer) */}
                        <div className="col-span-6 sm:col-span-3 p-2.5 bg-white rounded-xl border-2 border-slate-200 hover:border-[#7B1113] hover:shadow-xs transition-all flex flex-col justify-between group">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">C</span>
                            <span className="text-[9px] text-[#7B1113] font-bold bg-[#7B1113]/10 px-1 rounded">Cat</span>
                          </div>
                          <div className="my-1">
                            <select
                              value={course.categoryLetter || ''}
                              onChange={e => updateField('categoryLetter', e.target.value)}
                              className="w-full text-center font-black text-sm sm:text-base text-[#7B1113] bg-transparent border-0 focus:ring-2 focus:ring-[#7B1113] rounded cursor-pointer p-0"
                              title="Click to select Category"
                            >
                              <option value="" disabled>Select category</option>
                              {CATEGORY_CODES.map(c => (
                                <option key={c.code} value={c.code}>
                                  {c.code} — {c.name} ({c.defaultAbbr})
                                </option>
                              ))}
                            </select>
                          </div>
                          <span
                            className="text-[10px] text-slate-600 block font-medium truncate"
                            title={CATEGORY_CODES.find(c => c.code === course.categoryLetter)?.name || 'Select category'}
                          >
                            {course.categoryLetter
                              ? `${course.categoryAbbr || 'Cat'} (${CATEGORY_CODES.find(c => c.code === course.categoryLetter)?.name?.split(' ')[0] || 'Core'})`
                              : 'Select category'}
                          </span>
                        </div>

                        {/* 4. U: Unique Letter (Narrower) */}
                        <div className="col-span-3 sm:col-span-2 p-2.5 bg-white rounded-xl border-2 border-slate-200 hover:border-[#7B1113] hover:shadow-xs transition-all flex flex-col justify-between group">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">U</span>
                            <span className="text-[9px] text-sky-700 font-bold bg-sky-100 px-1 rounded">A-Z</span>
                          </div>
                          <div className="my-1">
                            <select
                              value={course.uniqueLetter || ''}
                              onChange={e => updateField('uniqueLetter', e.target.value.toUpperCase())}
                              className="w-full text-center font-black text-base sm:text-lg text-[#0F2942] bg-transparent border-0 focus:ring-2 focus:ring-[#0F2942] rounded cursor-pointer p-0"
                              title="Click to select Unique Letter"
                            >
                              <option value="" disabled>Letter</option>
                              {VALID_UNIQUE_LETTERS.map(letter => (
                                <option key={letter} value={letter}>
                                  {letter}
                                </option>
                              ))}
                            </select>
                          </div>
                          <span className="text-[10px] text-slate-500 block font-medium">Letter</span>
                        </div>

                        {/* 5. V: Version (Narrower) */}
                        <div className="col-span-3 sm:col-span-2 p-2.5 bg-white rounded-xl border-2 border-slate-200 hover:border-[#7B1113] hover:shadow-xs transition-all flex flex-col justify-between group">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">V</span>
                            <span className="text-[9px] text-slate-600 font-bold bg-slate-100 px-1 rounded">Ver</span>
                          </div>
                          <div className="my-1">
                            <select
                              value={course.version !== undefined && course.version !== null && course.version !== ('' as any) ? course.version : ''}
                              onChange={e => updateField('version', e.target.value === '' ? ('' as any) : Number(e.target.value))}
                              className="w-full text-center font-black text-base sm:text-lg text-slate-900 bg-transparent border-0 focus:ring-2 focus:ring-slate-600 rounded cursor-pointer p-0"
                              title="Click to select Version"
                            >
                              <option value="" disabled>Ver</option>
                              {[0, 1, 2, 3, 4, 5].map(v => (
                                <option key={v} value={v}>
                                  {v}
                                </option>
                              ))}
                            </select>
                          </div>
                          <span className="text-[10px] text-slate-500 block font-medium">
                            {course.version !== undefined && course.version !== null && course.version !== ('' as any) ? `Version ${course.version}` : 'Version'}
                          </span>
                        </div>
                      </div>

                      {(hasFieldError('uniqueLetter') || hasFieldError('courseCode')) && (
                        <div className="mt-2 text-xs text-red-600 font-semibold flex items-center space-x-1">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          <span>Code configuration error</span>
                        </div>
                      )}
                    </div>

                    {/* Course Title Field & Category Abbreviation */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
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
                          placeholder="Enter course title"
                          className={`w-full px-3.5 py-2.5 border rounded-lg text-sm font-medium transition-all ${
                            hasFieldError('courseName')
                              ? 'border-red-400 bg-red-50/20 text-slate-900 focus:ring-2 focus:ring-red-200 focus:border-red-500'
                              : 'border-slate-300 focus:ring-2 focus:ring-sky-500'
                          }`}
                        />
                        <InlineFieldError field="courseName" />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Category Abbreviation <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={course.categoryAbbr || ''}
                          onChange={e => updateField('categoryAbbr', e.target.value as any)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 font-medium"
                        >
                          <option value="" disabled>Select abbreviation</option>
                          {CATEGORY_ABBREVIATIONS.map(abbr => (
                            <option key={abbr} value={abbr}>
                              {abbr}
                            </option>
                          ))}
                        </select>
                        <InlineFieldError field="categoryAbbr" />
                      </div>
                    </div>

                    {/* Contact Hours & Credits Row */}
                    <div className="pt-2 border-t border-slate-200 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Lecture (L)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={course.L === ('' as any) ? '' : (course.L ?? '')}
                            onChange={e => updateField('L', e.target.value === '' ? ('' as any) : parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center font-bold focus:ring-2 focus:ring-sky-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Tutorial (T)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={course.T === ('' as any) ? '' : (course.T ?? '')}
                            onChange={e => updateField('T', e.target.value === '' ? ('' as any) : parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center font-bold focus:ring-2 focus:ring-sky-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Practical (P)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={course.courseType === 'THEORY' ? 0 : (course.P === ('' as any) ? '' : (course.P ?? ''))}
                            disabled={course.courseType === 'THEORY'}
                            onChange={e => updateField('P', e.target.value === '' ? ('' as any) : parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center font-bold focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                            title={course.courseType === 'THEORY' ? 'Practical is disabled for theory courses' : 'Practical contact hours'}
                          />
                        </div>

                        <div className="p-2 bg-sky-50 border border-sky-200 rounded-lg text-center flex flex-col justify-center">
                          <label className="block text-[11px] font-bold text-sky-900 mb-0.5">
                            Credits
                          </label>
                          <span className="text-lg font-extrabold text-sky-700">
                            {course.credits !== undefined && course.credits !== null && course.credits !== ('' as any) ? course.credits : '—'}
                          </span>
                        </div>
                      </div>

                      {/* TCP TE Exam Type */}
                      {course.courseType === 'TCP' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Terminal Examination Type (TE Type) <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={course.teExamType || ''}
                            onChange={e => updateField('teExamType', e.target.value as any)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500"
                          >
                            <option value="" disabled>Select TE Exam Type</option>
                            <option value="TCP-T">TCP-T (Theory Examination 50%)</option>
                            <option value="TCP-P">TCP-P (Practical Examination 50%)</option>
                          </select>
                        </div>
                      )}

                      {/* Inline error feedback */}
                      <InlineFieldError field="credits" />
                      <InlineFieldError field="L" />
                      <InlineFieldError field="T" />
                      <InlineFieldError field="P" />
                    </div>
                  </div>
                )}

                {/* Step 2: Preamble & Prerequisites */}
                {currentStep === 1 && (() => {
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
                          placeholder="Enter course preamble (strictly maximum 90 words, single coherent paragraph)..."
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
                                  placeholder="Enter course code"
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
                                  placeholder="Enter course title"
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
                {currentStep === 2 && (
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
                      <div className="flex items-center space-x-2">
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

                    {/* Practical General CO Pool Picker */}
                    {course.courseType === 'PRACTICAL' && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-xs font-bold text-slate-800 block mb-2">
                          Add from Institutional General CO Pool:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {GENERAL_CO_POOL.map(g => (
                            <button
                              key={g.code}
                              onClick={() => {
                                const newCo: CourseOutcome = {
                                  coNo: `CO${(course.courseOutcomes || []).length + 1}`,
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
                                updateField('courseOutcomes', [...(course.courseOutcomes || []), newCo]);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium border bg-white hover:bg-sky-50 border-slate-300 text-slate-700 hover:text-sky-700 transition-colors"
                            >
                              + {g.code} ({g.domain}, TPS {g.tpsLevel})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CO Table Rows */}
                    <div className="space-y-4">
                      {(course.courseOutcomes || []).map((co, idx) => (
                        <div
                          key={idx}
                          className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-800">
                              {co.coNo || `CO${idx + 1}`}
                            </span>
                            <div className="flex items-center space-x-2">
                              {/* Verb Helper Pill */}
                              <div className="text-xs text-slate-500">
                                Approved TPS {co.tpsLevel} Verbs: {TPS_VERBS[co.tpsLevel]?.slice(0, 4).join(', ')}
                              </div>
                              <button
                                onClick={() => {
                                  const updated = (course.courseOutcomes || []).filter((_, i) => i !== idx);
                                  // renumber
                                  const renumbered = updated.map((c, i) => ({ ...c, coNo: `CO${i + 1}` }));
                                  updateField('courseOutcomes', renumbered);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                            <div className="md:col-span-8">
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Outcome Statement (must start with TPS {co.tpsLevel} verb)
                              </label>
                              <textarea
                                rows={2}
                                value={co.statement || ''}
                                onChange={e => {
                                  const updated = [...(course.courseOutcomes || [])];
                                  updated[idx] = { ...updated[idx], statement: e.target.value };
                                  updateField('courseOutcomes', updated);
                                }}
                                placeholder="Enter course outcome statement"
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                TPS Level
                              </label>
                              <select
                                value={co.tpsLevel}
                                onChange={e => {
                                  const level = parseInt(e.target.value);
                                  const updated = [...(course.courseOutcomes || [])];
                                  updated[idx] = { ...updated[idx], tpsLevel: level };
                                  updateField('courseOutcomes', updated);
                                }}
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                              >
                                <option value={1}>TPS 1 (Remember)</option>
<option value={2}>TPS 2 (Understand)</option>
<option value={3}>TPS 3 (Apply)</option>
<option value={4}>TPS 4 (Analyze)</option>
<option value={5}>TPS 5 (Evaluate)</option>
<option value={6}>TPS 6 (Create)</option>
                              </select>
                            </div>

                            <div className="md:col-span-2">
                              <PiCheckboxSelector
                                value={co.pi || ''}
                                coNo={co.coNo}
                                onChange={(newPi, matchedTpsLevel) => {
                                  const updated = [...(course.courseOutcomes || [])];
                                  updated[idx] = {
                                    ...updated[idx],
                                    pi: newPi,
                                    ...(matchedTpsLevel ? { tpsLevel: matchedTpsLevel } : {}),
                                  };
                                  updateField('courseOutcomes', updated);
                                }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                            {(course.courseType === 'THEORY' || course.courseType === 'TCP') && (
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                  CO Weightage (%)
                                </label>
                                <input
                                  type="number"
                                  min={8}
                                  max={20}
                                  value={co.weightage || 0}
                                  onChange={e => {
                                    const val = parseInt(e.target.value) || 0;
                                    const updated = [...(course.courseOutcomes || [])];
                                    updated[idx] = { ...updated[idx], weightage: val };
                                    updateField('courseOutcomes', updated);
                                  }}
                                  className="w-full p-2 border border-slate-300 rounded-lg text-xs text-center font-bold"
                                />
                              </div>
                            )}

                            {course.courseType === 'PRACTICAL' && (
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                  Objective (1–13)
                                </label>
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
                                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                                >
                                  {LAB_OBJECTIVES.map(o => (
                                    <option key={o.no} value={o.no}>
                                      {o.no}. {o.name} ({o.domain})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <div>
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

                            <div>
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
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs text-center font-bold disabled:bg-slate-100 disabled:text-slate-400"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

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
                {currentStep === 3 && (
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
                                            value={rowData.cat1 || 0}
                                            onChange={e => updateCell('cat1', parseInt(e.target.value) || 0)}
                                            className="w-16 p-1.5 border border-slate-300 rounded text-center text-xs font-semibold"
                                          />
                                        </td>
                                        <td className="p-2 text-center">
                                          <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={rowData.assignment1 || 0}
                                            onChange={e => updateCell('assignment1', parseInt(e.target.value) || 0)}
                                            className="w-16 p-1.5 border border-slate-300 rounded text-center text-xs font-semibold"
                                          />
                                        </td>
                                        <td className="p-2 text-center">
                                          <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={rowData.cat2 || 0}
                                            onChange={e => updateCell('cat2', parseInt(e.target.value) || 0)}
                                            className="w-16 p-1.5 border border-slate-300 rounded text-center text-xs font-semibold"
                                          />
                                        </td>
                                        <td className="p-2 text-center">
                                          <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={rowData.assignment2 || 0}
                                            onChange={e => updateCell('assignment2', parseInt(e.target.value) || 0)}
                                            className="w-16 p-1.5 border border-slate-300 rounded text-center text-xs font-semibold"
                                          />
                                        </td>
                                        <td className="p-2 text-center bg-sky-50/30">
                                          <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={rowData.terminalExam || 0}
                                            onChange={e => updateCell('terminalExam', parseInt(e.target.value) || 0)}
                                            className="w-16 p-1.5 border border-sky-300 bg-white rounded text-center text-xs font-bold text-sky-900"
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

                    {/* Practical Component Table (Fixed by guideline & Assessment Pattern Grid) */}
                    {course.courseType === 'PRACTICAL' && (
                      <div className="space-y-5">
                        <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
                          <span className="font-bold text-xs text-emerald-900 block">
                            Standard Laboratory Assessment Framework (200 Marks Total):
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                            <div className="p-3 bg-white rounded-lg border border-emerald-200">
                              <span className="text-slate-500 block">Continuous Assessment</span>
                              <span className="text-lg font-extrabold text-emerald-700">75 Marks</span>
                              <span className="text-[10px] text-slate-400 block">Pre/In/Post lab</span>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-emerald-200">
                              <span className="text-slate-500 block">Model Test</span>
                              <span className="text-lg font-extrabold text-emerald-700">25 Marks</span>
                              <span className="text-[10px] text-slate-400 block">Rubrics 3 domains</span>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-emerald-200">
                              <span className="text-slate-500 block">Total Internal</span>
                              <span className="text-lg font-extrabold text-emerald-700">100 Marks</span>
                              <span className="text-[10px] text-slate-400 block">Continuous + Model</span>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-emerald-200">
                              <span className="text-slate-500 block">End Semester Exam</span>
                              <span className="text-lg font-extrabold text-emerald-700">100 Marks</span>
                              <span className="text-[10px] text-slate-400 block">Rubrics 3 domains</span>
                            </div>
                          </div>
                        </div>

                        {/* Laboratory Assessment Pattern Grid */}
                        <div className="space-y-3 pt-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h3 className="text-base font-bold text-slate-900">
                                Laboratory Assessment Pattern (Mark Distribution)
                              </h3>
                              <p className="text-xs text-slate-500">
                                Mark percentage distribution across Theory (CAT1, CAT2), Practical (OCR/Continuous Assessment, Model Test CO-wise), and Terminal Exam {(course.courseType === 'PRACTICAL' || course.teExamType === 'TCP-P') ? '(Practical)' : '(Theory)'}. Each column must sum to exactly 100%.
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
                                        className="border border-black p-2 text-center align-middle font-bold text-black w-[10%]"
                                      >
                                        CO
                                      </th>
                                      <th
                                        colSpan={2}
                                        className="border border-black p-2 text-center font-bold text-black"
                                      >
                                        Theory
                                      </th>
                                      <th
                                        colSpan={2}
                                        className="border border-black p-2 text-center font-bold text-black"
                                      >
                                        Practical
                                      </th>
                                      <th
                                        rowSpan={2}
                                        className="border border-black p-2 text-center align-middle font-bold text-black w-[18%]"
                                      >
                                        Terminal Exam<br />{(course.courseType === 'PRACTICAL' || course.teExamType === 'TCP-P') ? '(Practical)' : '(Theory)'}
                                      </th>
                                    </tr>
                                    <tr>
                                      <th className="border border-black p-2 text-center font-bold text-black w-[18%]">
                                        CAT1
                                      </th>
                                      <th className="border border-black p-2 text-center font-bold text-black w-[18%]">
                                        CAT2
                                      </th>
                                      <th className="border border-black p-2 text-center font-bold text-black w-[18%]">
                                        OCR/Continuous Assessment
                                      </th>
                                      <th className="border border-black p-2 text-center font-bold text-black w-[18%]">
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
                                      const cat1Val = rawRow?.theoryCat1 !== undefined
                                        ? rawRow.theoryCat1
                                        : (rawRow?.cat1 !== undefined ? rawRow.cat1 : '');
                                      const cat2Val = rawRow?.theoryCat2 !== undefined
                                        ? rawRow.theoryCat2
                                        : (rawRow?.cat2 !== undefined ? rawRow.cat2 : (rawRow?.assignment1 !== undefined ? rawRow.assignment1 : ''));
                                      const caVal = rawRow?.practicalCa !== undefined
                                        ? rawRow.practicalCa
                                        : '';
                                      const modelVal = rawRow?.practicalModel !== undefined
                                        ? rawRow.practicalModel
                                        : '';
                                      const termVal = rawRow?.terminalExam !== undefined
                                        ? rawRow.terminalExam
                                        : (rawRow?.tcpTerminal !== undefined ? rawRow.tcpTerminal : '');

                                      const updateCell = (col: 'theoryCat1' | 'theoryCat2' | 'practicalCa' | 'practicalModel' | 'terminalExam', valStr: string) => {
                                        const numVal = valStr === '' ? 0 : Math.max(0, Math.min(100, parseInt(valStr, 10) || 0));
                                        const matrix = [...(course.assessmentMatrix || [])];
                                        const idx = matrix.findIndex(r => r.coNo === co.coNo);
                                        if (idx >= 0) {
                                          const existing = matrix[idx];
                                          matrix[idx] = {
                                            ...existing,
                                            coNo: co.coNo,
                                            theoryCat1: col === 'theoryCat1' ? numVal : (existing.theoryCat1 ?? existing.cat1 ?? 0),
                                            cat1: col === 'theoryCat1' ? numVal : (existing.cat1 ?? existing.theoryCat1 ?? 0),
                                            theoryCat2: col === 'theoryCat2' ? numVal : (existing.theoryCat2 ?? existing.cat2 ?? existing.assignment1 ?? 0),
                                            cat2: col === 'theoryCat2' ? numVal : (existing.cat2 ?? existing.theoryCat2 ?? 0),
                                            practicalCa: col === 'practicalCa' ? numVal : (existing.practicalCa ?? 0),
                                            practicalModel: col === 'practicalModel' ? numVal : (existing.practicalModel ?? 0),
                                            terminalExam: col === 'terminalExam' ? numVal : (existing.terminalExam ?? existing.tcpTerminal ?? 0),
                                            tcpTerminal: col === 'terminalExam' ? numVal : (existing.tcpTerminal ?? existing.terminalExam ?? 0),
                                            [col]: numVal,
                                          };
                                        } else {
                                          matrix.push({
                                            coNo: co.coNo,
                                            theoryCat1: col === 'theoryCat1' ? numVal : 0,
                                            cat1: col === 'theoryCat1' ? numVal : 0,
                                            theoryCat2: col === 'theoryCat2' ? numVal : 0,
                                            cat2: col === 'theoryCat2' ? numVal : 0,
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
                                            <span className="font-bold">{co.coNo}</span>
                                            {co.tpsLevel && (
                                              <span className="block text-[10px] text-slate-500 font-medium">
                                                TPS {co.tpsLevel}
                                              </span>
                                            )}
                                          </td>
                                          <td className="border border-black p-1.5 text-center">
                                            <input
                                              type="number"
                                              min={0}
                                              max={100}
                                              value={cat1Val && Number(cat1Val) > 0 ? cat1Val : ''}
                                              placeholder="0"
                                              onChange={e => updateCell('theoryCat1', e.target.value)}
                                              className="w-16 p-1 border border-slate-300 rounded text-center text-xs font-semibold focus:outline-sky-500"
                                            />
                                          </td>
                                          <td className="border border-black p-1.5 text-center">
                                            <input
                                              type="number"
                                              min={0}
                                              max={100}
                                              value={cat2Val && Number(cat2Val) > 0 ? cat2Val : ''}
                                              placeholder="0"
                                              onChange={e => updateCell('theoryCat2', e.target.value)}
                                              className="w-16 p-1 border border-slate-300 rounded text-center text-xs font-semibold focus:outline-sky-500"
                                            />
                                          </td>
                                          <td className="border border-black p-1.5 text-center">
                                            <input
                                              type="number"
                                              min={0}
                                              max={100}
                                              value={caVal && Number(caVal) > 0 ? caVal : ''}
                                              placeholder="0"
                                              onChange={e => updateCell('practicalCa', e.target.value)}
                                              className="w-16 p-1 border border-slate-300 rounded text-center text-xs font-semibold focus:outline-sky-500"
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
                                              className="w-16 p-1 border border-slate-300 rounded text-center text-xs font-semibold focus:outline-sky-500"
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
                                              className="w-16 p-1 border border-slate-300 rounded text-center text-xs font-semibold focus:outline-sky-500"
                                            />
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  <tfoot>
                                    {(() => {
                                      const cos = course.courseOutcomes || [];
                                      const sumCat1 = cos.reduce((acc, co) => {
                                        const r = (course.assessmentMatrix || []).find(x => x.coNo === co.coNo);
                                        const v = r?.theoryCat1 !== undefined ? r.theoryCat1 : (r?.cat1 || 0);
                                        return acc + (Number(v) || 0);
                                      }, 0);
                                      const sumCat2 = cos.reduce((acc, co) => {
                                        const r = (course.assessmentMatrix || []).find(x => x.coNo === co.coNo);
                                        const v = r?.theoryCat2 !== undefined ? r.theoryCat2 : (r?.cat2 || r?.assignment1 || 0);
                                        return acc + (Number(v) || 0);
                                      }, 0);
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
                                              sumCat1 === 100 ? 'text-emerald-700 bg-emerald-50/50' : 'text-rose-600 bg-rose-50/50'
                                            }`}
                                          >
                                            {sumCat1}%
                                          </td>
                                          <td
                                            className={`border border-black p-2 text-center font-bold ${
                                              sumCat2 === 100 ? 'text-emerald-700 bg-emerald-50/50' : 'text-rose-600 bg-rose-50/50'
                                            }`}
                                          >
                                            {sumCat2}%
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

                              {/* Footer Note */}
                              <div className="mt-3 flex justify-between text-xs text-slate-700 font-sans">
                                <span>Passed in BoS Meeting {course.bosMeetingDate || '30.05.2026'}</span>
                                <span>
                                  Approved in 71<sup>st</sup> Academic council meeting {course.academicCouncilDate || '27.06.2026'}
                                </span>
                              </div>

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
                                        value={(cell as any)[colKey] || 0}
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
                                        className="w-16 p-1.5 border border-slate-300 rounded text-center text-xs"
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
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {course.courseType === 'PRACTICAL'
                          ? '5. Syllabus, Schedule & Laboratory Experiments'
                          : (course.courseType === 'TCP' ? '5. Syllabus, Schedule & Experiments' : '5. Syllabus Modules & Lecture Schedule')}
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        {course.courseType === 'PRACTICAL'
                          ? 'Configure syllabus modules, lecture/contact schedule, and laboratory experiments with inquiry openness levels (1/2/3).'
                          : 'Modules must contain main topic and ordered subtopics.'}
                      </p>
                    </div>

                    {/* Syllabus Modules & Lecture Schedule (Theory, TCP, and Laboratory courses) */}
                    {(course.courseType === 'THEORY' || course.courseType === 'TCP' || course.courseType === 'PRACTICAL') && (
                      <div className="space-y-4">
                        {(course.modules || []).map((mod, idx) => (
                          <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-slate-800">
                                Module {mod.moduleNo || idx + 1}
                              </span>
                              <button
                                onClick={() => {
                                  const updated = (course.modules || []).filter((_, i) => i !== idx);
                                  const renumbered = updated.map((m, i) => ({ ...m, moduleNo: i + 1 }));
                                  updateField('modules', renumbered);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Main Topic Title
                              </label>
                              <input
                                type="text"
                                value={mod.mainTopic || ''}
                                onChange={e => {
                                  const updated = [...(course.modules || [])];
                                  updated[idx] = { ...updated[idx], mainTopic: e.target.value };
                                  updateField('modules', updated);
                                }}
                                placeholder={`Enter Module ${mod.moduleNo || idx + 1} topic`}
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Subtopics (comma-separated or dashed)
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
                                placeholder="Enter subtopics (comma, dash or newline separated)"
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
                            const effectiveLectureCredits = ((course.courseType === 'TCP' || course.courseType === 'PRACTICAL') && (course.L || 0) > 0) ? course.L : course.credits;
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
                              });

                              for (let i = 1; i <= 3; i++) {
                                list.push({
                                  moduleNo: `${nextMod}.${i}`,
                                  topic: '',
                                  periods: '',
                                  coMapping: defaultCo,
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
                                    {(course.modules && course.modules.length > 0) && (
                                      <button
                                        type="button"
                                        onClick={handleSyncFromModules}
                                        className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                                        title="Auto-fill schedule from modules and subtopics entered in Section 5"
                                      >
                                        <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                                        <span>Auto-fill from Syllabus Modules</span>
                                      </button>
                                    )}

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

                                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
                                  <table className="w-full text-xs text-left border-collapse">
                                    <thead className="bg-slate-100 text-slate-700 font-bold">
                                      <tr>
                                        <th className="p-2.5 border-b w-28 text-center">Module No.</th>
                                        <th className="p-2.5 border-b min-w-[280px]">Topics</th>
                                        <th className="p-2.5 border-b w-28 text-center">No. of Periods</th>
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
                                              You can auto-generate the complete schedule from your syllabus modules above or create modules from scratch.
                                            </p>
                                            <div className="flex items-center justify-center space-x-3">
                                              {(course.modules && course.modules.length > 0) && (
                                                <button
                                                  type="button"
                                                  onClick={handleSyncFromModules}
                                                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow"
                                                >
                                                  <Sparkles className="w-4 h-4" />
                                                  <span>Auto-fill from Syllabus Modules</span>
                                                </button>
                                              )}
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
                                                        list[idx] = { ...list[idx], topic: e.target.value };
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

                                              {/* Periods column: supports optional/blank */}
                                              <td className="p-2 text-center align-middle">
                                                <input
                                                  type="text"
                                                  inputMode="numeric"
                                                  pattern="[0-9]*"
                                                  value={item.periods !== undefined && item.periods !== null ? String(item.periods) : ''}
                                                  onChange={e => {
                                                    const list = [...scheduleItems];
                                                    const raw = e.target.value.trim();
                                                    list[idx] = { ...list[idx], periods: raw === '' ? '' : (parseInt(raw) || 0) };
                                                    updateField('lectureScheduleItems', list);
                                                  }}
                                                  placeholder="-"
                                                  className={`w-16 p-1 border rounded text-center text-xs font-bold transition-colors ${
                                                    isHeader
                                                      ? 'bg-white border-slate-400 text-slate-900 shadow-sm'
                                                      : 'border-slate-300 text-slate-800 bg-white'
                                                  }`}
                                                  title="Enter periods for this topic or leave blank if combined across topics"
                                                />
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
                                                  placeholder="Enter mapped COs"
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
                    {(course.courseType === 'PRACTICAL' || course.courseType === 'TCP') && (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-xs text-slate-800 block">List of Experiments:</span>
                            <span className="text-[11px] text-slate-500">Each experiment requires a title, openness level, and mapped Course Outcome(s).</span>
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

                        {(course.experiments || []).map((exp, idx) => (
                          <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-700">Exp. {exp.slNo || idx + 1}</span>
                              <button
                                onClick={() => {
                                  const updated = (course.experiments || []).filter((_, i) => i !== idx);
                                  updateField('experiments', updated);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Delete experiment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                              <div className="md:col-span-8">
                                <input
                                  type="text"
                                  value={exp.name || ''}
                                  onChange={e => {
                                    const updated = [...(course.experiments || [])];
                                    updated[idx] = { ...updated[idx], name: e.target.value };
                                    updateField('experiments', updated);
                                  }}
                                  placeholder={`Enter Experiment ${exp.slNo || idx + 1} title`}
                                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-sky-500"
                                />
                              </div>

                              <div className="md:col-span-4">
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

                            {/* Course Outcomes Mapping Pills */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-200/60">
                              <span className="text-[11px] font-semibold text-slate-500 mr-1">Mapped COs:</span>
                              {(course.courseOutcomes || []).map(co => {
                                const isSelected = (exp.coNos || []).includes(co.coNo);
                                return (
                                  <button
                                    key={co.coNo}
                                    type="button"
                                    onClick={() => {
                                      const updated = [...(course.experiments || [])];
                                      const current = updated[idx].coNos || [];
                                      const next = isSelected
                                        ? current.filter(c => c !== co.coNo)
                                        : [...current, co.coNo];
                                      updated[idx] = { ...updated[idx], coNos: next };
                                      updateField('experiments', updated);
                                    }}
                                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-sky-600 text-white shadow-xs'
                                        : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400'
                                    }`}
                                    title={`Toggle ${co.coNo} for Experiment ${exp.slNo || idx + 1}`}
                                  >
                                    {co.coNo}
                                  </button>
                                );
                              })}
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
                              level: 2,
                              objectiveNos: [1],
                              coNos: [assignedCo],
                            };
                            updateField('experiments', [...(course.experiments || []), newExp]);
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
                    )}
                  </div>
                )}

                {/* Step 6: Learning Resources */}
                {currentStep === 5 && (
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
                          className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-sky-500 bg-white hover:bg-sky-50/50 text-slate-600 hover:text-sky-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          + Add Text Book
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
                          className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-sky-500 bg-white hover:bg-sky-50/50 text-slate-600 hover:text-sky-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          + Add Reference Book
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
                              placeholder="Enter course title / resource name"
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
                              placeholder="Enter instructor name"
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
                              placeholder="Enter institute name"
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
                              placeholder="Enter URL / web link"
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
                        className="w-full py-2 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:text-sky-700 text-xs font-semibold"
                      >
                        + Add NPTEL Course
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
                {currentStep === 6 && (
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
                            <span className="font-bold text-xs text-slate-700">Designer {idx + 1}</span>
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
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <input
                              type="text"
                              value={des.name}
                              onChange={e => {
                                const updated = [...(course.designers || [])];
                                updated[idx] = { ...updated[idx], name: e.target.value };
                                updateField('designers', updated);
                              }}
                              placeholder="Enter faculty name"
                              className="p-2 border border-slate-300 rounded text-xs font-semibold"
                            />
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
                              className={`p-2 border border-slate-300 rounded text-xs bg-white ${
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
                            <input
                              type="text"
                              value={des.department}
                              onChange={e => {
                                const updated = [...(course.designers || [])];
                                updated[idx] = { ...updated[idx], department: e.target.value };
                                updateField('designers', updated);
                              }}
                              placeholder="Enter department"
                              className="p-2 border border-slate-300 rounded text-xs"
                            />
                            <input
                              type="email"
                              value={des.email}
                              onChange={e => {
                                const updated = [...(course.designers || [])];
                                updated[idx] = { ...updated[idx], email: e.target.value };
                                updateField('designers', updated);
                              }}
                              placeholder="Enter email ID"
                              className="p-2 border border-slate-300 rounded text-xs font-mono text-[#0000FF] underline font-medium"
                            />
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          const newDes: CourseDesigner = {
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
                {currentStep === 7 && (
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
              <div className="flex items-center justify-between pt-8 border-t border-slate-200 mt-8">
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







