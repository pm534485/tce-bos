import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Shield, KeyRound, Lock, Mail } from 'lucide-react';

// Authorized Google Email Validation Regex: Strictly *.tce.edu accounts (permits @tce.edu and @student.tce.edu)
export const ALLOWED_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(?:(?:[a-zA-Z0-9-]+\.)*tce\.edu)$/i;

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
  const { user, googleLogin, login } = useAuth();
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState<'faculty' | 'admin'>('faculty');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Admin credentials state
  const [adminEmail, setAdminEmail] = useState('admin@tce.edu');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [gisRendered, setGisRendered] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!adminEmail.trim() || !adminPassword) {
      setError('Please provide both administrator email and password.');
      return;
    }
    setAdminLoading(true);
    try {
      const loggedUser = await login(adminEmail.trim(), adminPassword);
      if (loggedUser.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid administrator credentials. Please check your email and password.');
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    // Disable GIS silent auto-selection so user always picks account and authenticates
    const google = (window as any).google;
    if (google?.accounts?.id?.disableAutoSelect) {
      google.accounts.id.disableAutoSelect();
    }
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Handle Google Credential Response from GIS One Tap / Standard Button
  const handleCredentialResponse = async (response: any) => {
    setLoading(true);
    setError(null);
    try {
      if (!response.credential) {
        throw new Error('Google did not return an authentication token.');
      }

      // Safe base64url JWT payload decoding
      let credEmail = '';
      let credName = '';
      let credAvatar = '';
      let credSub = '';

      const parts = response.credential.split('.');
      if (parts.length === 3) {
        try {
          let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) {
            base64 += '=';
          }
          const jsonStr = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonStr);
          credEmail = payload.email || '';
          credName = payload.name || '';
          credAvatar = payload.picture || '';
          credSub = payload.sub || '';

          // STRICT DOMAIN VALIDATION: Only *.tce.edu accounts permitted
          if (credEmail && !isAllowedEmail(credEmail)) {
            setError('Please sign in with your official tce.edu college email.');
            setLoading(false);
            return;
          }
        } catch (decodeErr) {
          console.warn('Payload decode note:', decodeErr);
        }
      }

      // Send credential to backend to persist user in MongoDB and issue session
      await googleLogin({
        credential: response.credential,
        email: credEmail,
        name: credName,
        avatar: credAvatar,
        googleId: credSub,
      });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Please sign in with your official tce.edu college email.');
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

          if (google.accounts.id.disableAutoSelect) {
            google.accounts.id.disableAutoSelect();
          }

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
        if (!gisRendered && setupGoogle()) {
          clearInterval(intervalId);
        }
      }, 300);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [gisRendered]);

  // Primary Google sign-in click handler using OAuth2 Token Client with prompt=select_account
  const handleGoogleSignIn = () => {
    setError(null);
    const google = (window as any).google;

    if (google?.accounts?.oauth2?.initTokenClient) {
      try {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          prompt: 'select_account',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              setError(tokenResponse.error_description || 'Google sign-in was cancelled or failed.');
              return;
            }
            if (tokenResponse.access_token) {
              setLoading(true);
              try {
                let userinfo: any = null;
                // Optional client-side pre-check (safely wrapped so browser CORS/firewall won't block login)
                try {
                  const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                    signal: AbortSignal.timeout(3500),
                  });
                  if (userinfoRes.ok) {
                    userinfo = await userinfoRes.json();
                    if (userinfo?.email && !isAllowedEmail(userinfo.email)) {
                      setError('Please sign in with your official tce.edu college email.');
                      setLoading(false);
                      return;
                    }
                  }
                } catch (fetchErr) {
                  console.warn('Direct Google userinfo fetch bypassed, delegating to backend:', fetchErr);
                }

                // Backend will securely fetch userinfo server-side and verify institutional access
                await googleLogin({
                  accessToken: tokenResponse.access_token,
                  email: userinfo?.email,
                  name: userinfo?.name,
                  avatar: userinfo?.picture,
                  googleId: userinfo?.sub,
                });
                navigate('/dashboard', { replace: true });
              } catch (err: any) {
                setError(err.message || 'Please sign in with your official tce.edu college email.');
              } finally {
                setLoading(false);
              }
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e) {
        console.warn('OAuth2 token client request error, trying GIS prompt:', e);
      }
    }

    if (google?.accounts?.id) {
      google.accounts.id.prompt();
    } else {
      setError('Google Workspace SSO is loading. Please wait a moment and try again.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F8FAFC] font-sans">
      {/* LEFT SIDE: Deep TCE Maroon Brand Panel */}
      <div className="w-full md:w-1/2 lg:w-7/12 bg-gradient-to-br from-[#38050A] via-[#480910] to-[#2B0307] p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden text-white min-h-[420px] md:min-h-screen">
        {/* Subtle decorative glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#C59B27]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#0F2942]/40 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Official College Logo Banner Card */}
        <div className="relative z-10">
          <div className="bg-white rounded-2xl px-5 py-4 sm:px-6 sm:py-5 shadow-xl w-full block border border-white/40 overflow-hidden">
            <img
              src="/tce-banner.png"
              alt="Thiagarajar College of Engineering - Since 1957"
              className="w-full h-auto object-contain block -mt-[7%] -mb-[6.3%]"
            />
          </div>
        </div>

        {/* Middle: Page Title - Course Design Portal */}
        <div className="relative z-10 my-auto py-10 md:py-16">
          <h1 className="text-5xl sm:text-6xl lg:text-[clamp(2.8rem,4.5vw,5rem)] font-black text-white leading-[1.05] tracking-tight" style={{fontFamily: "'Inter', 'Outfit', system-ui, sans-serif", fontWeight: 900}}>
            Course Design Portal
          </h1>
        </div>

        {/* Bottom decorative spacer */}
        <div className="relative z-10 py-2" />
      </div>

      {/* RIGHT SIDE: Institutional Authentication Card */}
      <div className="w-full md:w-1/2 lg:w-5/12 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-[#F8FAFC]">
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 max-w-lg w-full">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Welcome back
            </h2>
            {authMode === 'admin' && (
              <span className="px-2.5 py-1 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black rounded-lg flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-amber-700" />
                <span>Admin Portal</span>
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            {authMode === 'faculty'
              ? 'Authenticate with your official institutional Google account to design courses.'
              : 'Administrator login to manage institutional regulations, curriculum, and master collections.'}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-2xl mb-6 text-xs font-bold border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setAuthMode('faculty');
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl flex items-center justify-center transition-all ${
                authMode === 'faculty'
                  ? 'bg-[#7B1113] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Faculty</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('admin');
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl flex items-center justify-center transition-all ${
                authMode === 'admin'
                  ? 'bg-[#7B1113] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Admin</span>
            </button>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="p-4 mb-5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start space-x-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-bold block text-red-900">Authentication Notice</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* FACULTY GOOGLE SSO */}
          {authMode === 'faculty' && (
            <div className="space-y-4">
              <div className="border border-slate-200/90 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50/60 hover:bg-slate-50 transition-colors">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-sm border border-slate-200 hover:border-slate-300 flex items-center justify-center space-x-3 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <GoogleIcon className="w-5 h-5 flex-shrink-0" />
                  <span>{loading ? 'Signing in...' : 'Sign in with Google (@tce.edu)'}</span>
                </button>
                <div ref={googleButtonRef} className="hidden" />
              </div>
              <p className="text-[11px] text-center text-slate-400">
                Institutional single sign-on is restricted to verified <strong>@tce.edu</strong> faculty accounts.
              </p>
            </div>
          )}

          {/* ADMIN CREDENTIALS LOGIN */}
          {authMode === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">


              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    placeholder="admin@tce.edu"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#7B1113] focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#7B1113] focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setAdminEmail('admin@tce.edu');
                    setAdminPassword('AdminPassword2026!');
                  }}
                  className="text-amber-700 hover:text-amber-800 underline font-semibold flex items-center space-x-1"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Auto-fill default setup credentials</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full py-3 px-6 rounded-xl bg-[#7B1113] hover:bg-[#600D0F] text-white font-bold text-xs shadow-md flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >

                <span>{adminLoading ? 'Signing In...' : 'Sign In to Admin Workspace'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
