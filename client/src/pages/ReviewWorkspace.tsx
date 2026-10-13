import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Course, ReviewComment } from '@syllabusforge/shared';
import { DocumentPreview } from '../components/DocumentPreview';
import {
  CheckSquare,
  AlertCircle,
  CheckCircle2,
  Send,
  MessageSquare,
  Clock,
  ArrowRight,
  User,
} from 'lucide-react';

export const ReviewWorkspace: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [remarks, setRemarks] = useState<string>('');
  const [targetSection, setTargetSection] = useState<string>('General');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadReviewQueue();
  }, []);

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
        remarks: remarks.trim() || (action === 'APPROVE' ? 'Approved as per Regulation 2026 guidelines.' : ''),
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

  const pendingCount = courses.filter(c => c.status === 'SUBMITTED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#7B1113] tracking-tight flex items-center space-x-2 font-tce">
            <CheckSquare className="w-6 h-6 text-[#C59B27]" />
            <span>Department Syllabus Review Workspace</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Examine submitted curriculum documents under Regulation 2026, anchor revision notes by section, and issue institutional approvals.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#7B1113] text-white shadow-xs">
            {pendingCount} Awaiting HoD Review
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Queue Sidebar */}
        <div className="lg:col-span-4 bg-white border border-slate-200 border-t-4 border-t-[#7B1113] rounded-2xl p-4 shadow-xs space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            Department Syllabi Queue
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading queue...</div>
          ) : courses.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No courses in department queue.</div>
          ) : (
            <div className="space-y-2 max-h-[700px] overflow-y-auto">
              {courses.map(c => {
                const isSelected = selectedCourse?._id === c._id;
                return (
                  <div
                    key={c._id}
                    onClick={() => setSelectedCourse(c)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#7B1113] bg-slate-50 shadow-xs border-l-4 border-l-[#7B1113]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
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
                      <span>By: {c.createdBy?.split('@')[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Side-by-Side Review Pane */}
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
                    className="px-4 py-2 rounded-xl border border-rose-300 bg-red-50 hover:bg-rose-100 text-rose-700 font-bold text-xs shadow-xs transition-all active:scale-95"
                  >
                    Return for Changes
                  </button>
                  <button
                    onClick={() => handleReviewAction('APPROVE')}
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95"
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
