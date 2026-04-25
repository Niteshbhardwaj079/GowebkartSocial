# ⚡ SocialSaaS — Social Media Management Platform

Complete Hootsuite/Buffer clone for Indian market.

## ⚠️ Security Notes

- `.env` files are gitignored — never commit them. Use `.env.example` as the template.
- Generate a strong `JWT_SECRET` per environment. The server refuses to start in production with the default secret.
- Rotate any credentials that have been shared in chat or seen in screenshots.

## 🚀 Quick Start

### 1. MongoDB Atlas Setup
- mongodb.com/atlas → Free account → Cluster banao
- Connection string `.env` mein: `MONGO_URI=mongodb+srv://...`

### 2. Gmail Email Setup  
- Gmail → Security → 2-Step → App Passwords → Copy 16-digit password
- `.env` mein: `EMAIL_USER=apka@gmail.com` aur `EMAIL_PASS=xxxx xxxx xxxx xxxx`

### 3. Cloudinary (Images/Videos)
- cloudinary.com → Free account
- Dashboard se Cloud Name, API Key, Secret copy karo
- `.env` mein add karo

### 4. Razorpay (Payments)
- razorpay.com → Free account → Settings → API Keys
- `.env` mein: `RAZORPAY_KEY_ID` aur `RAZORPAY_KEY_SECRET`

### 5. Start karo

```bash
# Server
cd server
cp .env.example .env   # phir .env mein values bharo
npm install
node src/seed.js    # ← Ek baar chalao (Super Admin banata hai)
npm run dev

# Client (naye terminal mein)
cd client
cp .env.example .env
npm install
npm start
```

### 6. Production deploy (Render)

**Backend (`server/`):**
- Render → New Web Service → connect repo → root: `server`
- Build: `npm install` | Start: `npm start`
- Environment variables (Render dashboard → Environment):
  - `NODE_ENV=production`
  - `JWT_SECRET=<generate fresh 64-char random>` — **must be 32+ chars**, must NOT be the default
    - Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
  - `MONGO_URI`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, Cloudinary keys, Email keys
  - `CLIENT_URL=https://<your-frontend>.onrender.com` (comma-separate multiple origins)

**Frontend (`client/`):**
- Render → Static Site → root: `client`
- Build: `npm install && npm run build` | Publish: `build`
- `client/.env.production` already points to `https://gowebkartsocial.onrender.com` — edit it if your backend URL changes
- Add a redirect rule: `/* → /index.html` (200) for React Router

### 6. Super Admin Login
- URL: http://localhost:3000
- Email: admin@socialsaas.com
- Password: Admin@12345

## 📦 Features

### Frontend
- ✅ Login + OTP Email Verification
- ✅ Dashboard with analytics
- ✅ Create Post (Emoji Picker, Feelings, Location, AI Caption)
- ✅ Image Editor (Crop, Filters, Adjustments)
- ✅ Content Calendar (150+ Indian Festivals, Saturday/Sunday highlight)
- ✅ Unified Inbox (FB, IG, Twitter, LinkedIn)
- ✅ Analytics
- ✅ Social Accounts Management
- ✅ API Settings with Step-by-Step Guide
- ✅ Storage Settings (Cloudinary/S3/ImageKit)
- ✅ Company Profile (Logo, Branding)
- ✅ Notification Settings (Tag/Abuse Alerts)
- ✅ Plans & Billing (Razorpay Integration)
- ✅ Support Center + AI Chatbot
- ✅ Super Admin Panel
- ✅ Expiry Settings + Payment Management
- ✅ Settings (Profile, Post Tools On/Off)
- ✅ Mobile Responsive (PWA support)
- ✅ Dark Blue Sidebar Theme

### Backend  
- ✅ JWT Auth + OTP Verification
- ✅ Posts CRUD + Scheduler (Cron)
- ✅ All Social Media APIs
- ✅ Email Templates (Beautiful HTML)
- ✅ Expiry Alerts (Auto daily check)
- ✅ Razorpay Payment + Verification
- ✅ Support Tickets + AI Chatbot
- ✅ Storage Service (3 providers)

## 📁 Structure

```
social-saas/
├── client/          React Frontend
│   └── src/
│       ├── pages/   All pages
│       ├── components/
│       ├── store/   Redux
│       └── styles/  SCSS
└── server/          Node.js Backend
    └── src/
        ├── models/     MongoDB models
        ├── routes/     API routes
        ├── controllers/
        └── services/   Business logic
```
