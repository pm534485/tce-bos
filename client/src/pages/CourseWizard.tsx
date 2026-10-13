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
  Info,
  Check,
  RefreshCw,
  Copy,
  ChevronRight,
  ChevronLeft,
  Menu,
  BookOpen,
} from 'lucide-react';

export const VALID_UNIQUE_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M',
  'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

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

  // Course Form State
  const [course, setCourse] = useState<Course>({
    courseType: courseTypeParam,
    regulationYear: 2026,
    regulationCode: '26',
    programmeCode: user?.programmeAccess[0] || 'CA',
    categoryLetter: 'C',
    uniqueLetter: 'A',
    version: 0,
    courseCode: `26${user?.programmeAccess[0] || 'CA'}CA0`,
    courseName: '',
    categoryAbbr: 'PCC',
    semester: 1,
    L: courseTypeParam === 'PRACTICAL' ? 0 : 3,
    T: courseTypeParam === 'PRACTICAL' ? 0 : 1,
    P: courseTypeParam === 'PRACTICAL' ? 3 : 0,
    credits: courseTypeParam === 'PRACTICAL' ? 1.5 : 4,
    teExamType: courseTypeParam === 'TCP' ? 'TCP-T' : undefined,
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

  // Load existing course or catalog codes
  useEffect(() => {
    async function loadData() {
      try {
        const allCourses = await api.getCourses({ scope: 'all' });
        const codes = allCourses.map(c => c.courseCode);
        setExistingCodes(codes);

        if (id) {
          const fetched = await api.getCourse(id);
          setCourse(fetched);
          setLastSaved(new Date());
        } else {
          // If default 'A' is already taken in this programme/category, pick the next available letter
          const defaultCode = computeCourseCode({
            regulationCode: '26',
            programmeCode: user?.programmeAccess[0] || 'CA',
            categoryLetter: 'C',
            uniqueLetter: 'A',
            version: 0,
          });
          if (codes.includes(defaultCode)) {
            const availableLetter = VALID_UNIQUE_LETTERS.find(letter => {
              const code = computeCourseCode({
                regulationCode: '26',
                programmeCode: user?.programmeAccess[0] || 'CA',
                categoryLetter: 'C',
                uniqueLetter: letter,
                version: 0,
              });
              return !codes.includes(code);
            }) || 'B';

            setCourse(prev => {
              const nextCode = computeCourseCode({
                regulationCode: prev.regulationCode,
                programmeCode: prev.programmeCode,
                categoryLetter: prev.categoryLetter,
                uniqueLetter: availableLetter,
                version: prev.version,
              });
              return { ...prev, uniqueLetter: availableLetter, courseCode: nextCode };
            });
          }
        }
      } catch (err) {
        console.error('Failed to load course:', err);
      }
    }
    loadData();
  }, [id]);

  // Compute live validation report
  const otherCodes = course._id
    ? existingCodes.filter(c => c !== course.courseCode)
    : existingCodes;
  const validationReport = validateCourse(course, otherCodes);

  // Debounced auto-save
  const saveTimeoutRef = useRef<any>(null);
  useEffect(() => {
    if (!course._id) return; // don't autosave uncreated drafts

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        const updated = await api.updateCourse(course._id!, course);
        setLastSaved(new Date());
        setIsSaving(false);
      } catch (e) {
        setIsSaving(false);
      }
    }, 2500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [course]);

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

      return updated;
    });
  };

  // Stepper definition
  const steps = [
    { id: 'identity', title: '1. Course Code & Identity', desc: 'Code RR AA C U V & Title' },
    { id: 'structure', title: '2. Structure & L-T-P', desc: 'Hours, credits, semester' },
    { id: 'preamble', title: '3. Preamble & Prerequisites', desc: 'Course context & prior courses' },
    { id: 'cos', title: '4. Course Outcomes', desc: 'TPS taxonomy & weightages' },
    { id: 'assessment', title: '5. Assessment Pattern', desc: 'Continuous & Terminal exam' },
    {
      id: 'syllabus',
      title: course.courseType === 'PRACTICAL' ? '6. Laboratory Experiments' : '6. Syllabus & Content',
      desc: course.courseType === 'PRACTICAL' ? 'Experiments & Annexure 1' : 'Modules & Schedule',
    },
    { id: 'resources', title: '7. Learning Resources', desc: 'Text & reference books' },
    { id: 'designers', title: '8. Course Designers', desc: 'Faculty details & emails' },
    { id: 'review', title: '9. Review & Submit', desc: '17-point compliance audit' },
  ];

  // Real-time field-level validation helpers
  const getFieldErrors = (fieldName: string) => {
    return validationReport.errors.filter(e => e.field === fieldName);
  };

  const hasFieldError = (fieldName: string) => {
    return validationReport.errors.some(e => e.field === fieldName);
  };

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

  // Live counts for institutional header
  const totalModulePeriods = (course.modules || []).reduce((acc, m) => acc + (Number(m.periods) || 0), 0);
  const totalLecturePeriods = (course.lectureScheduleItems || []).reduce((acc, item) => acc + (Number(item.periods) || 0), 0);
  const totalTopics = (course.modules || []).reduce((acc, m) => acc + (m.subtopics?.length || 0) + (m.mainTopic ? 1 : 0), 0);
  const totalPeriods = course.courseType === 'PRACTICAL'
    ? (course.experiments || []).length * 3
    : (totalLecturePeriods > 0 ? totalLecturePeriods : totalModulePeriods);

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
            onClick={() => navigate('/')}
            className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-2 min-w-0">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 flex-shrink-0">
              {course.courseCode}
            </span>
            <span className="font-bold text-slate-900 text-sm truncate max-w-[180px] sm:max-w-xs">
              {course.courseName || 'Untitled Course'}
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
                          {course.courseCode || '26CACA0'}
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
                            <span className="text-slate-400 font-normal italic lowercase">
                              (enter course title in step 1)
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Column 3: Category, LTP & Credits Table */}
                      <div
                        onClick={() => setCurrentStep(1)}
                        className="md:col-span-4 grid grid-cols-5 border-collapse text-center cursor-pointer hover:bg-slate-50 transition-colors"
                        title="Click to edit L-T-P and Credits in Step 2"
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
                          {course.categoryAbbr || 'PCC'}
                        </div>
                        <div className="p-2.5 text-xs sm:text-sm font-bold text-slate-900 border-r border-slate-900 flex items-center justify-center">
                          {course.L ?? (course.courseType === 'PRACTICAL' ? 0 : 3)}
                        </div>
                        <div className="p-2.5 text-xs sm:text-sm font-bold text-slate-900 border-r border-slate-900 flex items-center justify-center">
                          {course.T ?? (course.courseType === 'PRACTICAL' ? 0 : 1)}
                        </div>
                        <div className="p-2.5 text-xs sm:text-sm font-bold text-slate-900 border-r border-slate-900 flex items-center justify-center">
                          {course.P ?? (course.courseType === 'PRACTICAL' ? 3 : 0)}
                        </div>
                        <div className="p-2.5 text-xs sm:text-sm font-black text-slate-950 flex items-center justify-center">
                          {course.credits ?? (course.courseType === 'PRACTICAL' ? 1.5 : 4)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Syllabus Live Progress & Details Strip */}
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-200">
                        <span>{course.courseType}</span>
                        <span>• Semester {course.semester || 1}</span>
                      </span>

                      <button
                        onClick={() => setCurrentStep(5)}
                        className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-[11px] border border-blue-200 transition-colors cursor-pointer"
                        title="Click to view/edit Modules and Lecture Schedule"
                      >
                        <BookOpen className="w-3 h-3 text-blue-700" />
                        <span>{course.modules?.length || 0} Modules</span>
                        <span>({totalPeriods} Periods)</span>
                      </button>

                      {totalTopics > 0 && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-900 font-bold text-[11px] border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>{totalTopics} Topics defined</span>
                        </span>
                      )}

                      {(course.courseOutcomes || []).length > 0 && (
                        <button
                          onClick={() => setCurrentStep(3)}
                          className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-[11px] border border-purple-200 transition-colors cursor-pointer"
                          title="Click to view/edit Course Outcomes"
                        >
                          <span>{course.courseOutcomes.length} COs Defined</span>
                        </button>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium">
                      Regulation 2026 OBE Curriculum
                    </div>
                  </div>
                </div>

                {/* Step 1: Course Identity */}
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">1. Course Code & Identity</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Compose the standardized 5-component course code <strong>RR AA C U V</strong> directly in the cards below, and enter the formal title.
                      </p>
                    </div>

                    {/* Course Code Composition Card - Direct Interactive Selection */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                              Course Code Composition
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Direct Selector
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Select or change any component directly in the 5 cards below (RR, AA, C, U, V).
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-semibold text-slate-500">Composed Code:</span>
                          <span className="font-mono text-base sm:text-lg font-black text-sky-800 bg-sky-100/80 px-3 py-0.5 rounded-lg border border-sky-300 shadow-xs tracking-wider">
                            {course.courseCode}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center text-xs">
                        {/* 1. RR: Regulation */}
                        <div className="p-2.5 bg-white rounded-xl border-2 border-slate-200 hover:border-[#7B1113] hover:shadow-xs transition-all flex flex-col justify-between">
                          <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">RR</span>
                          <div className="my-1">
                            <select
                              value={course.regulationCode}
                              onChange={e => updateField('regulationCode', e.target.value)}
                              className="w-full text-center font-black text-base sm:text-lg text-slate-900 bg-transparent border-0 focus:ring-2 focus:ring-[#7B1113] rounded cursor-pointer p-0"
                              title="Regulation Code (26)"
                            >
                              <option value="26">26</option>
                            </select>
                          </div>
                          <span className="text-[10px] text-slate-500 block font-medium">Reg. 26</span>
                        </div>

                        {/* 2. AA: Programme Code */}
                        <div className="p-2.5 bg-white rounded-xl border-2 border-slate-200 hover:border-[#7B1113] hover:shadow-xs transition-all flex flex-col justify-between group">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">AA</span>
                            <span className="text-[9px] text-[#0F2942] font-bold bg-[#0F2942]/10 px-1 rounded">Prog</span>
                          </div>
                          <div className="my-1">
                            <select
                              value={course.programmeCode}
                              onChange={e => updateField('programmeCode', e.target.value)}
                              className="w-full text-center font-black text-base sm:text-lg text-[#0F2942] bg-transparent border-0 focus:ring-2 focus:ring-[#0F2942] rounded cursor-pointer p-0"
                              title="Click to select Programme"
                            >
                              {PROGRAMME_CODES.map(p => (
                                <option key={p.code} value={p.code}>
                                  {p.code} — {p.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <span
                            className="text-[10px] text-slate-600 block font-medium truncate"
                            title={PROGRAMME_CODES.find(p => p.code === course.programmeCode)?.name || 'Programme'}
                          >
                            {PROGRAMME_CODES.find(p => p.code === course.programmeCode)?.name || 'Programme'}
                          </span>
                        </div>

                        {/* 3. C: Category Code */}
                        <div className="p-2.5 bg-white rounded-xl border-2 border-slate-200 hover:border-[#7B1113] hover:shadow-xs transition-all flex flex-col justify-between group">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">C</span>
                            <span className="text-[9px] text-[#7B1113] font-bold bg-[#7B1113]/10 px-1 rounded">Cat</span>
                          </div>
                          <div className="my-1">
                            <select
                              value={course.categoryLetter}
                              onChange={e => updateField('categoryLetter', e.target.value)}
                              className="w-full text-center font-black text-base sm:text-lg text-[#7B1113] bg-transparent border-0 focus:ring-2 focus:ring-[#7B1113] rounded cursor-pointer p-0"
                              title="Click to select Category"
                            >
                              {CATEGORY_CODES.map(c => (
                                <option key={c.code} value={c.code}>
                                  {c.code} — {c.name} ({c.defaultAbbr})
                                </option>
                              ))}
                            </select>
                          </div>
                          <span
                            className="text-[10px] text-slate-600 block font-medium truncate"
                            title={CATEGORY_CODES.find(c => c.code === course.categoryLetter)?.name || 'Category'}
                          >
                            {course.categoryAbbr || 'PCC'} ({CATEGORY_CODES.find(c => c.code === course.categoryLetter)?.name?.split(' ')[0] || 'Core'})
                          </span>
                        </div>

                        {/* 4. U: Unique Letter */}
                        <div className="p-2.5 bg-white rounded-xl border-2 border-slate-200 hover:border-[#7B1113] hover:shadow-xs transition-all flex flex-col justify-between group">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">U</span>
                            <span className="text-[9px] text-sky-700 font-bold bg-sky-100 px-1 rounded">A-Z</span>
                          </div>
                          <div className="my-1">
                            <select
                              value={course.uniqueLetter}
                              onChange={e => updateField('uniqueLetter', e.target.value.toUpperCase())}
                              className="w-full text-center font-black text-base sm:text-lg text-[#0F2942] bg-transparent border-0 focus:ring-2 focus:ring-[#0F2942] rounded cursor-pointer p-0"
                              title="Click to select Unique Letter"
                            >
                              {VALID_UNIQUE_LETTERS.map(letter => (
                                <option key={letter} value={letter}>
                                  {letter}
                                </option>
                              ))}
                            </select>
                          </div>
                          <span className="text-[10px] text-slate-500 block font-medium">Unique (excl. I, O)</span>
                        </div>

                        {/* 5. V: Version */}
                        <div className="p-2.5 bg-white rounded-xl border-2 border-slate-200 hover:border-[#7B1113] hover:shadow-xs transition-all flex flex-col justify-between group">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">V</span>
                            <span className="text-[9px] text-slate-600 font-bold bg-slate-100 px-1 rounded">Ver</span>
                          </div>
                          <div className="my-1">
                            <select
                              value={course.version}
                              onChange={e => updateField('version', Number(e.target.value))}
                              className="w-full text-center font-black text-base sm:text-lg text-slate-900 bg-transparent border-0 focus:ring-2 focus:ring-slate-600 rounded cursor-pointer p-0"
                              title="Click to select Version"
                            >
                              {[0, 1, 2, 3, 4, 5].map(v => (
                                <option key={v} value={v}>
                                  {v}
                                </option>
                              ))}
                            </select>
                          </div>
                          <span className="text-[10px] text-slate-500 block font-medium">Version {course.version}</span>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Compound Unique Key: <code className="font-mono font-bold text-slate-700">{course.regulationCode}-{course.programmeCode}-{course.courseCode}-v{course.version}</code></span>
                        {hasFieldError('uniqueLetter') || hasFieldError('courseCode') ? (
                          <span className="text-red-600 font-semibold flex items-center space-x-1">
                            <AlertCircle className="w-3 h-3 text-red-500" />
                            <span>Code configuration error</span>
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            <span>Standard Regulation 2026 Format Validated</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Course Title Field */}
                    <div>
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
                        value={course.courseName}
                        onChange={e => updateField('courseName', e.target.value)}
                        placeholder={
                          course.courseType === 'PRACTICAL'
                            ? 'AC Machines Laboratory'
                            : 'Data Structures and Applications'
                        }
                        className={`w-full px-3.5 py-2.5 border rounded-lg text-sm font-medium transition-all ${
                          hasFieldError('courseName')
                            ? 'border-red-400 bg-red-50/20 text-slate-900 focus:ring-2 focus:ring-red-200 focus:border-red-500'
                            : (course.courseName || '').trim()
                            ? 'border-emerald-400 bg-emerald-50/10 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500'
                            : 'border-slate-300 focus:ring-2 focus:ring-sky-500'
                        }`}
                      />
                      <InlineFieldError field="courseName" />
                      {!hasFieldError('courseName') && (course.courseName || '').trim() && (
                        <InlineFieldSuccess message="Title verified & compliant with TCE Regulation 2026" />
                      )}
                      <div className="mt-1 text-[11px] text-slate-500 space-y-0.5">
                        <p>• Only letters, digits and spaces. No hyphens, ampersands, or slashes.</p>
                        <p>• Title Case. Rendered in CAPITAL and BOLD on official documents.</p>
                        <p>
                          • Use "Laboratory", never "Lab". Practical courses must end with "Laboratory".
                        </p>
                      </div>
                    </div>

                    {/* Category Abbreviation Confirmation */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Category Abbreviation (Credit Distribution Framework) <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={course.categoryAbbr}
                        onChange={e => updateField('categoryAbbr', e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500"
                      >
                        {CATEGORY_ABBREVIATIONS.map(abbr => (
                          <option key={abbr} value={abbr}>
                            {abbr}
                          </option>
                        ))}
                      </select>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        HSMC, BSC, ESC, PCC, PEC, OEC, EEC, AC. Auto-suggested from category letter.
                      </span>
                    </div>
                  </div>
                )}

                {/* Step 2: Contact Hours, LTP & Credits */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">2. Contact Hours & Credits</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Specify contact periods. Credits are computed automatically using <strong>Credits = L + T + P/2</strong>.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Lecture (L)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={course.L}
                          disabled={course.courseType === 'PRACTICAL'}
                          onChange={e => updateField('L', parseInt(e.target.value) || 0)}
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
                          value={course.T}
                          disabled={course.courseType === 'PRACTICAL'}
                          onChange={e => updateField('T', parseInt(e.target.value) || 0)}
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
                          value={course.P}
                          onChange={e => updateField('P', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center font-bold focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      <div className="p-2 bg-sky-50 border border-sky-200 rounded-lg text-center">
                        <label className="block text-xs font-bold text-sky-900 mb-1">
                          Credits (Computed)
                        </label>
                        <span className="text-xl font-extrabold text-sky-700">{course.credits}</span>
                      </div>
                    </div>

                    {/* Credit to Contact Hours Calculation */}
                    {(() => {
                      const effCredits = (course.courseType === 'TCP' && (course.L || 0) > 0) ? course.L : course.credits;
                      const crit = getExpectedHoursCriteria(effCredits);
                      return (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">
                              {course.courseType === 'TCP' ? `Theory Lecture Hours Criteria: ${crit.description} (based on L = ${course.L || 0} credits)` : `Contact Hours Criteria: ${crit.description}`}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Institutional Criteria: 1 credit = 12 to 14 hrs | 2 credits = 24 to 28 hrs | 3 credits = 36 hrs | 4 credits = 48 hrs.
                              {course.courseType === 'TCP' ? ` For TCP, practical lab component has ${course.P || 0} hours/week.` : ''}
                            </span>
                          </div>
                          <div className="text-xs font-extrabold px-3 py-1 bg-sky-100 text-sky-800 rounded-lg border border-sky-200 self-start sm:self-auto">
                            {course.courseType === 'TCP' ? `L = ${course.L || 0} → ${crit.description}` : `${course.credits} ${course.credits === 1 ? 'Credit' : 'Credits'} → ${crit.description}`}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Semester
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={8}
                          value={course.semester}
                          onChange={e => updateField('semester', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      {/* TCP TE Exam Type */}
                      {course.courseType === 'TCP' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Terminal Examination Type (TE Type) <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={course.teExamType || 'TCP-T'}
                            onChange={e => updateField('teExamType', e.target.value as any)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500"
                          >
                            <option value="TCP-T">TCP-T (Theory Examination 50%)</option>
                            <option value="TCP-P">TCP-P (Practical Examination 50%)</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Inline error feedback for Contact Hours & Credits */}
                    <InlineFieldError field="credits" />
                    <InlineFieldError field="L" />
                    <InlineFieldError field="T" />
                    <InlineFieldError field="P" />
                    {!hasFieldError('credits') && !hasFieldError('L') && !hasFieldError('T') && !hasFieldError('P') && (
                      <InlineFieldSuccess message="Contact periods and credits formula verified" />
                    )}

                    {/* Advanced / Elective Flag */}
                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-200">
                      <input
                        type="checkbox"
                        id="isAdvanced"
                        checked={course.isAdvanced || false}
                        onChange={e => updateField('isAdvanced', e.target.checked)}
                        className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                      />
                      <label htmlFor="isAdvanced" className="text-xs text-slate-700 font-medium">
                        Classify as Advanced / Elective Course (triggers mandatory 5-year publication recency rule on textbooks)
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 3: Preamble & Prerequisites */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">3. Course Preamble & Prerequisites</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Contextualizes domain, academic relevance, and prior foundational prerequisite courses.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          Preamble Statement <span className="text-rose-500">*</span>
                        </label>
                        {countWords(course.preamble || '') < 60 ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                            {countWords(course.preamble || '')} / 60 words (minimum 60 required)
                          </span>
                        ) : countWords(course.preamble || '') <= 150 ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {countWords(course.preamble || '')} words — Compliant
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            {countWords(course.preamble || '')} words (&gt; 150 words)
                          </span>
                        )}
                      </div>
                      <textarea
                        rows={6}
                        value={course.preamble}
                        onChange={e => updateField('preamble', e.target.value)}
                        placeholder="State what the course is about, connect to real-world applications and modern standards, and avoid generic clichés..."
                        className={`w-full p-3.5 border rounded-xl text-sm leading-relaxed transition-all ${
                          hasFieldError('preamble')
                            ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-200 focus:border-red-500'
                            : countWords(course.preamble || '') >= 60 && countWords(course.preamble || '') <= 150
                            ? 'border-emerald-400 bg-emerald-50/10 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500'
                            : 'border-slate-300 focus:ring-2 focus:ring-sky-500'
                        }`}
                      />
                      <InlineFieldError field="preamble" />
                      {!hasFieldError('preamble') && countWords(course.preamble || '') >= 60 && (
                        <InlineFieldSuccess message="Preamble word count and structure verified compliant" />
                      )}
                      <div className="mt-2 text-[11px] text-slate-500 space-y-1">
                        <p>• Single coherent paragraph without line breaks.</p>
                        <p>• Avoid cliché phrases: "This course covers important topics" or "Students will learn about".</p>
                        <p>• Do not repeat the Course Outcomes list verbatim.</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Prerequisites
                      </label>
                      <input
                        type="text"
                        value={Array.isArray(course.prerequisites) ? '' : (course.prerequisites || '')}
                        onChange={e => updateField('prerequisites', e.target.value)}
                        placeholder="Nil (or e.g. 26CSCA0 : Problem Solving)"
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                      />
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        Enter "Nil" if there are no prerequisites.
                      </span>
                    </div>
                  </div>
                )}

                {/* Step 4: Course Outcomes */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">4. Course Outcomes (COs)</h2>
                        <p className="text-sm text-slate-500 mt-1">
                          {course.courseType === 'THEORY' && '6 to 8 COs. Minimum 70% at TPS >= 3. Total weightage = 100%.'}
                          {course.courseType === 'PRACTICAL' && 'Select from General CO Pool: Cognitive (2-4), Affective (2-3), Psychomotor (2-3).'}
                          {course.courseType === 'TCP' && 'Up to 8 COs. At least 2 addressing PO6 to PO11 competencies.'}
                        </p>
                      </div>

                      {/* Weightage Suggester */}
                      {(course.courseType === 'THEORY' || course.courseType === 'TCP') && (
                        <button
                          onClick={() => {
                            const suggested = suggestCoWeightages(course.courseOutcomes || []);
                            const updatedCos = (course.courseOutcomes || []).map((c, i) => ({
                              ...c,
                              weightage: suggested[i] || c.weightage,
                            }));
                            updateField('courseOutcomes', updatedCos);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold flex items-center space-x-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Suggest Weightages</span>
                        </button>
                      )}
                    </div>

                    {/* Real-time Weightage Balance Bar & Error Alert */}
                    {(() => {
                      const totalW = (course.courseOutcomes || []).reduce((s, c) => s + (c.weightage || 0), 0);
                      if (course.courseType === 'THEORY' || course.courseType === 'TCP') {
                        if (totalW !== 100) {
                          return (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between animate-in fade-in duration-150">
                              <div className="flex items-center space-x-2">
                                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <span className="font-semibold">Total CO Weightage must equal 100% (currently {totalW}%)</span>
                              </div>
                              <span className="font-bold px-2.5 py-0.5 bg-red-100 rounded text-red-800">{totalW}% / 100%</span>
                            </div>
                          );
                        }
                        return (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-in fade-in duration-150">
                            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span className="font-semibold">CO Weightage balanced at 100%</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    <InlineFieldError field="courseOutcomes" />

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
                                placeholder="e.g. Apply fundamental engineering principles to solve practical domain problems."
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
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                PI (x.y.z)
                              </label>
                              <input
                                type="text"
                                list={`pi-suggestions-${idx}`}
                                value={co.pi || ''}
                                onChange={e => {
                                  const piVal = e.target.value;
                                  const updated = [...(course.courseOutcomes || [])];
                                  const matchedPi = PERFORMANCE_INDICATORS.find(p => p.piNumber === piVal.trim());
                                  updated[idx] = {
                                    ...updated[idx],
                                    pi: piVal,
                                    ...(matchedPi ? { tpsLevel: matchedPi.tpsLevel } : {}),
                                  };
                                  updateField('courseOutcomes', updated);
                                }}
                                placeholder="e.g. 1.2.1 or 1.2.1, 2.1.3"
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-sky-500"
                              />
                              <datalist id={`pi-suggestions-${idx}`}>
                                {PERFORMANCE_INDICATORS.map(p => (
                                  <option key={p.piNumber} value={p.piNumber}>
                                    {p.piNumber} (TPS {p.tpsLevel})
                                  </option>
                                ))}
                              </datalist>
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
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                SDG Addressed
                              </label>
                              <select
                                value={co.sdgNo || 'NC'}
                                onChange={e => {
                                  const val = e.target.value === 'NC' ? 'NC' : parseInt(e.target.value);
                                  const updated = [...(course.courseOutcomes || [])];
                                  updated[idx] = { ...updated[idx], sdgNo: val, sdgLevel: val === 'NC' ? 0 : updated[idx].sdgLevel || 1 };
                                  updateField('courseOutcomes', updated);
                                }}
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                              >
                                <option value="NC">NC (Not Covered)</option>
                                {SDG_LIST.map(s => (
                                  <option key={s.no} value={s.no}>
                                    SDG {s.no}: {s.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                SDG Level (0–5)
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={5}
                                disabled={co.sdgNo === 'NC'}
                                value={co.sdgLevel || 0}
                                onChange={e => {
                                  const val = parseInt(e.target.value) || 0;
                                  const updated = [...(course.courseOutcomes || [])];
                                  updated[idx] = { ...updated[idx], sdgLevel: val };
                                  updateField('courseOutcomes', updated);
                                }}
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs text-center"
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

                {/* Step 5: Assessment Pattern */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">5. Assessment Pattern</h2>
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
                            <div className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                              {(course.courseOutcomes || []).length} COs Configured
                            </div>
                          </div>

                          {(course.courseOutcomes || []).length === 0 ? (
                            <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
                              <p className="text-xs text-amber-800 font-semibold">
                                No Course Outcomes defined yet. Please return to Step 4 (Course Outcomes) to add COs first.
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
                                            <span className="block text-[10px] text-slate-400 font-normal">
                                              TPS {co.tpsLevel} • {co.weightage}% wt
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

                    {/* Practical Component Table (Fixed by guideline) */}
                    {course.courseType === 'PRACTICAL' && (
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
                    )}

                    {/* TCP Dual Matrix */}
                    {course.courseType === 'TCP' && (
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
                                  <td className="p-2.5 font-bold text-slate-800">{co.coNo}</td>
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
                    )}
                  </div>
                )}

                {/* Step 6: Syllabus Modules & Experiments */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {course.courseType === 'PRACTICAL' ? '6. Laboratory Experiments' : '6. Syllabus Modules'}
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        {course.courseType === 'PRACTICAL'
                          ? 'Specify experiments with inquiry openness levels (1/2/3) and Annexure 1 course plan.'
                          : 'Modules must contain main topic and ordered subtopics.'}
                      </p>
                    </div>

                    {/* Theory / TCP Modules */}
                    {(course.courseType === 'THEORY' || course.courseType === 'TCP') && (
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
                                placeholder={`e.g. Module ${mod.moduleNo || idx + 1} Main Topic (e.g. DC Circuits)`}
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
                                  const list = raw.split(',').map(s => s.trim()).filter(Boolean);
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
                                placeholder="e.g. Subtopic A, Subtopic B, Subtopic C (comma-separated)"
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
                            const effectiveLectureCredits = (course.courseType === 'TCP' && (course.L || 0) > 0) ? course.L : course.credits;
                            const lectureCriteria = getExpectedHoursCriteria(effectiveLectureCredits);

                            const handleSyncFromModules = () => {
                              if (!course.modules || course.modules.length === 0) return;
                              const items: LectureScheduleItem[] = [];
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

                                if (mod.subtopics && mod.subtopics.length > 0) {
                                  mod.subtopics.forEach((sub, sIdx) => {
                                    items.push({
                                      moduleNo: `${modNo}.${sIdx + 1}`,
                                      topic: sub,
                                      periods: '',
                                      coMapping: modCos,
                                    });
                                  });
                                }
                              });
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
                                                          ? `e.g. Module ${item.moduleNo} Title (e.g. Basics: Python interpreter)`
                                                          : `e.g. Subtopic ${item.moduleNo} (e.g. Variables)`
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
                                                  placeholder="e.g. CO1, CO6"
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
                        <span className="font-bold text-xs text-slate-800 block">List of Experiments:</span>
                        {(course.experiments || []).map((exp, idx) => (
                          <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-700">Exp. {exp.slNo || idx + 1}</span>
                              <button
                                onClick={() => {
                                  const updated = (course.experiments || []).filter((_, i) => i !== idx);
                                  updateField('experiments', updated);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600"
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
                                  placeholder={`e.g. Experiment ${exp.slNo || idx + 1} Title (e.g. Implementation of Linear Data Structures)`}
                                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
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
                                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                                >
                                  <option value={1}>Level 1: Structured (Open answers)</option>
                                  <option value={2}>Level 2: Guided (Open methods)</option>
                                  <option value={3}>Level 3: Inquiry (Fully open)</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            const n = (course.experiments || []).length + 1;
                            const newExp: LabExperiment = {
                              slNo: n,
                              name: '',
                              level: 2,
                              objectiveNos: [1],
                              coNos: ['CO1'],
                            };
                            updateField('experiments', [...(course.experiments || []), newExp]);
                          }}
                          className="w-full py-2 rounded-xl border border-dashed border-slate-300 hover:border-sky-500 text-slate-600 hover:text-sky-700 text-xs font-semibold flex items-center justify-center space-x-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Laboratory Experiment</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 7: Learning Resources */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">7. Learning Resources</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Must specify <strong>1 to 2 Text Books</strong> and <strong>3 to 6 Reference Books</strong> with mandatory publication year.
                      </p>
                    </div>

                    {/* Text Books */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800">
                          Text Books (1–2 required, format: Author, "Title", Publisher, Edition, Year):
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">
                          {(course.textBooks || []).length} / 2
                        </span>
                      </div>
                      {(course.textBooks || []).map((b, idx) => (
                        <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-700">Text Book {idx + 1}</span>
                            <button
                              onClick={() => {
                                const updated = (course.textBooks || []).filter((_, i) => i !== idx);
                                updateField('textBooks', updated);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                            <input
                              type="text"
                              value={b.authors}
                              onChange={e => {
                                const updated = [...(course.textBooks || [])];
                                updated[idx] = { ...updated[idx], authors: e.target.value };
                                updateField('textBooks', updated);
                              }}
                              placeholder="Author(s) (e.g. William H. Hayt Jr.)"
                              className="p-2 border border-slate-300 rounded text-xs"
                            />
                            <input
                              type="text"
                              value={b.title}
                              onChange={e => {
                                const updated = [...(course.textBooks || [])];
                                updated[idx] = { ...updated[idx], title: e.target.value };
                                updateField('textBooks', updated);
                              }}
                              placeholder="Title (e.g. Engineering Circuit Analysis)"
                              className="p-2 border border-slate-300 rounded text-xs"
                            />
                            <input
                              type="text"
                              value={b.edition || ''}
                              onChange={e => {
                                const updated = [...(course.textBooks || [])];
                                updated[idx] = { ...updated[idx], edition: e.target.value };
                                updateField('textBooks', updated);
                              }}
                              placeholder="Edition (e.g. 10th Edition)"
                              className="p-2 border border-slate-300 rounded text-xs"
                            />
                            <input
                              type="text"
                              value={b.publisher || ''}
                              onChange={e => {
                                const updated = [...(course.textBooks || [])];
                                updated[idx] = { ...updated[idx], publisher: e.target.value };
                                updateField('textBooks', updated);
                              }}
                              placeholder="Publisher (e.g. McGraw Hill)"
                              className="p-2 border border-slate-300 rounded text-xs"
                            />
                            <input
                              type="number"
                              value={b.year || ''}
                              onChange={e => {
                                const updated = [...(course.textBooks || [])];
                                updated[idx] = { ...updated[idx], year: parseInt(e.target.value) || '' };
                                updateField('textBooks', updated);
                              }}
                              placeholder="Year (e.g. 2022)"
                              className="p-2 border border-slate-300 rounded text-xs font-bold"
                            />
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
                          className="w-full py-2 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:text-sky-700 text-xs font-semibold"
                        >
                          + Add Text Book
                        </button>
                      )}
                    </div>

                    {/* Reference Books */}
                    <div className="space-y-3 pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800">
                          Reference Books (3–6 required):
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">
                          {(course.referenceBooks || []).length} / 3–6
                        </span>
                      </div>
                      {(course.referenceBooks || []).map((b, idx) => (
                        <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-700">Reference Book {idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (course.referenceBooks || []).filter((_, i) => i !== idx);
                                updateField('referenceBooks', updated);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                            <input
                              type="text"
                              value={b.authors}
                              onChange={e => {
                                const updated = [...(course.referenceBooks || [])];
                                updated[idx] = { ...updated[idx], authors: e.target.value };
                                updateField('referenceBooks', updated);
                              }}
                              placeholder="Author(s) (e.g. Abhijit Chakrabarthi)"
                              className="p-2 border border-slate-300 rounded text-xs"
                            />
                            <input
                              type="text"
                              value={b.title}
                              onChange={e => {
                                const updated = [...(course.referenceBooks || [])];
                                updated[idx] = { ...updated[idx], title: e.target.value };
                                updateField('referenceBooks', updated);
                              }}
                              placeholder="Title (e.g. Basic Electrical Engineering)"
                              className="p-2 border border-slate-300 rounded text-xs"
                            />
                            <input
                              type="text"
                              value={b.edition || ''}
                              onChange={e => {
                                const updated = [...(course.referenceBooks || [])];
                                updated[idx] = { ...updated[idx], edition: e.target.value };
                                updateField('referenceBooks', updated);
                              }}
                              placeholder="Edition (e.g. 2nd edition)"
                              className="p-2 border border-slate-300 rounded text-xs"
                            />
                            <input
                              type="text"
                              value={b.publisher || ''}
                              onChange={e => {
                                const updated = [...(course.referenceBooks || [])];
                                updated[idx] = { ...updated[idx], publisher: e.target.value };
                                updateField('referenceBooks', updated);
                              }}
                              placeholder="Publisher (e.g. McGraw Hill)"
                              className="p-2 border border-slate-300 rounded text-xs"
                            />
                            <input
                              type="number"
                              value={b.year || ''}
                              onChange={e => {
                                const updated = [...(course.referenceBooks || [])];
                                updated[idx] = { ...updated[idx], year: parseInt(e.target.value) || '' };
                                updateField('referenceBooks', updated);
                              }}
                              placeholder="Year (e.g. 2021)"
                              className="p-2 border border-slate-300 rounded text-xs font-bold"
                            />
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
                          className="w-full py-2 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:text-sky-700 text-xs font-semibold"
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
                              placeholder="Course Title (e.g. Basic Electrical Circuits)"
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
                              placeholder="Instructor (e.g. Prof. Ashok Kumar Pradhan)"
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
                              placeholder="Institute (e.g. IIT Kharagpur)"
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
                              placeholder="URL / Web Link (optional, e.g. https://nptel.ac.in/...)"
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

                {/* Step 8: Course Designers */}
                {currentStep === 7 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">8. Course Designers</h2>
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
                              placeholder="Name (e.g. Dr. A. Kumar)"
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
                              placeholder="Department (e.g. Computer Science)"
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
                              placeholder="Email ID (e.g. akumar@tce.edu)"
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

                {/* Step 9: Review & Compliance Audit */}
                {currentStep === 8 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">9. Review & Self-Audit</h2>
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
                  <button
                    onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-xs font-semibold text-white shadow-sm flex items-center space-x-1 active:scale-95 transition-all"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
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







