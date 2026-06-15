import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { joinEarlyAccess } from '../services/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Animation states for counters and indicators
  const [counters, setCounters] = useState({
    blocked: 0,
    credits: 0,
    contacts: 0,
    spend: 0,
    score: 0,
    liveScore: 89
  });
  
  const [progressActive, setProgressActive] = useState(false);
  const [earlyAccessEmail, setEarlyAccessEmail] = useState('');
  const [earlyAccessStatus, setEarlyAccessStatus] = useState('');
  const [earlyAccessLoading, setEarlyAccessLoading] = useState(false);

  // Trigger scroll reveals and counters animation
  useEffect(() => {
    // Scroll reveal observer
    const reveals = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    reveals.forEach(reveal => revealObserver.observe(reveal));

    // Staggered row observer
    const tableRows = document.querySelectorAll('.stagger-row');
    const tableObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          tableObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    tableRows.forEach(row => tableObserver.observe(row));

    // Stats counter animation observer
    const statsSection = document.getElementById('dashboard-stats');
    let statsObserver;
    if (statsSection) {
      statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setProgressActive(true);
            
            const duration = 2000;
            const steps = duration / 16;
            let step = 0;
            
            const interval = setInterval(() => {
              step++;
              setCounters(prev => ({
                ...prev,
                blocked: Math.min(289, Math.ceil((289 / steps) * step)),
                credits: Math.min(742, Math.ceil((742 / steps) * step)),
                contacts: Math.min(312, Math.ceil((312 / steps) * step)),
                spend: Math.min(186, Math.ceil((186 / steps) * step)),
                score: Math.min(82, Math.ceil((82 / steps) * step))
              }));
              
              if (step >= steps) {
                clearInterval(interval);
              }
            }, 16);
            
            statsObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      
      statsObserver.observe(statsSection);
    }

    // Live score fluctuation
    const liveTimer = setInterval(() => {
      setCounters(prev => {
        const variance = Math.floor(Math.random() * 5) - 2;
        return {
          ...prev,
          liveScore: Math.min(100, Math.max(80, prev.liveScore + variance))
        };
      });
    }, 4000);

    return () => {
      revealObserver.disconnect();
      tableObserver.disconnect();
      if (statsObserver) statsObserver.disconnect();
      clearInterval(liveTimer);
    };
  }, []);

  const handleCtaClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      document.getElementById('early-access')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleEarlyAccess = async (event) => {
    event.preventDefault();
    setEarlyAccessLoading(true);
    setEarlyAccessStatus('');
    try {
      const result = await joinEarlyAccess(earlyAccessEmail);
      setEarlyAccessStatus(result.message);
      setEarlyAccessEmail('');
    } catch (error) {
      setEarlyAccessStatus(error.message);
    } finally {
      setEarlyAccessLoading(false);
    }
  };

  return (
    <div className="bg-background text-[#0f172a] font-body-md text-body-md antialiased selection:bg-secondary-fixed selection:text-on-secondary-fixed min-h-screen">
      
      {/* Styles local to the landing page */}
      <style dangerouslySetInnerHTML={{__html: `
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .icon-fill {
          font-variation-settings: 'FILL' 1;
        }
        .bg-pattern {
          background-image: radial-gradient(circle at 2px 2px, rgba(15, 23, 42, 0.05) 1px, transparent 0);
          background-size: 24px 24px;
        }
        .shadow-ambient {
          box-shadow: 0px 4px 20px rgba(15, 23, 42, 0.04);
        }
        .shadow-ambient-lg {
          box-shadow: 0px 12px 40px rgba(15, 23, 42, 0.08);
        }
        
        /* Interactive Classes */
        @media (prefers-reduced-motion: no-preference) {
          .reveal {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.8s ease-out, transform 0.8s ease-out;
          }
          .reveal.active {
            opacity: 1;
            transform: translateY(0);
          }
          
          .stagger-row {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.5s ease-out, transform 0.5s ease-out;
          }
          .stagger-row.active {
            opacity: 1;
            transform: translateY(0);
          }
          
          .progress-fill {
            width: 0%;
            transition: width 1.5s cubic-bezier(0.22, 1, 0.36, 1);
          }
          .progress-fill.active {
            width: 82%;
          }
        }

        .table-row-hover:hover {
          background-color: rgba(59, 130, 246, 0.05);
        }

        /* Hover Effects */
        .before-after-container:hover .before-card {
          opacity: 0.7;
          transform: scale(0.98);
        }
        .before-after-container:hover .after-card {
          transform: scale(1.02);
          box-shadow: 0px 12px 40px rgba(16, 185, 129, 0.15);
        }
        .before-card, .after-card {
          transition: all 0.4s ease-out;
        }

        .benefit-card {
          transition: all 0.3s ease-out;
        }
        .benefit-card:hover {
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.1);
        }
        .benefit-card:hover .material-symbols-outlined {
          transform: translateY(-2px) scale(1.1);
          transition: transform 0.3s ease-out;
        }
      `}} />

      {/* TopNavBar */}
      <nav className="bg-surface/90 backdrop-blur-sm fixed top-0 w-full z-50 border-b border-border-subtle">
        <div className="flex justify-between items-center h-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <Link to="/" className="text-headline-sm font-headline-sm font-bold text-[#0f172a] tracking-tight hover:no-underline">
            STRAVOTECH
          </Link>
          <span className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-700">CLOSED BETA</span>
          
          <div className="hidden md:flex gap-8">
            <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-[#3B82F6] transition-colors duration-200 hover:no-underline" href="#product">Product</a>
            <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-[#3B82F6] transition-colors duration-200 hover:no-underline" href="#solutions">Solutions</a>
            <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-[#3B82F6] transition-colors duration-200 hover:no-underline" href="#pricing">Pricing</a>
            <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-[#3B82F6] transition-colors duration-200 hover:no-underline" href="#case-studies">Case Studies</a>
          </div>
          
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <button 
                onClick={() => navigate('/dashboard')} 
                className="bg-[#3B82F6] hover:bg-secondary-container text-on-primary font-label-caps text-label-caps py-3 px-6 rounded-lg transition-colors shadow-ambient"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="font-label-caps text-label-caps text-on-surface-variant hover:text-[#3B82F6] transition-colors duration-200 hover:no-underline mr-2">
                  Sign In
                </Link>
                <button 
                  onClick={handleCtaClick} 
                  className="hidden sm:block bg-[#3B82F6] hover:bg-secondary-container text-on-primary font-label-caps text-label-caps py-3 px-6 rounded-lg transition-colors shadow-ambient"
                >
                  Join Early Access
                </button>
              </>
            )}
            <div className="md:hidden">
              <button className="p-2 text-on-surface" onClick={handleCtaClick}>
                <span className="material-symbols-outlined">menu</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 md:pt-48 md:pb-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto overflow-hidden relative reveal">
        <div className="absolute inset-0 bg-pattern opacity-50 -z-10"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#3B82F6] opacity-[0.03] rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="grid md:grid-cols-12 gap-gutter items-center">
          <div className="md:col-span-5 space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-full border border-border-subtle">
              <span className="w-2 h-2 rounded-full bg-status-protected"></span>
              <span className="font-label-caps text-label-caps text-on-surface-variant">Closed Beta for AI Founders</span>
            </div>
            
            <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-[#0f172a] leading-tight">
              Stop paying for <span className="text-[#3B82F6]">fake users.</span>
            </h1>
            
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
              STRAVOTECH helps AI SaaS founders block risky signups before they burn AI credits, enter your CRM, pollute your email list, or make your analytics lie.
            </p>
            
            <div className="bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] rounded-lg p-4 text-sm text-[#0f172a] font-medium shadow-sm flex items-start gap-2">
              <span className="material-symbols-outlined text-status-warning text-[18px] mt-0.5">warning</span>
              <span>Every fake signup can become a wasted AI credit, a junk CRM contact, a useless email subscriber, and a misleading growth signal.</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={handleCtaClick} 
                className="bg-[#3B82F6] hover:bg-secondary-container text-on-primary font-label-caps text-label-caps py-4 px-8 rounded-lg transition-colors shadow-ambient text-center"
              >
                Join the Beta
              </button>
              <a 
                className="bg-surface-card hover:bg-surface-container border border-border-subtle text-[#0f172a] font-label-caps text-label-caps py-4 px-8 rounded-lg transition-colors flex items-center justify-center gap-2 hover:no-underline" 
                href="#before-after"
              >
                <span className="material-symbols-outlined text-[18px]">compare_arrows</span>
                See Before vs After
              </a>
            </div>
          </div>
          
          {/* Hero Visual: Dashboard UI */}
          <div className="md:col-span-7 relative z-10 mt-12 md:mt-0">
            <div className="absolute -inset-4 bg-gradient-to-tr from-[#3B82F6]/5 to-transparent rounded-2xl -z-10"></div>
            <div className="bg-surface-card border border-border-subtle rounded-xl p-6 md:p-8 shadow-ambient-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#3B82F6]/5 rounded-bl-full -z-10"></div>
              
              <div className="flex justify-between items-center border-b border-border-subtle pb-5 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0f172a] flex items-center justify-center text-on-primary shadow-sm">
                    <span className="material-symbols-outlined">shield</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-lg font-bold text-[#0f172a] leading-none mb-1">Signup Quality</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-border-subtle rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-status-protected" 
                          style={{
                            width: progressActive ? '82%' : '0%',
                            transition: 'width 1.5s cubic-bezier(0.22, 1, 0.36, 1)'
                          }}
                        />
                      </div>
                      <p className="text-[13px] text-status-protected font-semibold">{counters.score}/100 Score</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-label-caps text-[11px] bg-surface-container px-2 py-1 rounded text-on-surface-variant border border-border-subtle">Last 24h</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" id="dashboard-stats">
                <div className="bg-surface p-4 rounded-lg border border-border-subtle hover:border-[#3B82F6]/30 transition-colors">
                  <p className="text-[12px] text-on-surface-variant mb-1 font-medium">Fake Signups Blocked</p>
                  <p className="font-headline-sm text-2xl text-[#0f172a]">{counters.blocked}</p>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-border-subtle hover:border-[#3B82F6]/30 transition-colors">
                  <p className="text-[12px] text-on-surface-variant mb-1 font-medium">AI Credits Saved</p>
                  <p className="font-headline-sm text-2xl text-status-protected">${counters.credits}</p>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-border-subtle hover:border-[#3B82F6]/30 transition-colors">
                  <p className="text-[12px] text-on-surface-variant mb-1 font-medium">Junk Contacts</p>
                  <p className="font-headline-sm text-2xl text-[#0f172a]">{counters.contacts}</p>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-border-subtle hover:border-[#3B82F6]/30 transition-colors">
                  <p className="text-[12px] text-on-surface-variant mb-1 font-medium">Spend Protected</p>
                  <p className="font-headline-sm text-2xl text-[#0f172a]">${counters.spend}</p>
                </div>
              </div>
              
              {/* Risk Event Card */}
              <div className="border border-status-risk/20 rounded-lg overflow-hidden shadow-sm relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-status-risk"></div>
                <div className="bg-[rgba(239,68,68,0.03)] px-5 py-3 border-b border-border-subtle flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-status-risk text-[18px]">policy</span>
                    <span className="font-label-caps text-label-caps text-[#0f172a]">Recent Interception</span>
                  </div>
                  <span className="bg-[rgba(239,68,68,0.1)] text-status-risk px-2.5 py-1 rounded text-[11px] font-bold tracking-wider border border-[rgba(239,68,68,0.2)]">DECISION: BLOCK</span>
                </div>
                <div className="p-5 bg-surface-card">
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider mb-1.5">Email Attempt</p>
                      <div className="flex items-center gap-2">
                        <p className="font-code-sm text-base text-[#0f172a] font-medium bg-surface-container-low px-2 py-0.5 rounded">user@tempmail.dev</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider mb-1.5">Risk Score</p>
                      <p className="font-headline-sm text-2xl text-status-risk leading-none">{counters.liveScore}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Flags Detected</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2.5 py-1.5 bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)] rounded-md text-[12px] font-mono text-status-risk flex items-center gap-1.5 shadow-sm">
                        <span className="material-symbols-outlined text-[14px]">mail</span> temporary_email
                      </span>
                      <span className="px-2.5 py-1.5 bg-surface-container border border-border-subtle rounded-md text-[12px] font-mono text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">router</span> repeat_ip
                      </span>
                      <span className="px-2.5 py-1.5 bg-surface-container border border-border-subtle rounded-md text-[12px] font-mono text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">vpn_key</span> vpn_detected
                      </span>
                      <span className="px-2.5 py-1.5 bg-surface-container border border-border-subtle rounded-md text-[12px] font-mono text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">speed</span> suspicious_velocity
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <span className="inline-flex items-center bg-[#F8FAFC] border border-border-subtle text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-3 py-1.5 rounded-full">
                  <span className="material-symbols-outlined text-[14px] align-middle mr-1 text-status-protected">check_circle</span>
                  Blocked before product access, CRM entry, and email campaigns
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before vs After Section */}
      <section className="py-24 bg-surface-container-lowest border-y border-border-subtle px-margin-mobile md:px-margin-desktop reveal" id="before-after">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-headline-md text-headline-md text-[#0f172a] mb-4">The real cost of unprotected signups.</h2>
            <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">See how fake growth silently drains your resources, and how STRAVOTECH instantly fixes it.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 before-after-container">
            {/* Before Card */}
            <div className="bg-surface-card border border-[rgba(239,68,68,0.3)] rounded-2xl p-8 shadow-ambient relative overflow-hidden before-card">
              <div className="absolute top-0 left-0 w-full h-1 bg-status-risk"></div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-[rgba(239,68,68,0.1)] flex items-center justify-center text-status-risk">
                  <span className="material-symbols-outlined">trending_down</span>
                </div>
                <h3 className="font-headline-sm text-2xl font-bold text-[#0f172a]">Before STRAVOTECH</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-status-risk mt-0.5">close</span>
                  <div>
                    <p className="font-semibold text-[#0f172a]">More signups, lower conversion</p>
                    <p className="text-sm text-on-surface-variant">Top-line growth looks good, but real revenue doesn't match.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-status-risk mt-0.5">close</span>
                  <div>
                    <p className="font-semibold text-[#0f172a]">Expensive AI credits disappearing</p>
                    <p className="text-sm text-on-surface-variant">Bots and abusers burn through your API limits on free tiers.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-status-risk mt-0.5">close</span>
                  <div>
                    <p className="font-semibold text-[#0f172a]">CRM full of junk</p>
                    <p className="text-sm text-on-surface-variant">Sales wastes time qualifying disposable email addresses.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-status-risk mt-0.5">close</span>
                  <div>
                    <p className="font-semibold text-[#0f172a]">Paying for Mailchimp spam</p>
                    <p className="text-sm text-on-surface-variant">Marketing tiers balloon as you pay to email fake accounts.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-status-risk mt-0.5">close</span>
                  <div>
                    <p className="font-semibold text-[#0f172a]">Founder guessing game</p>
                    <p className="text-sm text-on-surface-variant">You can't trust your product analytics or retention curves.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            {/* After Card */}
            <div className="bg-surface-card border border-[rgba(16,185,129,0.4)] rounded-2xl p-8 shadow-ambient relative overflow-hidden after-card z-10">
              <div className="absolute top-0 left-0 w-full h-1 bg-status-protected"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[rgba(16,185,129,0.05)] rounded-bl-full -z-10"></div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-[rgba(16,185,129,0.1)] flex items-center justify-center text-status-protected">
                  <span className="material-symbols-outlined">trending_up</span>
                </div>
                <h3 className="font-headline-sm text-2xl font-bold text-[#0f172a]">After STRAVOTECH</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-status-protected mt-0.5">check_circle</span>
                  <div>
                    <p className="font-semibold text-[#0f172a]">Risky signups blocked instantly</p>
                    <p className="text-sm text-on-surface-variant">Bad actors are stopped at the door, automatically.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-status-protected mt-0.5">check_circle</span>
                  <div>
                    <p className="font-semibold text-[#0f172a]">AI credits protected</p>
                    <p className="text-sm text-on-surface-variant">Every cent goes toward legitimate users experiencing your product.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-status-protected mt-0.5">check_circle</span>
                  <div>
                    <p className="font-semibold text-[#0f172a]">Clean, actionable CRM</p>
                    <p className="text-sm text-on-surface-variant">Sales only talks to high-intent, real humans.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-status-protected mt-0.5">check_circle</span>
                  <div>
                    <p className="font-semibold text-[#0f172a]">List quality up, costs down</p>
                    <p className="text-sm text-on-surface-variant">Stop paying marketing tools for dead-end contacts.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-status-protected mt-0.5">check_circle</span>
                  <div>
                    <p className="font-semibold text-[#0f172a]">Reliable analytics</p>
                    <p className="text-sm text-on-surface-variant">Make product decisions based on clean, trustworthy data.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Marketing Tools Protection Section */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto reveal">
        <div className="bg-[#0f172a] rounded-3xl p-8 md:p-16 text-center relative overflow-hidden shadow-ambient-lg">
          <div className="absolute inset-0 bg-pattern opacity-10"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-[#3B82F6]/20 blur-[100px] rounded-full"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <span className="material-symbols-outlined text-[#3B82F6] text-5xl mb-6">outgoing_mail</span>
            <h2 className="font-headline-md text-3xl md:text-4xl text-white mb-6 font-bold">Your email tool sends to the list.<br/>STRAVOTECH protects who enters it.</h2>
            <p className="text-[#94a3b8] text-lg mb-8 leading-relaxed">
              Mailchimp, HubSpot, and other marketing platforms are built to send emails, not to detect abusive signups or free-tier farmers. Every fake account that slips through becomes a permanent liability on your monthly bill.
            </p>
            <div className="inline-block bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.3)] px-6 py-4 rounded-xl">
              <p className="text-white font-semibold text-lg">Do not pay to market to users who should never have entered your product.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Competitor Comparison Table */}
      <section className="py-24 bg-surface-container-low border-y border-border-subtle px-margin-mobile md:px-margin-desktop reveal" id="product">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-headline-md text-headline-md text-[#0f172a] mb-4">Email validation is not signup protection.</h2>
            <p className="text-on-surface-variant text-lg">Basic validators only check if an email exists. STRAVOTECH analyzes intent.</p>
          </div>
          
          <div className="overflow-x-auto pb-8">
            <div className="min-w-[800px] bg-surface-card border border-border-subtle rounded-2xl shadow-ambient overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container border-b border-border-subtle">
                    <th className="p-5 font-semibold text-[#0f172a] w-1/3">Feature</th>
                    <th className="p-5 font-semibold text-on-surface-variant text-center text-sm w-1/6">Disposable Email Tools</th>
                    <th className="p-5 font-semibold text-on-surface-variant text-center text-sm w-1/6">Email Validators</th>
                    <th className="p-5 font-semibold text-on-surface-variant text-center text-sm w-1/6">Email Marketing Tools</th>
                    <th className="p-5 font-bold text-[#3B82F6] text-center w-1/6 bg-[#3B82F6]/5 border-l border-border-subtle relative">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#3B82F6] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-sm">
                        Full Protection
                      </div>
                      STRAVOTECH
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm table-body-stagger">
                  <tr className="border-b border-border-subtle table-row-hover transition-colors stagger-row" style={{ transitionDelay: '50ms' }}>
                    <td className="p-5 font-medium text-[#0f172a]">Detect temp emails</td>
                    <td className="p-5 text-center text-status-protected"><span className="material-symbols-outlined">check</span></td>
                    <td className="p-5 text-center text-status-protected"><span className="material-symbols-outlined">check</span></td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-status-protected bg-[#3B82F6]/5 border-l border-border-subtle font-bold"><span className="material-symbols-outlined">check_circle</span></td>
                  </tr>
                  <tr className="border-b border-border-subtle table-row-hover transition-colors stagger-row" style={{ transitionDelay: '100ms' }}>
                    <td className="p-5 font-medium text-[#0f172a]">Detect repeat signups</td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-status-protected bg-[#3B82F6]/5 border-l border-border-subtle font-bold"><span className="material-symbols-outlined">check_circle</span></td>
                  </tr>
                  <tr className="border-b border-border-subtle table-row-hover transition-colors stagger-row" style={{ transitionDelay: '150ms' }}>
                    <td className="p-5 font-medium text-[#0f172a]">Detect suspicious velocity</td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-status-protected bg-[#3B82F6]/5 border-l border-border-subtle font-bold"><span className="material-symbols-outlined">check_circle</span></td>
                  </tr>
                  <tr className="border-b border-border-subtle table-row-hover transition-colors stagger-row" style={{ transitionDelay: '200ms' }}>
                    <td className="p-5 font-medium text-[#0f172a]">Detect VPN/proxy risk</td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-status-protected bg-[#3B82F6]/5 border-l border-border-subtle font-bold"><span className="material-symbols-outlined">check_circle</span></td>
                  </tr>
                  <tr className="border-b border-border-subtle table-row-hover transition-colors stagger-row" style={{ transitionDelay: '250ms' }}>
                    <td className="p-5 font-medium text-[#0f172a]">Stop free-credit abuse</td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">remove</span></td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">remove</span></td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-status-protected bg-[#3B82F6]/5 border-l border-border-subtle font-bold"><span className="material-symbols-outlined">check_circle</span></td>
                  </tr>
                  <tr className="border-b border-border-subtle table-row-hover transition-colors bg-surface-container-lowest stagger-row" style={{ transitionDelay: '300ms' }}>
                    <td className="p-5 font-medium text-[#0f172a] italic">Protect AI credits</td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-[#3B82F6] bg-[#3B82F6]/5 border-l border-border-subtle font-bold"><span className="material-symbols-outlined">verified</span></td>
                  </tr>
                  <tr className="border-b border-border-subtle table-row-hover transition-colors bg-surface-container-lowest stagger-row" style={{ transitionDelay: '350ms' }}>
                    <td className="p-5 font-medium text-[#0f172a] italic">Protect CRM quality</td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">remove</span></td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">remove</span></td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-[#3B82F6] bg-[#3B82F6]/5 border-l border-border-subtle font-bold"><span className="material-symbols-outlined">verified</span></td>
                  </tr>
                  <tr className="border-b border-border-subtle table-row-hover transition-colors bg-surface-container-lowest stagger-row" style={{ transitionDelay: '400ms' }}>
                    <td className="p-5 font-medium text-[#0f172a] italic">Protect email marketing spend</td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">remove</span></td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">remove</span></td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-[#3B82F6] bg-[#3B82F6]/5 border-l border-border-subtle font-bold"><span className="material-symbols-outlined">verified</span></td>
                  </tr>
                  <tr className="border-b border-border-subtle table-row-hover transition-colors bg-surface-container-lowest stagger-row" style={{ transitionDelay: '450ms' }}>
                    <td className="p-5 font-medium text-[#0f172a] italic">Protect analytics accuracy</td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-[#3B82F6] bg-[#3B82F6]/5 border-l border-border-subtle font-bold"><span className="material-symbols-outlined">verified</span></td>
                  </tr>
                  <tr className="border-b border-border-subtle table-row-hover transition-colors stagger-row" style={{ transitionDelay: '500ms' }}>
                    <td className="p-5 font-medium text-[#0f172a]">Give Allow / Review / Block decision</td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-status-protected bg-[#3B82F6]/5 border-l border-border-subtle font-bold"><span className="material-symbols-outlined">check_circle</span></td>
                  </tr>
                  <tr className="table-row-hover transition-colors stagger-row" style={{ transitionDelay: '550ms' }}>
                    <td className="p-5 font-medium text-[#0f172a]">Built for AI SaaS founders</td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-outline-variant"><span className="material-symbols-outlined">close</span></td>
                    <td className="p-5 text-center text-status-protected bg-[#3B82F6]/5 border-l border-border-subtle font-bold"><span className="material-symbols-outlined">check_circle</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Benefit Cards Section */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto reveal" id="solutions">
        <div className="text-center mb-16">
          <h2 className="font-headline-md text-headline-md text-[#0f172a] mb-4">STRAVOTECH is not a cost.<br/>It is insurance against fake growth.</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-card border border-border-subtle p-8 rounded-2xl shadow-ambient hover:shadow-ambient-lg transition-shadow benefit-card">
            <div className="w-12 h-12 bg-[#3B82F6]/10 text-[#3B82F6] rounded-xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined transition-transform duration-300">smart_toy</span>
            </div>
            <h3 className="font-headline-sm text-xl font-bold text-[#0f172a] mb-3">Save AI credits</h3>
            <p className="text-on-surface-variant text-sm">Stop bots from draining your expensive OpenAI or Anthropic API limits during free trials.</p>
          </div>
          
          <div className="bg-surface-card border border-border-subtle p-8 rounded-2xl shadow-ambient hover:shadow-ambient-lg transition-shadow benefit-card">
            <div className="w-12 h-12 bg-status-protected/10 text-status-protected rounded-xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined transition-transform duration-300">savings</span>
            </div>
            <h3 className="font-headline-sm text-xl font-bold text-[#0f172a] mb-3">Protect marketing spend</h3>
            <p className="text-on-surface-variant text-sm">Keep your email marketing tiers low by only storing real, contactable human beings.</p>
          </div>
          
          <div className="bg-surface-card border border-border-subtle p-8 rounded-2xl shadow-ambient hover:shadow-ambient-lg transition-shadow benefit-card">
            <div className="w-12 h-12 bg-status-warning/10 text-status-warning rounded-xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined transition-transform duration-300">contact_mail</span>
            </div>
            <h3 className="font-headline-sm text-xl font-bold text-[#0f172a] mb-3">Keep CRM clean</h3>
            <p className="text-on-surface-variant text-sm">Give your sales team high-intent leads instead of a database full of tempmail addresses.</p>
          </div>
          
          <div className="bg-surface-card border border-border-subtle p-8 rounded-2xl shadow-ambient hover:shadow-ambient-lg transition-shadow md:col-span-1 md:col-start-1 md:col-end-2 xl:col-span-1 benefit-card">
            <div className="w-12 h-12 bg-[#8b5cf6]/10 text-[#8b5cf6] rounded-xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined transition-transform duration-300">analytics</span>
            </div>
            <h3 className="font-headline-sm text-xl font-bold text-[#0f172a] mb-3">Trust your analytics</h3>
            <p className="text-on-surface-variant text-sm">Know your true conversion and retention rates without the noise of automated signup spam.</p>
          </div>
          
          <div className="bg-surface-card border border-border-subtle p-8 rounded-2xl shadow-ambient hover:shadow-ambient-lg transition-shadow md:col-span-2 xl:col-span-2 benefit-card">
            <div className="w-12 h-12 bg-[#0f172a]/10 text-[#0f172a] rounded-xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined transition-transform duration-300">military_tech</span>
            </div>
            <h3 className="font-headline-sm text-xl font-bold text-[#0f172a] mb-3">Stand out in market</h3>
            <p className="text-on-surface-variant text-sm">Build a sustainable, profitable SaaS business based on real usage, while competitors burn runway servicing bots and fake accounts.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section (integrated from LandingPage.jsx design guidelines) */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto reveal" id="pricing">
        <div className="text-center mb-16">
          <h2 className="font-headline-md text-headline-md text-[#0f172a] mb-4">Simple, usage-based pricing</h2>
          <p className="text-on-surface-variant text-lg">Choose the tier that matches your signups velocity.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Starter', price: 29, desc: 'Perfect for early-stage founders', features: ['1,000 risk checks/mo', '3 integrations', 'Basic rules', 'Email support'], recommended: false },
            { name: 'Growth', price: 79, desc: 'For scaling AI SaaS products', features: ['10,000 risk checks/mo', 'All integrations', 'Custom rules', 'Priority support', 'Risk Simulator', 'Review Queue'], recommended: true },
            { name: 'Pro', price: 199, desc: 'Unlimited protection at scale', features: ['Unlimited risk checks', 'Advanced ML rules', 'Dedicated support', 'Custom blocklists', 'SLA guarantee'], recommended: false }
          ].map((plan, idx) => (
            <div 
              key={idx} 
              className={`bg-surface-card border rounded-2xl p-8 shadow-ambient flex flex-col relative ${plan.recommended ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]' : 'border-border-subtle'}`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-6 bg-[#3B82F6] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                  RECOMMENDED
                </div>
              )}
              <h3 className="font-headline-sm text-2xl font-bold text-[#0f172a] mb-2">{plan.name}</h3>
              <p className="text-xs text-on-surface-variant mb-6">{plan.desc}</p>
              
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-headline-sm text-4xl font-bold text-[#0f172a]">${plan.price}</span>
                <span className="text-sm text-on-surface-variant">/mo</span>
              </div>
              
              <div className="border-t border-border-subtle my-6" />
              
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feat, fidx) => (
                  <li key={fidx} className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-status-protected text-[16px]">check_circle</span>
                    {feat}
                  </li>
                ))}
              </ul>
              
              <button
                onClick={handleCtaClick}
                className={`w-full py-3 px-6 rounded-lg font-label-caps text-label-caps text-center transition-colors ${
                  plan.recommended 
                    ? 'bg-[#3B82F6] hover:bg-secondary-container text-on-primary shadow-ambient' 
                    : 'bg-surface border border-border-subtle text-[#0f172a] hover:bg-surface-container'
                }`}
              >
                Request Beta Access
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop reveal" id="early-access">
        <div className="max-w-4xl mx-auto bg-surface-card border border-border-subtle rounded-3xl p-10 md:p-16 text-center shadow-ambient-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#3B82F6]/5 to-transparent pointer-events-none"></div>
          <div className="relative z-10 mx-auto mb-5 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">STRAVOTECH BETA</div>
          <h2 className="font-headline-md text-3xl md:text-4xl text-[#0f172a] mb-6 font-bold relative z-10">Get early access to STRAVOTECH.</h2>
          <p className="text-on-surface-variant text-lg mb-10 max-w-2xl mx-auto relative z-10">
            We are onboarding a small group of AI SaaS founders during closed beta. Share your Gmail or work email and we will contact you when a place opens.
          </p>
          <form className="relative z-10 mx-auto flex max-w-xl flex-col gap-3 sm:flex-row" onSubmit={handleEarlyAccess}>
            <input
              className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-white px-4 py-4 text-[#0f172a] outline-none focus:ring-2 focus:ring-[#3B82F6]"
              type="email"
              required
              placeholder="you@gmail.com"
              value={earlyAccessEmail}
              onChange={event => setEarlyAccessEmail(event.target.value)}
            />
            <button className="rounded-lg bg-[#3B82F6] px-8 py-4 font-bold text-white shadow-ambient transition-colors hover:bg-secondary-container disabled:opacity-60" disabled={earlyAccessLoading} type="submit">
              {earlyAccessLoading ? 'Joining...' : 'Join Early Access'}
            </button>
          </form>
          {earlyAccessStatus && <p className="relative z-10 mt-4 text-sm font-medium text-[#3B82F6]">{earlyAccessStatus}</p>}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container-highest border-t border-border-subtle py-16 px-margin-desktop max-w-container-max mx-auto flex flex-col gap-12 w-full reveal">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="text-headline-sm font-headline-sm font-bold text-[#0f172a]">
            STRAVOTECH
          </div>
          <div className="flex flex-wrap gap-6">
            <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-[#3B82F6] transition-colors focus:ring-2 focus:ring-secondary hover:no-underline" href="#">Privacy Policy</a>
            <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-[#3B82F6] transition-colors focus:ring-2 focus:ring-secondary hover:no-underline" href="#">Terms of Service</a>
            <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-[#3B82F6] transition-colors focus:ring-2 focus:ring-secondary hover:no-underline" href="#">Security Documentation</a>
            <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-[#3B82F6] transition-colors focus:ring-2 focus:ring-secondary hover:no-underline" href="#">Status</a>
            <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-[#3B82F6] transition-colors focus:ring-2 focus:ring-secondary hover:no-underline" href="#">Contact Support</a>
          </div>
        </div>
        <div className="font-body-md text-body-md text-on-surface-variant border-t border-border-subtle pt-8 text-center md:text-left">
          © 2026 STRAVOTECH. All rights reserved. Built for high-stakes AI founders.
        </div>
      </footer>

    </div>
  );
}
