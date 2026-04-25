import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../services/api';
import { updateUser } from '../store';

function Toggle({ value, onChange, label, desc, color = '#0066cc' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 0', borderBottom:'1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize:14, fontWeight:600 }}>{label}</div>
        {desc && <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{desc}</div>}
      </div>
      <div onClick={() => onChange(!value)} style={{ width:46, height:24, borderRadius:12, background:value?color:'#ddd', position:'relative', cursor:'pointer', transition:'all 0.2s', flexShrink:0, marginLeft:16 }}>
        <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:value?25:3, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const dispatch   = useDispatch();
  const { user }   = useSelector(s => s.auth);
  const [saving,   setSaving]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [tab,      setTab]      = useState('profile');

  const [profile, setProfile] = useState({
    name:     user?.name     || '',
    email:    user?.email    || '',
    language: user?.language || 'en',
    timezone: user?.timezone || 'Asia/Kolkata',
  });

  // Post creation settings
  const [postSettings, setPostSettings] = useState({
    imageEditEnabled:   user?.settings?.imageEditEnabled   !== false,  // Image crop/filter
    emojiEnabled:       user?.settings?.emojiEnabled       !== false,  // Emoji picker
    feelingsEnabled:    user?.settings?.feelingsEnabled    !== false,  // Feelings
    locationEnabled:    user?.settings?.locationEnabled    !== false,  // Location
    aiCaptionEnabled:   user?.settings?.aiCaptionEnabled   !== false,  // AI button
    autoHashtags:       user?.settings?.autoHashtags       || false,   // Auto hashtags
    defaultPlatforms:   user?.settings?.defaultPlatforms   || [],
  });

  const [passwords, setPasswords] = useState({ current:'', newPw:'', confirm:'' });

  const setSetting = k => v => setPostSettings(s => ({ ...s, [k]: v }));

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', profile);
      toast.success('✅ Profile updated!');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const savePostSettings = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', { settings: postSettings });
      toast.success('✅ Settings save ho gayi!');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!passwords.current || !passwords.newPw) { toast.error('Dono password required'); return; }
    if (passwords.newPw !== passwords.confirm) { toast.error('New passwords match nahi kar rahe'); return; }
    if (passwords.newPw.length < 6) { toast.error('Password 6+ characters hona chahiye'); return; }
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: passwords.current, newPassword: passwords.newPw });
      toast.success('✅ Password change ho gaya!');
      setPasswords({ current:'', newPw:'', confirm:'' });
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setPwSaving(false); }
  };

  const setP = k => e => setProfile(p => ({ ...p, [k]: e.target.value }));
  const setPw = k => e => setPasswords(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">⚙️ Settings</div>
        <div className="page-sub">Profile, preferences aur post creation settings</div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, flexWrap:'wrap' }}>
        {[['profile','👤 Profile'],['post','✏️ Post Settings'],['password','🔑 Password']].map(([id,label]) => (
          <button key={id} className={`btn btn-sm ${tab===id?'btn-primary':'btn-secondary'}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {tab === 'profile' && (
        <div className="card" style={{ maxWidth:520 }}>
          <div className="card-title mb-4">👤 Profile Info</div>

          {/* Avatar */}
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#0066cc,#0099ff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:800, color:'#fff', margin:'0 auto 10px' }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div style={{ fontSize:12, color:'var(--muted)' }}>{user?.email}</div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={profile.name} onChange={setP('name')} placeholder="Apna naam" />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Language</label>
              <select className="form-select" value={profile.language} onChange={setP('language')}>
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select className="form-select" value={profile.timezone} onChange={setP('timezone')}>
                <option value="Asia/Kolkata">IST (India)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">EST (New York)</option>
                <option value="America/Los_Angeles">PST (LA)</option>
              </select>
            </div>
          </div>

          <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
            {saving ? '⟳ Saving...' : '💾 Save Profile'}
          </button>
        </div>
      )}

      {/* ── POST SETTINGS TAB ── */}
      {tab === 'post' && (
        <div style={{ maxWidth:560 }}>
          {/* Image Editing */}
          <div className="card mb-4">
            <div className="card-title mb-1">🖼️ Image & Media Options</div>
            <div className="card-sub mb-3">Post create karte waqt kaunse options dikhein</div>

            <Toggle value={postSettings.imageEditEnabled} onChange={setSetting('imageEditEnabled')}
              label="🎨 Image Editor Enable"
              desc="Image upload karne ke baad crop, filter, brightness adjust kar sako" />

            <div style={{ marginLeft:32, fontSize:12, color:'var(--muted)', padding:'6px 0 10px', borderBottom:'1px solid var(--border)' }}>
              <span style={{ marginRight:16 }}>✂️ Crop (1:1, 16:9, 4:5)</span>
              <span style={{ marginRight:16 }}>✨ Filters (12 types)</span>
              <span>🎚️ Brightness/Contrast/Saturation</span>
            </div>
          </div>

          {/* Post Tools */}
          <div className="card mb-4">
            <div className="card-title mb-1">✏️ Post Creation Tools</div>
            <div className="card-sub mb-3">Create Post mein kaunse buttons dikhein</div>

            <Toggle value={postSettings.emojiEnabled} onChange={setSetting('emojiEnabled')}
              label="😊 Emoji Picker"
              desc="Post mein emojis add karne ka option — 500+ emojis" />

            <Toggle value={postSettings.feelingsEnabled} onChange={setSetting('feelingsEnabled')}
              label="🎭 Feelings / Activity"
              desc="'Feeling Happy' jaise tags add karne ka option" />

            <Toggle value={postSettings.locationEnabled} onChange={setSetting('locationEnabled')}
              label="📍 Location Tag"
              desc="Post mein location add karne ka option" />

            <Toggle value={postSettings.aiCaptionEnabled} onChange={setSetting('aiCaptionEnabled')}
              label="🤖 AI Caption Button"
              desc="AI se automatically caption generate karne ka button" />

            <Toggle value={postSettings.autoHashtags} onChange={setSetting('autoHashtags')}
              label="# Auto Hashtags"
              desc="Post content ke hisaab se automatically hashtags suggest karein" color="#7c3aed" />
          </div>

          {/* Preview */}
          <div style={{ background:'#f8faff', border:'1px solid var(--border)', borderRadius:10, padding:14, marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--muted)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.05em' }}>Preview — Toolbar dikhega:</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <span style={{ padding:'5px 10px', background:'#fff', border:'1px solid var(--border)', borderRadius:8, fontSize:13 }}>😊 Emoji</span>
              {postSettings.feelingsEnabled  && <span style={{ padding:'5px 10px', background:'#fff', border:'1px solid var(--border)', borderRadius:8, fontSize:13 }}>🎭 Feeling</span>}
              {postSettings.locationEnabled  && <span style={{ padding:'5px 10px', background:'#fff', border:'1px solid var(--border)', borderRadius:8, fontSize:13 }}>📍 Location</span>}
              {postSettings.aiCaptionEnabled && <span style={{ padding:'5px 10px', background:'#e8f0ff', border:'1px solid #c0d4ff', borderRadius:8, fontSize:13, color:'#0066cc', fontWeight:700 }}>🤖 AI Caption</span>}
              {!postSettings.feelingsEnabled && !postSettings.locationEnabled && !postSettings.aiCaptionEnabled && (
                <span style={{ fontSize:12, color:'var(--muted)' }}>Sirf Emoji button dikhega</span>
              )}
            </div>
          </div>

          <button className="btn btn-primary" onClick={savePostSettings} disabled={saving}>
            {saving ? '⟳ Saving...' : '💾 Save Settings'}
          </button>
        </div>
      )}

      {/* ── PASSWORD TAB ── */}
      {tab === 'password' && (
        <div className="card" style={{ maxWidth:400 }}>
          <div className="card-title mb-4">🔑 Change Password</div>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={passwords.current} onChange={setPw('current')} />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={passwords.newPw} onChange={setPw('newPw')} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={passwords.confirm} onChange={setPw('confirm')} />
            {passwords.confirm && passwords.newPw !== passwords.confirm && (
              <div style={{ fontSize:12, color:'var(--danger)', marginTop:4 }}>❌ Passwords match nahi kar rahe</div>
            )}
          </div>
          <button className="btn btn-primary" onClick={changePassword} disabled={pwSaving}>
            {pwSaving ? '⟳ Changing...' : '🔑 Change Password'}
          </button>
        </div>
      )}
    </div>
  );
}
