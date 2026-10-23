import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Course, CourseType } from '@syllabusforge/shared';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  PlusCircle,
  Copy,
  ExternalLink,
  Trash2,
  Eye,
  Edit3,
  Award,
  BookOpen,
  GraduationCap,
  Layers,
  Sparkles,
  X,
  Info,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [showBanner, setShowBanner] = useState<boolean>(() => {
    return localStorage.getItem('tce_hide_banner') !== 'true';
  });

  const [adminScope, setAdminScope] = useState<'all' | 'mine'>('all');

  useEffect(() => {
    loadCourses();
  }, [user, adminScope]);

  async function loadCourses() {
    try {
      setLoading(true);
      const params: Record<string, string | number> | undefined =
        user?.role === 'ADMIN' && adminScope === 'mine' ? { scope: 'mine' } : undefined;
      const data = await api.getCourses(params);
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load courses:', err);
      setCourses([]);
    } finally {
      loadCoursesFinished();
    }
  }

  function loadCoursesFinished() {
    setLoading(false);
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this syllabus draft?')) return;
    try {
      await api.deleteCourse(id);
      loadCourses();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleRevise = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.reviseCourse(id);
      navigate(`/courses/${res.course._id}`);
    } catch (err: any) {
      alert(`Revision error: ${err.message}`);
    }
  };

  // Filtered courses
  const courseList = Array.isArray(courses) ? courses : [];
  const filteredCourses = courseList.filter(c => {
    if (!c) return false;
    const matchesSearch =
      (c.courseName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.courseCode || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || c.status === selectedStatus;
    const matchesType = selectedType === 'ALL' || c.courseType === selectedType;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Summary counts
  const draftsCount = courseList.filter(c => c && c.status === 'DRAFT').length;
  const submittedCount = courseList.filter(c => c && c.status === 'SUBMITTED').length;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pt-3 pb-8 space-y-4">
      {/* Sleek Compact TCE Portal Ribbon */}
      {showBanner ? (
        <div className="bg-gradient-to-r from-[#560B0D] via-[#7B1113] to-[#091A2A] rounded-xl px-4 py-2.5 text-white shadow-sm relative overflow-hidden border-b-2 border-[#C59B27] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C59B27] text-slate-900 shadow-xs">
              <Award className="w-3 h-3" />
              <span>Regulation 2026</span>
            </span>
            <h1 className="text-sm font-bold tracking-tight font-tce text-white">
              TCE - Course Design Portal
            </h1>
            <span className="hidden md:inline text-xs text-white/70">
              • Thiagarajar College of Engineering
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-white/90">
            <div>
              <span className="text-[#E2BF53] font-semibold">User:</span>{' '}
              <span className="font-bold">{user?.name}</span> ({user?.role})
            </div>
            <span className="text-white/30 hidden sm:inline">•</span>
            <div className="hidden sm:inline text-white/80">
              {user?.department || 'Curriculum Development Cell'}
            </div>
            <button
              onClick={() => {
                setShowBanner(false);
                localStorage.setItem('tce_hide_banner', 'true');
              }}
              title="Hide banner"
              className="text-white/60 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end -mb-2">
          <button
            onClick={() => {
              setShowBanner(true);
              localStorage.removeItem('tce_hide_banner');
            }}
            className="inline-flex items-center space-x-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Info className="w-3 h-3" />
            <span>Show Portal Header</span>
          </button>
        </div>
      )}

      {/* Metric Cards: Drafts & Submitted only */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Drafts */}
        <div
          onClick={() => setSelectedStatus(selectedStatus === 'DRAFT' ? 'ALL' : 'DRAFT')}
          className={`p-5 rounded-xl border-2 transition-all cursor-pointer bg-white relative overflow-hidden ${
            selectedStatus === 'DRAFT'
              ? 'border-[#7B1113] bg-slate-50 shadow-md ring-2 ring-[#7B1113]/20'
              : 'border-slate-200 hover:border-[#7B1113]/50 hover:shadow-xs'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#7B1113]" />
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Drafts</span>
            <Edit3 className="w-4 h-4 text-[#7B1113]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#7B1113]">{draftsCount}</div>
          <div className="text-xs text-slate-500 mt-1">In formulation / saved drafts</div>
        </div>

        {/* Submitted */}
        <div
          onClick={() => setSelectedStatus(selectedStatus === 'SUBMITTED' ? 'ALL' : 'SUBMITTED')}
          className={`p-5 rounded-xl border-2 transition-all cursor-pointer bg-white relative overflow-hidden ${
            selectedStatus === 'SUBMITTED'
              ? 'border-[#0F2942] bg-[#F0F4F8] shadow-md ring-2 ring-[#0F2942]/20'
              : 'border-slate-200 hover:border-[#0F2942]/50 hover:shadow-xs'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#0F2942]" />
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Submitted</span>
            <Clock className="w-4 h-4 text-[#0F2942]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0F2942]">{submittedCount}</div>
          <div className="text-xs text-slate-500 mt-1">Department review / submitted syllabi</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by course code or title..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#7B1113] focus:border-[#7B1113]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Admin Scope Filter */}
          {user?.role === 'ADMIN' && (
            <select
              value={adminScope}
              onChange={e => setAdminScope(e.target.value as any)}
              className="px-3 py-2 border border-amber-300 bg-amber-50 rounded-lg text-xs font-semibold text-amber-900 focus:ring-2 focus:ring-[#7B1113]"
              title="Admin Scope Filter"
            >
              <option value="all">Institutional View (All Syllabi)</option>
              <option value="mine">My Authored Syllabi Only</option>
            </select>
          )}

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:ring-2 focus:ring-[#7B1113]"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:ring-2 focus:ring-[#7B1113]"
          >
            <option value="ALL">All Course Types</option>
            <option value="THEORY">Theory</option>
            <option value="PRACTICAL">Practical (Lab)</option>
            <option value="TCP">Theory cum Practical (TCP)</option>
            <option value="AUDIT">Audit Course</option>
          </select>
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          Loading course syllabi...
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No course syllabi found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {selectedStatus !== 'ALL'
              ? `You have no documents with status "${selectedStatus}".`
              : 'You have not saved or submitted any course syllabi yet.'}
          </p>
          <button
            onClick={() => navigate('/courses/new')}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#7B1113] hover:bg-[#5E0D0E] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Course</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map(c => {
            // Type badge color
            const typeBorder =
              c.courseType === 'THEORY'
                ? 'border-t-[#7B1113]'
                : c.courseType === 'PRACTICAL'
                ? 'border-t-[#0F2942]'
                : c.courseType === 'TCP'
                ? 'border-t-[#C59B27]'
                : 'border-t-amber-600';

            const typeBadgeBg =
              c.courseType === 'THEORY'
                ? 'bg-[#7B1113]/10 text-[#7B1113]'
                : c.courseType === 'PRACTICAL'
                ? 'bg-[#0F2942]/10 text-[#0F2942]'
                : c.courseType === 'TCP'
                ? 'bg-[#C59B27]/15 text-[#9C7A1D]'
                : 'bg-amber-100 text-amber-800';

            return (
              <div
                key={c._id}
                onClick={() => navigate(`/courses/${c._id}`)}
                className={`bg-white rounded-xl border border-slate-200 border-t-4 ${typeBorder} p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded bg-[#FAF7F2] text-[#7B1113] border border-[#7B1113]/20">
                      {c.courseCode}
                    </span>
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                        c.status === 'APPROVED' || c.status === 'FINALIZED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : c.status === 'SUBMITTED'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : c.status === 'RETURNED'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-[#7B1113] transition-colors mt-2">
                    {c.courseName || 'Untitled Course'}
                  </h3>

                  <div className="flex items-center space-x-2 text-[11px] font-semibold text-slate-500 mt-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${typeBadgeBg}`}>
                      {c.courseType}
                    </span>
                    <span>•</span>
                    <span className="text-slate-600">{c.categoryAbbr || 'PCC'}</span>
                    <span>•</span>
                    <span className="text-slate-700 font-bold">
                      {c.credits} Credits (L-T-P: {c.L}-{c.T}-{c.P})
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                    {c.preamble || 'No preamble defined yet.'}
                  </p>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-600">Semester {c.semester}</span>
                  <div className="flex items-center space-x-1">
                    {(c.status === 'APPROVED' || c.status === 'FINALIZED') && (
                      <button
                        onClick={e => handleRevise(c._id!, e)}
                        title="Clone as new revision"
                        className="p-1 text-slate-400 hover:text-[#7B1113] rounded transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {c.status === 'DRAFT' && (
                      <button
                        onClick={e => handleDelete(c._id!, e)}
                        title="Delete draft"
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
