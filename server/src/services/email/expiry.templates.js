const { baseTemplate } = require('./email.templates');

const expiryTemplates = {

  // ── Client ko expiry warning ──
  expiryWarning: ({ name, plan, daysLeft, renewUrl, company, amount }) => {
    const urgency = daysLeft <= 3 ? 'danger' : daysLeft <= 7 ? 'warning' : 'info';
    const emoji   = daysLeft <= 3 ? '🚨' : daysLeft <= 7 ? '⚠️' : '📢';
    const colors  = { danger: '#e53e3e', warning: '#dd8800', info: '#0066cc' };
    const bgColor = { danger: '#fff0f0', warning: '#fff8e8', info: '#f0f7ff' };
    const borderColor = { danger: '#ffcccc', warning: '#ffe0a0', info: '#c0d4ff' };

    return {
      subject: `${emoji} Aapka ${plan.toUpperCase()} Plan ${daysLeft} din mein expire ho raha hai — ${company?.name || 'GowebkartSocial'}`,
      html: baseTemplate({
        company,
        title: `Plan Expiry — ${daysLeft} Days Left`,
        preheader: `Aapka ${plan} plan sirf ${daysLeft} din mein expire ho raha hai. Abhi renew karein!`,
        body: `
          <div style="font-size:20px;font-weight:800;margin-bottom:8px;">${emoji} Plan Expiry Notice</div>
          <p>Namaste <strong>${name}</strong>,</p>
          <p>Aapka <strong>${plan.toUpperCase()} Plan</strong> sirf <strong style="color:${colors[urgency]};font-size:18px;">${daysLeft} din</strong> mein expire hone wala hai.</p>

          <div style="background:${bgColor[urgency]};border:2px solid ${borderColor[urgency]};border-radius:14px;padding:20px;text-align:center;margin:20px 0;">
            <div style="font-size:48px;font-weight:900;color:${colors[urgency]};line-height:1;">${daysLeft}</div>
            <div style="font-size:14px;color:${colors[urgency]};font-weight:700;margin-top:4px;">DAYS REMAINING</div>
          </div>

          ${daysLeft <= 3 ? `
          <div style="background:#fff0f0;border-left:4px solid #e53e3e;border-radius:8px;padding:14px;margin:16px 0;">
            <p style="margin:0;font-size:14px;"><strong>🚨 URGENT:</strong> Plan expire hone ke baad aapke scheduled posts publish nahi honge aur social accounts disconnect ho sakte hain!</p>
          </div>` : ''}

          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr style="border-bottom:1px solid #f0f4f8;"><td style="padding:10px;color:#6b7c93;font-weight:600;font-size:13px;">Current Plan</td><td style="padding:10px;font-weight:700;">${plan.toUpperCase()}</td></tr>
            <tr style="border-bottom:1px solid #f0f4f8;"><td style="padding:10px;color:#6b7c93;font-weight:600;font-size:13px;">Expires On</td><td style="padding:10px;font-weight:700;color:${colors[urgency]};">${daysLeft} din baad</td></tr>
            ${amount ? `<tr><td style="padding:10px;color:#6b7c93;font-weight:600;font-size:13px;">Renewal Amount</td><td style="padding:10px;font-weight:700;">₹${amount}/month</td></tr>` : ''}
          </table>

          <div style="text-align:center;margin:24px 0;">
            <a href="${renewUrl}" style="display:inline-block;background:linear-gradient(135deg,#0066cc,#0099ff);color:#fff;text-decoration:none;padding:16px 36px;border-radius:10px;font-weight:800;font-size:16px;">⚡ Abhi Renew Karein</a>
          </div>

          <div style="background:#f0fff8;border:1px solid #b3f0d8;border-radius:10px;padding:14px;margin:16px 0;">
            <p style="margin:0;font-size:13px;">✅ <strong>Renew karne ke fayde:</strong> Sab scheduled posts continue honge, social accounts connected rahenge, aur koi data lost nahi hoga.</p>
          </div>
        `
      })
    };
  },

  // ── Plan Expired ──
  planExpired: ({ name, plan, renewUrl, company }) => ({
    subject: `❌ Aapka ${plan.toUpperCase()} Plan Expire Ho Gaya — ${company?.name || 'GowebkartSocial'}`,
    html: baseTemplate({
      company,
      title: 'Plan Expired',
      preheader: 'Aapka plan expire ho gaya hai — abhi renew karein!',
      body: `
        <div style="font-size:20px;font-weight:800;margin-bottom:8px;">❌ Plan Expired</div>
        <p>Namaste <strong>${name}</strong>,</p>
        <p>Aapka <strong>${plan.toUpperCase()} Plan</strong> expire ho gaya hai.</p>

        <div style="background:#fff0f0;border:2px solid #ffcccc;border-radius:14px;padding:20px;text-align:center;margin:20px 0;">
          <div style="font-size:40px;margin-bottom:8px;">😔</div>
          <div style="font-size:18px;font-weight:800;color:#e53e3e;">Plan Expire Ho Gaya</div>
          <div style="font-size:13px;color:#718096;margin-top:6px;">Free plan par switch ho gaya — limited features</div>
        </div>

        <p><strong>Kya limited ho gaya:</strong></p>
        <ul style="padding-left:20px;color:#4a5568;font-size:14px;line-height:2;">
          <li>Scheduled posts paused ho gayi hain</li>
          <li>30 posts/month limit (free plan)</li>
          <li>Ads Manager access removed</li>
        </ul>

        <div style="text-align:center;margin:24px 0;">
          <a href="${renewUrl}" style="display:inline-block;background:linear-gradient(135deg,#e53e3e,#c0392b);color:#fff;text-decoration:none;padding:16px 36px;border-radius:10px;font-weight:800;font-size:16px;">🔄 Plan Renew Karein</a>
        </div>
      `
    })
  }),

  // ── Admin ko expiry alert ──
  adminExpiryAlert: ({ clientName, clientEmail, plan, daysLeft, adminPanelUrl, company }) => ({
    subject: `👥 Client Alert: ${clientName} ka plan ${daysLeft} din mein expire ho raha hai`,
    html: baseTemplate({
      company,
      title: 'Client Plan Expiry Alert',
      preheader: `${clientName} ka ${plan} plan ${daysLeft} din mein expire ho raha hai`,
      body: `
        <div style="font-size:20px;font-weight:800;margin-bottom:8px;">👥 Client Expiry Alert</div>
        <p>Ek client ka plan jald expire hone wala hai:</p>

        <table style="width:100%;border-collapse:collapse;margin:16px 0;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr style="background:#f0f7ff;"><td style="padding:12px;color:#0066cc;font-weight:700;font-size:13px;" colspan="2">Client Details</td></tr>
          <tr style="border-bottom:1px solid #f0f4f8;"><td style="padding:10px 14px;color:#6b7c93;font-weight:600;font-size:13px;">👤 Name</td><td style="padding:10px 14px;font-weight:700;">${clientName}</td></tr>
          <tr style="border-bottom:1px solid #f0f4f8;"><td style="padding:10px 14px;color:#6b7c93;font-weight:600;font-size:13px;">📧 Email</td><td style="padding:10px 14px;"><a href="mailto:${clientEmail}" style="color:#0066cc;">${clientEmail}</a></td></tr>
          <tr style="border-bottom:1px solid #f0f4f8;"><td style="padding:10px 14px;color:#6b7c93;font-weight:600;font-size:13px;">💎 Plan</td><td style="padding:10px 14px;font-weight:700;">${plan.toUpperCase()}</td></tr>
          <tr><td style="padding:10px 14px;color:#6b7c93;font-weight:600;font-size:13px;">⏰ Expires In</td><td style="padding:10px 14px;font-weight:800;color:${daysLeft<=3?'#e53e3e':daysLeft<=7?'#dd8800':'#0066cc'};">${daysLeft} DAYS</td></tr>
        </table>

        <div style="text-align:center;margin:20px 0;display:flex;gap:12px;justify-content:center;">
          <a href="mailto:${clientEmail}?subject=Aapka plan expire ho raha hai" style="display:inline-block;background:linear-gradient(135deg,#0066cc,#0099ff);color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;">📧 Client ko Email Bhejein</a>
          <a href="${adminPanelUrl}" style="display:inline-block;background:#f0f7ff;color:#0066cc;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;border:1.5px solid #c0d4ff;">👑 Admin Panel</a>
        </div>
      `
    })
  }),

  // ── Payment Success ──
  paymentSuccess: ({ name, plan, amount, orderId, startDate, endDate, company }) => ({
    subject: `✅ Payment Successful — ${plan.toUpperCase()} Plan Activated! | ${company?.name || 'GowebkartSocial'}`,
    html: baseTemplate({
      company,
      title: 'Payment Successful!',
      preheader: `✅ ₹${amount} payment received — ${plan} plan activated!`,
      body: `
        <div style="font-size:20px;font-weight:800;margin-bottom:8px;">✅ Payment Successful!</div>
        <p>Namaste <strong>${name}</strong>,</p>
        <p>Aapka payment successfully receive ho gaya aur <strong>${plan.toUpperCase()} Plan</strong> activate ho gaya hai!</p>

        <div style="background:linear-gradient(135deg,#f0fff8,#e8fff5);border:2px solid #b3f0d8;border-radius:14px;padding:20px;text-align:center;margin:20px 0;">
          <div style="font-size:48px;margin-bottom:8px;">🎉</div>
          <div style="font-size:24px;font-weight:900;color:#00b86b;">${plan.toUpperCase()} PLAN ACTIVE!</div>
          <div style="font-size:14px;color:#38a169;margin-top:6px;">Valid till ${new Date(endDate).toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}</div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr style="border-bottom:1px solid #f0f4f8;"><td style="padding:10px;color:#6b7c93;font-weight:600;font-size:13px;">📋 Order ID</td><td style="padding:10px;font-weight:700;font-family:monospace;">${orderId}</td></tr>
          <tr style="border-bottom:1px solid #f0f4f8;"><td style="padding:10px;color:#6b7c93;font-weight:600;font-size:13px;">💰 Amount Paid</td><td style="padding:10px;font-weight:700;color:#00b86b;">₹${amount}</td></tr>
          <tr style="border-bottom:1px solid #f0f4f8;"><td style="padding:10px;color:#6b7c93;font-weight:600;font-size:13px;">📅 Start Date</td><td style="padding:10px;font-weight:700;">${new Date(startDate).toLocaleDateString('en-IN')}</td></tr>
          <tr><td style="padding:10px;color:#6b7c93;font-weight:600;font-size:13px;">📅 Valid Till</td><td style="padding:10px;font-weight:700;">${new Date(endDate).toLocaleDateString('en-IN')}</td></tr>
        </table>

        <div style="text-align:center;margin:20px 0;">
          <a href="${process.env.CLIENT_URL||'#'}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#0066cc,#0099ff);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:800;">🚀 Dashboard Kholein</a>
        </div>
      `
    })
  }),
};

module.exports = expiryTemplates;
