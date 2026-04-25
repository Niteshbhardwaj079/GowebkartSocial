import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../services/api';

const companyAPI = {
  get:          ()  => api.get('/company'),
  update:       (d) => api.put('/company', d),
  uploadLogo:   (f) => { const fd = new FormData(); fd.append('logo', f);   return api.post('/company/logo',   fd, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  uploadBanner: (f) => { const fd = new FormData(); fd.append('banner', f); return api.post('/company/banner', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); },
};

export default function CompanyPage() {
  const { user }   = useSelector(s => s.auth);
  const [company,  setCompany]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [logoUp,   setLogoUp]   = useState(false);
  const [bannerUp, setBannerUp] = useState(false);
  const [form,     setForm]     = useState({});
  const logoRef   = useRef();
  const bannerRef = useRef();

  useEffect(() => {
    companyAPI.get()
      .then(r => { setCompany(r.data.company); setForm(r.data.company || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setBranding = (k) => (e) => setForm(f => ({ ...f, branding: { ...(f.branding || {}), [k]: e.target.value } }));
  const setSocial = (k) => (e) => setForm(f => ({ ...f, socialLinks: { ...(f.socialLinks || {}), [k]: e.target.value } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await companyAPI.update(form);
      setCompany(res.data.company);
      toast.success('✅ Company profile updated!');
    } catch (e) {
      toast.error('Update failed');
    } finally { setSaving(false); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoUp(true);
    try {
      const res = await companyAPI.uploadLogo(file);
      setCompany(c => ({ ...c, logo: res.data.logo }));
      setForm(f => ({ ...f, logo: res.data.logo }));
      toast.success('✅ Logo uploaded!');
    } catch { toast.error('Logo upload failed'); }
    finally { setLogoUp(false); }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBannerUp(true);
    try {
      const res = await companyAPI.uploadBanner(file);
      setCompany(c => ({ ...c, branding: { ...(c.branding || {}), bannerImage: res.data.banner } }));
      toast.success('✅ Banner uploaded!');
    } catch { toast.error('Banner upload failed'); }
    finally { setBannerUp(false); }
  };

  if (loading) return <div className="page"><div style={{ padding: 40, color: 'var(--muted)' }}>⟳ Loading...</div></div>;

  return (
    <div className="page fade-in">
      <div className="page-header flex justify-between items-center">
        <div>
          <div className="page-title">🏢 Company Profile</div>
          <div className="page-sub">Apni company ki details, logo aur branding set karo</div>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '⟳ Saving...' : '💾 Save Changes'}
        </button>
      </div>

      {/* Banner */}
      <div style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 24, height: 160, background: form.branding?.primaryColor ? `linear-gradient(135deg, ${form.branding.primaryColor}, ${form.branding.secondaryColor || '#0099ff'})` : 'linear-gradient(135deg, #0066cc, #0099ff)', cursor: 'pointer' }}
        onClick={() => bannerRef.current?.click()}>
        {company?.branding?.bannerImage && (
          <img src={company.branding.bannerImage} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
        )}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
          <div style={{ color: '#fff', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{bannerUp ? '⟳' : '🖼️'}</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{bannerUp ? 'Uploading...' : 'Click to change banner'}</div>
          </div>
        </div>
        <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerUpload} style={{ display: 'none' }} />
      </div>

      <div className="grid grid-2">
        {/* Left column */}
        <div>
          {/* Logo + Basic Info */}
          <div className="card mb-4">
            <div className="card-title mb-4">🏷️ Basic Information</div>

            {/* Logo upload */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 80, height: 80, borderRadius: 16, background: 'var(--bg3)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}
                onClick={() => logoRef.current?.click()}>
                {logoUp ? (
                  <span style={{ fontSize: 20 }}>⟳</span>
                ) : company?.logo ? (
                  <img src={company.logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
                    <div style={{ fontSize: 24 }}>🏢</div>
                    <div style={{ fontSize: 10, marginTop: 4 }}>Upload Logo</div>
                  </div>
                )}
              </div>
              <div>
                <button className="btn btn-secondary btn-sm" onClick={() => logoRef.current?.click()}>{logoUp ? '⟳ Uploading...' : '📁 Upload Logo'}</button>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>PNG, JPG — Max 5MB<br/>Recommended: 400×400px</div>
              </div>
              <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
            </div>

            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input className="form-input" placeholder="My Business Pvt. Ltd." value={form.name || ''} onChange={set('name')} />
            </div>
            <div className="form-group">
              <label className="form-label">Tagline / Slogan</label>
              <input className="form-input" placeholder="Your business tagline" value={form.branding?.tagline || ''} onChange={setBranding('tagline')} />
            </div>
            <div className="form-group">
              <label className="form-label">About Company</label>
              <textarea className="form-textarea" placeholder="Apni company ke baare mein likhiye..." value={form.about || ''} onChange={set('about')} style={{ minHeight: 80 }} />
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Industry</label>
                <select className="form-select" value={form.industry || ''} onChange={set('industry')}>
                  <option value="">Select Industry</option>
                  {['Digital Marketing','E-Commerce','Fashion & Apparel','Food & Restaurant','Real Estate','Education','Healthcare','Technology','Finance','Travel & Tourism','Entertainment','Other'].map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Website</label>
                <input className="form-input" placeholder="https://yourwebsite.com" value={form.website || ''} onChange={set('website')} />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="card mb-4">
            <div className="card-title mb-4">📞 Contact Information</div>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="+91 98765 43210" value={form.phone || ''} onChange={set('phone')} />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" placeholder="Mumbai" value={form.city || ''} onChange={set('city')} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-input" placeholder="Maharashtra" value={form.state || ''} onChange={set('state')} />
              </div>
              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input className="form-input" placeholder="400001" value={form.pincode || ''} onChange={set('pincode')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Full Address</label>
              <textarea className="form-textarea" placeholder="Shop No. 12, ABC Complex, MG Road" value={form.address || ''} onChange={set('address')} style={{ minHeight: 60 }} />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div>
          {/* Branding Colors */}
          <div className="card mb-4">
            <div className="card-title mb-4">🎨 Brand Colors</div>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Primary Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.branding?.primaryColor || '#0066cc'} onChange={setBranding('primaryColor')} style={{ width: 44, height: 40, border: '1.5px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: 'white' }} />
                  <input className="form-input" value={form.branding?.primaryColor || '#0066cc'} onChange={setBranding('primaryColor')} placeholder="#0066cc" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Secondary Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.branding?.secondaryColor || '#0099ff'} onChange={setBranding('secondaryColor')} style={{ width: 44, height: 40, border: '1.5px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: 'white' }} />
                  <input className="form-input" value={form.branding?.secondaryColor || '#0099ff'} onChange={setBranding('secondaryColor')} placeholder="#0099ff" />
                </div>
              </div>
            </div>

            {/* Color preview */}
            <div style={{ borderRadius: 10, overflow: 'hidden', marginTop: 8 }}>
              <div style={{ background: `linear-gradient(135deg, ${form.branding?.primaryColor || '#0066cc'}, ${form.branding?.secondaryColor || '#0099ff'})`, padding: '16px 20px', color: '#fff' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{form.name || 'Your Company'}</div>
                <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{form.branding?.tagline || 'Your tagline here'}</div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="card mb-4">
            <div className="card-title mb-4">🔗 Social Media Links</div>
            {[
              { key: 'facebook',  icon: '📘', label: 'Facebook Page URL',   placeholder: 'https://facebook.com/yourpage' },
              { key: 'instagram', icon: '📷', label: 'Instagram Profile',    placeholder: 'https://instagram.com/yourprofile' },
              { key: 'twitter',   icon: '🐦', label: 'Twitter / X Profile',  placeholder: 'https://twitter.com/yourhandle' },
              { key: 'linkedin',  icon: '💼', label: 'LinkedIn Page',        placeholder: 'https://linkedin.com/company/yourco' },
              { key: 'youtube',   icon: '📺', label: 'YouTube Channel',      placeholder: 'https://youtube.com/@yourchannel' },
              { key: 'whatsapp',  icon: '💬', label: 'WhatsApp Business',    placeholder: '+91 98765 43210' },
            ].map(s => (
              <div key={s.key} className="form-group">
                <label className="form-label">{s.icon} {s.label}</label>
                <input className="form-input" placeholder={s.placeholder} value={form.socialLinks?.[s.key] || ''} onChange={setSocial(s.key)} />
              </div>
            ))}
          </div>

          {/* Plan Info */}
          <div className="card" style={{ background: 'linear-gradient(135deg, #e8f0ff, #f0f8ff)', border: '1.5px solid #c0d4ff' }}>
            <div className="card-title mb-2">📦 Current Package</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0066cc', textTransform: 'uppercase' }}>{user?.plan} Plan</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  Posts: {user?.usage?.postsThisMonth || 0} used this month
                </div>
              </div>
              <a href="/plans" className="btn btn-primary btn-sm">⚡ Upgrade</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
