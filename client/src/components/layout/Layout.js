import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store';
import ChatbotWidget from '../common/ChatbotWidget';

const NAV_MAIN = [
  { to:'/dashboard',   icon:'🏠', label:'Dashboard'    },
  { to:'/create',      icon:'✏️', label:'Create Post', badge:'New' },
  { to:'/posts',       icon:'📋', label:'All Posts'    },
  { to:'/calendar',    icon:'📅', label:'Calendar'     },
  { to:'/inbox',       icon:'📬', label:'Inbox', dot:true },
  { to:'/analytics',   icon:'📊', label:'Analytics'    },
];
const NAV_MANAGE = [
  { to:'/accounts',         icon:'🔗', label:'Social Accounts'  },
  { to:'/api-settings',     icon:'🔑', label:'API Settings'     },
  { to:'/storage-settings', icon:'💾', label:'Storage Settings' },
  { to:'/company',          icon:'🏢', label:'Company Profile'  },
  { to:'/notifications',    icon:'🔔', label:'Notifications'    },
  { to:'/ads',              icon:'📢', label:'Ads Manager'      },
  { to:'/plans',            icon:'💎', label:'Plans & Billing'  },
  { to:'/settings',         icon:'⚙️', label:'Settings'         },
];
const MOB_NAV = [
  { to:'/dashboard', icon:'🏠', label:'Home'   },
  { to:'/create',    icon:'✏️', label:'Create' },
  { to:'/inbox',     icon:'📬', label:'Inbox'  },
  { to:'/plans',     icon:'💎', label:'Plans'  },
  { to:'/settings',  icon:'⚙️', label:'More'   },
];

const dropdownItemStyle = {
  display:'flex', alignItems:'center', gap:10, padding:'10px 16px',
  fontSize:13, color:'var(--text)', textDecoration:'none', cursor:'pointer',
  transition:'background 0.1s',
};

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(s => s.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  
  // Company branding
  const company     = user?.company;
  const companyLogo = company?.logo || null;
  const companyName = company?.name || 'GowebkartSocial';

  useEffect(() => { setSidebarOpen(false); setUserMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    if (!userMenuOpen) return;
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [userMenuOpen]);

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };
  const initials  = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)||'U';
  const planLimit = user?.plan==='pro'?999999:user?.plan==='basic'?100:30;
  const usedPosts = user?.usage?.postsThisMonth||0;
  const usagePct  = Math.min((usedPosts/planLimit)*100,100);

  const pageTitles = {
    '/dashboard':'Dashboard','/create':'Create Post','/posts':'All Posts','/calendar':'Calendar',
    '/inbox':'Inbox','/analytics':'Analytics','/accounts':'Social Accounts','/api-settings':'API Settings',
    '/storage-settings':'Storage','/company':'Company','/notifications':'Notifications',
    '/ads':'Ads Manager','/plans':'Plans','/settings':'Settings',
    '/admin':'Admin','/superadmin':'Super Admin','/expiry-settings':'Expiry Settings'
  };
  const pageTitle = pageTitles[location.pathname]||'GowebkartSocial';

  // Browser tab title update karo
  useEffect(() => {
    document.title = `${pageTitle} | ${companyName}`;
  }, [pageTitle, companyName]);

  return (
    <div className="app-shell">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen?'open':''}`}>
        <div className="sidebar-logo">
          {companyLogo ? (
            // Company ka logo hai → dikhao
            <>
              <div style={{
                width: 36, height: 36, borderRadius: 10, overflow: 'hidden',
                background: '#fff', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
                border: '1.5px solid rgba(255,255,255,0.2)'
              }}>
                <img src={companyLogo} alt={companyName}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <span className="logo-text" style={{ fontSize: 14 }}>
                {companyName.length > 14 ? companyName.slice(0, 14) + '…' : companyName}
              </span>
            </>
          ) : (
            // Default logo
            <>
              <div className="logo-icon">⚡</div>
              <span className="logo-text">Gowebkart<span>Social</span></span>
            </>
          )}
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">Main</div>
          {NAV_MAIN.map(item => (
            <NavLink key={item.to} to={item.to} className={({isActive})=>`nav-item${isActive?' active':''}`}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.dot && <span style={{marginLeft:'auto',width:8,height:8,borderRadius:'50%',background:'#0099ff'}}/>}
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </NavLink>
          ))}
          <div className="nav-section" style={{marginTop:10}}>Manage</div>
          {NAV_MANAGE.map(item => (
            <NavLink key={item.to} to={item.to} className={({isActive})=>`nav-item${isActive?' active':''}`}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
          {(user?.role==='admin'||user?.role==='superadmin') && <>
            <div className="nav-section" style={{marginTop:10}}>Admin</div>
            {user?.role==='superadmin' && <>
              <NavLink to="/superadmin" className={({isActive})=>`nav-item${isActive?' active':''}`}>
                <span className="nav-icon">👑</span><span className="nav-label">Super Admin</span>
              </NavLink>
              <NavLink to="/expiry-settings" className={({isActive})=>`nav-item${isActive?' active':''}`}>
                <span className="nav-icon">💎</span><span className="nav-label">Plan & Payments</span>
              </NavLink>
            </>}
            <NavLink to="/admin" className={({isActive})=>`nav-item${isActive?' active':''}`}>
              <span className="nav-icon">🛠️</span><span className="nav-label">Admin Panel</span>
            </NavLink>
          </>}
        </nav>

        {/* Usage bar */}
        <div style={{padding:'0 14px 10px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
            <span style={{fontSize:10,color:'rgba(255,255,255,0.45)'}}>Posts this month</span>
            <span style={{fontSize:10,color:'#0099ff',fontWeight:700}}>{usedPosts}/{user?.plan==='pro'?'∞':planLimit}</span>
          </div>
          <div style={{background:'rgba(255,255,255,0.12)',borderRadius:4,height:4,overflow:'hidden'}}>
            <div style={{width:`${usagePct}%`,height:'100%',background:usagePct>80?'#ff4444':'#0099ff',borderRadius:4,transition:'width 0.5s'}}/>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="avatar" style={{width:30,height:30,fontSize:12}}>{initials}</div>
            <div style={{flex:1,minWidth:0}}>
              <div className="user-name truncate" style={{fontSize:12}}>{user?.name||'User'}</div>
              <div className="user-plan">{user?.plan||'free'} plan</div>
            </div>
          </div>
          <button className="btn btn-sm w-full mt-2" style={{justifyContent:'center',background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.65)',border:'none',fontSize:12}} onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
            <span style={{fontFamily:"'Poppins',sans-serif",fontSize:15,fontWeight:700,color:'var(--text)'}}>{pageTitle}</span>
          </div>
          <div className="topbar-right">
            {user?.isDemo && <span style={{fontSize:10,background:'#fff8e8',color:'#dd8800',border:'1px solid #ffe0a0',padding:'2px 8px',borderRadius:20,fontWeight:700}}>🎭 DEMO</span>}
            <NavLink to="/notifications" className="btn btn-ghost btn-sm" style={{padding:'6px 8px'}}>🔔</NavLink>
            <NavLink to="/inbox"  className="btn btn-ghost btn-sm"  style={{padding:'6px 8px'}}>📬</NavLink>
            <NavLink to="/create" className="btn btn-primary btn-sm">+ Post</NavLink>

            {/* User dropdown */}
            <div ref={userMenuRef} style={{ position:'relative' }}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(o => !o)}
                aria-label="User menu"
                style={{
                  display:'flex', alignItems:'center', gap:8, padding:'4px 10px 4px 4px',
                  background: userMenuOpen ? 'var(--bg3)' : 'transparent',
                  border: '1px solid ' + (userMenuOpen ? 'var(--border)' : 'transparent'),
                  borderRadius: 999, cursor:'pointer',
                  transition:'all 0.15s',
                }}
              >
                <div style={{
                  width:30, height:30, borderRadius:'50%',
                  background:'linear-gradient(135deg,#0066cc,#0099ff)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#fff', fontWeight:800, fontSize:12, flexShrink:0,
                }}>{initials}</div>
                <span style={{
                  fontSize:13, fontWeight:600, color:'var(--text)',
                  maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                }} className="hide-on-mobile">{user?.name?.split(' ')[0] || 'User'}</span>
                <span style={{ fontSize:10, color:'var(--muted)' }}>▼</span>
              </button>

              {userMenuOpen && (
                <div style={{
                  position:'absolute', top:'calc(100% + 8px)', right:0,
                  minWidth:280, maxWidth:320,
                  background:'#fff', border:'1px solid var(--border)',
                  borderRadius:12, boxShadow:'0 8px 30px rgba(0,0,0,0.12)',
                  zIndex: 500, overflow:'hidden',
                  animation:'fadeIn 0.15s ease',
                }}>
                  {/* User header */}
                  <div style={{ padding:'14px 16px', background:'linear-gradient(135deg,#f8faff,#f0f7ff)', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{
                        width:42, height:42, borderRadius:'50%',
                        background:'linear-gradient(135deg,#0066cc,#0099ff)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        color:'#fff', fontWeight:800, fontSize:15, flexShrink:0,
                      }}>{initials}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name || 'User'}</div>
                        <div style={{ fontSize:11, color:'var(--muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:6, marginTop:8 }}>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:'#e8f0ff', color:'#0066cc', textTransform:'uppercase' }}>
                        💎 {user?.plan || 'free'}
                      </span>
                      {user?.role && user.role !== 'user' && (
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20,
                          background: user.role === 'superadmin' ? '#fff3e8' : '#f0f7ff',
                          color:      user.role === 'superadmin' ? '#dd8800' : '#0066cc',
                          textTransform:'uppercase' }}>
                          {user.role === 'superadmin' ? '👑 Super Admin' : '🛠️ Admin'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Company section */}
                  {company && (
                    <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
                      <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Company</div>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        {companyLogo ? (
                          <img src={companyLogo} alt={companyName} style={{ width:32, height:32, borderRadius:8, objectFit:'contain', background:'#f8faff', border:'1px solid var(--border)', flexShrink:0 }} />
                        ) : (
                          <div style={{ width:32, height:32, borderRadius:8, background:'#f0f7ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>🏢</div>
                        )}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{companyName}</div>
                          {(company.city || company.state) && (
                            <div style={{ fontSize:11, color:'var(--muted)' }}>📍 {[company.city, company.state].filter(Boolean).join(', ')}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick links */}
                  <div style={{ padding:'6px 0' }}>
                    <NavLink to="/company"  onClick={() => setUserMenuOpen(false)} style={dropdownItemStyle}>🏢 <span>Company Profile</span></NavLink>
                    <NavLink to="/settings" onClick={() => setUserMenuOpen(false)} style={dropdownItemStyle}>⚙️ <span>Settings</span></NavLink>
                    <NavLink to="/plans"    onClick={() => setUserMenuOpen(false)} style={dropdownItemStyle}>💎 <span>Plans & Billing</span></NavLink>
                  </div>

                  {/* Logout */}
                  <div style={{ borderTop:'1px solid var(--border)', padding:'6px 0' }}>
                    <button
                      type="button"
                      onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                      style={{ ...dropdownItemStyle, width:'100%', background:'transparent', border:'none', textAlign:'left', cursor:'pointer', color:'#e53e3e', fontWeight:600 }}
                    >🚪 <span>Logout</span></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <Outlet />
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        {MOB_NAV.map(item=>(
          <NavLink key={item.to} to={item.to} className={({isActive})=>`mob-nav-item${isActive?' active':''}`}>
            <span className="mob-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* AI Chatbot */}
      <ChatbotWidget />
    </div>
  );
}