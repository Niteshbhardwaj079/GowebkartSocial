import React, { useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createPost } from '../store';
import { toast } from 'react-toastify';
import api from '../services/api';

// ════════════════════════════════════════════
// EMOJI DATA
// ════════════════════════════════════════════
const EMOJI_CATEGORIES = {
  '😀 Smileys': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😙','😚','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','🤬','💀','💩','🤡','👹','👺','👻','👽','🤖'],
  '👋 Gestures': ['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝','👍','👎','✊','👊','🤛','🤜','👏','🙌','🤲','🤝','🙏','💪','🦾','🦿'],
  '❤️ Hearts': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💝','💘','💟','♥️','❤️‍🔥','❤️‍🩹'],
  '🎉 Events': ['🎉','🎊','🎈','🎀','🎁','🎂','🍰','🥳','🎭','🎪','🎠','🎡','🎢','🎯','🎲','🎮','🎸','🎵','🎶','🎤','🎧','🎼'],
  '🌍 Travel': ['🌍','🌎','🌏','🗺','🧭','🏔','🌋','🗻','🏕','🏖','🏜','🏝','🏞','🏟','🏛','🏗','🏘','🏙','🗼','🗽','🗿','🏰','🏯','🛫','🛬','🚀','🛸','🚗','🚕','🚙','🚌','🚎','🏎','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜'],
  '🍕 Food': ['🍕','🍔','🍟','🌭','🌮','🌯','🥙','🧆','🥚','🍳','🥘','🍲','🫕','🥗','🥫','🍿','🧂','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌽','🥦','🥬','🥒','🫑','🌶','🫒','🧄','🧅','🥔','🍠','🧀'],
  '⚽ Sports': ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🥊','⛷','🏂','🪂','🤿','🏋','🤸','🤼','🤺','🏇','⛹','🤾','🏌','🏄','🚣','🧗','🚴','🏊'],
  '🐶 Animals': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐚','🐞','🐜','🦟','🦗','🕷','🦂','🐢','🐍','🦎','🦖','🦕','🐙'],
};

const FEELINGS = [
  { emoji:'😊', label:'Happy' },      { emoji:'😢', label:'Sad' },
  { emoji:'😡', label:'Angry' },      { emoji:'😱', label:'Shocked' },
  { emoji:'🥰', label:'Loved' },      { emoji:'🤩', label:'Excited' },
  { emoji:'😴', label:'Tired' },      { emoji:'🤒', label:'Sick' },
  { emoji:'💪', label:'Motivated' },  { emoji:'🙏', label:'Thankful' },
  { emoji:'😎', label:'Cool' },       { emoji:'🤔', label:'Thinking' },
  { emoji:'🎉', label:'Celebrating' },{ emoji:'🌟', label:'Inspired' },
  { emoji:'😤', label:'Frustrated' }, { emoji:'🥺', label:'Emotional' },
];

const LOCATIONS = [
  '📍 Current Location','🏠 Home','🏢 Office','☕ Café','🏋️ Gym',
  '✈️ Travelling','🏖️ Beach','🏔️ Mountains','🍽️ Restaurant','🛍️ Shopping',
  '🏥 Hospital','🎓 College','🏟️ Stadium','🌳 Park','💒 Wedding Venue',
  '🎪 Event Venue','🚗 On the road','✨ Custom Location...',
];

const PLATFORM_LIMITS = {
  twitter: 280, linkedin: 3000, facebook: 63206, instagram: 2200
};

// ════════════════════════════════════════════
// EMOJI PICKER COMPONENT
// ════════════════════════════════════════════
function EmojiPicker({ onSelect, onClose }) {
  const [search, setSearch]     = useState('');
  const [activeTab, setActiveTab] = useState(Object.keys(EMOJI_CATEGORIES)[0]);

  const filtered = search
    ? Object.values(EMOJI_CATEGORIES).flat().filter(e => e.includes(search))
    : EMOJI_CATEGORIES[activeTab] || [];

  return (
    <div style={{ position:'absolute', zIndex:1000, bottom:'100%', left:0, background:'#fff', border:'1.5px solid var(--border)', borderRadius:14, width:320, boxShadow:'0 8px 32px rgba(0,0,0,0.15)', overflow:'hidden', animation:'slideUp 0.2s ease' }}>
      {/* Search */}
      <div style={{ padding:'10px 12px', borderBottom:'1px solid var(--border)' }}>
        <input style={{ width:'100%', padding:'7px 12px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:13, outline:'none' }}
          placeholder="🔍 Search emoji..."
          value={search} onChange={e => setSearch(e.target.value)} autoFocus />
      </div>

      {/* Category Tabs */}
      {!search && (
        <div style={{ display:'flex', overflowX:'auto', padding:'6px 8px', gap:4, borderBottom:'1px solid var(--border)', scrollbarWidth:'none' }}>
          {Object.keys(EMOJI_CATEGORIES).map(cat => (
            <button key={cat} onClick={() => setActiveTab(cat)}
              style={{ background: activeTab===cat?'#e8f0ff':'transparent', border:'none', borderRadius:6, padding:'4px 6px', cursor:'pointer', fontSize:16, flexShrink:0, transition:'all 0.15s' }}>
              {cat.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div style={{ height:200, overflowY:'auto', padding:8, display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:2 }}>
        {filtered.map((emoji, i) => (
          <button key={i} onClick={() => onSelect(emoji)}
            style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', padding:4, borderRadius:6, transition:'all 0.1s', lineHeight:1 }}
            onMouseEnter={e => e.target.style.background='#f0f4f8'}
            onMouseLeave={e => e.target.style.background='none'}>
            {emoji}
          </button>
        ))}
      </div>

      {/* Close */}
      <div style={{ padding:'6px 8px', borderTop:'1px solid var(--border)', textAlign:'right' }}>
        <button onClick={onClose} style={{ background:'none', border:'none', fontSize:12, color:'var(--muted)', cursor:'pointer' }}>Close ✕</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
// IMAGE EDITOR COMPONENT
// ════════════════════════════════════════════
const FILTERS = [
  { name:'Normal',     value:'none' },
  { name:'Vivid',      value:'saturate(1.8) contrast(1.1)' },
  { name:'Warm',       value:'sepia(0.3) saturate(1.4) brightness(1.05)' },
  { name:'Cool',       value:'hue-rotate(20deg) saturate(1.2)' },
  { name:'B&W',        value:'grayscale(1)' },
  { name:'Fade',       value:'opacity(0.8) brightness(1.1)' },
  { name:'Dramatic',   value:'contrast(1.5) saturate(0.8)' },
  { name:'Sunny',      value:'brightness(1.15) saturate(1.3)' },
  { name:'Vintage',    value:'sepia(0.5) hue-rotate(-10deg) saturate(0.8)' },
  { name:'Night',      value:'brightness(0.7) contrast(1.3) saturate(1.2)' },
  { name:'Matte',      value:'contrast(0.9) brightness(1.1) saturate(0.85)' },
  { name:'Pop',        value:'contrast(1.3) saturate(2) brightness(1.05)' },
];

const CROP_RATIOS = [
  { label:'Free',      value:null,        icon:'⬜' },
  { label:'1:1',       value:1,           icon:'⬛' },
  { label:'4:5',       value:4/5,         icon:'📱' },
  { label:'16:9',      value:16/9,        icon:'🖥️' },
  { label:'9:16',      value:9/16,        icon:'📲' },
  { label:'3:2',       value:3/2,         icon:'🖼️' },
];

function ImageEditor({ src, onSave, onClose }) {
  const canvasRef = useRef(null);
  const imgRef    = useRef(null);
  const [filter,      setFilter]      = useState('none');
  const [cropRatio,   setCropRatio]   = useState(null);
  const [brightness,  setBrightness]  = useState(100);
  const [contrast,    setContrast]    = useState(100);
  const [saturation,  setSaturation]  = useState(100);
  const [activePanel, setActivePanel] = useState('filters');

  const fullFilter = `${filter !== 'none' ? filter : ''} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

  const applyAndSave = () => {
    const canvas  = canvasRef.current;
    const img     = imgRef.current;
    if (!canvas || !img) { onSave(src); return; }

    const ctx = canvas.getContext('2d');
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.filter = fullFilter;
    ctx.drawImage(img, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onSave(dataUrl);
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.9)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
      {/* Header */}
      <div style={{ width:'100%', maxWidth:900, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', color:'#fff' }}>
        <div style={{ fontFamily:"'Poppins',sans-serif", fontWeight:800, fontSize:18 }}>✂️ Edit Image</div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => { setFilter('none'); setBrightness(100); setContrast(100); setSaturation(100); }}
            style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', padding:'7px 14px', borderRadius:8, cursor:'pointer', fontSize:12 }}>
            🔄 Reset
          </button>
          <button onClick={applyAndSave}
            style={{ background:'#0066cc', border:'none', color:'#fff', padding:'7px 18px', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:13 }}>
            ✅ Apply & Save
          </button>
          <button onClick={onClose}
            style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', padding:'7px 12px', borderRadius:8, cursor:'pointer' }}>
            ✕
          </button>
        </div>
      </div>

      {/* Main area */}
      <div style={{ display:'flex', width:'100%', maxWidth:900, flex:1, overflow:'hidden', padding:'0 20px 20px', gap:20 }}>
        {/* Preview */}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.05)', borderRadius:12, overflow:'hidden', minHeight:300 }}>
          <img ref={imgRef} src={src} alt="edit"
            style={{ maxWidth:'100%', maxHeight:'60vh', objectFit:'contain', filter:fullFilter, borderRadius:8,
              ...(cropRatio ? { aspectRatio:cropRatio, objectFit:'cover', width:'100%' } : {})
            }} />
          <canvas ref={canvasRef} style={{ display:'none' }} />
        </div>

        {/* Controls */}
        <div style={{ width:240, background:'rgba(255,255,255,0.08)', borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          {/* Panel Tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
            {[['filters','✨'],['adjust','🎚️'],['crop','✂️']].map(([p, ic]) => (
              <button key={p} onClick={() => setActivePanel(p)}
                style={{ flex:1, background:activePanel===p?'rgba(255,255,255,0.15)':'transparent', border:'none', color:'#fff', padding:'10px', cursor:'pointer', fontSize:12, fontWeight:600, textTransform:'capitalize', borderBottom:activePanel===p?'2px solid #0099ff':'2px solid transparent' }}>
                {ic} {p}
              </button>
            ))}
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:12 }}>

            {/* FILTERS Panel */}
            {activePanel === 'filters' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {FILTERS.map(f => (
                  <button key={f.name} onClick={() => setFilter(f.value)}
                    style={{
                      background:'transparent', border:`2px solid ${filter===f.value?'#0099ff':'rgba(255,255,255,0.15)'}`,
                      borderRadius:8, padding:0, cursor:'pointer', overflow:'hidden', color:'#fff',
                      boxShadow: filter===f.value ? '0 0 10px #0099ff66' : 'none',
                    }}>
                    <div style={{ height:52, overflow:'hidden' }}>
                      <img src={src} alt={f.name} style={{ width:'100%', height:'100%', objectFit:'cover', filter:f.value!=='none'?f.value:undefined }} />
                    </div>
                    <div style={{ fontSize:10, fontWeight:600, padding:'4px 2px', background: filter===f.value?'#0066cc':'rgba(0,0,0,0.5)' }}>
                      {f.name}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* ADJUST Panel */}
            {activePanel === 'adjust' && (
              <div>
                {[
                  { label:'☀️ Brightness', val:brightness, set:setBrightness, min:50, max:150 },
                  { label:'◑ Contrast',    val:contrast,   set:setContrast,   min:50, max:150 },
                  { label:'🎨 Saturation', val:saturation, set:setSaturation, min:0,  max:200 },
                ].map(ctrl => (
                  <div key={ctrl.label} style={{ marginBottom:16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', color:'#fff', fontSize:12, fontWeight:600, marginBottom:6 }}>
                      <span>{ctrl.label}</span>
                      <span style={{ color:'#0099ff' }}>{ctrl.val}%</span>
                    </div>
                    <input type="range" min={ctrl.min} max={ctrl.max} value={ctrl.val}
                      onChange={e => ctrl.set(Number(e.target.value))}
                      style={{ width:'100%', accentColor:'#0099ff' }} />
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:3 }}>
                      <span>{ctrl.min}%</span>
                      <button onClick={() => ctrl.set(100)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:10 }}>Reset</button>
                      <span>{ctrl.max}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CROP Panel */}
            {activePanel === 'crop' && (
              <div>
                <div style={{ color:'rgba(255,255,255,0.6)', fontSize:11, marginBottom:10 }}>Aspect Ratio Select Karein:</div>
                {CROP_RATIOS.map(r => (
                  <button key={r.label} onClick={() => setCropRatio(r.value)}
                    style={{
                      width:'100%', background: cropRatio===r.value?'rgba(0,102,204,0.4)':'rgba(255,255,255,0.07)',
                      border:`1.5px solid ${cropRatio===r.value?'#0099ff':'rgba(255,255,255,0.15)'}`,
                      borderRadius:8, padding:'10px 12px', marginBottom:6, cursor:'pointer', color:'#fff',
                      display:'flex', alignItems:'center', gap:10, fontSize:13,
                    }}>
                    <span style={{ fontSize:18 }}>{r.icon}</span>
                    <span style={{ fontWeight:600 }}>{r.label}</span>
                    {r.label === '1:1' && <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)', marginLeft:'auto' }}>Instagram</span>}
                    {r.label === '9:16' && <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)', marginLeft:'auto' }}>Stories</span>}
                    {r.label === '16:9' && <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)', marginLeft:'auto' }}>YouTube</span>}
                  </button>
                ))}
                <div style={{ marginTop:12, background:'rgba(255,255,255,0.05)', borderRadius:8, padding:'10px 12px', fontSize:11, color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>
                  💡 <strong style={{ color:'rgba(255,255,255,0.7)' }}>Platform Guide:</strong><br/>
                  Instagram Feed → 1:1<br/>
                  Instagram Story → 9:16<br/>
                  Facebook Cover → 16:9<br/>
                  LinkedIn Post → 3:2
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
// MAIN CREATE POST PAGE
// ════════════════════════════════════════════
export default function CreatePostPage() {
  const dispatch   = useDispatch();
  const { user }   = useSelector(s => s.auth);
  const [posting, setPosting] = useState(false);

  // Post content
  const [text,       setText]       = useState('');
  const [platforms,  setPlatforms]  = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [scheduleAt, setScheduleAt] = useState('');
  const [isScheduled,setIsScheduled]= useState(false);

  // Extras
  const [feeling,    setFeeling]    = useState(null);
  const [location,   setLocation]   = useState('');
  const [customLocation, setCustomLocation] = useState('');

  // UI toggles
  const [showEmoji,     setShowEmoji]     = useState(false);
  const [showFeelings,  setShowFeelings]  = useState(false);
  const [showLocation,  setShowLocation]  = useState(false);
  const [editingImage,  setEditingImage]  = useState(null); // { index, src }
  const [aiLoading,     setAiLoading]     = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Settings se image editing check karo
  const imageEditEnabled = user?.settings?.imageEditEnabled !== false; // default true

  const PLATFORMS_LIST = [
    { id:'facebook',  label:'Facebook',  icon:'📘', color:'#1877f2', limit:63206 },
    { id:'instagram', label:'Instagram', icon:'📷', color:'#e1306c', limit:2200  },
    { id:'twitter',   label:'Twitter',   icon:'🐦', color:'#1da1f2', limit:280   },
    { id:'linkedin',  label:'LinkedIn',  icon:'💼', color:'#0077b5', limit:3000  },
    { id:'youtube',   label:'YouTube',   icon:'📺', color:'#ff0000', limit:5000  },
  ];

  // Insert text at cursor
  const insertText = (insertStr) => {
    const ta    = textareaRef.current;
    if (!ta) { setText(t => t + insertStr); return; }
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const newText = text.slice(0, start) + insertStr + text.slice(end);
    setText(newText);
    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = start + insertStr.length;
      ta.focus();
    }, 0);
  };

  // Character count for active platforms
  const activeLimits = platforms.map(p => PLATFORMS_LIST.find(pl => pl.id === p)?.limit).filter(Boolean);
  const minLimit     = activeLimits.length ? Math.min(...activeLimits) : 63206;
  const charCount    = text.length;
  const isOverLimit  = charCount > minLimit;

  // Full text with feeling + location
  const getFullText = () => {
    let full = text;
    if (feeling) full += `\n\nFeeling ${feeling.emoji} ${feeling.label}`;
    const loc = location === '✨ Custom Location...' ? customLocation : location;
    if (loc) full += `\n📍 ${loc.replace(/^[^\s]+ /,'')}`;
    return full;
  };

  // Media upload
  const handleFiles = async (files) => {
    const newFiles = Array.from(files).slice(0, 10 - mediaFiles.length);
    const previews = await Promise.all(newFiles.map(f => new Promise(res => {
      const reader = new FileReader();
      reader.onload = e => res({ file: f, preview: e.target.result, type: f.type.startsWith('video') ? 'video' : 'image' });
      reader.readAsDataURL(f);
    })));
    setMediaFiles(prev => [...prev, ...previews]);
  };

  // Image edit save
  const handleImageEditSave = (dataUrl) => {
    setMediaFiles(prev => prev.map((m, i) => i === editingImage.index ? { ...m, preview: dataUrl, edited: true } : m));
    setEditingImage(null);
    toast.success('✅ Image edit ho gayi!');
  };

  // Remove media
  const removeMedia = (i) => setMediaFiles(prev => prev.filter((_, j) => j !== i));

  // AI Caption
  const generateCaption = async () => {
    setAiLoading(true);
    try {
      const topic = text.trim() || 'social media post';
      const res = await api.post('/ai/caption', {
        topic,
        platform: platforms[0] || 'instagram',
        tone: 'engaging',
        language: 'en'
      });
      const caption = res.data?.caption || res.data?.captions?.[0] || res.data?.text || '';
      if (caption) {
        setText(caption);
        toast.success('✅ AI caption ready!');
      } else {
        toast.warning('Caption generate nahi hua — dobara try karein');
      }
    } catch (e) {
      if (!e.response) {
        toast.error('⚠️ Server nahi chal raha — pehle server start karein');
      } else if (e.response?.status === 404) {
        toast.error('AI route nahi mila — server restart karein');
      } else {
        toast.error(e.response?.data?.message || 'AI error — dobara try karein');
      }
    } finally {
      setAiLoading(false);
    }
  };

  // Post submit
  const handlePost = async () => {
    if (!text.trim() && mediaFiles.length === 0) { toast.error('Post content ya image required hai'); return; }
    if (platforms.length === 0) { toast.error('Kam se kam ek platform select karo'); return; }
    if (isOverLimit) { toast.error(`Character limit exceed ho gaya (${charCount}/${minLimit})`); return; }

    setPosting(true);
    try {
      // Upload media files
      let uploadedMedia = [];
      if (mediaFiles.length > 0) {
        const fd = new FormData();
        mediaFiles.forEach(m => {
          if (m.edited) {
            // Edited image — blob convert karo
            const blob = dataURLtoBlob(m.preview);
            fd.append('files', blob, 'edited.jpg');
          } else {
            fd.append('files', m.file);
          }
        });
        const uploadRes = await api.post('/storage/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        uploadedMedia   = uploadRes.data.files || [];
      }

      await dispatch(createPost({
        content: { text: getFullText(), media: uploadedMedia },
        platforms: platforms.map(p => ({ platform: p })),
        scheduling: isScheduled && scheduleAt ? { scheduledAt: new Date(scheduleAt) } : {},
        status: isScheduled && scheduleAt ? 'scheduled' : 'publishing',
      }));

      toast.success(isScheduled ? '📅 Post scheduled!' : '🚀 Post published!');
      setText(''); setMediaFiles([]); setPlatforms([]); setFeeling(null); setLocation('');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Post failed');
    } finally { setPosting(false); }
  };

  const dataURLtoBlob = (dataUrl) => {
    const arr  = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    const n    = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
    return new Blob([u8arr], { type: mime });
  };

  const finalLocation = location === '✨ Custom Location...' ? customLocation : location?.replace(/^[^\s]+ /,'');

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">✏️ Create Post</div>
        <div className="page-sub">Ek saath sab platforms par post karein</div>
      </div>

      <div className="grid grid-2" style={{ maxWidth:960, margin:'0 auto' }}>

        {/* ── LEFT: Editor ── */}
        <div>
          {/* Platform Selector */}
          <div className="card mb-3">
            <div className="card-title mb-3">📱 Platforms Select Karein</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {PLATFORMS_LIST.map(p => (
                <button key={p.id} onClick={() => setPlatforms(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                  style={{
                    display:'flex', alignItems:'center', gap:6, padding:'7px 12px',
                    borderRadius:20, border:`2px solid ${platforms.includes(p.id) ? p.color : 'var(--border)'}`,
                    background: platforms.includes(p.id) ? p.color+'15' : '#fff',
                    cursor:'pointer', fontSize:13, fontWeight:600,
                    transition:'all 0.15s',
                  }}>
                  {p.icon} {p.label}
                  {platforms.includes(p.id) && <span style={{ color:p.color }}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Text Editor */}
          <div className="card mb-3" style={{ position:'relative' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div className="card-title">📝 Content</div>
              <button className="btn btn-secondary btn-sm" onClick={generateCaption} disabled={aiLoading}>
                {aiLoading ? '⟳' : '🤖'} AI Caption
              </button>
            </div>

            <textarea
              ref={textareaRef}
              className="form-textarea"
              placeholder="Kya share karna chahte ho? Type karo ya AI se generate karo... 😊"
              value={text}
              onChange={e => setText(e.target.value)}
              style={{ minHeight:140, fontSize:15, lineHeight:1.7, resize:'vertical', paddingBottom:50 }}
            />

            {/* Toolbar below textarea */}
            <div style={{ display:'flex', alignItems:'center', gap:2, marginTop:8, flexWrap:'wrap' }}>
              {/* Emoji Button */}
              <div style={{ position:'relative' }}>
                <button onClick={() => { setShowEmoji(!showEmoji); setShowFeelings(false); setShowLocation(false); }}
                  style={{ background:'none', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', cursor:'pointer', fontSize:16, transition:'all 0.15s' }}
                  title="Emoji add karo">
                  😊
                </button>
                {showEmoji && <EmojiPicker onSelect={e => { insertText(e); setShowEmoji(false); }} onClose={() => setShowEmoji(false)} />}
              </div>

              {/* Feeling Button */}
              <button onClick={() => { setShowFeelings(!showFeelings); setShowEmoji(false); setShowLocation(false); }}
                style={{ background: feeling?'#e8f0ff':'none', border:`1px solid ${feeling?'#0066cc':'var(--border)'}`, borderRadius:8, padding:'6px 10px', cursor:'pointer', fontSize:13, fontWeight:600, color: feeling?'#0066cc':'var(--text)', transition:'all 0.15s' }}
                title="Feeling add karo">
                {feeling ? `${feeling.emoji} ${feeling.label}` : '🎭 Feeling'}
              </button>

              {/* Location Button */}
              <button onClick={() => { setShowLocation(!showLocation); setShowEmoji(false); setShowFeelings(false); }}
                style={{ background: location?'#e8f0ff':'none', border:`1px solid ${location?'#0066cc':'var(--border)'}`, borderRadius:8, padding:'6px 10px', cursor:'pointer', fontSize:13, fontWeight:600, color: location?'#0066cc':'var(--text)', transition:'all 0.15s' }}
                title="Location add karo">
                {finalLocation || '📍 Location'}
              </button>

              {/* Clear extras */}
              {(feeling || location) && (
                <button onClick={() => { setFeeling(null); setLocation(''); }}
                  style={{ background:'none', border:'1px solid #ffcccc', borderRadius:8, padding:'6px 10px', cursor:'pointer', fontSize:12, color:'var(--danger)' }}>
                  ✕ Clear
                </button>
              )}

              {/* Char counter */}
              <div style={{ marginLeft:'auto', fontSize:12, fontWeight:600, color: isOverLimit?'var(--danger)':charCount>minLimit*0.9?'var(--warning)':'var(--muted)' }}>
                {charCount}/{minLimit}
                {platforms.includes('twitter') && charCount > 280 && <span style={{ color:'var(--danger)', marginLeft:4 }}>(Twitter limit!)</span>}
              </div>
            </div>

            {/* Feelings Dropdown */}
            {showFeelings && (
              <div style={{ position:'absolute', zIndex:1000, top:'100%', left:0, right:0, background:'#fff', border:'1.5px solid var(--border)', borderRadius:12, padding:12, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', marginTop:4, animation:'slideUp 0.2s ease' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--muted)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.05em' }}>🎭 Feeling choose karein:</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
                  {FEELINGS.map(f => (
                    <button key={f.label} onClick={() => { setFeeling(f); setShowFeelings(false); }}
                      style={{
                        display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                        padding:'8px 4px', border:`1.5px solid ${feeling?.label===f.label?'#0066cc':'var(--border)'}`,
                        borderRadius:8, background: feeling?.label===f.label?'#e8f0ff':'#fff',
                        cursor:'pointer', fontSize:11, fontWeight:600, color:'var(--text)', transition:'all 0.15s'
                      }}>
                      <span style={{ fontSize:20 }}>{f.emoji}</span>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Location Dropdown */}
            {showLocation && (
              <div style={{ position:'absolute', zIndex:1000, top:'100%', left:0, right:0, background:'#fff', border:'1.5px solid var(--border)', borderRadius:12, padding:12, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', marginTop:4, animation:'slideUp 0.2s ease', maxHeight:260, overflowY:'auto' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--muted)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.05em' }}>📍 Location choose karein:</div>
                {LOCATIONS.map(loc => (
                  <button key={loc} onClick={() => { setLocation(loc); if (loc !== '✨ Custom Location...') setShowLocation(false); }}
                    style={{
                      display:'block', width:'100%', textAlign:'left', padding:'9px 12px',
                      border:'none', background: location===loc?'#e8f0ff':'transparent',
                      borderRadius:8, cursor:'pointer', fontSize:13, color:'var(--text)',
                      fontWeight: location===loc?700:400, transition:'all 0.1s',
                    }}
                    onMouseEnter={e => e.target.style.background='#f0f4f8'}
                    onMouseLeave={e => e.target.style.background=location===loc?'#e8f0ff':'transparent'}>
                    {loc}
                  </button>
                ))}
                {location === '✨ Custom Location...' && (
                  <div style={{ marginTop:8 }}>
                    <input className="form-input" placeholder="Apna location likhein..." value={customLocation}
                      onChange={e => setCustomLocation(e.target.value)}
                      onKeyDown={e => e.key==='Enter' && setShowLocation(false)}
                      style={{ fontSize:13 }} autoFocus />
                    <button className="btn btn-primary btn-sm mt-2" onClick={() => setShowLocation(false)}>Set Location ✓</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Media Upload */}
          <div className="card mb-3">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div className="card-title">🖼️ Media</div>
              <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
                + Add Photos/Videos
              </button>
              <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" onChange={e => handleFiles(e.target.files)} style={{ display:'none' }} />
            </div>

            {mediaFiles.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                style={{ border:'2px dashed var(--border)', borderRadius:10, padding:24, textAlign:'center', cursor:'pointer', transition:'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor='#0066cc'}
                onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
                <div style={{ fontSize:32, marginBottom:8 }}>📸</div>
                <div style={{ fontWeight:600, color:'var(--text)', marginBottom:4 }}>Images ya Videos drag karein</div>
                <div style={{ fontSize:12, color:'var(--muted)' }}>JPG, PNG, GIF, MP4 • Max 10 files</div>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))', gap:8 }}>
                {mediaFiles.map((m, i) => (
                  <div key={i} style={{ position:'relative', borderRadius:8, overflow:'hidden', aspectRatio:'1', border:'1.5px solid var(--border)' }}>
                    {m.type === 'video' ? (
                      <video src={m.preview} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    ) : (
                      <img src={m.preview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    )}

                    {/* Edited badge */}
                    {m.edited && (
                      <div style={{ position:'absolute', bottom:4, left:4, background:'#0066cc', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:4 }}>✓ Edited</div>
                    )}

                    {/* Action buttons */}
                    <div style={{ position:'absolute', top:4, right:4, display:'flex', gap:3 }}>
                      {m.type === 'image' && imageEditEnabled && (
                        <button onClick={() => setEditingImage({ index: i, src: m.preview })}
                          style={{ background:'rgba(0,0,0,0.65)', border:'none', borderRadius:6, padding:'4px 6px', cursor:'pointer', color:'#fff', fontSize:11 }}
                          title="Image edit karo">
                          ✏️
                        </button>
                      )}
                      <button onClick={() => removeMedia(i)}
                        style={{ background:'rgba(220,0,0,0.75)', border:'none', borderRadius:6, padding:'4px 6px', cursor:'pointer', color:'#fff', fontSize:11 }}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                {mediaFiles.length < 10 && (
                  <button onClick={() => fileInputRef.current?.click()}
                    style={{ aspectRatio:'1', border:'2px dashed var(--border)', borderRadius:8, background:'#fafcff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:4, color:'var(--muted)', fontSize:12, fontWeight:600 }}>
                    <span style={{ fontSize:22 }}>+</span>
                    Add More
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="card mb-3">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div className="card-title">📅 Schedule</div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <label style={{ fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                  <div onClick={() => setIsScheduled(!isScheduled)}
                    style={{ width:40, height:22, borderRadius:11, background:isScheduled?'#0066cc':'#ddd', position:'relative', cursor:'pointer', transition:'all 0.2s' }}>
                    <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:isScheduled?21:3, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                  Schedule Later
                </label>
              </div>
            </div>
            {isScheduled && (
              <input type="datetime-local" className="form-input mt-3"
                value={scheduleAt} onChange={e => setScheduleAt(e.target.value)}
                min={new Date().toISOString().slice(0,16)} />
            )}
          </div>

          {/* POST BUTTON */}
          <button className="btn btn-primary w-full btn-lg" onClick={handlePost} disabled={posting || platforms.length === 0 || (!text.trim() && mediaFiles.length === 0)}>
            {posting ? '⟳ Posting...' :
             isScheduled && scheduleAt ? `📅 Schedule Post — ${platforms.length} platform${platforms.length>1?'s':''}` :
             `🚀 Post Now — ${platforms.length} platform${platforms.length>1?'s':''}`}
          </button>
        </div>

        {/* ── RIGHT: Preview ── */}
        <div>
          <div className="card" style={{ position:'sticky', top:70 }}>
            <div className="card-title mb-3">👁️ Preview</div>

            {/* Platform preview card */}
            <div style={{ background:'#f8faff', borderRadius:10, padding:14, border:'1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#0066cc,#0099ff)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:14, fontWeight:800 }}>
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:13 }}>{user?.name || 'Your Name'}</div>
                  <div style={{ fontSize:11, color:'var(--muted)' }}>
                    {feeling && `Feeling ${feeling.emoji} ${feeling.label} `}
                    {finalLocation && `📍 ${finalLocation}`}
                    {!feeling && !finalLocation && 'Just now'}
                  </div>
                </div>
              </div>

              {/* Text preview */}
              {text && (
                <div style={{ fontSize:14, lineHeight:1.7, marginBottom:12, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                  {text}
                  {feeling && <span style={{ color:'var(--muted)' }}> — feeling {feeling.emoji} <strong>{feeling.label}</strong></span>}
                  {finalLocation && <span style={{ color:'var(--muted)' }}>{'\n'}📍 <strong>{finalLocation}</strong></span>}
                </div>
              )}

              {/* Media preview */}
              {mediaFiles.length > 0 && (
                <div style={{ borderRadius:8, overflow:'hidden', marginBottom:8 }}>
                  {mediaFiles.length === 1 ? (
                    <img src={mediaFiles[0].preview} alt="" style={{ width:'100%', maxHeight:200, objectFit:'cover', borderRadius:8 }} />
                  ) : (
                    <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(mediaFiles.length,2)},1fr)`, gap:2 }}>
                      {mediaFiles.slice(0,4).map((m, i) => (
                        <div key={i} style={{ position:'relative' }}>
                          <img src={m.preview} alt="" style={{ width:'100%', height:90, objectFit:'cover' }} />
                          {i === 3 && mediaFiles.length > 4 && (
                            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:16 }}>
                              +{mediaFiles.length - 4}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {platforms.length === 0 && !text && (
                <div style={{ textAlign:'center', color:'var(--muted)', padding:'20px 0', fontSize:13 }}>
                  👈 Platform select karo aur content likho to preview dikhega
                </div>
              )}
            </div>

            {/* Platform-wise char count */}
            {platforms.length > 0 && text && (
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Character Count:</div>
                {platforms.map(p => {
                  const pInfo = PLATFORMS_LIST.find(pl => pl.id === p);
                  const pct   = Math.min((charCount / pInfo.limit) * 100, 100);
                  return (
                    <div key={p} style={{ marginBottom:6 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
                        <span>{pInfo.icon} {pInfo.label}</span>
                        <span style={{ fontWeight:700, color: charCount > pInfo.limit ? 'var(--danger)' : 'var(--success)' }}>
                          {charCount}/{pInfo.limit} {charCount > pInfo.limit ? '⚠️' : '✓'}
                        </span>
                      </div>
                      <div style={{ background:'var(--bg3)', borderRadius:3, height:4, overflow:'hidden' }}>
                        <div style={{ width:`${pct}%`, height:'100%', background: charCount > pInfo.limit ? 'var(--danger)' : 'var(--success)', borderRadius:3, transition:'width 0.3s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Editor Modal */}
      {editingImage && (
        <ImageEditor
          src={editingImage.src}
          onSave={handleImageEditSave}
          onClose={() => setEditingImage(null)}
        />
      )}
    </div>
  );
}