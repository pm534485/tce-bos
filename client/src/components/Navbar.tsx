import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CourseType } from '@syllabusforge/shared';
import {
  FileText,
  PlusCircle,
  ShieldCheck,
  CheckSquare,
  LogOut,
  User as UserIcon,
  Layers,
  ChevronDown,
  Award,
  BookOpen,
  LayoutDashboard,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { TceLogo } from './TceLogo';

interface NavbarProps {
  onNewCourse?: (type: CourseType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNewCourse }) => {
  const { user, logout, quickLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileRef]);

  const handleSelectType = (type: CourseType) => {
    setShowTypeModal(false);
    if (onNewCourse) {
      onNewCourse(type);
    } else {
      navigate(`/courses/new?type=${type}`);
    }
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

    const isCourseEditor = location.pathname.startsWith('/courses/');

    return (
      <>
        <header className={`sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs flex items-center transition-all ${
          isCourseEditor ? 'h-[46px]' : 'h-[56px]'
        }`}>
          <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            
            {/* Left: Logo + Navigation */}
            <div className="flex items-center space-x-6">
              <Link to="/" className="flex items-center space-x-2 group">
                <TceLogo variant="compact" />
              </Link>

              <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
                <Link
                  to="/"
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center space-x-1.5 ${
                    isActive('/')
                      ? 'text-[#800020] bg-[#800020]/10 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                {(user?.role === 'HOD' || user?.role === 'ADMIN') && (
                  <Link
                    to="/reviews"
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center space-x-1.5 ${
                      isActive('/reviews')
                        ? 'text-[#800020] bg-[#800020]/10 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Review Queue</span>
                  </Link>
                )}

                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center space-x-1.5 ${
                      isActive('/admin')
                        ? 'text-[#800020] bg-[#800020]/10 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin & ACM</span>
                  </Link>
                )}
              </nav>
            </div>

            {/* Right: Actions + Profile */}
            <div className="flex items-center space-x-3">
              {!isCourseEditor && (
                <button
                  onClick={() => setShowTypeModal(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#800020] hover:bg-[#660019] text-white text-sm font-medium shadow-sm transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New Syllabus</span>
                </button>
              )}

            {user && (
              <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#800020]/50"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-slate-100 mb-2">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                        Role: {user.role}
                      </span>
                    </div>
                    
                    <div className="px-4 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Switch Role
                    </div>
                    <button
                      onClick={() => { quickLogin('FACULTY'); setShowProfileMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${user?.role === 'FACULTY' ? 'bg-[#800020]/5 text-[#800020] font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      Faculty {user?.role === 'FACULTY' && <span className="w-1.5 h-1.5 rounded-full bg-[#800020]"></span>}
                    </button>
                    <button
                      onClick={() => { quickLogin('HOD'); setShowProfileMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${user?.role === 'HOD' ? 'bg-[#800020]/5 text-[#800020] font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      HoD {user?.role === 'HOD' && <span className="w-1.5 h-1.5 rounded-full bg-[#800020]"></span>}
                    </button>
                    <button
                      onClick={() => { quickLogin('ADMIN'); setShowProfileMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${user?.role === 'ADMIN' ? 'bg-[#800020]/5 text-[#800020] font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      Admin {user?.role === 'ADMIN' && <span className="w-1.5 h-1.5 rounded-full bg-[#800020]"></span>}
                    </button>

                    <div className="border-t border-slate-100 mt-2 pt-2">
                      <button
                        onClick={() => { logout(); setShowProfileMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* New Course Type Chooser Modal (TCE Academic Styling) */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border-t-4 border-[#800020] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#F8F9FB] p-5 border-b border-slate-200">
              <div className="flex items-center space-x-2 text-[#800020] mb-1">
                <BookOpen className="w-5 h-5 text-[#800020]" />
                <h3 className="text-lg font-bold font-tce">Create New University Syllabus</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Select the course delivery category for <strong>Regulation 2026</strong>. The wizard will automatically configure institutional guidelines, contact hours, TPS outcomes and assessment schemes.
              </p>
            </div>

            {/* Modal Options */}
            <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
              {/* 1. Theory */}
              <button
                onClick={() => handleSelectType('THEORY')}
                className="w-full text-left p-3.5 rounded-xl border-2 border-slate-200 hover:border-[#800020] hover:bg-slate-50 transition-all flex items-start space-x-3.5 group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#800020]/10 text-[#800020] flex items-center justify-center font-bold text-sm group-hover:bg-[#800020] group-hover:text-white transition-all flex-shrink-0">
                  TH
                </div>
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-[#800020] text-sm">
                    1. Theory Course
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Classroom lecture & tutorial format (e.g., 3-1-0 or 3-0-0). 6–8 Course Outcomes, CATs + Assignments + Terminal Exam, modules and book recency checks.
                  </div>
                </div>
              </button>

              {/* 2. Practical */}
              <button
                onClick={() => handleSelectType('PRACTICAL')}
                className="w-full text-left p-3.5 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-start space-x-3.5 group"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm group-hover:bg-slate-200 group-hover:text-slate-900 transition-all flex-shrink-0">
                  PR
                </div>
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-slate-900 text-sm">
                    2. Practical (Laboratory) Course
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    L=0, T=0, credits = P/2. General CO Pool (Cognitive, Affective, Psychomotor), 13 lab objectives, Schwab/Herron openness levels, Annexure 1 course plan.
                  </div>
                </div>
              </button>

              {/* 3. TCP */}
              <button
                onClick={() => handleSelectType('TCP')}
                className="w-full text-left p-3.5 rounded-xl border-2 border-slate-200 hover:border-[#C59B27] hover:bg-slate-50 transition-all flex items-start space-x-3.5 group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#C59B27]/15 text-[#9C7A1D] flex items-center justify-center font-bold text-sm group-hover:bg-[#C59B27] group-hover:text-white transition-all flex-shrink-0">
                  TCP
                </div>
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-[#9C7A1D] text-sm">
                    3. Theory cum Practical (TCP)
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Integrated lecture & laboratory contact hours. TCP-T or TCP-P examination type, split continuous assessment matrix, combined PO6–PO11 mapping.
                  </div>
                </div>
              </button>

              {/* 4. Audit Course */}
              <button
                onClick={() => handleSelectType('AUDIT')}
                className="w-full text-left p-3.5 rounded-xl border-2 border-slate-200 hover:border-amber-600 hover:bg-amber-50/50 transition-all flex items-start space-x-3.5 group"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm group-hover:bg-amber-700 group-hover:text-white transition-all flex-shrink-0">
                  AU
                </div>
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-amber-800 text-sm">
                    4. Audit Course (Zero Credit)
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    No academic credits assigned (Credits: 0). Mandatory institutional non-CGPA courses evaluated exclusively via Continuous Assessment (CA).
                  </div>
                </div>
              </button>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowTypeModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
