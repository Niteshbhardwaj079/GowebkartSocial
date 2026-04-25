import React, { useState, useEffect } from 'react';
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

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(s => s.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Company branding
  const company     = user?.company;
  const companyLogo = company?.logo || null;
  const companyName = company?.name || 'GowebkartSocial';

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

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