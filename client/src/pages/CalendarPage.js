import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPosts } from '../store';

// ══════════════════════════════════════════
// INDIAN FESTIVALS + HOLIDAYS DATA
// ══════════════════════════════════════════
const INDIAN_FESTIVALS = {
  // ── January ──
  '01-01': [{ name: "New Year's Day", icon: '🎆', type: 'national', color: '#e53e3e' }],
  '01-14': [{ name: 'Makar Sankranti', icon: '🪁', type: 'festival', color: '#ff9900' }, { name: 'Pongal', icon: '🍲', type: 'festival', color: '#ff9900' }],
  '01-15': [{ name: 'Army Day', icon: '🪖', type: 'national', color: '#2d6a4f' }],
  '01-23': [{ name: 'Netaji Subhas Chandra Bose Jayanti', icon: '🇮🇳', type: 'national', color: '#0066cc' }],
  '01-26': [{ name: 'Republic Day', icon: '🇮🇳', type: 'national', color: '#e53e3e' }],

  // ── February ──
  '02-14': [{ name: "Valentine's Day", icon: '💝', type: 'special', color: '#e53e3e' }],
  '02-19': [{ name: 'Shivaji Jayanti', icon: '⚔️', type: 'regional', color: '#ff6b35' }],

  // ── March ──
  '03-08': [{ name: "International Women's Day", icon: '👩', type: 'international', color: '#9b59b6' }],
  '03-22': [{ name: 'Bihar Day', icon: '🗺️', type: 'regional', color: '#27ae60' }],

  // ── April ──
  '04-01': [{ name: "April Fools' Day", icon: '🤡', type: 'fun', color: '#f39c12' }],
  '04-05': [{ name: 'National Maritime Day', icon: '⚓', type: 'national', color: '#2980b9' }],
  '04-07': [{ name: 'World Health Day', icon: '🏥', type: 'international', color: '#27ae60' }],
  '04-14': [{ name: 'Ambedkar Jayanti', icon: '📖', type: 'national', color: '#0066cc' }, { name: 'Baisakhi', icon: '🌾', type: 'festival', color: '#ff9900' }],
  '04-22': [{ name: 'Earth Day', icon: '🌍', type: 'international', color: '#27ae60' }],

  // ── May ──
  '05-01': [{ name: 'Labour Day / Maharashtra Day', icon: '⚒️', type: 'national', color: '#e53e3e' }],
  '05-07': [{ name: 'Rabindranath Tagore Jayanti', icon: '✍️', type: 'national', color: '#8e44ad' }],
  '05-11': [{ name: 'National Technology Day', icon: '💻', type: 'national', color: '#2980b9' }],

  // ── June ──
  '06-01': [{ name: "World Children's Day", icon: '👶', type: 'international', color: '#3498db' }],
  '06-05': [{ name: 'World Environment Day', icon: '🌱', type: 'international', color: '#27ae60' }],
  '06-21': [{ name: 'International Yoga Day', icon: '🧘', type: 'international', color: '#ff9900' }],
  '06-23': [{ name: "Father's Day", icon: '👨', type: 'special', color: '#2980b9' }],

  // ── July ──
  '07-01': [{ name: 'National Doctors Day', icon: '👨‍⚕️', type: 'national', color: '#e74c3c' }],
  '07-26': [{ name: 'Kargil Vijay Diwas', icon: '🏅', type: 'national', color: '#e53e3e' }],

  // ── August ──
  '08-12': [{ name: "World Youth Day", icon: '🌟', type: 'international', color: '#9b59b6' }],
  '08-15': [{ name: 'Independence Day', icon: '🇮🇳', type: 'national', color: '#e53e3e' }],
  '08-19': [{ name: 'World Photography Day', icon: '📸', type: 'international', color: '#8e44ad' }],
  '08-29': [{ name: 'National Sports Day', icon: '🏑', type: 'national', color: '#27ae60' }],

  // ── September ──
  '09-05': [{ name: "Teacher's Day", icon: '👩‍🏫', type: 'national', color: '#2980b9' }],
  '09-14': [{ name: 'Hindi Diwas', icon: '🔤', type: 'national', color: '#ff9900' }],
  '09-16': [{ name: 'World Ozone Day', icon: '🌤️', type: 'international', color: '#27ae60' }],

  // ── October ──
  '10-02': [{ name: 'Gandhi Jayanti', icon: '🕊️', type: 'national', color: '#e53e3e' }],
  '10-04': [{ name: 'World Animal Day', icon: '🐾', type: 'international', color: '#e67e22' }],
  '10-09': [{ name: 'World Post Day', icon: '📮', type: 'international', color: '#e53e3e' }],
  '10-31': [{ name: 'National Unity Day / Halloween', icon: '🎃', type: 'national', color: '#e67e22' }],

  // ── November ──
  '11-01': [{ name: 'Kannada Rajyotsava', icon: '🟡', type: 'regional', color: '#f39c12' }],
  '11-14': [{ name: "Children's Day", icon: '👦', type: 'national', color: '#3498db' }],
  '11-19': [{ name: "World Toilet Day 😄", icon: '🚽', type: 'international', color: '#7f8c8d' }],

  // ── December ──
  '12-01': [{ name: 'World AIDS Day', icon: '🎗️', type: 'international', color: '#e53e3e' }],
  '12-04': [{ name: 'Navy Day', icon: '⚓', type: 'national', color: '#2980b9' }],
  '12-10': [{ name: 'Human Rights Day', icon: '✊', type: 'international', color: '#9b59b6' }],
  '12-25': [{ name: 'Christmas / Good Governance Day', icon: '🎄', type: 'festival', color: '#27ae60' }],
  '12-31': [{ name: "New Year's Eve", icon: '🎉', type: 'special', color: '#8e44ad' }],
};

// ── Floating festivals (year ke hisaab se badle) ──
// Ye festivals har saal alag date par aate hain
const getFloatingFestivals = (year) => {
  const festivals = [];

  // 2025 ke approximate dates
  if (year === 2025) {
    festivals.push(
      { date: '01-29', name: 'Basant Panchami', icon: '🌼', type: 'festival', color: '#f1c40f' },
      { date: '02-12', name: 'Maha Shivratri', icon: '🕉️', type: 'festival', color: '#6c3483' },
      { date: '02-26', name: 'Holi Eve (Holika)', icon: '🔥', type: 'festival', color: '#e74c3c' },
      { date: '03-14', name: 'Holi', icon: '🎨', type: 'festival', color: '#e74c3c' },
      { date: '03-30', name: 'Ram Navami', icon: '🏹', type: 'festival', color: '#ff9900' },
      { date: '04-06', name: 'Hanuman Jayanti', icon: '🙏', type: 'festival', color: '#ff9900' },
      { date: '04-10', name: 'Eid ul-Fitr', icon: '🌙', type: 'festival', color: '#27ae60' },
      { date: '04-18', name: 'Good Friday', icon: '✝️', type: 'festival', color: '#7f8c8d' },
      { date: '04-20', name: 'Easter', icon: '🐣', type: 'festival', color: '#27ae60' },
      { date: '06-17', name: 'Eid ul-Adha', icon: '🌙', type: 'festival', color: '#27ae60' },
      { date: '07-10', name: 'Muharram', icon: '🌙', type: 'festival', color: '#27ae60' },
      { date: '08-01', name: 'Sawan Shivratri', icon: '🕉️', type: 'festival', color: '#6c3483' },
      { date: '08-09', name: 'Nag Panchami', icon: '🐍', type: 'festival', color: '#27ae60' },
      { date: '08-16', name: 'Raksha Bandhan', icon: '🧶', type: 'festival', color: '#e74c3c' },
      { date: '08-25', name: 'Janmashtami', icon: '🦚', type: 'festival', color: '#2980b9' },
      { date: '08-27', name: 'Ganesh Chaturthi', icon: '🐘', type: 'festival', color: '#ff9900' },
      { date: '09-05', name: 'Milad-un-Nabi', icon: '🌙', type: 'festival', color: '#27ae60' },
      { date: '10-02', name: 'Navratri Shuru', icon: '🪔', type: 'festival', color: '#e74c3c' },
      { date: '10-10', name: 'Dussehra', icon: '🏹', type: 'festival', color: '#e74c3c' },
      { date: '10-20', name: 'Dhanteras', icon: '💰', type: 'festival', color: '#f1c40f' },
      { date: '10-20', name: 'Karva Chauth', icon: '🌕', type: 'festival', color: '#ff9900' },
      { date: '10-21', name: 'Diwali (Choti)', icon: '✨', type: 'festival', color: '#f1c40f' },
      { date: '10-22', name: '🪔 DIWALI', icon: '🪔', type: 'festival', color: '#e74c3c' },
      { date: '10-23', name: 'Govardhan Puja', icon: '🐄', type: 'festival', color: '#ff9900' },
      { date: '10-24', name: 'Bhai Dooj', icon: '🤝', type: 'festival', color: '#ff9900' },
      { date: '11-05', name: 'Guru Nanak Jayanti', icon: '🙏', type: 'festival', color: '#f39c12' },
      { date: '12-25', name: 'Christmas', icon: '🎄', type: 'festival', color: '#27ae60' },
    );
  } else if (year === 2026) {
    festivals.push(
      { date: '01-02', name: 'Holi', icon: '🎨', type: 'festival', color: '#e74c3c' },
      { date: '03-20', name: 'Eid ul-Fitr', icon: '🌙', type: 'festival', color: '#27ae60' },
      { date: '10-11', name: '🪔 DIWALI', icon: '🪔', type: 'festival', color: '#e74c3c' },
    );
  }

  return festivals;
};

// ── Type colors ──
const TYPE_INFO = {
  national:      { bg: '#fff0f0', border: '#ffcccc', text: '#e53e3e',  label: 'National' },
  festival:      { bg: '#fff8e8', border: '#ffe0a0', text: '#dd8800',  label: 'Festival' },
  international: { bg: '#f0f7ff', border: '#c0d4ff', text: '#0066cc',  label: 'International' },
  regional:      { bg: '#f0fff8', border: '#b3f0d8', text: '#00b86b',  label: 'Regional' },
  special:       { bg: '#fff0f8', border: '#ffb3d9', text: '#d63384',  label: 'Special' },
  fun:           { bg: '#fff8e8', border: '#ffe0a0', text: '#dd8800',  label: 'Fun' },
};

// ── Get festivals for a date ──
const getFestivals = (day, month, year) => {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const key = `${mm}-${dd}`;

  const fixed    = INDIAN_FESTIVALS[key] || [];
  const floating = getFloatingFestivals(year).filter(f => f.date === key).map(f => ({
    name: f.name, icon: f.icon, type: f.type, color: f.color
  }));

  return [...fixed, ...floating];
};

// ══════════════════════════════════════════
// CALENDAR PAGE
// ══════════════════════════════════════════
export default function CalendarPage() {
  const dispatch = useDispatch();
  const { items: posts } = useSelector(s => s.posts);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [view, setView] = useState('month'); // month | week

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const start = new Date(year, month, 1).toISOString();
    const end   = new Date(year, month + 1, 0).toISOString();
    dispatch(fetchPosts({ start, end }));
  }, [dispatch, year, month]);

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today       = new Date();

  // Posts by day
  const postsByDay = {};
  posts.forEach(p => {
    if (p.scheduling?.scheduledAt) {
      const d = new Date(p.scheduling.scheduledAt);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate();
        if (!postsByDay[day]) postsByDay[day] = [];
        postsByDay[day].push(p);
      }
    }
  });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday   = () => setCurrentDate(new Date());

  // Cells banao
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push({ empty: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });

  const isToday  = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const isSunday = (d) => new Date(year, month, d).getDay() === 0;
  const isSaturday = (d) => new Date(year, month, d).getDay() === 6;
  const isWeekend = (d) => isSunday(d) || isSaturday(d);

  // Selected day info
  const selectedFestivals = selectedDay ? getFestivals(selectedDay, month, year) : [];
  const selectedPosts     = selectedDay ? (postsByDay[selectedDay] || []) : [];

  // Festival count this month
  let festivalCount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    if (getFestivals(d, month, year).length > 0) festivalCount++;
  }

  return (
    <div className="page fade-in">
      {/* Header */}
      <div className="page-header flex justify-between items-center" style={{ flexWrap:'wrap', gap:10 }}>
        <div>
          <div className="page-title">📅 Content Calendar</div>
          <div className="page-sub">
            {MONTHS[month]} {year} •{' '}
            <span style={{color:'#e53e3e',fontWeight:600}}>🎉 {festivalCount} festivals this month</span>
          </div>
        </div>

        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {/* View toggle */}
          <div className="toggle-wrap" style={{width:'auto'}}>
            <div className={`toggle-btn ${view==='month'?'active':''}`} onClick={()=>setView('month')}>📅 Month</div>
            <div className={`toggle-btn ${view==='week'?'active':''}`}  onClick={()=>setView('week')}>📋 Week</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={goToday}>Today</button>
          <button className="btn btn-secondary btn-sm" onClick={prevMonth}>◀</button>
          <span style={{padding:'5px 14px',fontWeight:700,fontSize:13,background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--radius2)'}}>{MONTHS[month].slice(0,3)} {year}</span>
          <button className="btn btn-secondary btn-sm" onClick={nextMonth}>▶</button>
          <a href="/create" className="btn btn-primary btn-sm">+ Post</a>
        </div>
      </div>

      {/* Festival type legend */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
        {Object.entries(TYPE_INFO).map(([type, info]) => (
          <span key={type} style={{fontSize:11,padding:'3px 10px',borderRadius:20,background:info.bg,color:info.text,border:`1px solid ${info.border}`,fontWeight:600}}>
            {info.label}
          </span>
        ))}
        <span style={{fontSize:11,padding:'3px 10px',borderRadius:20,background:'#f0f4f8',color:'var(--muted)',border:'1px solid var(--border)',fontWeight:600}}>🔵 Your Post</span>
        <span style={{fontSize:11,padding:'3px 10px',borderRadius:20,background:'#fff0f5',color:'#e1306c',border:'1px solid #ffc0d8',fontWeight:600}}>🔴 Sunday</span>
        <span style={{fontSize:11,padding:'3px 10px',borderRadius:20,background:'#e8f4ff',color:'#0077b5',border:'1px solid #b0d8f0',fontWeight:600}}>🔵 Saturday</span>
      </div>

      <div style={{display:'grid',gridTemplateColumns: selectedDay ? '1fr 280px' : '1fr',gap:16}}>

        {/* ── CALENDAR GRID ── */}
        <div>
          {/* Day headers */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:1,marginBottom:1}}>
            {DAYS.map((d,i) => (
              <div key={d} style={{
                padding:'8px 4px',
                textAlign:'center',
                fontSize:11,
                fontWeight:800,
                textTransform:'uppercase',
                letterSpacing:'0.05em',
                color: i===0 ? '#e53e3e' : i===6 ? '#0066cc' : 'var(--muted)',
                background: i===0 ? '#fff5f5' : i===6 ? '#f0f7ff' : '#fff',
                borderRadius:'6px 6px 0 0'
              }}>{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:1,background:'var(--border)',borderRadius:'0 0 var(--radius) var(--radius)',overflow:'hidden'}}>
            {cells.map((cell, i) => {
              if (cell.empty) return <div key={`e-${i}`} style={{background:'#fafafa',minHeight:100}} />;

              const { day } = cell;
              const festivals  = getFestivals(day, month, year);
              const dayPosts   = postsByDay[day] || [];
              const _isToday   = isToday(day);
              const _isSun     = isSunday(day);
              const _isSat     = isSaturday(day);
              const _isSelected = selectedDay === day;
              const hasFestival = festivals.length > 0;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(_isSelected ? null : day)}
                  style={{
                    background: _isSelected ? '#e8f0ff' :
                                _isToday    ? '#fff8e8' :
                                hasFestival ? '#fffbf0' :
                                _isSun      ? '#fff5f5' :
                                _isSat      ? '#f5f8ff' : '#fff',
                    minHeight: 90,
                    padding: '6px 5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    borderLeft: _isSun ? '2px solid #ffcccc' : _isSat ? '2px solid #c0d4ff' : 'none',
                    position: 'relative',
                    borderBottom: _isSelected ? '2px solid #0066cc' : 'none',
                  }}
                >
                  {/* Date number */}
                  <div style={{
                    width: 24, height: 24,
                    borderRadius: '50%',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: _isToday || _isSun || _isSat ? 800 : 600,
                    background: _isToday ? '#0066cc' : 'transparent',
                    color: _isToday ? '#fff' : _isSun ? '#e53e3e' : _isSat ? '#0066cc' : 'var(--text)',
                    marginBottom: 3,
                  }}>
                    {day}
                  </div>

                  {/* Weekend label */}
                  {_isSun && !_isToday && (
                    <span style={{fontSize:8,color:'#e53e3e',fontWeight:700,marginLeft:2,verticalAlign:'middle'}}>SUN</span>
                  )}
                  {_isSat && !_isToday && (
                    <span style={{fontSize:8,color:'#0066cc',fontWeight:700,marginLeft:2,verticalAlign:'middle'}}>SAT</span>
                  )}

                  {/* Festivals */}
                  {festivals.slice(0,2).map((f, fi) => (
                    <div key={fi} title={f.name} style={{
                      fontSize: 9,
                      padding: '1px 4px',
                      borderRadius: 3,
                      marginBottom: 1,
                      background: TYPE_INFO[f.type]?.bg || '#f5f5f5',
                      color: TYPE_INFO[f.type]?.text || '#666',
                      border: `1px solid ${TYPE_INFO[f.type]?.border || '#ddd'}`,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                      lineHeight: 1.5,
                    }}>
                      {f.icon} {f.name.length > 12 ? f.name.slice(0,12)+'…' : f.name}
                    </div>
                  ))}
                  {festivals.length > 2 && (
                    <div style={{fontSize:9,color:'var(--muted)',fontWeight:600}}>+{festivals.length-2} more</div>
                  )}

                  {/* Posts */}
                  {dayPosts.slice(0,2).map((p, pi) => (
                    <div key={pi} style={{
                      fontSize: 9, padding: '1px 4px', borderRadius: 3, marginBottom: 1,
                      background: '#f0f7ff', color: '#0066cc', border: '1px solid #c0d4ff',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600,
                    }}>
                      📝 {p.content?.text?.slice(0,12) || 'Post'}
                    </div>
                  ))}
                  {dayPosts.length > 2 && (
                    <div style={{fontSize:9,color:'#0066cc',fontWeight:600}}>+{dayPosts.length-2} posts</div>
                  )}

                  {/* Festival indicator dot */}
                  {hasFestival && (
                    <div style={{
                      position:'absolute', top:4, right:4,
                      width:6, height:6, borderRadius:'50%',
                      background: festivals[0].color || '#ff9900',
                      boxShadow:`0 0 4px ${festivals[0].color || '#ff9900'}66`
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SIDE PANEL — Selected day detail ── */}
        {selectedDay && (
          <div style={{animation:'slideIn 0.2s ease'}}>
            <div className="card" style={{position:'sticky',top:80}}>
              {/* Header */}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
                <div>
                  <div style={{fontFamily:"'Poppins',sans-serif",fontSize:22,fontWeight:800,color:'var(--text)'}}>
                    {selectedDay} {MONTHS[month].slice(0,3)}
                  </div>
                  <div style={{fontSize:12,color:isSunday(selectedDay)?'#e53e3e':isSaturday(selectedDay)?'#0066cc':'var(--muted)',fontWeight:600}}>
                    {new Date(year,month,selectedDay).toLocaleDateString('en-IN',{weekday:'long'})}
                    {isSunday(selectedDay) && ' 🔴 Holiday'}
                    {isSaturday(selectedDay) && ' 🔵 Half Day'}
                  </div>
                </div>
                <button onClick={()=>setSelectedDay(null)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:18,padding:4}}>✕</button>
              </div>

              {/* Festivals */}
              {selectedFestivals.length > 0 && (
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>
                    🎉 Festivals & Events
                  </div>
                  {selectedFestivals.map((f,i) => (
                    <div key={i} style={{
                      display:'flex',alignItems:'center',gap:10,
                      padding:'10px 12px',marginBottom:6,
                      background: TYPE_INFO[f.type]?.bg || '#f5f5f5',
                      border: `1px solid ${TYPE_INFO[f.type]?.border || '#ddd'}`,
                      borderRadius:10,
                      borderLeft: `3px solid ${f.color}`,
                    }}>
                      <span style={{fontSize:22}}>{f.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:13,color:'var(--text)'}}>{f.name}</div>
                        <div style={{fontSize:11,color: TYPE_INFO[f.type]?.text || 'var(--muted)',fontWeight:600,textTransform:'uppercase'}}>
                          {TYPE_INFO[f.type]?.label || f.type}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Post Idea Button */}
                  <a href={`/create`} className="btn btn-primary w-full mt-2" style={{fontSize:12}}>
                    ✏️ Is festival ke liye post banao
                  </a>
                </div>
              )}

              {/* Posts */}
              {selectedPosts.length > 0 && (
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>
                    📝 Scheduled Posts ({selectedPosts.length})
                  </div>
                  {selectedPosts.map((p,i) => (
                    <div key={i} style={{padding:'10px 12px',background:'#f0f7ff',border:'1px solid #c0d4ff',borderRadius:10,marginBottom:6}}>
                      <div style={{fontSize:12,fontWeight:600,marginBottom:4,color:'var(--text)'}}>
                        {p.content?.text?.slice(0,60) || 'Media post'}
                      </div>
                      <div style={{fontSize:11,color:'var(--muted)'}}>
                        🕐 {new Date(p.scheduling.scheduledAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedFestivals.length === 0 && selectedPosts.length === 0 && (
                <div style={{textAlign:'center',padding:'20px 0',color:'var(--muted)'}}>
                  <div style={{fontSize:32,marginBottom:8}}>📭</div>
                  <div style={{fontSize:13}}>Koi festival ya post nahi</div>
                  <a href="/create" className="btn btn-primary btn-sm mt-3">+ Post Add Karo</a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── UPCOMING FESTIVALS THIS MONTH ── */}
      <div className="card mt-4">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div className="card-title">🎉 {MONTHS[month]} ke Festivals</div>
          <span style={{fontSize:12,color:'var(--muted)'}}>{festivalCount} events</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
          {Array.from({length: daysInMonth}, (_, i) => i+1)
            .map(d => ({ day: d, festivals: getFestivals(d, month, year) }))
            .filter(x => x.festivals.length > 0)
            .map(({ day, festivals }) => (
              <div
                key={day}
                onClick={() => setSelectedDay(day)}
                style={{
                  padding:'10px 12px',
                  background: isToday(day) ? '#fff8e8' : '#fff',
                  border:`1px solid ${festivals[0]?.color || 'var(--border)'}44`,
                  borderRadius:10,
                  borderLeft:`3px solid ${festivals[0]?.color || 'var(--accent)'}`,
                  cursor:'pointer',
                  transition:'all 0.15s',
                  boxShadow:'0 1px 4px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <div style={{
                    width:28,height:28,borderRadius:'50%',
                    background: isToday(day) ? '#0066cc' : 'var(--bg3)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:11,fontWeight:800,
                    color: isToday(day) ? '#fff' : isSunday(day) ? '#e53e3e' : isSaturday(day) ? '#0066cc' : 'var(--text)',
                    flexShrink:0
                  }}>{day}</div>
                  <div>
                    <div style={{fontSize:10,color:'var(--muted)',fontWeight:600}}>
                      {new Date(year,month,day).toLocaleDateString('en-IN',{weekday:'short'})}
                      {isSunday(day) && ' 🔴'}{isSaturday(day) && ' 🔵'}
                    </div>
                  </div>
                </div>
                {festivals.slice(0,2).map((f,i) => (
                  <div key={i} style={{fontSize:12,fontWeight:600,color:'var(--text)',marginBottom:2}}>
                    {f.icon} {f.name}
                  </div>
                ))}
                {festivals.length > 2 && (
                  <div style={{fontSize:11,color:'var(--muted)'}}>+{festivals.length-2} more</div>
                )}
              </div>
            ))
          }
        </div>
        {festivalCount === 0 && (
          <div style={{textAlign:'center',padding:30,color:'var(--muted)'}}>Is mahine koi festival nahi hai</div>
        )}
      </div>
    </div>
  );
}
