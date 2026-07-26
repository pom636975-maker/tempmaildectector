import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function SignupPage() {
  const { signup, verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [deviceId] = useState(() => {
    // Generate a simple device ID if not present
    let id = localStorage.getItem('stravo_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('stravo_device_id', id);
    }
    return id;
  });

  // State management
  const [step, setStep] = useState('signup'); // 'signup' or 'verification'
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Constants
  const isFormValid = fullName.trim() && email.trim() && password.length >= 8;

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await signup({
        email,
        password,
        fullName,
        deviceId
      });

      if (response?.needsVerification) {
        setMessage(response.message);
        setStep('verification');
      } else if (response?.action === 'REVIEW') {
        setStep('review_held');
        setMessage(response.message || 'We need to review this signup before enabling dashboard access.');
      } else {
        // Direct success (if verification is disabled on API, though default flow needs email verification)
        setMessage('Signup successful. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await verifyEmail({ email, otp });
      setMessage(response?.message || 'Verification successful! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setMessage('');
    setResending(true);

    try {
      const response = await resendVerification(email);
      setMessage(response?.message || 'Verification code sent again.');
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-brand-warm text-[#101828] antialiased">

      {/* Styles local to the signup page */}
      <style dangerouslySetInnerHTML={{__html: `
        .glass-panel {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid #E4DDD2;
        }
        .dot-matrix {
          background-image: radial-gradient(#E4DDD2 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .inner-glow {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
      `}} />

      {/* Left Panel: Product Storytelling (Desktop Only) */}
      <section className="hidden md:flex flex-col w-7/12 bg-brand-warm relative overflow-hidden border-r border-login-outline-variant/30 px-margin-desktop py-12 justify-center">
        <div className="absolute inset-0 z-0 opacity-40 dot-matrix"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-login-primary/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-login-tertiary-container/5 rounded-full blur-[80px]"></div>

        <div className="relative z-10 max-w-xl mx-auto w-full">
          <div className="mb-12">
            <Link to="/" className="font-headline-md text-headline-md font-bold tracking-tighter text-[#101828] uppercase hover:no-underline">
              STRAVOTECH
            </Link>
          </div>

          <h1 className="font-headline-lg text-headline-lg mb-4 text-brand-navy">Protect your product from bots and junk signups.</h1>
          <p className="font-body-lg text-body-lg text-login-on-surface-variant mb-12">Monitor visitor activity block disposable emails, prevent VPN abuse, and safeguard your conversion metrics in real-time.</p>

          <div className="glass-panel p-panel-padding rounded-xl shadow-sm border-login-outline-variant">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-login-primary">verified</span>
                <div>
                  <h4 className="font-bold text-brand-navy">Real-time disposable email checks</h4>
                  <p className="text-sm text-login-outline">Instantly reject short-lived temp mailboxes.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-login-primary">security</span>
                <div>
                  <h4 className="font-bold text-brand-navy">Advanced device fingerprinting</h4>
                  <p className="text-sm text-login-outline">Identify multiple signup attempts from the same device.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-login-primary">speed</span>
                <div>
                  <h4 className="font-bold text-brand-navy">Velocity rate controls</h4>
                  <p className="text-sm text-login-outline">Stop malicious scripted credential-stuffing campaigns.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right Panel: Signup Forms */}
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
            <h2 className="font-headline-lg text-headline-lg text-brand-navy mb-2">
              {step === 'signup' && 'Create your account'}
              {step === 'verification' && 'Verify your email'}
              {step === 'review_held' && 'Signup Received'}
            </h2>
            <p className="font-body-md text-body-md text-login-outline">
              {step === 'signup' && 'Register now to secure your SaaS conversion logs.'}
              {step === 'verification' && `We sent a security code to matches on ${email}.`}
              {step === 'review_held' && 'Your details are under beta review.'}
            </p>
          </div>

          {error && (
            <div className="bg-login-error-container/30 border border-login-error/15 rounded-lg p-3 text-sm text-login-error">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              {message}
            </div>
          )}

          {/* STEP 1: Signup form */}
          {step === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-label-caps text-label-caps text-login-on-surface-variant" htmlFor="fullName">FULL NAME</label>
                  <input
                    className="w-full h-12 bg-white border border-login-outline-variant px-4 rounded-lg focus:ring-2 focus:ring-login-primary focus:border-login-primary transition-all outline-none text-body-md placeholder:text-login-outline/50 shadow-sm"
                    id="fullName"
                    name="fullName"
                    placeholder="Jane Doe"
                    required
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>
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
                  <label className="font-label-caps text-label-caps text-login-on-surface-variant" htmlFor="password">PASSWORD</label>
                  <input
                    className="w-full h-12 bg-white border border-login-outline-variant px-4 rounded-lg focus:ring-2 focus:ring-login-primary focus:border-login-primary transition-all outline-none text-body-md placeholder:text-login-outline/50 shadow-sm"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    type="password"
                    minLength={8}
                    maxLength={72}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <p className="text-xs text-login-outline">At least 8 characters</p>
                </div>
              </div>

              <button
                className="w-full h-12 bg-login-primary text-white font-headline-md text-body-lg rounded-lg shadow-lg shadow-login-primary/20 hover:bg-login-primary-container active:scale-[0.98] transition-all flex items-center justify-center inner-glow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                type="submit"
                disabled={loading || !isFormValid}
              >
                {loading ? 'Submitting...' : 'Sign Up'}
              </button>
            </form>
          )}

          {/* STEP 2: Email Verification form */}
          {step === 'verification' && (
            <form onSubmit={handleVerifySubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-label-caps text-label-caps text-login-on-surface-variant" htmlFor="otp">ONE-TIME PASSCODE</label>
                  <input
                    className="w-full h-12 bg-white border border-login-outline-variant px-4 rounded-lg focus:ring-2 focus:ring-login-primary focus:border-login-primary transition-all outline-none text-center text-xl font-bold tracking-widest placeholder:text-login-outline/30 shadow-sm"
                    id="otp"
                    name="otp"
                    placeholder="000000"
                    required
                    type="text"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  className="flex-1 h-12 bg-login-primary text-white font-headline-md text-body-lg rounded-lg shadow-lg shadow-login-primary/20 hover:bg-login-primary-container active:scale-[0.98] transition-all flex items-center justify-center inner-glow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  type="submit"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button
                  className="h-12 px-4 border border-login-outline-variant hover:bg-login-surface-container rounded-lg font-bold text-sm text-login-outline disabled:opacity-50"
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                >
                  {resending ? 'Resending...' : 'Resend'}
                </button>
              </div>
            </form>
          )}

          {/* HELD STATE: Early Access / Review Notice */}
          {step === 'review_held' && (
            <div className="space-y-6 text-center md:text-left bg-blue-50/50 p-6 rounded-xl border border-blue-100">
              <span className="material-symbols-outlined text-login-primary text-4xl">hourglass_empty</span>
              <p className="text-body-md text-brand-navy">
                Thank you for applying to the STRAVOTECH closed beta. Due to high demand and active spam prevention, your registration requires manual verification.
              </p>
              <p className="text-sm text-login-outline">
                We will email you at <strong>{email}</strong> once your account has been reviewed.
              </p>
              <button
                onClick={() => setStep('signup')}
                className="inline-block mt-4 text-login-primary font-bold hover:underline"
              >
                ← Back to registration
              </button>
            </div>
          )}

          <div className="border-t border-login-outline-variant pt-7 text-left space-y-4">
            <p className="text-sm text-login-outline">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-login-primary hover:underline hover:no-underline">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
