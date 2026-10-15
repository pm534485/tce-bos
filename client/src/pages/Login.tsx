import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

// Authorized Google Email Validation Regex: Strictly @tce.edu accounts only (Rejecting @student.tce.edu and others)
export const ALLOWED_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@tce\.edu$/i;

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

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [gisRendered, setGisRendered] = useState(false);

  useEffect(() => {
    // Disable GIS silent auto-selection so user always picks account and authenticates
    const google = (window as any).google;
    if (google?.accounts?.id?.disableAutoSelect) {
      google.accounts.id.disableAutoSelect();
    }
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/courses/new', { replace: true });
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
            setError('Please sign in with your tce.edu college email.');
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
      navigate('/courses/new');
    } catch (err: any) {
      setError(err.message || 'Please sign in with your tce.edu college email.');
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
            hd: 'tce.edu',
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
          hd: 'tce.edu',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              setError(tokenResponse.error_description || 'Google sign-in was cancelled or failed.');
              return;
            }
            if (tokenResponse.access_token) {
              setLoading(true);
              try {
                const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userinfo = await userinfoRes.json();
                if (userinfo.email && !isAllowedEmail(userinfo.email)) {
                  setError('Please sign in with your tce.edu college email.');
                  setLoading(false);
                  return;
                }

                await googleLogin({
                  accessToken: tokenResponse.access_token,
                  email: userinfo.email,
                  name: userinfo.name,
                  avatar: userinfo.picture,
                  googleId: userinfo.sub,
                });
                navigate('/courses/new');
              } catch (err: any) {
                setError(err.message || 'Please sign in with your tce.edu college email.');
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
          <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xl max-w-[340px] sm:max-w-[400px] inline-block border border-white/40">
            <img
              src="/tce-banner.png"
              alt="Thiagarajar College of Engineering - Since 1957"
              className="w-full h-auto object-contain block"
            />
          </div>
        </div>

        {/* Middle: Page Title - Syllabi Management Portal */}
        <div className="relative z-10 my-auto py-10 md:py-16 max-w-xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
            Syllabi Management Portal
          </h1>
        </div>

        {/* Bottom decorative spacer to balance left panel without removed footer */}
        <div className="relative z-10 py-2" />
      </div>

      {/* RIGHT SIDE: Institutional TCE Google Sign In Card */}
      <div className="w-full md:w-1/2 lg:w-5/12 flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-[#F8FAFC]">
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 max-w-md w-full">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-8 leading-relaxed">
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

          {/* Sign in with Google Button (GIS OAuth2 Popup Flow with prompt='select_account') */}
          <div className="border border-slate-200/90 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center bg-slate-50/60 hover:bg-slate-50 transition-colors">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-sm border border-slate-200 hover:border-slate-300 flex items-center justify-center space-x-3 transition-all active:scale-[0.98] cursor-pointer"
            >
              <GoogleIcon className="w-5 h-5 flex-shrink-0" />
              <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
            </button>
            <div ref={googleButtonRef} className="hidden" />
          </div>
        </div>
      </div>
    </div>
  );
};

