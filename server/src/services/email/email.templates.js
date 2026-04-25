// ══════════════════════════════════════════════════════
// BEAUTIFUL EMAIL TEMPLATE ENGINE
// Company logo + name + branding sab include
// ══════════════════════════════════════════════════════

const getCompanyInfo = async (userId) => {
  try {
    if (!userId) return null;
    const { User, Company } = require('../../models');
    const user    = await User.findById(userId).populate('company');
    return user?.company || null;
  } catch { return null; }
};

// ── Base template — sab emails iske andar jayenge ──
const baseTemplate = ({ company, title, preheader, body, footer }) => {
  const companyName  = company?.name    || 'SocialSaaS';
  const companyLogo  = company?.logo    || null;
  const primaryColor = company?.branding?.primaryColor   || '#0066cc';
  const secondaryColor = company?.branding?.secondaryColor || '#0099ff';
  const tagline      = company?.branding?.tagline || 'Manage all your social media from one place';
  const website      = company?.website || '#';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]><style>* { font-family: Arial, sans-serif !important; }</style><![endif]-->
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background:#f0f4f8; color:#1a2332; line-height:1.6; -webkit-text-size-adjust:100%; }
    .wrapper   { max-width:600px; margin:0 auto; padding:20px 15px; }
    .card      { background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
    .header    { background:linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); padding:28px 32px; text-align:center; }
    .logo-wrap { margin-bottom:12px; }
    .logo-img  { height:50px; max-width:180px; object-fit:contain; filter:brightness(0) invert(1); }
    .logo-text { font-size:26px; font-weight:900; color:#ffffff; letter-spacing:-0.5px; }
    .logo-sub  { font-size:12px; color:rgba(255,255,255,0.75); margin-top:4px; }
    .body      { padding:32px; }
    .greeting  { font-size:22px; font-weight:800; color:#1a2332; margin-bottom:8px; }
    p          { font-size:15px; color:#4a5568; margin-bottom:16px; line-height:1.7; }
    .otp-box   { background:linear-gradient(135deg,#f0f7ff,#e8f4ff); border:2px dashed ${primaryColor}; border-radius:14px; padding:24px; text-align:center; margin:24px 0; }
    .otp-code  { font-size:44px; font-weight:900; color:${primaryColor}; letter-spacing:12px; font-family:'Courier New',monospace; line-height:1; }
    .otp-timer { font-size:13px; color:#6b7c93; margin-top:10px; }
    .btn       { display:inline-block; background:linear-gradient(135deg,${primaryColor},${secondaryColor}); color:#ffffff !important; text-decoration:none; padding:14px 32px; border-radius:10px; font-weight:700; font-size:15px; margin:8px 0; text-align:center; }
    .btn-wrap  { text-align:center; margin:20px 0; }
    .divider   { height:1px; background:linear-gradient(90deg,transparent,#e2e8f0,transparent); margin:24px 0; }
    .info-box  { border-radius:10px; padding:14px 16px; margin:16px 0; }
    .info-box.warning { background:#fff8e8; border-left:4px solid #dd8800; }
    .info-box.success { background:#f0fff8; border-left:4px solid #00b86b; }
    .info-box.error   { background:#fff0f0; border-left:4px solid #e53e3e; }
    .info-box.info    { background:#f0f7ff; border-left:4px solid ${primaryColor}; }
    .info-box p { margin:0; font-size:13px; }
    .detail-table { width:100%; border-collapse:collapse; margin:16px 0; }
    .detail-table td { padding:10px 14px; font-size:14px; border-bottom:1px solid #f0f4f8; }
    .detail-table td:first-child { color:#6b7c93; font-weight:600; width:40%; }
    .detail-table td:last-child  { color:#1a2332; font-weight:700; }
    .tag  { display:inline-block; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:700; }
    .tag.red    { background:#fff0f0; color:#e53e3e; }
    .tag.green  { background:#f0fff8; color:#00b86b; }
    .tag.blue   { background:#f0f7ff; color:${primaryColor}; }
    .tag.orange { background:#fff8e8; color:#dd8800; }
    .social-links { text-align:center; padding:10px 0; }
    .social-links a { display:inline-block; margin:0 6px; color:${primaryColor}; font-size:13px; text-decoration:none; }
    .footer    { background:#f8fafc; padding:22px 32px; text-align:center; border-top:1px solid #e2e8f0; }
    .footer p  { font-size:12px; color:#94a3b8; margin-bottom:6px; }
    .footer a  { color:${primaryColor}; text-decoration:none; font-weight:600; }
    .unsubscribe { font-size:11px; color:#cbd5e1; margin-top:10px; }
    @media (max-width:600px) {
      .wrapper  { padding:10px; }
      .body     { padding:20px; }
      .otp-code { font-size:36px; letter-spacing:8px; }
      .btn      { display:block; text-align:center; }
    }
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;color:#f0f4f8;">${preheader || title}</div>
  <div class="wrapper">
    <div class="card">

      <!-- HEADER -->
      <div class="header">
        <div class="logo-wrap">
          ${companyLogo
            ? `<img src="${companyLogo}" alt="${companyName}" class="logo-img" />`
            : `<div class="logo-text">⚡ ${companyName}</div>`
          }
        </div>
        <div class="logo-sub">${tagline}</div>
      </div>

      <!-- BODY -->
      <div class="body">
        ${body}
      </div>

    </div>

    <!-- FOOTER -->
    <div class="card" style="margin-top:12px;background:#f8fafc;">
      <div class="footer">
        ${footer || `
          <p>© ${new Date().getFullYear()} <strong>${companyName}</strong>. All rights reserved.</p>
          ${website !== '#' ? `<p><a href="${website}">${website}</a></p>` : ''}
          <p class="unsubscribe">
            Agar yeh email aapne nahi mangayi to please ignore karein.<br>
            Yeh email <strong>${companyName}</strong> ki taraf se bheja gaya hai.
          </p>
        `}
      </div>
    </div>

  </div>
</body>
</html>`;
};

// ════════════════════════════════════════
// EMAIL TEMPLATES
// ════════════════════════════════════════
const templates = {

  // 1. OTP VERIFICATION
  otp: ({ name, otp, expireMinutes = 10, company }) => ({
    subject: `${otp} — Email Verify Karein | ${company?.name || 'SocialSaaS'}`,
    html: baseTemplate({
      company,
      title: 'Email Verification OTP',
      preheader: `Aapka OTP: ${otp} — ${expireMinutes} minutes mein expire hoga`,
      body: `
        <div class="greeting">Namaste ${name}! 👋</div>
        <p>Aapka <strong>${company?.name || 'SocialSaaS'}</strong> account verify karne ke liye yeh OTP use karein:</p>

        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div class="otp-timer">⏰ Yeh OTP <strong>${expireMinutes} minutes</strong> mein expire ho jayega</div>
        </div>

        <div class="info-box warning">
          <p>🔒 <strong>Security:</strong> Yeh OTP kisi ke saath share mat karein. ${company?.name || 'SocialSaaS'} team kabhi bhi OTP nahi maangti.</p>
        </div>

        <p style="font-size:13px;color:#94a3b8;">Agar aapne account nahi banaya to is email ko ignore karein — koi action nahi lena.</p>
      `
    })
  }),

  // 2. WELCOME EMAIL
  welcome: ({ name, plan = 'free', company }) => ({
    subject: `🎉 Welcome to ${company?.name || 'SocialSaaS'}! Shuru karein`,
    html: baseTemplate({
      company,
      title: `Welcome to ${company?.name || 'SocialSaaS'}`,
      preheader: `Namaste ${name}! Aapka account ready hai — ab social media manage karein!`,
      body: `
        <div class="greeting">Welcome, ${name}! 🎉</div>
        <p>Aapka <strong>${company?.name || 'SocialSaaS'}</strong> account successfully create ho gaya hai! Ab aap apne sab social media accounts ek jagah manage kar sakte hain.</p>

        <div class="info-box success">
          <p>✅ <strong>Aapka Plan:</strong> <span class="tag blue">${plan.toUpperCase()}</span> — Successfully activated!</p>
        </div>

        <p><strong>Shuru karne ke liye:</strong></p>
        <table class="detail-table">
          <tr><td>1️⃣ API Settings</td><td>Social media apps ki keys add karein</td></tr>
          <tr><td>2️⃣ Storage Setup</td><td>Images/videos ke liye Cloudinary connect karein</td></tr>
          <tr><td>3️⃣ Connect Accounts</td><td>Facebook, Instagram, Twitter link karein</td></tr>
          <tr><td>4️⃣ Create Post</td><td>Pehli post schedule karein! 🚀</td></tr>
        </table>

        <div class="btn-wrap">
          <a href="${process.env.CLIENT_URL || '#'}/dashboard" class="btn">🚀 Dashboard Kholein</a>
        </div>
      `
    })
  }),

  // 3. PASSWORD RESET
  passwordReset: ({ name, resetUrl, company }) => ({
    subject: `🔑 Password Reset — ${company?.name || 'SocialSaaS'}`,
    html: baseTemplate({
      company,
      title: 'Password Reset Request',
      preheader: 'Aapne password reset request ki hai — 30 minutes mein expire hoga',
      body: `
        <div class="greeting">Password Reset</div>
        <p>Namaste <strong>${name}</strong>, aapne <strong>${company?.name || 'SocialSaaS'}</strong> account ka password reset request kiya hai.</p>

        <div class="btn-wrap">
          <a href="${resetUrl}" class="btn">🔑 Password Reset Karein</a>
        </div>

        <div class="info-box warning">
          <p>⏰ Yeh link <strong>30 minutes</strong> mein expire ho jayega.<br>
          🔒 Agar aapne yeh request nahi ki to is email ko ignore karein — aapka password safe hai.</p>
        </div>

        <p style="font-size:12px;color:#94a3b8;">Link kaam nahi kar raha? Yeh URL copy karein:<br>
        <span style="word-break:break-all;color:#0066cc;">${resetUrl}</span></p>
      `
    })
  }),

  // 4. TAG ALERT
  tagAlert: ({ name, taggedBy, platform, content, accountName, company }) => ({
    subject: `🏷️ ${taggedBy} ne aapko ${platform} par tag kiya — ${company?.name || 'SocialSaaS'}`,
    html: baseTemplate({
      company,
      title: 'New Tag Alert',
      preheader: `${taggedBy} ne ${platform} par aapको tag kiya hai`,
      body: `
        <div class="greeting">📌 Tag Alert!</div>
        <p><strong>${taggedBy}</strong> ne aapke <strong>${accountName}</strong> account ko <strong>${platform}</strong> par tag kiya hai.</p>

        <table class="detail-table">
          <tr><td>🌐 Platform</td><td><span class="tag blue">${platform}</span></td></tr>
          <tr><td>👤 Tagged by</td><td><strong>${taggedBy}</strong></td></tr>
          <tr><td>🕐 Time</td><td>${new Date().toLocaleString('en-IN', { timeZone:'Asia/Kolkata' })}</td></tr>
          <tr><td>📱 Account</td><td>${accountName}</td></tr>
        </table>

        ${content ? `
        <div style="background:#f8fafc;border-radius:10px;padding:14px 16px;border:1px solid #e2e8f0;margin:16px 0;">
          <p style="font-size:12px;color:#94a3b8;font-weight:700;margin-bottom:8px;">MESSAGE / COMMENT:</p>
          <p style="font-size:14px;color:#1a2332;">"${content}"</p>
        </div>` : ''}

        <div class="btn-wrap">
          <a href="${process.env.CLIENT_URL || '#'}/inbox" class="btn">📬 Inbox Mein Reply Karein</a>
        </div>
      `
    })
  }),

  // 5. ABUSE ALERT
  abuseAlert: ({ name, from, platform, content, accountName, company }) => ({
    subject: `🚨 ALERT: Offensive Content — ${platform} par @${accountName}`,
    html: baseTemplate({
      company,
      title: '⚠️ Offensive Content Detected',
      preheader: `Aapke ${accountName} account par offensive content milaa hai`,
      body: `
        <div class="greeting">🚨 Offensive Content Alert!</div>
        <p>Aapke <strong>${accountName}</strong> account par <strong>${platform}</strong> mein offensive/abusive content detect hua hai.</p>

        <div class="info-box error">
          <p>⚠️ <strong>Yeh content automatically flagged kiya gaya hai.</strong><br>
          Aap is comment ko Inbox se hide ya block kar sakte hain.</p>
        </div>

        <table class="detail-table">
          <tr><td>🌐 Platform</td><td><span class="tag red">${platform}</span></td></tr>
          <tr><td>👤 From</td><td><strong>${from}</strong></td></tr>
          <tr><td>🕐 Time</td><td>${new Date().toLocaleString('en-IN', { timeZone:'Asia/Kolkata' })}</td></tr>
        </table>

        ${content ? `
        <div style="background:#fff0f0;border-radius:10px;padding:14px 16px;border:1px solid #ffcccc;margin:16px 0;">
          <p style="font-size:12px;color:#e53e3e;font-weight:700;margin-bottom:6px;">DETECTED CONTENT:</p>
          <p style="font-size:14px;color:#1a2332;">"${content}"</p>
        </div>` : ''}

        <div class="btn-wrap">
          <a href="${process.env.CLIENT_URL || '#'}/inbox" class="btn" style="background:linear-gradient(135deg,#e53e3e,#c0392b);">🛡️ Manage Karein</a>
        </div>
      `
    })
  }),

  // 6. SUPPORT TICKET — Client ne issue report kiya
  supportTicket: ({ ticketId, clientName, clientEmail, category, priority, subject, description, company }) => ({
    subject: `🎫 [Ticket #${ticketId}] ${subject} — ${priority} Priority`,
    html: baseTemplate({
      company,
      title: `Support Ticket #${ticketId}`,
      preheader: `New support request from ${clientName} — ${priority} priority`,
      body: `
        <div class="greeting">🎫 New Support Ticket</div>
        <p>Ek client ne support request submit ki hai. Details neeche hain:</p>

        <table class="detail-table">
          <tr><td>🎫 Ticket ID</td><td><strong>#${ticketId}</strong></td></tr>
          <tr><td>👤 Client</td><td><strong>${clientName}</strong></td></tr>
          <tr><td>📧 Email</td><td><a href="mailto:${clientEmail}" style="color:#0066cc;">${clientEmail}</a></td></tr>
          <tr><td>📂 Category</td><td><span class="tag blue">${category}</span></td></tr>
          <tr><td>🔥 Priority</td><td>
            <span class="tag ${priority==='high'||priority==='urgent' ? 'red' : priority==='medium' ? 'orange' : 'green'}">
              ${priority.toUpperCase()}
            </span>
          </td></tr>
          <tr><td>📌 Subject</td><td>${subject}</td></tr>
          <tr><td>🕐 Time</td><td>${new Date().toLocaleString('en-IN', { timeZone:'Asia/Kolkata' })}</td></tr>
        </table>

        <div style="background:#f8fafc;border-radius:10px;padding:16px;border:1px solid #e2e8f0;margin:16px 0;">
          <p style="font-size:12px;color:#94a3b8;font-weight:700;margin-bottom:8px;">ISSUE DESCRIPTION:</p>
          <p style="font-size:14px;color:#1a2332;line-height:1.7;">${description}</p>
        </div>

        <div class="btn-wrap">
          <a href="mailto:${clientEmail}?subject=Re: [Ticket #${ticketId}] ${subject}" class="btn">📧 Reply to Client</a>
        </div>

        <div class="info-box info">
          <p>💡 Client ko reply karne ke liye upar ka button use karein ya seedha ${clientEmail} par email bhejein.</p>
        </div>
      `
    })
  }),

  // 7. TICKET CONFIRMATION — Client ko confirmation
  ticketConfirmation: ({ ticketId, name, subject, estimatedTime, company }) => ({
    subject: `✅ Support Request Received [#${ticketId}] — ${company?.name || 'SocialSaaS'}`,
    html: baseTemplate({
      company,
      title: 'Support Request Received',
      preheader: `Aapka ticket #${ticketId} receive hua — jaldi reply milegi`,
      body: `
        <div class="greeting">✅ Request Received!</div>
        <p>Namaste <strong>${name}</strong>, aapki support request humein mil gayi hai. Hum jaldi se help karenge!</p>

        <div class="info-box success">
          <p>🎫 <strong>Ticket Number: #${ticketId}</strong><br>
          📌 Subject: ${subject}<br>
          ⏰ Expected Response: <strong>${estimatedTime || '24 ghante mein'}</strong></p>
        </div>

        <p>Tab tak aap in resources se help le sakte hain:</p>
        <table class="detail-table">
          <tr><td>📖 Help Guide</td><td><a href="${process.env.CLIENT_URL||'#'}/help" style="color:#0066cc;">Documentation padhein</a></td></tr>
          <tr><td>💬 AI Chatbot</td><td>Dashboard mein bottom-right corner mein available hai</td></tr>
          <tr><td>📧 Direct Email</td><td>${process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || 'support@socialsaas.com'}</td></tr>
        </table>

        <div class="btn-wrap">
          <a href="${process.env.CLIENT_URL || '#'}/support" class="btn">📋 Ticket Status Dekhen</a>
        </div>
      `
    })
  }),

  // 8. POST PUBLISHED
  postPublished: ({ name, postText, platforms, publishedAt, company }) => ({
    subject: `✅ Post Published — ${company?.name || 'SocialSaaS'}`,
    html: baseTemplate({
      company,
      title: 'Post Successfully Published',
      preheader: `Aapki post ${platforms?.join(', ')} par publish ho gayi!`,
      body: `
        <div class="greeting">✅ Post Published!</div>
        <p>Aapki post successfully publish ho gayi hai!</p>
        <div style="background:#f8fafc;border-radius:10px;padding:14px;border:1px solid #e2e8f0;margin:16px 0;">
          <p style="font-size:14px;color:#1a2332;">"${(postText||'').slice(0,200)}${postText?.length>200?'...':''}"</p>
        </div>
        <table class="detail-table">
          <tr><td>🌐 Platforms</td><td>${(platforms||[]).map(p=>`<span class="tag blue">${p}</span>`).join(' ')}</td></tr>
          <tr><td>🕐 Published at</td><td>${publishedAt ? new Date(publishedAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}) : 'Now'}</td></tr>
        </table>
        <div class="btn-wrap"><a href="${process.env.CLIENT_URL||'#'}/analytics" class="btn">📊 Analytics Dekhen</a></div>
      `
    })
  }),

  // 9. POST FAILED
  postFailed: ({ name, postText, platforms, error, company }) => ({
    subject: `❌ Post Failed — Action Required | ${company?.name || 'SocialSaaS'}`,
    html: baseTemplate({
      company,
      title: 'Post Failed',
      preheader: `Aapki post publish nahi ho payi — please check karein`,
      body: `
        <div class="greeting">❌ Post Failed</div>
        <p>Aapki scheduled post publish nahi ho payi. Please check karein.</p>
        <div class="info-box error">
          <p>🚨 <strong>Error:</strong> ${error || 'Unknown error occurred'}</p>
        </div>
        <table class="detail-table">
          <tr><td>🌐 Platform</td><td>${(platforms||[]).join(', ')}</td></tr>
          <tr><td>📝 Post</td><td>"${(postText||'').slice(0,100)}..."</td></tr>
        </table>
        <p><strong>Fix karne ke liye:</strong></p>
        <ul style="padding-left:20px;color:#4a5568;font-size:14px;line-height:2;">
          <li>Social account connection check karein</li>
          <li>API keys valid hain ya nahi verify karein</li>
          <li>Post content platform guidelines follow karta hai check karein</li>
        </ul>
        <div class="btn-wrap"><a href="${process.env.CLIENT_URL||'#'}/posts" class="btn" style="background:linear-gradient(135deg,#e53e3e,#c0392b);">🔧 Fix Karein</a></div>
      `
    })
  }),

};

module.exports = { templates, baseTemplate, getCompanyInfo };
