import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Course, DEPARTMENT_OPTIONS } from '@syllabusforge/shared';
import { DocumentPreview } from '../components/DocumentPreview';
import {
  CheckSquare,
  CheckCircle2,
  FileText,
  Download,
  Layers,
  Sparkles,
  BookOpen,
  MessageSquare,
  Check,
  RefreshCw,
  FolderDown,
  Info,
  PlusCircle,
  Building2,
  ChevronDown,
  X,
  Trash2,
} from 'lucide-react';

export const ReviewWorkspace: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [remarks, setRemarks] = useState<string>('');
  const [targetSection, setTargetSection] = useState<string>('General');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Regulation details & available list
  const [activeReg, setActiveReg] = useState<{ regulationYear: number; regulationCode: string }>({
    regulationYear: 2026,
    regulationCode: '26',
  });
  const [regulationList, setRegulationList] = useState<Array<{ year: number; code: string; label?: string }>>([
    { year: 2026, code: '26', label: 'Regulation 2026' },
  ]);

  // Selected Department for reviewing courses (defaults to coordinator's department, or first available)
  const [selectedDept, setSelectedDept] = useState<string>(user?.department || 'Civil Engineering');

  // Modal for adding a new regulation or department
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'regulation' | 'department'>('regulation');
  const [newRegYear, setNewRegYear] = useState<number>(2026);
  const [newRegCode, setNewRegCode] = useState<string>('26');
  const [newDeptName, setNewDeptName] = useState<string>('');
  const [customDeptList, setCustomDeptList] = useState<string[]>([...DEPARTMENT_OPTIONS]);
  const [isSavingMaster, setIsSavingMaster] = useState<boolean>(false);

  // Multi-select for merging syllabus documents: stores course IDs in the exact selection sequence
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [mergingDocx, setMergingDocx] = useState<boolean>(false);
  const [mergingPdf, setMergingPdf] = useState<boolean>(false);

  // BoS Coordinator Approval Footer State
  const [includeApprovalFooter, setIncludeApprovalFooter] = useState<boolean>(true);
  const [bosMeetingText, setBosMeetingText] = useState<string>('Passed in BoS Meeting 30.05.2026');
  const [academicCouncilText, setAcademicCouncilText] = useState<string>('Approved in 71st Academic council meeting 27.06.2026');
  const [isSavingFooter, setIsSavingFooter] = useState<boolean>(false);

  useEffect(() => {
    loadRegulation();
    loadCustomDepartments();
  }, []);

  useEffect(() => {
    loadReviewQueue();
    loadApprovalFooterConfig();
  }, [selectedDept]);

  async function loadCustomDepartments() {
    try {
      const data = await api.getMaster('departments');
      if (Array.isArray(data) && data.length > 0) {
        const names = data.map((d: any) => d.name || d.code || '').filter(Boolean);
        const combined = Array.from(new Set([...DEPARTMENT_OPTIONS, ...names]));
        setCustomDeptList(combined);
      }
    } catch (_) {
      // Keep defaults
    }
  }

  async function loadRegulation() {
    try {
      const reg = await api.getActiveRegulation();
      if (reg?.regulationYear) {
        setActiveReg({ regulationYear: reg.regulationYear, regulationCode: reg.regulationCode });
      }
      if (reg?.regulationList && Array.isArray(reg.regulationList)) {
        setRegulationList(reg.regulationList);
      }
    } catch (e) {
      // Use defaults
    }
  }

  async function loadApprovalFooterConfig() {
    try {
      const config = await api.getApprovalFooterConfig(selectedDept, activeReg.regulationYear);
      if (config) {
        setIncludeApprovalFooter(config.includeApprovalFooter ?? true);
        if (config.bosMeetingText) setBosMeetingText(config.bosMeetingText);
        if (config.academicCouncilText) setAcademicCouncilText(config.academicCouncilText);
      }
    } catch (_) {
      // Use defaults
    }
  }

  const saveApprovalFooterConfig = async (newInclude?: boolean, newBos?: string, newAcm?: string) => {
    try {
      setIsSavingFooter(true);
      await api.updateApprovalFooterConfig({
        department: selectedDept,
        regulationYear: activeReg.regulationYear,
        includeApprovalFooter: newInclude !== undefined ? newInclude : includeApprovalFooter,
        bosMeetingText: (newBos !== undefined ? newBos : bosMeetingText).trim(),
        academicCouncilText: (newAcm !== undefined ? newAcm : academicCouncilText).trim(),
      });
    } catch (err) {
      console.error('Failed to save approval footer configuration:', err);
    } finally {
      setIsSavingFooter(false);
    }
  };

  async function loadReviewQueue() {
    try {
      setLoading(true);
      const data = await api.getCourses({ scope: 'review', department: selectedDept });
      setCourses(data);
      if (data.length > 0) {
        setSelectedCourse(data[0]);
      } else {
        setSelectedCourse(null);
      }
    } catch (err) {
      console.error('Failed to load review queue:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSwitchRegulation = async (year: number, code: string) => {
    setActiveReg({ regulationYear: year, regulationCode: code });
    try {
      await api.updateActiveRegulation({ regulationYear: year, regulationCode: code });
    } catch (_) {}
  };

  const handleSaveNewRegulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegYear || !newRegCode) return;
    try {
      setIsSavingMaster(true);
      const res = await api.updateActiveRegulation({
        regulationYear: Number(newRegYear),
        regulationCode: String(newRegCode).trim(),
        label: `Regulation ${newRegYear}`,
      });
      setActiveReg({ regulationYear: res.regulationYear, regulationCode: res.regulationCode });
      if (res.regulationList) {
        setRegulationList(res.regulationList);
      }
      setShowAddModal(false);
      alert(`Regulation ${res.regulationYear} added & set as active!`);
    } catch (err: any) {
      alert(`Failed to add regulation: ${err.message}`);
    } finally {
      setIsSavingMaster(false);
    }
  };

  const handleSaveNewDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const deptName = newDeptName.trim();
    if (!deptName) return;
    try {
      setIsSavingMaster(true);
      await api.createMaster('departments', { name: deptName, code: deptName.substring(0, 3).toUpperCase() });
      const updated = Array.from(new Set([...customDeptList, deptName]));
      setCustomDeptList(updated);
      setSelectedDept(deptName);
      setNewDeptName('');
      setShowAddModal(false);
      alert(`Department "${deptName}" added successfully!`);
    } catch (err: any) {
      alert(`Failed to add department: ${err.message}`);
    } finally {
      setIsSavingMaster(false);
    }
  };

  const handleReviewAction = async (action: 'APPROVE' | 'RETURN') => {
    if (!selectedCourse?._id) return;
    if (action === 'RETURN' && !remarks.trim()) {
      alert('Please provide return remarks so the faculty member knows what corrections are needed.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.reviewCourse(selectedCourse._id, {
        action,
        remarks: remarks.trim() || (action === 'APPROVE' ? `Approved under Regulation ${activeReg.regulationYear} guidelines.` : ''),
        section: targetSection,
      });
      setSelectedCourse(res.course);
      setRemarks('');
      loadReviewQueue();
      alert(`Syllabus ${action === 'APPROVE' ? 'approved' : 'returned'} successfully.`);
    } catch (err: any) {
      alert(`Review action failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourse?._id) return;
    const courseCode = selectedCourse.courseCode || 'Untitled';
    const courseName = selectedCourse.courseName || '';
    const confirmMsg = `Are you sure you want to permanently delete this submitted syllabus document?\n\nCourse: ${courseCode} - ${courseName}\n\nThis action cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setIsSubmitting(true);
      await api.deleteCourse(selectedCourse._id);
      const deletedId = selectedCourse._id;
      setSelectedCourse(null);
      setSelectedForMerge(prev => prev.filter(id => id !== deletedId));
      loadReviewQueue();
      alert('The submitted syllabus document has been permanently deleted.');
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle course selection for merger (maintaining selection sequence)
  const toggleMergeSelect = (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForMerge(prev => {
      if (prev.includes(courseId)) {
        return prev.filter(id => id !== courseId);
      } else {
        return [...prev, courseId];
      }
    });
  };

  const selectAllCourses = () => {
    if (selectedForMerge.length === courses.length) {
      setSelectedForMerge([]);
    } else {
      setSelectedForMerge(courses.map(c => c._id!));
    }
  };

  const handleMergeDownload = async (format: 'docx' | 'pdf') => {
    if (selectedForMerge.length === 0) {
      alert('Please select at least one syllabus document using the checkboxes.');
      return;
    }

    try {
      if (format === 'docx') setMergingDocx(true);
      if (format === 'pdf') setMergingPdf(true);

      const res = await api.mergeCourses(
        selectedForMerge,
        format,
        activeReg.regulationYear,
        {
          includeApprovalFooter,
          bosMeetingText,
          academicCouncilText,
        }
      );

      if (res.isHtml && res.html) {
        // Pixel-perfect client-side printing into PDF (bypasses serverless Chromium issues on Vercel)
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(res.html);
          doc.close();

          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 2000);
          }, 350);
        } else {
          window.print();
        }
      } else if (res.blob) {
        const url = window.URL.createObjectURL(res.blob);
        const a = document.createElement('a');
        a.href = url;
        const deptSlug = (user?.department || 'Curriculum').replace(/[^a-zA-Z0-9]/g, '_');
        a.download = `Merged_Syllabus_${deptSlug}_Reg${activeReg.regulationYear}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err: any) {
      alert(`Merge download failed: ${err.message}`);
    } finally {
      setMergingDocx(false);
      setMergingPdf(false);
    }
  };

  const pendingCount = courses.filter(c => c.status === 'SUBMITTED').length;
  const isBosCoord = user?.role === 'BOS_COORDINATOR';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Workspace Header with Interactive Regulation & Department Selectors */}
      <div className="bg-gradient-to-r from-white via-slate-50 to-amber-50/40 border border-slate-200 border-l-4 border-l-[#7B1113] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {/* Dynamic Regulation Selector Pill */}
            <div className="relative inline-flex items-center">
              <select
                value={activeReg.regulationYear}
                onChange={e => {
                  const selectedYear = Number(e.target.value);
                  const matched = regulationList.find(r => Number(r.year) === selectedYear);
                  if (matched) {
                    handleSwitchRegulation(matched.year, matched.code);
                  }
                }}
                className="inline-flex items-center pl-7 pr-6 py-1 rounded-full text-xs font-bold bg-[#7B1113] text-white tracking-wide border-0 focus:ring-2 focus:ring-[#7B1113]/30 cursor-pointer appearance-none"
                title="Select Regulation"
              >
                {regulationList.map(r => (
                  <option key={r.year} value={r.year} className="bg-white text-slate-800 py-1">
                    REGULATION {r.year}
                  </option>
                ))}
              </select>
              <BookOpen className="w-3.5 h-3.5 text-white absolute left-2.5 pointer-events-none" />
              <ChevronDown className="w-3 h-3 text-white absolute right-2 pointer-events-none opacity-80" />
            </div>

            {/* Department Dropdown Selector */}
            <div className="relative inline-flex items-center">
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="pl-7 pr-7 py-1 rounded-full text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-[#7B1113]/20 cursor-pointer appearance-none shadow-2xs"
                title="Select Department Queue"
              >
                {customDeptList.map(dept => (
                  <option key={dept} value={dept}>
                    {dept.toUpperCase()}
                  </option>
                ))}
              </select>
              <Building2 className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 pointer-events-none" />
            </div>

            {/* Add Regulation / Department Button */}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 transition-colors shadow-2xs cursor-pointer"
              title="Add a new regulation year or add a new department"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-700" />
              <span>Add Regulation / Department</span>
            </button>
          </div>

          <h1 className="text-2xl font-black text-[#7B1113] tracking-tight flex items-center space-x-2 font-tce mt-1">
            <CheckSquare className="w-6 h-6 text-[#C59B27]" />
            <span>{isBosCoord ? 'BOS Coordinator Curriculum Workspace' : 'Department Syllabus Review Workspace'}</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            {isBosCoord
              ? `Review faculty submitted course syllabi for ${selectedDept}. Select documents in your desired sequence with the checkboxes to merge and download compiled bundles in Word (.docx) or PDF (.pdf).`
              : `Examine submitted curriculum documents under Regulation ${activeReg.regulationYear}, anchor revision notes by section, and issue approvals.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadReviewQueue}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-xs font-semibold flex items-center space-x-1 cursor-pointer"
            title="Refresh queue"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-200 shadow-xs">
            {pendingCount} Awaiting Review
          </span>
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            {courses.length} Total Syllabi
          </span>
        </div>
      </div>

      {/* Highlighted BoS Approval Footer Controls */}
      <div className="bg-gradient-to-r from-amber-50/90 to-orange-50/80 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="flex items-start sm:items-center space-x-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeApprovalFooter}
              onChange={(e) => {
                const checked = e.target.checked;
                setIncludeApprovalFooter(checked);
                saveApprovalFooterConfig(checked);
              }}
              className="w-5 h-5 mt-0.5 sm:mt-0 text-[#7B1113] border-2 border-amber-400 rounded focus:ring-2 focus:ring-amber-500 cursor-pointer accent-[#7B1113]"
            />
            <div>
              <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Include BoS &amp; Academic Council Approval Footer in Exports &amp; Prints
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-amber-200 text-amber-900 rounded-full border border-amber-300">
                  BoS Coordinator Option
                </span>
              </span>
              <p className="text-xs text-slate-600 mt-0.5">
                When checked, the footer appears across all pages of your Word, PDF, and print downloads (both single courses &amp; merged bundles). Faculty downloads will <strong>never</strong> include this footer.
              </p>
            </div>
          </label>

          <div className="text-[11px] font-semibold text-amber-800 bg-amber-100/90 px-3 py-1 rounded-xl border border-amber-200 flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-2xs">
            {isSavingFooter ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                <span>Saved for {selectedDept}</span>
              </>
            )}
          </div>
        </div>

        {includeApprovalFooter && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2.5 border-t border-amber-200/90">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                BoS Meeting Approved Line:
              </label>
              <input
                type="text"
                value={bosMeetingText}
                onChange={(e) => setBosMeetingText(e.target.value)}
                onBlur={() => saveApprovalFooterConfig(undefined, bosMeetingText, undefined)}
                placeholder="e.g. BOS meeting approved: 01-06-2022 or Passed in BoS Meeting 30.05.2026"
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium text-slate-800 shadow-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Left side of running footer (editable per year/session)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Academic Council Meeting Line:
              </label>
              <input
                type="text"
                value={academicCouncilText}
                onChange={(e) => setAcademicCouncilText(e.target.value)}
                onBlur={() => saveApprovalFooterConfig(undefined, undefined, academicCouncilText)}
                placeholder="e.g. Approved in 63rd Academic Council meeting on 25-06-2022"
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium text-slate-800 shadow-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Right side of running footer (editable per year/session)</span>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Document Compilation & Merge Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={selectAllCourses}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
          >
            {selectedForMerge.length === courses.length ? 'Deselect All' : 'Select All'}
          </button>
          <div className="text-xs text-slate-600 flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-[#7B1113]" />
            <span>
              <strong>{selectedForMerge.length}</strong> of {courses.length} courses selected for compilation bundle
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => handleMergeDownload('docx')}
            disabled={selectedForMerge.length === 0 || mergingDocx}
            className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-98"
          >
            <Download className="w-4 h-4" />
            <span>{mergingDocx ? 'Compiling Word...' : 'Download Selected (.docx)'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleMergeDownload('pdf')}
            disabled={selectedForMerge.length === 0 || mergingPdf}
            className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-[#7B1113] hover:bg-[#600D0F] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-98"
          >
            <FolderDown className="w-4 h-4" />
            <span>{mergingPdf ? 'Compiling PDF...' : 'Download Selected (.pdf)'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Queue Sidebar with Ordered Selection Checkboxes */}
        <div className="lg:col-span-4 bg-white border border-slate-200 border-t-4 border-t-[#7B1113] rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Department Syllabi ({courses.length})
            </span>
            <span className="text-[11px] text-slate-400 italic">Check to order bundle</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading queue...</div>
          ) : courses.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No courses submitted in {user?.department || 'this department'} yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {courses.map(c => {
                const isSelected = selectedCourse?._id === c._id;
                const mergeIndex = selectedForMerge.indexOf(c._id!);
                const isCheckedForMerge = mergeIndex !== -1;

                return (
                  <div
                    key={c._id}
                    onClick={() => setSelectedCourse(c)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-2.5 ${
                      isSelected
                        ? 'border-[#7B1113] bg-slate-50 shadow-xs border-l-4 border-l-[#7B1113]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {/* Checkbox with selection sequence badge */}
                    <div
                      onClick={e => toggleMergeSelect(c._id!, e)}
                      className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] transition-all flex-shrink-0 cursor-pointer ${
                        isCheckedForMerge
                          ? 'bg-[#7B1113] text-white shadow-xs'
                          : 'border-2 border-slate-300 hover:border-[#7B1113] bg-white text-slate-400'
                      }`}
                      title={isCheckedForMerge ? `Selected sequence position: ${mergeIndex + 1}` : 'Click to select and order into merged document'}
                    >
                      {isCheckedForMerge ? mergeIndex + 1 : ''}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-slate-800">{c.courseCode}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            c.status === 'SUBMITTED'
                              ? 'bg-amber-100 text-amber-800'
                              : c.status === 'APPROVED' || c.status === 'FINALIZED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'RETURNED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-slate-900 line-clamp-1">{c.courseName}</div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                        <span>{c.courseType} • Sem {c.semester}</span>
                        <span className="truncate max-w-[120px]">By: {c.createdBy?.split('@')[0]}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Side-by-Side Review & Action Pane */}
        <div className="lg:col-span-8 space-y-6">
          {selectedCourse ? (
            <>
              {/* Decision Action Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Reviewing Course:</span>
                    <h2 className="text-base font-bold text-slate-900">
                      {selectedCourse.courseCode} — {selectedCourse.courseName}
                    </h2>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
                    Status: {selectedCourse.status}
                  </span>
                </div>

                {/* Section-anchored comments list */}
                {selectedCourse.comments && selectedCourse.comments.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Review History & Notes:</span>
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedCourse.comments.map((cm, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                          <div className="flex items-center justify-between text-slate-500 mb-1">
                            <span className="font-semibold text-slate-800">
                              {cm.userName} ({cm.userRole})
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700">
                              Section: {cm.section}
                            </span>
                          </div>
                          <p className="text-slate-700 mt-0.5 leading-relaxed">{cm.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Remarks Form */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Section</label>
                    <select
                      value={targetSection}
                      onChange={e => setTargetSection(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                    >
                      <option value="General">General</option>
                      <option value="Course Outcomes">Course Outcomes</option>
                      <option value="Assessment Pattern">Assessment Pattern</option>
                      <option value="Syllabus Modules">Syllabus Modules</option>
                      <option value="Learning Resources">Learning Resources</option>
                      <option value="SDG Alignment">SDG Alignment</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Review Remarks</label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      placeholder="Add specific constructive feedback or approval notes..."
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    onClick={handleDeleteCourse}
                    disabled={isSubmitting}
                    title="Permanently delete this submitted syllabus document"
                    className="px-3.5 py-2 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 font-semibold text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center space-x-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Syllabus</span>
                  </button>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleReviewAction('RETURN')}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-xl border border-rose-300 bg-red-50 hover:bg-rose-100 text-rose-700 font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      Return for Changes
                    </button>
                    <button
                      onClick={() => handleReviewAction('APPROVE')}
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
                    >
                      Approve Syllabus
                    </button>
                  </div>
                </div>
              </div>

              {/* Document Preview Rendering */}
              <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
                <DocumentPreview
                  course={selectedCourse}
                  footerConfig={{
                    includeApprovalFooter,
                    bosMeetingText,
                    academicCouncilText,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              Select a syllabus from the queue to start reviewing.
            </div>
          )}
        </div>
      </div>

      {/* Modal for Adding New Regulation or Department */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-[#7B1113]" />
                <h3 className="font-bold text-base text-slate-900 font-tce">Add Regulation / Department</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setModalTab('regulation')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  modalTab === 'regulation' ? 'bg-white text-[#7B1113] shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Add Regulation
              </button>
              <button
                type="button"
                onClick={() => setModalTab('department')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  modalTab === 'department' ? 'bg-white text-[#7B1113] shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Add Department
              </button>
            </div>

            {modalTab === 'regulation' ? (
              <form onSubmit={handleSaveNewRegulation} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Regulation Year <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={2000}
                    max={2100}
                    value={newRegYear}
                    onChange={e => {
                      const yr = parseInt(e.target.value) || 2026;
                      setNewRegYear(yr);
                      setNewRegCode(String(yr).slice(-2));
                    }}
                    placeholder="e.g. 2028"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#7B1113]/20 focus:border-[#7B1113] outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">The 4-digit academic regulation year.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Regulation Code (RR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={newRegCode}
                    onChange={e => setNewRegCode(e.target.value.trim())}
                    placeholder="e.g. 28"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono text-center font-bold text-[#7B1113] focus:ring-2 focus:ring-[#7B1113]/20 focus:border-[#7B1113] outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">2-digit course code prefix (e.g. 26 for 2026, 28 for 2028).</span>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingMaster || !newRegYear || !newRegCode}
                    className="px-5 py-2 rounded-xl bg-[#7B1113] hover:bg-[#600D0F] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    {isSavingMaster ? 'Saving...' : 'Add & Activate Regulation'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveNewDepartment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newDeptName}
                    onChange={e => setNewDeptName(e.target.value)}
                    placeholder="e.g. Artificial Intelligence and Data Science"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#7B1113]/20 focus:border-[#7B1113] outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Once added, this department will immediately appear in the department dropdown for syllabus review and compilation.
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingMaster || !newDeptName.trim()}
                    className="px-5 py-2 rounded-xl bg-[#7B1113] hover:bg-[#600D0F] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    {isSavingMaster ? 'Saving...' : 'Add Department'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
