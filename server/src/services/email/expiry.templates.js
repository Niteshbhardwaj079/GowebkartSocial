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

  // ── Invoice (sent on payment success) ──
  invoice: ({ name, email, plan, billingCycle, amount, invoiceNumber, paymentId, orderId, paidAt, startDate, endDate, company }) => {
    const subtotal = +(amount / 1.18).toFixed(2);
    const gst      = +(amount - subtotal).toFixed(2);
    const dateStr  = new Date(paidAt || Date.now()).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });
    return {
      subject: `🧾 Invoice ${invoiceNumber} — ${plan.toUpperCase()} Plan | ${company?.name || 'GowebkartSocial'}`,
      html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${invoiceNumber}</title></head>
<body style="margin:0;padding:24px;background:#f8faff;font-family:Inter,Arial,sans-serif;color:#1a2332;">
  <div style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0066cc,#0099ff);color:#fff;padding:28px 32px;display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-size:12px;letter-spacing:2px;opacity:0.85;font-weight:600;">TAX INVOICE</div>
        <div style="font-size:22px;font-weight:800;margin-top:4px;">${invoiceNumber}</div>
        <div style="font-size:11px;opacity:0.9;margin-top:4px;">Issued: ${dateStr}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:18px;font-weight:800;">GowebkartSocial</div>
        <div style="font-size:11px;opacity:0.85;">by Gowebkart</div>
      </div>
    </div>

    <!-- Bill to + From -->
    <div style="display:flex;padding:24px 32px;border-bottom:1px solid #e2e8f0;">
      <div style="flex:1;">
        <div style="font-size:10px;font-weight:700;color:#64748b;letter-spacing:1px;">BILLED TO</div>
        <div style="font-size:14px;font-weight:700;margin-top:6px;">${name}</div>
        <div style="font-size:12px;color:#64748b;margin-top:2px;">${email}</div>
        ${company?.name ? `<div style="font-size:12px;color:#64748b;margin-top:2px;">${company.name}</div>` : ''}
      </div>
      <div style="flex:1;text-align:right;">
        <div style="font-size:10px;font-weight:700;color:#64748b;letter-spacing:1px;">PAYMENT METHOD</div>
        <div style="font-size:13px;font-weight:600;margin-top:6px;">Razorpay (Online)</div>
        <div style="font-size:10px;color:#64748b;margin-top:2px;font-family:monospace;">Order: ${orderId?.slice(-14) || '—'}</div>
        <div style="font-size:10px;color:#64748b;font-family:monospace;">Payment: ${paymentId?.slice(-14) || '—'}</div>
      </div>
    </div>

    <!-- Items -->
    <div style="padding:0 32px;">
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <thead>
          <tr style="background:#f8faff;border-bottom:2px solid #0066cc;">
            <th style="text-align:left;padding:12px 8px;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.5px;">DESCRIPTION</th>
            <th style="text-align:center;padding:12px 8px;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.5px;">CYCLE</th>
            <th style="text-align:right;padding:12px 8px;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.5px;">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #f0f4f8;">
            <td style="padding:14px 8px;">
              <div style="font-weight:700;">${plan.toUpperCase()} Plan Subscription</div>
              <div style="font-size:11px;color:#64748b;margin-top:2px;">Valid: ${new Date(startDate).toLocaleDateString('en-IN')} → ${new Date(endDate).toLocaleDateString('en-IN')}</div>
            </td>
            <td style="text-align:center;padding:14px 8px;font-size:13px;text-transform:capitalize;">${billingCycle}</td>
            <td style="text-align:right;padding:14px 8px;font-weight:700;">₹${subtotal.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Totals -->
      <table style="width:60%;margin-left:auto;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:6px 8px;font-size:13px;color:#64748b;">Subtotal</td><td style="padding:6px 8px;text-align:right;font-weight:600;">₹${subtotal.toFixed(2)}</td></tr>
        <tr><td style="padding:6px 8px;font-size:13px;color:#64748b;">GST @ 18%</td><td style="padding:6px 8px;text-align:right;font-weight:600;">₹${gst.toFixed(2)}</td></tr>
        <tr style="border-top:2px solid #1a2332;"><td style="padding:10px 8px;font-size:14px;font-weight:800;">Total Paid</td><td style="padding:10px 8px;text-align:right;font-size:18px;font-weight:900;color:#00b86b;">₹${amount.toFixed(2)}</td></tr>
      </table>
    </div>

    <!-- Status banner -->
    <div style="margin:0 32px 24px;background:linear-gradient(135deg,#f0fff8,#e8fff5);border:1.5px solid #b3f0d8;border-radius:10px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:12px;color:#38a169;font-weight:700;">✅ PAID & ACTIVATED</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px;">Plan active till ${new Date(endDate).toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}</div>
      </div>
      <div style="font-size:32px;">🎉</div>
    </div>

    <!-- Footer -->
    <div style="padding:18px 32px;background:#f8faff;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;">
      <div style="margin-bottom:6px;">Yeh ek system-generated invoice hai — manually signed nahi hai. Koi sawal ho to <strong>support@gowebkart.in</strong> par contact karein.</div>
      <div>Thank you for choosing <strong>GowebkartSocial</strong>! 🙏</div>
    </div>
  </div>
</body></html>
      `,
    };
  },

  // ── Payment Failed (sent when signature/verify fails) ──
  paymentFailed: ({ name, plan, amount, orderId, reason, company }) => ({
    subject: `❌ Payment Failed — ${plan.toUpperCase()} Plan | ${company?.name || 'GowebkartSocial'}`,
    html: baseTemplate({
      company,
      title: 'Payment Could Not Be Verified',
      preheader: `₹${amount} payment for ${plan} plan failed verification.`,
      body: `
        <div style="font-size:20px;font-weight:800;margin-bottom:8px;">❌ Payment Failed</div>
        <p>Namaste <strong>${name}</strong>,</p>
        <p>Aapka <strong>${plan.toUpperCase()} Plan</strong> ka payment <strong>verify nahi ho saka</strong>.</p>

        <div style="background:#fff0f0;border:2px solid #ffcccc;border-radius:14px;padding:18px;margin:18px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#6b7c93;font-size:13px;">Order ID</td><td style="padding:6px 0;font-family:monospace;font-weight:700;text-align:right;">${orderId || '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7c93;font-size:13px;">Amount</td><td style="padding:6px 0;font-weight:700;text-align:right;">₹${amount}</td></tr>
            ${reason ? `<tr><td style="padding:6px 0;color:#6b7c93;font-size:13px;">Reason</td><td style="padding:6px 0;font-size:12px;text-align:right;">${reason}</td></tr>` : ''}
          </table>
        </div>

        <div style="background:#f0f7ff;border-left:4px solid #0066cc;border-radius:8px;padding:14px;margin:16px 0;">
          <p style="margin:0;font-size:13px;"><strong>💡 Agar paise kat gaye hain</strong> — chinta na karein. 5-7 working days me Razorpay refund kar dega. Agar nahi aaye to support se contact karein order ID ke saath.</p>
        </div>

        <div style="text-align:center;margin:24px 0;">
          <a href="${process.env.CLIENT_URL || '#'}/plans" style="display:inline-block;background:linear-gradient(135deg,#0066cc,#0099ff);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:800;">🔄 Phir Try Karein</a>
        </div>
      `
    })
  })
};

module.exports = expiryTemplates;
