import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, Shield, UserCheck, BookOpen, AlertCircle, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { user, login, quickLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials or verify server connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (role: 'FACULTY' | 'HOD' | 'ADMIN') => {
    setError(null);
    setLoading(true);
    try {
      await quickLogin(role);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Quick login failed. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F8FAFC] font-sans">
      {/* LEFT SIDE: Deep TCE Maroon Brand Panel */}
      <div className="w-full md:w-1/2 lg:w-7/12 bg-gradient-to-br from-[#38050A] via-[#480910] to-[#2B0307] p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden text-white min-h-[460px] md:min-h-screen">
        {/* Decorative ambient background glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#C59B27]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#0F2942]/40 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Official College Logo & Name White Card Badge */}
        <div className="relative z-10">
          <div className="bg-white text-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl max-w-sm sm:max-w-md inline-flex items-center space-x-3.5 border border-white/40">
            <img
              src="/tce-logo.png"
              alt="Thiagarajar College of Engineering Crest"
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain flex-shrink-0 drop-shadow-sm"
            />
            <div className="flex flex-col flex-1 min-w-0 pr-1">
              <span className="font-serif font-extrabold text-lg sm:text-xl text-[#7B1113] tracking-tight leading-tight">
                Thiagarajar
              </span>
              <span className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                College of Engineering
              </span>
              <span className="font-serif italic text-[11px] text-[#A67C1E] font-medium leading-tight mt-0.5">
                where quality and ethics matter
              </span>
            </div>
            <div className="border-l border-slate-200 pl-3 flex-shrink-0 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Since</span>
              <span className="text-sm sm:text-base font-black text-[#7B1113] font-serif">1957</span>
            </div>
          </div>
        </div>

        {/* Middle: Prominent Portal Title & OBE Engine Tagline */}
        <div className="relative z-10 my-auto py-10 md:py-16 max-w-xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
            Faculty<br />
            Curriculum & BoS<br />
            Portal
          </h1>
          <p className="mt-5 text-sm sm:text-base text-white/85 font-normal leading-relaxed max-w-lg">
            Outcome Based Education (OBE) & Syllabus Formulation Engine aligned with Autonomous Regulation 2026.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-white/90 border border-white/15 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#E2BF53] mr-1.5" />
              Regulation 2026 Curriculum Portal
            </span>
            <span className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-[#C59B27]/25 text-[#F2D785] border border-[#C59B27]/40 backdrop-blur-sm">
              Board of Studies (BoS)
            </span>
          </div>
        </div>

        {/* Bottom: Affiliation & Copyright Footer */}
        <div className="relative z-10 pt-6 border-t border-white/10 text-xs text-white/60 font-sans flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>© Thiagarajar College of Engineering • Autonomous Institution Affiliated to Anna University</span>
          <span className="text-white/40 hidden lg:inline">Madurai - 625 015</span>
        </div>
      </div>

      {/* RIGHT SIDE: Clean Sign In Form & Institutional Personas */}
      <div className="w-full md:w-1/2 lg:w-5/12 flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-[#F8FAFC]">
        <div className="bg-white rounded-3xl p-7 sm:p-10 shadow-xl border border-slate-100 max-w-md w-full">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#FAF7F2] border border-[#C59B27]/40 text-[#7B1113] text-xs font-bold uppercase tracking-wider mb-4">
            FACULTY SIGN IN
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
            Authenticate with your institutional credentials to access your syllabus and curriculum workspace.
          </p>

          {/* Error Message Box */}
          {error && (
            <div className="p-3.5 mb-5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Authentication Notice</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="faculty@tce.edu"
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#7B1113] focus:border-[#7B1113] transition-all bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#7B1113] focus:border-[#7B1113] transition-all bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#7B1113] hover:bg-[#560B0D] text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#7B1113]/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] border border-[#C59B27]/40 cursor-pointer disabled:opacity-60"
            >
              <span>{loading ? 'Authenticating with TCE...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4 text-[#E2BF53]" />
            </button>
          </form>

          {/* Quick Institutional Personas */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3.5">
              Institutional Personas (One-Click Sign In)
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => handleQuick('FACULTY')}
                disabled={loading}
                className="p-3 rounded-xl border border-slate-200 hover:border-[#7B1113] hover:bg-[#FAF7F2] text-center transition-all group disabled:opacity-50"
              >
                <BookOpen className="w-5 h-5 text-[#7B1113] mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800 block">Faculty</span>
                <span className="text-[10px] text-slate-400 block truncate">Dr. Sharmila</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuick('HOD')}
                disabled={loading}
                className="p-3 rounded-xl border border-slate-200 hover:border-[#0F2942] hover:bg-[#F0F4F8] text-center transition-all group disabled:opacity-50"
              >
                <UserCheck className="w-5 h-5 text-[#0F2942] mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800 block">HoD</span>
                <span className="text-[10px] text-slate-400 block truncate">Dr. Suresh</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuick('ADMIN')}
                disabled={loading}
                className="p-3 rounded-xl border border-slate-200 hover:border-[#C59B27] hover:bg-[#FDF9EE] text-center transition-all group disabled:opacity-50"
              >
                <Shield className="w-5 h-5 text-[#9C7A1D] mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800 block">Admin</span>
                <span className="text-[10px] text-slate-400 block truncate">Dean Academics</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
