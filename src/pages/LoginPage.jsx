import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function getDeviceFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('stravotech-device', 2, 2);
  }
  const raw = [
    navigator.userAgent,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    canvas.toDataURL(),
  ].join('|');

  let hash = 0;
  for (let index = 0; index < raw.length; index += 1) {
    hash = ((hash << 5) - hash + raw.charCodeAt(index)) | 0;
  }
  return `dev_${Math.abs(hash).toString(36)}`;
}

export default function LoginPage() {
  const { login, signup, verifyEmail, resendVerification, loginWithProvider, authError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [liveRiskScore, setLiveRiskScore] = useState(89);

  // Simulating live activity for visual effect
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveRiskScore(prev => {
        const variance = Math.floor(Math.random() * 5) - 2;
        return Math.min(100, Math.max(80, prev + variance));
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (authError) setError(authError);
  }, [authError]);

  useEffect(() => {
    if (sessionStorage.getItem('stravo_oauth_complete') === '1') {
      sessionStorage.removeItem('stravo_oauth_complete');
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const result = await signup({ email, password, fullName, deviceId: getDeviceFingerprint() });
        setPendingEmail(result.email || email);
        setMode('verify');
        setNotice(result.message || 'Verification code sent. Enter the latest 6-digit code from your inbox.');
        return;
      }
      if (mode === 'verify') {
        await verifyEmail({ email: pendingEmail || email, otp });
        navigate('/dashboard');
        return;
      }
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const result = await resendVerification(pendingEmail || email);
      setOtp('');
      setNotice(result.message || 'Verification code sent again. Use the newest code; older codes are invalid.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await loginWithProvider(provider);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-brand-warm text-[#101828] antialiased">
      
      {/* Styles local to the login page */}
      <style dangerouslySetInnerHTML={{__html: `
        .glass-panel {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid #E4DDD2;
        }
        .signal-line-path {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: dash 3s linear infinite;
        }
        @keyframes dash {
          from { stroke-dashoffset: 100; }
          to { stroke-dashoffset: -100; }
        }
        .inner-glow {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        .dot-matrix {
          background-image: radial-gradient(#E4DDD2 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}} />

      {/* Left Panel: Product Storytelling (Desktop Only) */}
      <section className="hidden md:flex flex-col w-7/12 bg-brand-warm relative overflow-hidden border-r border-login-outline-variant/30 px-margin-desktop py-12 justify-center">
        {/* Abstract Background */}
        <div className="absolute inset-0 z-0 opacity-40 dot-matrix"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-login-primary/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-login-tertiary-container/5 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10 max-w-xl mx-auto w-full">
          <div className="mb-12">
            <Link to="/" className="font-headline-md text-headline-md font-bold tracking-tighter text-[#101828] uppercase hover:no-underline">
              STRAVOTECH
            </Link>
          </div>
          
          <h1 className="font-headline-lg text-headline-lg mb-4 text-brand-navy">Welcome back to cleaner growth.</h1>
          <p className="font-body-lg text-body-lg text-login-on-surface-variant mb-12">Monitor risky signups, protect AI credits, and keep fake users out of your product, CRM, and email list.</p>
          
          {/* Dashboard Visualization Area */}
          <div className="space-y-gutter">
            
            {/* Mini Dashboard Card */}
            <div className="glass-panel p-panel-padding rounded-xl shadow-sm border-login-outline-variant">
              <div className="flex items-center justify-between mb-6">
                <span className="font-label-caps text-label-caps text-login-outline tracking-widest">TODAY’S SIGNUP PROTECTION</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="font-label-mono text-label-mono text-green-600">LIVE MONITORING</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-login-surface-container-lowest p-4 border border-login-outline-variant/50 rounded-lg">
                  <p className="font-label-caps text-label-caps text-login-outline mb-1">RISKY BLOCKED</p>
                  <p className="font-headline-md text-headline-md text-login-error">47</p>
                </div>
                <div className="bg-login-surface-container-lowest p-4 border border-login-outline-variant/50 rounded-lg">
                  <p className="font-label-caps text-label-caps text-login-outline mb-1">AI CREDITS SAVED</p>
                  <p className="font-headline-md text-headline-md text-login-primary">$128</p>
                </div>
                <div className="bg-login-surface-container-lowest p-4 border border-login-outline-variant/50 rounded-lg">
                  <p className="font-label-caps text-label-caps text-login-outline mb-1">JUNK PREVENTED</p>
                  <p className="font-headline-md text-headline-md text-brand-navy">63</p>
                </div>
                <div className="bg-login-surface-container-lowest p-4 border border-login-outline-variant/50 rounded-lg">
                  <p className="font-label-caps text-label-caps text-login-outline mb-1">QUALITY SCORE</p>
                  <div className="flex items-baseline gap-1">
                    <p className="font-headline-md text-headline-md text-login-primary">84</p>
                    <p className="text-xs text-login-outline">/100</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Flow Animation */}
            <div className="relative py-4 flex items-center justify-between px-8">
              <div className="flex flex-col items-center gap-2 z-10">
                <div className="w-10 h-10 rounded-full bg-login-surface-container-lowest border border-login-outline-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-login-primary text-[20px]">person_add</span>
                </div>
                <span className="font-label-caps text-label-caps text-login-outline">SIGNUP</span>
              </div>
              <div className="absolute left-0 right-0 top-1/2 -translate-y-6 flex justify-center pointer-events-none">
                <svg fill="none" height="20" viewBox="0 0 400 20" width="80%" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 10H400" stroke="#E4DDD2" strokeDasharray="4 4" strokeWidth="2"></path>
                  <path className="signal-line-path" d="M0 10H400" stroke="#2457E6" strokeWidth="2"></path>
                </svg>
              </div>
              <div className="flex flex-col items-center gap-2 z-10">
                <div className="w-12 h-12 rounded-full bg-login-primary flex items-center justify-center shadow-lg shadow-login-primary/20">
                  <span className="material-symbols-outlined text-white text-[24px] icon-fill">security</span>
                </div>
                <span className="font-label-caps text-label-caps text-login-primary font-bold">RISK CHECK</span>
              </div>
              <div className="flex flex-col items-center gap-2 z-10">
                <div className="w-10 h-10 rounded-full bg-login-surface-container-lowest border border-login-outline-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-login-error text-[20px]">block</span>
                </div>
                <span className="font-label-caps text-label-caps text-login-outline">BLOCKED</span>
              </div>
            </div>

            {/* Live Risk Event Card */}
            <div className="glass-panel p-4 rounded-lg flex items-center justify-between border-l-4 border-l-login-error">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded bg-login-error-container/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-login-error text-[18px]">warning</span>
                </div>
                <div>
                  <p className="font-label-mono text-label-mono text-brand-navy">user@tempmail.dev</p>
                  <p className="font-label-caps text-[9px] text-login-outline uppercase tracking-wider">Disposable Domain Detected</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className="font-label-mono text-label-mono text-login-outline">Risk Score:</span>
                  <span className="font-label-mono text-label-mono text-login-error font-bold">{liveRiskScore}</span>
                </div>
                <div className="inline-block px-2 py-0.5 bg-login-error text-white font-label-caps text-[10px] rounded mt-1 uppercase tracking-tighter">Decision: BLOCK</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Right Panel: Login Form */}
      <main className="flex-1 bg-white flex flex-col items-center justify-center px-margin-mobile md:px-24 py-12">
        <div className="w-full max-w-md space-y-8">
          
          {/* Header */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="mb-12 md:hidden">
              <Link to="/" className="font-headline-md text-headline-md font-bold tracking-tighter text-[#101828] uppercase hover:no-underline">
                STRAVOTECH
              </Link>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-brand-navy mb-2">{mode === 'login' ? 'Sign in to STRAVOTECH' : mode === 'verify' ? 'Verify your email' : 'Create your STRAVOTECH account'}</h2>
            <p className="font-body-md text-body-md text-login-outline">Access your signup risk dashboard.</p>
          </div>

          {error && (
            <div className="bg-login-error-container/30 border border-login-login-error/15 rounded-lg p-3 text-sm text-login-error">
              {error}
            </div>
          )}
          {notice && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              {notice}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="font-label-caps text-label-caps text-login-on-surface-variant" htmlFor="fullName">FULL NAME</label>
                  <input
                    className="w-full h-12 bg-white border border-login-outline-variant px-4 rounded-lg focus:ring-2 focus:ring-login-primary focus:border-login-primary transition-all outline-none text-body-md placeholder:text-login-outline/50 shadow-sm"
                    id="fullName"
                    name="fullName"
                    placeholder="Ada Founder"
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>
              )}
              {mode !== 'verify' ? (
              <div className="space-y-1.5">
                <label className="font-label-caps text-label-caps text-login-on-surface-variant" htmlFor="email">EMAIL ADDRESS</label>
                <input 
                  className="w-full h-12 bg-white border border-login-outline-variant px-4 rounded-lg focus:ring-2 focus:ring-login-primary focus:border-login-primary transition-all outline-none text-body-md placeholder:text-login-outline/50 shadow-sm" 
                  id="email" 
                  name="email" 
                  placeholder="name@company.com" 
                  required 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              ) : (
              <div className="space-y-1.5">
                <label className="font-label-caps text-label-caps text-login-on-surface-variant" htmlFor="otp">VERIFICATION CODE</label>
                <input
                  className="w-full h-12 bg-white border border-login-outline-variant px-4 rounded-lg focus:ring-2 focus:ring-login-primary focus:border-login-primary transition-all outline-none text-body-md placeholder:text-login-outline/50 shadow-sm tracking-[0.25em]"
                  id="otp"
                  inputMode="numeric"
                  maxLength={6}
                  name="otp"
                  placeholder="123456"
                  required
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                <p className="text-sm text-login-outline">Code sent to {pendingEmail || email}</p>
                <p className="text-xs text-login-outline">Use the newest code only. It can take a minute to arrive; check Spam and Promotions too.</p>
              </div>
              )}
              {mode !== 'verify' && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-label-caps text-label-caps text-login-on-surface-variant" htmlFor="password">PASSWORD</label>
                  <a className="font-label-caps text-label-caps text-login-primary hover:underline hover:no-underline" href="#">Forgot password?</a>
                </div>
                <input 
                  className="w-full h-12 bg-white border border-login-outline-variant px-4 rounded-lg focus:ring-2 focus:ring-login-primary focus:border-login-primary transition-all outline-none text-body-md placeholder:text-login-outline/50 shadow-sm" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  required 
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              )}
            </div>

            <button 
              className="w-full h-12 bg-login-primary text-white font-headline-md text-body-lg rounded-lg shadow-lg shadow-login-primary/20 hover:bg-login-primary-container active:scale-[0.98] transition-all flex items-center justify-center inner-glow cursor-pointer" 
              type="submit"
              disabled={loading || (mode === 'verify' && otp.length !== 6)}
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : mode === 'verify' ? 'Verify Email' : 'Create Account'}
            </button>
            {mode === 'verify' && (
              <button
                className="w-full h-11 border border-login-outline-variant rounded-lg text-login-primary font-bold hover:bg-login-surface-container-low transition-colors"
                disabled={loading}
                type="button"
                onClick={handleResendCode}
              >
                Resend Code
              </button>
            )}
          </form>

          {/* Divider */}
          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-login-outline-variant"></div>
            <span className="flex-shrink mx-4 font-label-caps text-label-caps text-login-outline">OR CONTINUE WITH</span>
            <div className="flex-grow border-t border-login-outline-variant"></div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              className="flex items-center justify-center gap-2 h-11 border border-login-outline-variant rounded-lg hover:bg-login-surface-container-low transition-colors active:scale-[0.98] cursor-pointer"
              type="button"
              disabled={loading}
              onClick={() => handleOAuthLogin('google')}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span className="font-body-md text-body-md font-medium text-[#101828]">Google</span>
            </button>
            <button 
              className="flex items-center justify-center gap-2 h-11 border border-login-outline-variant rounded-lg hover:bg-login-surface-container-low transition-colors active:scale-[0.98] cursor-pointer"
              type="button"
              disabled={loading}
              onClick={() => handleOAuthLogin('github')}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.24.73-.53v-1.84c-3.03.66-3.67-1.46-3.67-1.46-.5-1.24-1.21-1.58-1.21-1.58-1-1.37.08-1.35.08-1.35 1.1.07 1.69 1.14 1.69 1.14 1 1.7 2.6 1.2 3.23.92.1-.71.39-1.2.7-1.48-2.42-.28-4.97-1.21-4.97-5.39 0-1.19.43-2.16 1.13-2.93-.11-.27-.49-1.38.11-2.89 0 0 .91-.29 3 1.12.87-.24 1.79-.36 2.71-.37.92 0 1.84.13 2.71.37 2.09-1.41 3-1.12 3-1.12.6 1.5.22 2.61.11 2.89.71.77 1.13 1.74 1.13 2.93 0 4.19-2.55 5.1-4.98 5.37.39.34.73 1.01.73 2.03v3.01c0 .3.18.63.74.52A11 11 0 0012 1.27z" fill="#181717"></path>
              </svg>
              <span className="font-body-md text-body-md font-medium text-[#101828]">GitHub</span>
            </button>
          </div>

          {/* Footer Links */}
          <div className="pt-8 text-center md:text-left space-y-4">
            <p className="font-body-md text-body-md">
              <span className="text-login-outline">{mode === 'login' ? 'New to STRAVOTECH?' : 'Already have an account?'}</span>
              <button type="button" className="text-login-primary font-bold ml-1 hover:underline hover:no-underline" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setNotice(''); }}>
                {mode === 'login' ? 'Join Early Access' : 'Sign in'}
              </button>
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4 border-t border-login-outline-variant/30">
              <div className="flex items-center gap-1.5 text-login-outline">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                <span className="font-label-caps text-[10px]">SECURE LOGIN</span>
              </div>
              <div className="flex items-center gap-1.5 text-login-outline">
                <span className="material-symbols-outlined text-[14px]">api</span>
                <span className="font-label-caps text-[10px]">API ACCESS</span>
              </div>
              <div className="flex items-center gap-1.5 text-login-outline">
                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                <span className="font-label-caps text-[10px]">FOUNDER ONLY</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
