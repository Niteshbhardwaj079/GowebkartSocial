// ══════════════════════════════════════════════════════
// AI CHATBOT SERVICE — FREE Rule-Based
// Smart responses for common questions
// Future: OpenAI/Gemini se replace kar sakte ho
// ══════════════════════════════════════════════════════

class ChatbotService {

  constructor() {
    // Knowledge base — sab common questions ke answers
    this.kb = [

      // ── Setup/Getting Started ──
      {
        patterns: ['shuru', 'start', 'kaise karna', 'pehla step', 'setup', 'getting started', 'how to start', 'begin'],
        response: {
          text: '🚀 **Setup Steps:**\n\n1. **API Settings** → Social media keys add karo\n2. **Storage** → Cloudinary free account banao\n3. **Connect** → Accounts link karo\n4. **Create Post** → Pehli post banao!',
          links: [{ text: 'API Settings', url: '/api-settings' }, { text: 'Storage Setup', url: '/storage-settings' }],
          category: 'setup'
        }
      },

      // ── Cloudinary ──
      {
        patterns: ['cloudinary', 'image upload', 'photo upload', 'storage', 'media upload', 'file upload', 'picture'],
        response: {
          text: '☁️ **Cloudinary Setup (Free!):**\n\n1. cloudinary.com par free account banao\n2. Dashboard se **Cloud Name, API Key, API Secret** copy karo\n3. Storage Settings mein paste karo\n4. "Use This" click karo — done!',
          links: [{ text: 'Storage Settings', url: '/storage-settings' }, { text: 'Cloudinary Free', url: 'https://cloudinary.com/users/register_free', external: true }],
          category: 'storage'
        }
      },

      // ── Facebook ──
      {
        patterns: ['facebook', 'fb', 'facebook api', 'facebook connect', 'facebook post'],
        response: {
          text: '📘 **Facebook Connect Kaise Karein:**\n\n1. developers.facebook.com par jaao\n2. App banao → Settings → App ID + Secret copy karo\n3. API Settings mein paste karo\n4. "Connect" click karo!\n\n⚠️ App Review ke bina sirf apna account connect hoga.',
          links: [{ text: 'API Settings', url: '/api-settings' }, { text: 'Facebook Developers', url: 'https://developers.facebook.com', external: true }],
          category: 'social'
        }
      },

      // ── Instagram ──
      {
        patterns: ['instagram', 'insta', 'ig', 'reel', 'story'],
        response: {
          text: '📷 **Instagram Setup:**\n\nInstagram ke liye Facebook API keys use hoti hain!\n\n1. Facebook App banao (API Settings)\n2. Facebook connect karo\n3. Instagram automatically link ho jayega\n\n**Important:** Instagram Business ya Creator account hona chahiye.',
          links: [{ text: 'API Settings', url: '/api-settings' }],
          category: 'social'
        }
      },

      // ── Post Schedule ──
      {
        patterns: ['schedule', 'post kab', 'future post', 'later post', 'time set', 'auto post'],
        response: {
          text: '📅 **Post Schedule Kaise Karein:**\n\n1. Create Post page par jaao\n2. Content likhо\n3. "Schedule Later" toggle karо\n4. Date aur time select karо\n5. "Schedule Post" click karо\n\n✅ Post automatically publish ho jayegi!',
          links: [{ text: 'Create Post', url: '/create' }],
          category: 'posting'
        }
      },

      // ── AI Caption ──
      {
        patterns: ['caption', 'ai writer', 'ai caption', 'likhne mein help', 'content generate', 'hashtag'],
        response: {
          text: '🤖 **AI Caption Writer:**\n\n1. Create Post mein jaao\n2. "AI Writer" button click karo\n3. Topic likhо (e.g. "Diwali sale")\n4. Tone choose karo (Professional/Casual/Funny)\n5. Hindi ya English select karo\n6. Generate click karo!\n\n💡 Hashtags bhi automatically generate honge!',
          links: [{ text: 'Create Post', url: '/create' }],
          category: 'ai'
        }
      },

      // ── Email Setup ──
      {
        patterns: ['email', 'otp nahi aaya', 'mail nahi', 'notification mail', 'gmail', 'email setup'],
        response: {
          text: '📧 **Email Setup:**\n\n1. Gmail account → Security → 2-Step Verification enable karo\n2. "App Passwords" search karo\n3. Mail → Other → "GowebkartSocial" naam dao\n4. 16-digit password generate hoga\n5. Server .env mein:\n`EMAIL_USER=apka@gmail.com`\n`EMAIL_PASS=xxxx xxxx xxxx xxxx`',
          links: [{ text: 'Google Security', url: 'https://myaccount.google.com/security', external: true }],
          category: 'email'
        }
      },

      // ── Plan/Pricing ──
      {
        patterns: ['plan', 'price', 'pricing', 'upgrade', 'cost', 'paid', 'free plan', 'basic', 'pro'],
        response: {
          text: '💎 **Plans:**\n\n🆓 **Free** — ₹0\n• 30 posts/month\n• 3 social accounts\n• Basic features\n\n⚡ **Basic** — ₹999/month\n• 100 posts/month\n• 10 accounts\n• Ads Manager\n\n🚀 **Pro** — ₹2499/month\n• Unlimited posts\n• All features',
          links: [{ text: 'View Plans', url: '/plans' }],
          category: 'billing'
        }
      },

      // ── Password ──
      {
        patterns: ['password', 'forgot password', 'password reset', 'login nahi ho raha', 'password bhool gaya'],
        response: {
          text: '🔑 **Password Reset:**\n\n1. Login page par "Password bhool gaye?" click karo\n2. Email dalo\n3. Reset link aayega (30 min valid)\n4. Link se naya password set karo\n\n⚠️ Email inbox mein nahi? Spam folder check karo.',
          links: [{ text: 'Login Page', url: '/login' }],
          category: 'account'
        }
      },

      // ── Analytics ──
      {
        patterns: ['analytics', 'stats', 'performance', 'reach', 'likes', 'engagement', 'report'],
        response: {
          text: '📊 **Analytics:**\n\nAnalytics page par yeh sab dikhega:\n• Total posts published\n• Platform-wise breakdown\n• Last 7 days activity\n• Engagement (likes, comments, shares)\n\n💡 Zyada data ke liye social accounts connect karein aur posts publish karo.',
          links: [{ text: 'Analytics', url: '/analytics' }],
          category: 'analytics'
        }
      },

      // ── Inbox ──
      {
        patterns: ['inbox', 'message', 'comment', 'reply', 'dm', 'mention', 'tag'],
        response: {
          text: '📬 **Unified Inbox:**\n\nInbox mein yeh sab ek jagah milega:\n• Facebook messages + comments\n• Instagram DMs + comments\n• Twitter mentions + DMs\n• LinkedIn messages\n\n**Reply karna:** Message select karo → reply box mein type karo → Send\n**Comment hide karna:** Hide button click karo',
          links: [{ text: 'Inbox', url: '/inbox' }],
          category: 'inbox'
        }
      },

      // ── Super Admin ──
      {
        patterns: ['super admin', 'admin panel', 'user manage', 'plan change', 'users'],
        response: {
          text: '👑 **Super Admin:**\n\nSuper Admin panel mein yeh sab kar sakte ho:\n• Users dekho aur plan change karo\n• New Admin create karo\n• Plans edit/create karo\n• Support tickets dekho\n\n**Login:** admin@socialsaas.com / Admin@12345',
          links: [{ text: 'Super Admin', url: '/superadmin' }],
          category: 'admin'
        }
      },

      // ── Notifications ──
      {
        patterns: ['notification', 'alert', 'abuse', 'gali', 'tag alert', 'mention alert'],
        response: {
          text: '🔔 **Notifications Setup:**\n\n1. Notification Settings page par jaao\n2. Email alerts on karo\n3. Kaunse alerts chahiye choose karo:\n   • Tag alerts\n   • Mention alerts\n   • Abuse/Gali detection\n   • New messages\n4. Save karo!\n\n✅ Ab jab bhi koi tag karega — email aayega!',
          links: [{ text: 'Notification Settings', url: '/notifications' }],
          category: 'notifications'
        }
      },

      // ── Twitter ──
      {
        patterns: ['twitter', 'tweet', 'x platform', 'twitter api'],
        response: {
          text: '🐦 **Twitter Connect:**\n\n1. developer.twitter.com par jaao\n2. New Project → New App banao\n3. OAuth 2.0 enable karo\n4. API Key + Secret copy karo\n5. API Settings mein paste karo\n\n⚠️ Twitter Developer account approval time le sakta hai.',
          links: [{ text: 'API Settings', url: '/api-settings' }, { text: 'Twitter Dev', url: 'https://developer.twitter.com', external: true }],
          category: 'social'
        }
      },

      // ── Company Profile ──
      {
        patterns: ['company', 'logo', 'branding', 'company profile', 'company name'],
        response: {
          text: '🏢 **Company Profile:**\n\nCompany Profile mein yeh set kar sakte ho:\n• Company logo upload karo\n• Brand colors choose karo\n• Tagline/slogan add karo\n• Social media links\n• Address aur contact info\n\n💡 Logo emails mein bhi show hoga!',
          links: [{ text: 'Company Profile', url: '/company' }],
          category: 'settings'
        }
      },

      // ── Calendar ──
      {
        patterns: ['calendar', 'festival', 'schedule calendar', 'content calendar', 'holidays'],
        response: {
          text: '📅 **Content Calendar:**\n\nCalendar mein:\n• 150+ Indian festivals automatically show hote hain\n• Saturday = Blue, Sunday = Red\n• Click karo kisi bhi din → festivals detail dekhо\n• "Is festival ke liye post banao" button\n\n💡 Festivals ke hisaab se posts plan karo!',
          links: [{ text: 'Calendar', url: '/calendar' }],
          category: 'calendar'
        }
      },

      // ── Default ──
      {
        patterns: ['help', 'problem', 'issue', 'error', 'kya karu', 'samajh nahi', 'support'],
        response: {
          text: '🆘 **Help Options:**\n\n1. **Search karo** — upar search box mein apna issue likhо\n2. **Support Ticket** — "Report Issue" button se submit karo\n3. **Email** — support@socialsaas.com\n\n📌 Common issues:\n• Setup → API Settings guide\n• Upload → Storage Settings\n• Login → Password Reset',
          links: [{ text: 'Submit Ticket', action: 'openTicket' }],
          category: 'help'
        }
      },
    ];
  }

  // ── Find best matching response ──
  getResponse(userMessage) {
    const msg = userMessage.toLowerCase().trim();

    // Find best match
    let bestMatch = null;
    let maxScore  = 0;

    for (const item of this.kb) {
      let score = 0;
      for (const pattern of item.patterns) {
        if (msg.includes(pattern)) {
          score += pattern.length; // Longer match = higher score
        }
      }
      if (score > maxScore) {
        maxScore  = score;
        bestMatch = item;
      }
    }

    if (bestMatch && maxScore > 0) {
      return { found: true, ...bestMatch.response };
    }

    // Default response
    return {
      found: false,
      text: '🤔 Mujhe samajh nahi aaya. Kya aap thoda aur detail mein bata sakte hain?\n\nYa aap **Support Ticket** submit karein — hum 24 ghante mein reply karenge!',
      links: [{ text: 'Submit Ticket', action: 'openTicket' }],
      category: 'unknown'
    };
  }

  // ── Quick Replies — suggested questions ──
  getQuickReplies() {
    return [
      { text: '🚀 Setup kaise karein?',      message: 'setup kaise karna hai' },
      { text: '☁️ Image upload nahi ho rahi', message: 'image upload cloudinary' },
      { text: '📘 Facebook connect karein',   message: 'facebook connect kaise' },
      { text: '📅 Post schedule karein',      message: 'post schedule kaise karna' },
      { text: '🔑 Password bhool gaya',       message: 'password bhool gaya' },
      { text: '💎 Plans aur pricing',         message: 'plan price kya hai' },
      { text: '📊 Analytics kahan hai',       message: 'analytics kahan dekhein' },
      { text: '🆘 Koi aur problem hai',       message: 'help support' },
    ];
  }
}

module.exports = new ChatbotService();
