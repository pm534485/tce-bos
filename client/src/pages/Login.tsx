import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Mail,
  User as UserIcon,
} from 'lucide-react';

// Authorized Email Regex: *.tce.edu (Official TCE accounts) OR gmail.com
export const ALLOWED_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(?:(?:[a-zA-Z0-9-]+\.)*tce\.edu|gmail\.com)$/i;

export function isAllowedEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return ALLOWED_EMAIL_REGEX.test(email.trim());
}

// Backward compatible aliases
export const isTceEmail = isAllowedEmail;
export const TCE_EMAIL_REGEX = ALLOWED_EMAIL_REGEX;

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
  '615647398835-fo26hv337bphlvkoq6g91m0hu0b0ub1p.apps.googleusercontent.com';

export const Login: React.FC = () => {
  const { user, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
          const credEmail = payload.email || '';

          // STRICT REGEX VALIDATION: *.tce.edu or @gmail.com permitted
          if (!isAllowedEmail(credEmail)) {
            setError(
              `Access restricted: "${credEmail}" is not an authorized account. Only official accounts ending with .tce.edu or Google accounts ending with @gmail.com are permitted.`
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

  // Handle direct TCE Org Mail / Gmail Login
  const handleTceEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError('Please enter your official TCE email address or Google account.');
      return;
    }

    if (!isAllowedEmail(cleanEmail)) {
      setError(
        `Access restricted: "${cleanEmail}" is not an authorized email. Only official accounts ending with .tce.edu or Google accounts (@gmail.com) are permitted.`
      );
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await googleLogin({
        email: cleanEmail.toLowerCase(),
        name: name.trim() || undefined,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your institutional email.');
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePrompt = () => {
    setError(null);
    const google = (window as any).google;
    if (google?.accounts?.id) {
      google.accounts.id.prompt();
    } else {
      setError('Google Workspace SSO is loading. You can sign in directly using your TCE institutional email above.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F8FAFC] font-sans">
      {/* LEFT SIDE: Deep TCE Maroon Brand Panel */}
      <div className="w-full md:w-1/2 lg:w-7/12 bg-gradient-to-br from-[#38050A] via-[#480910] to-[#2B0307] p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden text-white min-h-[420px] md:min-h-screen">
        {/* Subtle decorative glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#C59B27]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#0F2942]/40 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Official College Logo Banner Card matching tfpep.tceapps.in */}
        <div className="relative z-10">
          <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xl max-w-[340px] sm:max-w-[400px] inline-block border border-white/40">
            <img
              src="/tce-banner.png"
              alt="Thiagarajar College of Engineering - Since 1957"
              className="w-full h-auto object-contain block"
            />
          </div>
        </div>

        {/* Middle: Prominent Portal Title */}
        <div className="relative z-10 my-auto py-10 md:py-16 max-w-xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
            TCE - Syllabi<br />
            Management Portal
          </h1>
        </div>

        {/* Bottom: Affiliation & Copyright Footer */}
        <div className="relative z-10 pt-6 border-t border-white/10 text-xs text-white/60 font-sans flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>© Thiagarajar College of Engineering • Autonomous Institution Affiliated to Anna University</span>
          <span className="text-white/40 hidden lg:inline">Madurai - 625 015</span>
        </div>
      </div>

      {/* RIGHT SIDE: Institutional TCE Sign In Card */}
      <div className="w-full md:w-1/2 lg:w-5/12 flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-[#F8FAFC]">
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 max-w-md w-full">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#FAF7F2] border border-[#C59B27]/40 text-[#7B1113] text-xs font-bold uppercase tracking-wider mb-4">
            FACULTY SIGN IN
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
            Authenticate with your official Google account to access your syllabus workspace.
          </p>

          {/* Error Message Box */}
          {error && (
            <div className="p-4 mb-6 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start space-x-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-bold block text-red-900">Institutional Access Notice</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Google Official GIS / SSO Button (Top section like tfpep.tceapps.in) */}
          <div className="space-y-3">
            <div ref={googleButtonRef} className="flex justify-center w-full min-h-[44px]" />

            {!gisRendered && (
              <button
                type="button"
                onClick={handleGooglePrompt}
                disabled={loading}
                className="w-full py-3 px-5 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm shadow-sm border border-slate-200 hover:border-slate-300 flex items-center justify-center space-x-3 transition-all active:scale-[0.98] cursor-pointer"
              >
                <GoogleIcon className="w-5 h-5 flex-shrink-0" />
                <span>Sign in with Google</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#7B1113] border border-[#C59B27]/40">
                  @tce.edu
                </span>
              </button>
            )}
          </div>

          {/* Divider for Direct TCE Email Sign In */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                or sign in with tce email
              </span>
            </div>
          </div>

          {/* Institutional TCE Email Form */}
          <form onSubmit={handleTceEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="tce-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Official TCE Email or Gmail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="tce-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="faculty@tce.edu or name@gmail.com"
                  required
                  className={`w-full pl-10 pr-28 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all ${
                    email && !isAllowedEmail(email)
                      ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : email && isAllowedEmail(email)
                      ? 'border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                      : 'border-slate-200 focus:border-[#7B1113] focus:ring-1 focus:ring-[#7B1113]'
                  }`}
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[10px] font-semibold text-slate-400">
                  @tce.edu / gmail
                </span>
              </div>

              {email && isAllowedEmail(email) && (
                <div className="mt-1.5 flex items-center space-x-1.5 text-[11px] text-emerald-600 font-medium animate-in fade-in duration-150">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Authorized TCE institutional or Google domain</span>
                </div>
              )}
              {email && !isAllowedEmail(email) && (
                <div className="mt-1.5 flex items-center space-x-1.5 text-[11px] text-red-500 font-medium animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Must be an official .tce.edu or @gmail.com account</span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="faculty-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Faculty / User Name <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="faculty-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. K. Ramesh"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#7B1113] focus:ring-1 focus:ring-[#7B1113] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !isAllowedEmail(email)}
              className="w-full py-3 px-5 rounded-full bg-[#7B1113] hover:bg-[#600D0F] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer mt-1"
            >
              <span>{loading ? 'Signing in...' : 'Sign in to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
