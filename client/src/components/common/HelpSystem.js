import React, { useState, useRef, useEffect } from 'react';

// ══════════════════════════════════════════
// TOOLTIP COMPONENT
// Kisi bhi element ke saath use karo
// Usage: <Tooltip text="Help text"><button>?</button></Tooltip>
// ══════════════════════════════════════════
export function Tooltip({ children, text, position = 'top', maxWidth = 220 }) {
  const [show, setShow] = useState(false);
  const ref = useRef(null);

  const positions = {
    top:    { bottom: '110%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 },
    bottom: { top: '110%',    left: '50%', transform: 'translateX(-50%)', marginTop: 6 },
    left:   { right: '110%',  top: '50%',  transform: 'translateY(-50%)', marginRight: 6 },
    right:  { left: '110%',   top: '50%',  transform: 'translateY(-50%)', marginLeft: 6 },
  };

  const arrows = {
    top:    { bottom: -5,  left: '50%', transform: 'translateX(-50%)', borderLeft:'5px solid transparent', borderRight:'5px solid transparent', borderTop:'5px solid #1a2332' },
    bottom: { top: -5,     left: '50%', transform: 'translateX(-50%)', borderLeft:'5px solid transparent', borderRight:'5px solid transparent', borderBottom:'5px solid #1a2332' },
    left:   { right: -5,   top: '50%',  transform: 'translateY(-50%)', borderTop:'5px solid transparent', borderBottom:'5px solid transparent', borderLeft:'5px solid #1a2332' },
    right:  { left: -5,    top: '50%',  transform: 'translateY(-50%)', borderTop:'5px solid transparent', borderBottom:'5px solid transparent', borderRight:'5px solid #1a2332' },
  };

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={() => setShow(!show)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute', zIndex: 9999,
          ...positions[position],
          background: '#1a2332', color: '#fff',
          padding: '8px 12px', borderRadius: 8,
          fontSize: 12, lineHeight: 1.5,
          maxWidth, whiteSpace: 'pre-wrap',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          pointerEvents: 'none',
          width: 'max-content',
        }}>
          {text}
          <div style={{ position: 'absolute', width: 0, height: 0, ...arrows[position] }} />
        </div>
      )}
    </span>
  );
}

// ══════════════════════════════════════════
// HELP ICON — ? circle
// Usage: <HelpIcon text="Ye field ke baare mein" />
// ══════════════════════════════════════════
export function HelpIcon({ text, position = 'top', size = 16 }) {
  return (
    <Tooltip text={text} position={position} maxWidth={260}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size, borderRadius: '50%',
        background: '#e8f0ff', color: '#0066cc',
        fontSize: size * 0.6, fontWeight: 800, cursor: 'help',
        border: '1.5px solid #c0d4ff', flexShrink: 0,
        userSelect: 'none', marginLeft: 5,
        transition: 'all 0.15s',
        lineHeight: 1,
      }}
        onMouseEnter={e => { e.currentTarget.style.background = '#0066cc'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#e8f0ff'; e.currentTarget.style.color = '#0066cc'; }}
      >?</span>
    </Tooltip>
  );
}

// ══════════════════════════════════════════
// STEP GUIDE — numbered steps with links
// ══════════════════════════════════════════
export function StepGuide({ title, steps, color = '#0066cc', collapsed = true }) {
  const [open, setOpen] = useState(!collapsed);

  return (
    <div style={{
      background: `${color}08`,
      border: `1px solid ${color}33`,
      borderRadius: 10, overflow: 'hidden',
      marginBottom: 12,
    }}>
      {/* Header — click to expand */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', cursor: 'pointer',
          background: open ? `${color}12` : 'transparent',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📖</span>
          <span style={{ fontSize: 13, fontWeight: 700, color }}>{title}</span>
        </div>
        <span style={{ fontSize: 12, color, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </div>

      {open && (
        <div style={{ padding: '0 14px 14px' }}>
          {steps.map((step, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12, padding: '8px 0',
              borderBottom: i < steps.length - 1 ? `1px solid ${color}22` : 'none',
            }}>
              {/* Step number */}
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: color, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1,
              }}>{i + 1}</div>

              {/* Step content */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#1a2332', lineHeight: 1.5 }}>
                  {step.text}
                </div>
                {step.link && (
                  <a href={step.link} target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, color, fontWeight: 700, marginTop: 3, display: 'inline-block', textDecoration: 'none' }}>
                    🔗 {step.linkText || 'Yahan jaao'} →
                  </a>
                )}
                {step.code && (
                  <code style={{
                    display: 'block', marginTop: 6,
                    background: '#1a2332', color: '#7fff7f',
                    padding: '4px 10px', borderRadius: 6,
                    fontSize: 11, fontFamily: 'monospace',
                  }}>{step.code}</code>
                )}
                {step.warning && (
                  <div style={{ fontSize: 11, color: '#dd8800', marginTop: 4, background: '#fff8e8', padding: '4px 8px', borderRadius: 4 }}>
                    ⚠️ {step.warning}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// INFO BOX — colored info/warning/success
// ══════════════════════════════════════════
export function InfoBox({ type = 'info', title, children, dismissible = false }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  const types = {
    info:    { bg: '#f0f7ff', border: '#c0d4ff', color: '#0066cc', icon: 'ℹ️' },
    success: { bg: '#f0fff8', border: '#b3f0d8', color: '#00b86b', icon: '✅' },
    warning: { bg: '#fff8e8', border: '#ffe0a0', color: '#dd8800', icon: '⚠️' },
    error:   { bg: '#fff0f0', border: '#ffcccc', color: '#e53e3e', icon: '❌' },
    tip:     { bg: '#f8f0ff', border: '#d8b4fe', color: '#7c3aed', icon: '💡' },
  };
  const t = types[type] || types.info;

  return (
    <div style={{
      background: t.bg, border: `1px solid ${t.border}`,
      borderRadius: 10, padding: '12px 14px',
      marginBottom: 14, position: 'relative',
    }}>
      {dismissible && (
        <button onClick={() => setVisible(false)} style={{
          position: 'absolute', top: 8, right: 10,
          background: 'none', border: 'none', cursor: 'pointer',
          color: t.color, fontSize: 14, padding: 2,
        }}>✕</button>
      )}
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span>{t.icon}</span>
          <span style={{ fontWeight: 700, color: t.color, fontSize: 13 }}>{title}</span>
        </div>
      )}
      <div style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.6 }}>
        {!title && <span style={{ marginRight: 6 }}>{t.icon}</span>}
        {children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// FORM FIELD with built-in help
// ══════════════════════════════════════════
export function GuideField({ label, helpText, required, children, example, learnMore }) {
  return (
    <div className="form-group">
      <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
        {label}
        {required && <span style={{ color: '#e53e3e', marginLeft: 3 }}>*</span>}
        {helpText && <HelpIcon text={helpText} position="right" />}
      </label>
      {children}
      {example && (
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
          <span style={{ color: '#0066cc', fontWeight: 600 }}>Example:</span> {example}
        </div>
      )}
      {learnMore && (
        <a href={learnMore.url} target="_blank" rel="noreferrer"
          style={{ fontSize: 11, color: '#0066cc', marginTop: 4, display: 'inline-block', textDecoration: 'none', fontWeight: 600 }}>
          📖 {learnMore.text || 'Learn more'} →
        </a>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// ONBOARDING CHECKLIST — first time user ke liye
// ══════════════════════════════════════════
export function OnboardingChecklist({ steps, onDismiss }) {
  const [completed, setCompleted] = useState([]);
  const allDone = completed.length === steps.length;

  const toggle = (id) => {
    setCompleted(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0f7ff, #fff)',
      border: '1.5px solid #c0d4ff',
      borderRadius: 14, padding: 20, marginBottom: 24,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 16, fontWeight: 800, color: '#0066cc' }}>
            🚀 {allDone ? 'Sab complete ho gaya! 🎉' : 'Setup Checklist'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            {completed.length}/{steps.length} steps complete
          </div>
        </div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18 }}>✕</button>
      </div>

      {/* Progress bar */}
      <div style={{ background: '#e8f0ff', borderRadius: 4, height: 6, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{
          width: `${(completed.length / steps.length) * 100}%`,
          height: '100%', background: '#0066cc', borderRadius: 4,
          transition: 'width 0.5s ease',
        }} />
      </div>

      {steps.map(step => (
        <div key={step.id} style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '10px 12px', marginBottom: 6, borderRadius: 10,
          background: completed.includes(step.id) ? '#f0fff8' : '#fff',
          border: `1px solid ${completed.includes(step.id) ? '#b3f0d8' : 'var(--border)'}`,
          cursor: 'pointer', transition: 'all 0.15s',
        }}
          onClick={() => toggle(step.id)}
        >
          {/* Checkbox */}
          <div style={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            background: completed.includes(step.id) ? '#00b86b' : '#fff',
            border: `2px solid ${completed.includes(step.id) ? '#00b86b' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 12, fontWeight: 800, marginTop: 1,
            transition: 'all 0.2s',
          }}>
            {completed.includes(step.id) ? '✓' : ''}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 13, fontWeight: 600,
              textDecoration: completed.includes(step.id) ? 'line-through' : 'none',
              color: completed.includes(step.id) ? 'var(--muted)' : 'var(--text)',
            }}>
              {step.icon} {step.title}
            </div>
            {step.desc && !completed.includes(step.id) && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{step.desc}</div>
            )}
            {step.link && !completed.includes(step.id) && (
              <a href={step.link} style={{ fontSize: 11, color: '#0066cc', fontWeight: 700, textDecoration: 'none' }}
                onClick={e => e.stopPropagation()}>
                Go → {step.linkText || step.link}
              </a>
            )}
          </div>

          {step.required && !completed.includes(step.id) && (
            <span style={{ fontSize: 10, background: '#fff0f0', color: '#e53e3e', padding: '1px 6px', borderRadius: 20, fontWeight: 700, flexShrink: 0 }}>Required</span>
          )}
        </div>
      ))}

      {allDone && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
          <div style={{ fontWeight: 700, color: '#00b86b' }}>Setup complete! Ab app use karo.</div>
          <button className="btn btn-primary btn-sm mt-2" onClick={onDismiss}>Close Checklist</button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// QUICK TOUR — page pe first visit guide
// ══════════════════════════════════════════
export function QuickTour({ steps, onFinish }) {
  const [current, setCurrent] = useState(0);
  const step = steps[current];
  const isLast = current === steps.length - 1;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 28,
        maxWidth: 420, width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.3s ease',
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, justifyContent: 'center' }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === current ? 20 : 8, height: 8, borderRadius: 4,
              background: i === current ? '#0066cc' : i < current ? '#00b86b' : '#e0e0e0',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>{step.icon}</div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 10 }}>
            {step.title}
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>{step.desc}</div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {current > 0 && (
            <button className="btn btn-secondary" onClick={() => setCurrent(c => c - 1)} style={{ flex: 1, justifyContent: 'center' }}>
              ← Back
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={() => isLast ? onFinish() : setCurrent(c => c + 1)}
            style={{ flex: 2, justifyContent: 'center' }}
          >
            {isLast ? '✅ Get Started!' : 'Next →'}
          </button>
        </div>

        <button onClick={onFinish} style={{ display: 'block', margin: '12px auto 0', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 12 }}>
          Skip tour
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// VIDEO/DOCS LINK COMPONENT
// ══════════════════════════════════════════
export function HelpLink({ text, url, icon = '📖', type = 'docs' }) {
  const icons = { docs: '📖', video: '▶️', guide: '🗺️', external: '🔗' };
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 12, color: '#0066cc', fontWeight: 600, textDecoration: 'none',
      padding: '3px 8px', borderRadius: 6, background: '#f0f7ff',
      border: '1px solid #c0d4ff', transition: 'all 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = '#0066cc'; e.currentTarget.style.color = '#fff'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#f0f7ff'; e.currentTarget.style.color = '#0066cc'; }}
    >
      {icons[type] || icons.docs} {text}
    </a>
  );
}

// ══════════════════════════════════════════
// ALL GUIDES DATA — har feature ke liye
// ══════════════════════════════════════════
export const GUIDES = {

  // ── Cloudinary ──
  cloudinary: {
    title: 'Cloudinary Setup Guide',
    color: '#0088cc',
    steps: [
      { text: 'cloudinary.com par jaao aur Free account banao (credit card nahi chahiye)', link: 'https://cloudinary.com/users/register_free', linkText: 'Free account banao' },
      { text: 'Email verify karo — confirmation email aayega' },
      { text: 'Dashboard khulega — top par Cloud Name dikhega. Copy karo.' },
      { text: 'Settings icon → Access Keys → API Key aur API Secret copy karo', warning: 'API Secret kisi ke saath share mat karo!' },
      { text: 'In teeno values yahan paste karo aur Save karein', code: 'Cloud Name + API Key + API Secret' },
    ]
  },

  // ── AWS S3 ──
  aws_s3: {
    title: 'AWS S3 Setup Guide',
    color: '#ff9900',
    steps: [
      { text: 'aws.amazon.com par Free account banao', link: 'https://aws.amazon.com/free', linkText: 'AWS Free account' },
      { text: 'Console mein jaao → Services → S3 → "Create Bucket" click karo' },
      { text: 'Bucket name dalo (e.g. my-socialsaas-media) → Region: ap-south-1 (Mumbai) choose karo' },
      { text: 'Permissions tab → "Block all public access" ko UNCHECK karo → Save', warning: 'Public access allow karna zaroori hai taaki images show ho sakein' },
      { text: 'IAM service mein jaao → Users → "Create User" → Programmatic access', link: 'https://console.aws.amazon.com/iam', linkText: 'IAM Console' },
      { text: 'Permissions mein "AmazonS3FullAccess" policy attach karo' },
      { text: 'Access Key ID aur Secret Access Key copy karke save karo', warning: 'Secret key sirf ek baar dikhti hai — save kar lo!' },
    ]
  },

  // ── ImageKit ──
  imagekit: {
    title: 'ImageKit Setup Guide',
    color: '#9b59b6',
    steps: [
      { text: 'imagekit.io par Free account banao', link: 'https://imagekit.io/registration', linkText: 'Free account banao' },
      { text: 'Dashboard mein jaao → Left sidebar mein "Developer Options" click karo' },
      { text: 'Public Key, Private Key aur URL Endpoint teeno copy karo', code: 'URL Endpoint: https://ik.imagekit.io/YOUR_ID' },
      { text: 'In teeno values yahan paste karo', warning: 'Private Key secret hai — share mat karo' },
    ]
  },

  // ── Facebook API ──
  facebook: {
    title: 'Facebook App Setup Guide',
    color: '#1877f2',
    steps: [
      { text: 'developers.facebook.com par jaao — Facebook account se login karo', link: 'https://developers.facebook.com', linkText: 'Facebook Developers' },
      { text: '"My Apps" → "Create App" → "Business" type select karo' },
      { text: 'App ka naam dalo (e.g. MyBusiness Social) → Create App button dabao' },
      { text: 'Settings → Basic → App ID aur App Secret copy karo' },
      { text: 'Products section mein "Facebook Login" add karo → Web platform choose karo' },
      { text: 'Valid OAuth Redirect URIs mein add karo:', code: 'http://localhost:5000/api/social/callback/facebook' },
      { text: 'App Domains mein add karo: localhost', warning: 'Production mein apna actual domain dalna hoga' },
    ]
  },

  // ── Twitter ──
  twitter: {
    title: 'Twitter (X) Developer Setup',
    color: '#1da1f2',
    steps: [
      { text: 'developer.twitter.com par jaao → Apply for access', link: 'https://developer.twitter.com/en/portal/dashboard', linkText: 'Twitter Developer Portal' },
      { text: 'New Project banao → New App banao' },
      { text: 'App Settings → Authentication Settings → OAuth 2.0 enable karo' },
      { text: 'Callback URL add karo:', code: 'http://localhost:5000/api/social/callback/twitter' },
      { text: 'Keys and Tokens tab → API Key aur API Secret copy karo' },
    ]
  },

  // ── LinkedIn ──
  linkedin: {
    title: 'LinkedIn Developer Setup',
    color: '#0077b5',
    steps: [
      { text: 'linkedin.com/developers par jaao', link: 'https://www.linkedin.com/developers/apps/new', linkText: 'LinkedIn App Create' },
      { text: '"Create App" → Company name, App name, Logo upload karo' },
      { text: 'Auth tab → Client ID aur Client Secret copy karo' },
      { text: 'Authorized redirect URLs mein add karo:', code: 'http://localhost:5000/api/social/callback/linkedin' },
      { text: 'Products tab mein "Share on LinkedIn" aur "Sign In with LinkedIn" add karo' },
    ]
  },

  // ── Gmail (Email) ──
  gmail: {
    title: 'Gmail Email Setup Guide',
    color: '#e53e3e',
    steps: [
      { text: 'Gmail account mein jaao → Settings (gear icon)', link: 'https://myaccount.google.com/security', linkText: 'Google Security' },
      { text: '"2-Step Verification" enable karo (agar nahi hai to)' },
      { text: 'Wapas Security mein jaao → "App passwords" search karo' },
      { text: '"Select app: Mail" → "Select device: Other" → naam dalo "GowebkartSocial"' },
      { text: '16-character password generate hoga — copy karo', warning: 'Ye password sirf ek baar dikhega!' },
      { text: '.env mein paste karo:', code: 'EMAIL_USER=apka@gmail.com\nEMAIL_PASS=xxxx xxxx xxxx xxxx' },
    ]
  },

  // ── MongoDB Atlas ──
  mongodb: {
    title: 'MongoDB Atlas Setup Guide',
    color: '#00ed64',
    steps: [
      { text: 'mongodb.com/atlas par Free account banao', link: 'https://www.mongodb.com/cloud/atlas/register', linkText: 'Free account' },
      { text: '"Build a Database" → Free tier (M0) choose karo → Mumbai region' },
      { text: 'Username aur Password set karo — ye yaad rakhna!' },
      { text: 'Network Access → "Allow access from anywhere" (0.0.0.0/0) add karo' },
      { text: 'Database → Connect → "Connect your application" → Connection string copy karo', code: 'mongodb+srv://user:pass@cluster.mongodb.net/social-saas' },
    ]
  },

  // ── Post Create ──
  createPost: {
    title: 'Post Kaise Banayein?',
    color: '#0066cc',
    steps: [
      { text: 'Pehle Social Accounts mein jaake apne platforms connect karo', link: '/api-settings', linkText: 'API Settings' },
      { text: 'Create Post mein jaao → Platforms select karo (FB, IG, etc.)' },
      { text: 'Text likhо ya AI Writer se auto-generate karо' },
      { text: 'Image/Video upload karo (Storage Settings configure karna zaroori hai)' },
      { text: '"Post Now" ya future date/time schedule karo' },
    ]
  },
};

// ══════════════════════════════════════════
// FLOATING HELP BUTTON — har page pe
// ══════════════════════════════════════════
export function FloatingHelp({ pageGuide }) {
  const [open, setOpen] = useState(false);

  if (!pageGuide) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: 80, right: 20, // 80 = mobile nav ke upar
          width: 48, height: 48, borderRadius: '50%',
          background: open ? '#0066cc' : 'linear-gradient(135deg, #0066cc, #0099ff)',
          color: '#fff', border: 'none', cursor: 'pointer',
          fontSize: 20, boxShadow: '0 4px 16px rgba(0,102,204,0.4)',
          zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}
        title="Help & Guide"
      >
        {open ? '✕' : '❓'}
      </button>

      {/* Help panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 140, right: 20,
          width: 300, maxHeight: '70vh',
          background: '#fff', borderRadius: 14,
          border: '1.5px solid #c0d4ff',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          zIndex: 499, overflow: 'auto',
          animation: 'slideUp 0.2s ease',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, #0066cc, #0099ff)' }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>❓ Help & Guide</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>Is page ke baare mein</div>
          </div>
          <div style={{ padding: 14 }}>
            <StepGuide {...pageGuide} collapsed={false} />
          </div>
        </div>
      )}
    </>
  );
}

export default { Tooltip, HelpIcon, StepGuide, InfoBox, GuideField, OnboardingChecklist, QuickTour, HelpLink, FloatingHelp, GUIDES };
