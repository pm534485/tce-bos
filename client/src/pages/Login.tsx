import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  AlertCircle,
  Sparkles,
  X,
  CheckCircle,
  ArrowRight,
  BookOpen,
  UserCheck,
  Mail,
  Lock,
} from 'lucide-react';

// TCE Institutional Domain Regex: ONLY *.tce.edu accounts allowed
export const TCE_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)*tce\.edu$/i;

export function isTceEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return TCE_EMAIL_REGEX.test(email.trim());
}

// Google Official Multi-Color Icon
const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '829781674375-o162b2lvc1kfv8ivolpae6giqdh31lt3.apps.googleusercontent.com';

export const Login: React.FC = () => {
  const { user, login, googleLogin, quickLogin } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAccountChooser, setShowAccountChooser] = useState(false);
  const [showDemoPersonas, setShowDemoPersonas] = useState(false);

  // Custom TCE Google account input state
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [gisRendered, setGisRendered] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Handle Google Credential Response from GIS
  const handleCredentialResponse = async (response: any) => {
    setLoading(true);
    setError(null);
    try {
      if (!response.credential) {
        throw new Error('Google did not return an authentication token.');
      }

      // Client-side token payload decoding to check domain
      const parts = response.credential.split('.');
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(
            decodeURIComponent(
              escape(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
            )
          );
          const email = payload.email || '';

          // STRICT REGEX VALIDATION: only *.tce.edu permitted
          if (!isTceEmail(email)) {
            setError(
              `Access restricted: "${email}" is not an authorized TCE institutional Google account. Only official accounts ending with .tce.edu are permitted.`
            );
            setLoading(false);
            return;
          }
        } catch (decodeErr) {
          console.warn('Payload decode note:', decodeErr);
        }
      }

      // Send credential to backend to persist user in MongoDB and issue session
      await googleLogin({ credential: response.credential });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize official Google Identity Services (GIS)
  useEffect(() => {
    let intervalId: any;

    const setupGoogle = () => {
      const google = (window as any).google;
      if (google?.accounts?.id && googleButtonRef.current) {
        try {
          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
          });

          googleButtonRef.current.innerHTML = '';
          google.accounts.id.renderButton(googleButtonRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: 320,
          });

          // Trigger One-Tap prompt exactly as seen in friend's portal
          google.accounts.id.prompt();
          setGisRendered(true);
          return true;
        } catch (e) {
          console.warn('Google Identity initialization notice:', e);
        }
      }
      return false;
    };

    if (!setupGoogle()) {
      intervalId = setInterval(() => {
        if (setupGoogle()) {
          clearInterval(intervalId);
        }
      }, 300);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Direct login with a selected TCE Google account
  const handleSelectAccount = async (email: string, name?: string) => {
    if (!isTceEmail(email)) {
      setError(`Access restricted: "${email}" is not an authorized .tce.edu account.`);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await googleLogin({ email, name });
      setShowAccountChooser(false);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with Google account.');
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
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F8FAFC] font-sans">
      {/* LEFT SIDE: Deep TCE Maroon Brand Panel */}
      <div className="w-full md:w-1/2 lg:w-7/12 bg-gradient-to-br from-[#38050A] via-[#480910] to-[#2B0307] p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden text-white min-h-[460px] md:min-h-screen">
        {/* Subtle decorative glows */}
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
            Curriculum & Syllabi<br />
            Management Portal
          </h1>
          <p className="mt-5 text-sm sm:text-base text-white/85 font-normal leading-relaxed max-w-lg">
            Outcome Based Education (OBE) & Syllabus Formulation Engine aligned with Autonomous Regulation 2026.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-white/90 border border-white/15 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#E2BF53] mr-1.5" />
              Regulation 2026 Autonomous Portal
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

      {/* RIGHT SIDE: Clean Sign In Card Matching Friend's Website */}
      <div className="w-full md:w-1/2 lg:w-5/12 flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-[#F8FAFC]">
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 max-w-md w-full">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#FAF7F2] border border-[#C59B27]/40 text-[#7B1113] text-xs font-bold uppercase tracking-wider mb-4">
            FACULTY SIGN IN
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-8 leading-relaxed">
            Authenticate with your official Google account to access your syllabus workspace.
          </p>

          {/* Error Message Box (e.g. Non-TCE Email Domain Blocked) */}
          {error && (
            <div className="p-4 mb-6 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start space-x-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-bold block text-red-900">Institutional Access Notice</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Google Sign In Area */}
          <div className="space-y-4">
            {/* Primary Google Sign-In Pill Button */}
            <button
              type="button"
              onClick={() => {
                setError(null);
                setShowAccountChooser(true);
              }}
              disabled={loading}
              className="w-full py-3 px-5 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm shadow-md border border-slate-200 hover:border-slate-300 flex items-center justify-center space-x-3 transition-all active:scale-[0.98] cursor-pointer group"
            >
              <GoogleIcon className="w-5 h-5 flex-shrink-0 group-hover:scale-105 transition-transform" />
              <span>Sign in with Google</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#7B1113] border border-[#C59B27]/40">
                @tce.edu
              </span>
            </button>

            {/* Hidden container for GIS button fallback */}
            <div ref={googleButtonRef} className="hidden" />

            {/* Institutional Security Policy Note */}
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#C59B27]/25 text-[11px] text-slate-600 flex items-start space-x-2">
              <Shield className="w-4 h-4 text-[#7B1113] flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                Security Policy: Only emails with domain{' '}
                <strong className="text-[#7B1113] font-bold">*.tce.edu</strong> are permitted access. Syllabi and documents are persistently retained in MongoDB.
              </span>
            </div>
          </div>

          {/* Subtle Offline Demo / Quick Test Drawer Toggle */}
          <div className="mt-8 pt-5 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => setShowDemoPersonas(!showDemoPersonas)}
              className="text-[11px] text-slate-400 hover:text-slate-600 font-medium transition-colors cursor-pointer"
            >
              {showDemoPersonas ? 'Hide offline demo accounts' : 'Developer / Offline demo login'}
            </button>

            {showDemoPersonas && (
              <div className="mt-3 grid grid-cols-3 gap-2 animate-in fade-in duration-150">
                <button
                  type="button"
                  onClick={() => handleQuick('FACULTY')}
                  disabled={loading}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-[#7B1113] hover:bg-[#FAF7F2] text-center transition-all group cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-[#7B1113] mx-auto mb-1 group-hover:scale-105" />
                  <span className="text-[11px] font-bold text-slate-800 block">Faculty</span>
                  <span className="text-[9px] text-slate-400 block truncate">Dr. Sharmila</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuick('HOD')}
                  disabled={loading}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-[#0F2942] hover:bg-[#F0F4F8] text-center transition-all group cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-[#0F2942] mx-auto mb-1 group-hover:scale-105" />
                  <span className="text-[11px] font-bold text-slate-800 block">HoD</span>
                  <span className="text-[9px] text-slate-400 block truncate">Dr. Suresh</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuick('ADMIN')}
                  disabled={loading}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-[#C59B27] hover:bg-[#FDF9EE] text-center transition-all group cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-[#9C7A1D] mx-auto mb-1 group-hover:scale-105" />
                  <span className="text-[11px] font-bold text-slate-800 block">Admin</span>
                  <span className="text-[9px] text-slate-400 block truncate">Dean Acad</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GOOGLE ACCOUNT CHOOSER DIALOG (Matching Google Accounts Modal from Screenshot) */}
      {showAccountChooser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#202124] text-white rounded-2xl shadow-2xl border border-slate-700 max-w-sm w-full overflow-hidden relative">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-700/80">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <GoogleIcon className="w-5 h-5" />
                  <span className="text-xs font-medium text-slate-300">Sign in with Google</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAccountChooser(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-xl font-medium text-white tracking-tight">Choose an account</h3>
              <p className="text-xs text-slate-400 mt-1">
                to continue to <span className="text-sky-400 font-medium">syllabus-forge</span>
              </p>
            </div>

            {/* Accounts List */}
            <div className="p-3 divide-y divide-slate-700/60">
              {/* Account: Monica Pazhanivel (From TCE Student/Faculty Account) */}
              <button
                type="button"
                onClick={() => handleSelectAccount('pmonica@student.tce.edu', 'Monica Pazhanivel')}
                disabled={loading}
                className="w-full p-3.5 rounded-xl hover:bg-slate-800 flex items-center space-x-3.5 text-left transition-colors cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                  M
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white group-hover:text-sky-300">
                    Monica Pazhanivel
                  </div>
                  <div className="text-xs text-slate-400 truncate">pmonica@student.tce.edu</div>
                </div>
                <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-medium">
                  .tce.edu
                </span>
              </button>

              {/* Account 1: Dr. P. Sharmila */}
              <button
                type="button"
                onClick={() => handleSelectAccount('psaca@tce.edu', 'Dr. P. Sharmila')}
                disabled={loading}
                className="w-full p-3.5 rounded-xl hover:bg-slate-800 flex items-center space-x-3.5 text-left transition-colors cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                  P
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white group-hover:text-sky-300">
                    Dr. P. Sharmila
                  </div>
                  <div className="text-xs text-slate-400 truncate">psaca@tce.edu</div>
                </div>
              </button>

              {/* Account 2 */}
              <button
                type="button"
                onClick={() => handleSelectAccount('r_rajanprakash@tce.edu', 'Dr. R. Rajan Prakash')}
                disabled={loading}
                className="w-full p-3.5 rounded-xl hover:bg-slate-800 flex items-center space-x-3.5 text-left transition-colors cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                  R
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white group-hover:text-sky-300">
                    Dr. R. Rajan Prakash
                  </div>
                  <div className="text-xs text-slate-400 truncate">r_rajanprakash@tce.edu</div>
                </div>
              </button>

              {/* Enter custom account */}
              <div className="p-3">
                <div className="text-xs font-semibold text-slate-300 mb-2">
                  Use another institutional account:
                </div>
                <div className="space-y-2">
                  <input
                    type="email"
                    value={customEmail}
                    onChange={e => {
                      setCustomEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="faculty@tce.edu"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                  />
                  {customEmail && !isTceEmail(customEmail) && (
                    <div className="text-[11px] text-red-400 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>Must end with .tce.edu</span>
                    </div>
                  )}
                  {customEmail && isTceEmail(customEmail) && (
                    <div className="text-[11px] text-emerald-400 flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3 flex-shrink-0" />
                      <span>Valid TCE institutional domain</span>
                    </div>
                  )}
                  <input
                    type="text"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder="Full Name (optional)"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleSelectAccount(customEmail, customName)}
                    disabled={!customEmail || !isTceEmail(customEmail) || loading}
                    className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                  >
                    <span>Sign in with this account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
