import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { joinEarlyAccess } from '../services/api';

export default function LoginPage() {
  const { login, authError, isAuthenticated, isDashboardEnabled } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [earlyAccessEmail, setEarlyAccessEmail] = useState('');
  const [earlyAccessLoading, setEarlyAccessLoading] = useState(false);
  const [earlyAccessMessage, setEarlyAccessMessage] = useState('');
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
    if (isAuthenticated && isDashboardEnabled) {
      navigate('/dashboard', { replace: true });
      return;
    }
    if (sessionStorage.getItem('stravo_oauth_complete') === '1') {
      sessionStorage.removeItem('stravo_oauth_complete');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isDashboardEnabled, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEarlyAccess = async (event) => {
    event.preventDefault();
    setEarlyAccessLoading(true);
    setEarlyAccessMessage('');
    try {
      const result = await joinEarlyAccess(earlyAccessEmail);
      setEarlyAccessMessage(result.message);
      setEarlyAccessEmail('');
    } catch (err) {
      setEarlyAccessMessage(err.message);
    } finally {
      setEarlyAccessLoading(false);
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
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> CLOSED BETA
            </div>
            <h2 className="font-headline-lg text-headline-lg text-brand-navy mb-2">Sign in to STRAVOTECH</h2>
            <p className="font-body-md text-body-md text-login-outline">Existing beta members can access the dashboard.</p>
          </div>

          {(error || authError) && (
            <div className="bg-login-error-container/30 border border-login-login-error/15 rounded-lg p-3 text-sm text-login-error">
              {error || authError}
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
                  minLength={8}
                  maxLength={72}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <p className="text-xs text-login-outline">8 to 72 characters</p>
              </div>
            </div>

            <button 
              className="w-full h-12 bg-login-primary text-white font-headline-md text-body-lg rounded-lg shadow-lg shadow-login-primary/20 hover:bg-login-primary-container active:scale-[0.98] transition-all flex items-center justify-center inner-glow cursor-pointer" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Please wait...' : 'Sign In'}
            </button>
          </form>

          <div className="border-t border-login-outline-variant pt-7 text-left space-y-4">
            <div>
              <p className="font-headline-sm text-lg text-brand-navy">Not invited yet?</p>
              <p className="mt-1 text-sm text-login-outline">Join the beta waitlist. We will email you when access opens.</p>
            </div>
            <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleEarlyAccess}>
              <input
                className="min-w-0 flex-1 h-11 bg-white border border-login-outline-variant px-4 rounded-lg focus:ring-2 focus:ring-login-primary outline-none text-sm"
                type="email"
                required
                placeholder="you@gmail.com"
                value={earlyAccessEmail}
                onChange={event => setEarlyAccessEmail(event.target.value)}
              />
              <button className="h-11 px-5 rounded-lg border border-login-primary text-login-primary font-bold hover:bg-blue-50 disabled:opacity-50" disabled={earlyAccessLoading} type="submit">
                {earlyAccessLoading ? 'Joining...' : 'Join Early Access'}
              </button>
            </form>
            {earlyAccessMessage && <p className="text-sm text-login-primary">{earlyAccessMessage}</p>}
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
