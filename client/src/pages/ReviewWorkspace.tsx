import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Course } from '@syllabusforge/shared';
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
} from 'lucide-react';

export const ReviewWorkspace: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [remarks, setRemarks] = useState<string>('');
  const [targetSection, setTargetSection] = useState<string>('General');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Regulation details
  const [activeReg, setActiveReg] = useState<{ regulationYear: number; regulationCode: string }>({
    regulationYear: 2026,
    regulationCode: '26',
  });

  // Multi-select for merging syllabus documents: stores course IDs in the exact selection sequence
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [mergingDocx, setMergingDocx] = useState<boolean>(false);
  const [mergingPdf, setMergingPdf] = useState<boolean>(false);

  useEffect(() => {
    loadReviewQueue();
    loadRegulation();
  }, []);

  async function loadRegulation() {
    try {
      const reg = await api.getActiveRegulation();
      if (reg?.regulationYear) {
        setActiveReg(reg);
      }
    } catch (e) {
      // Use defaults
    }
  }

  async function loadReviewQueue() {
    try {
      setLoading(true);
      const data = await api.getCourses({ scope: 'review' });
      setCourses(data);
      if (data.length > 0 && !selectedCourse) {
        setSelectedCourse(data[0]);
      }
    } catch (err) {
      console.error('Failed to load review queue:', err);
    } finally {
      setLoading(false);
    }
  }

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

      const blob = await api.mergeCourses(selectedForMerge, format, activeReg.regulationYear);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const deptSlug = (user?.department || 'Curriculum').replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `Merged_Syllabus_${deptSlug}_Reg${activeReg.regulationYear}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
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
      {/* Workspace Header & Active Regulation Banner */}
      <div className="bg-gradient-to-r from-white via-slate-50 to-amber-50/40 border border-slate-200 border-l-4 border-l-[#7B1113] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#7B1113] text-white tracking-wide">
              <BookOpen className="w-3.5 h-3.5" />
              <span>REGULATION {activeReg.regulationYear}</span>
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {user?.department || 'Institutional Department'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#7B1113] tracking-tight flex items-center space-x-2 font-tce mt-1.5">
            <CheckSquare className="w-6 h-6 text-[#C59B27]" />
            <span>{isBosCoord ? 'BOS Coordinator Curriculum Workspace' : 'Department Syllabus Review Workspace'}</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            {isBosCoord
              ? `Review faculty submitted course syllabi for ${user?.department || 'your department'}. Select documents in your desired sequence with the checkboxes to merge and download compiled bundles in Word (.docx) or PDF (.pdf).`
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
                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
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

              {/* Document Preview Rendering */}
              <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
                <DocumentPreview course={selectedCourse} />
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              Select a syllabus from the queue to start reviewing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
