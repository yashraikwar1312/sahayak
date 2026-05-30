# 🚀 SAHAYAK Emergency App - Vercel Deployment Guide

## Quick Start for Vercel Deployment

### Step 1: Setup API Keys (Do NOT commit these!)

**Option A: Using Vercel Dashboard (RECOMMENDED)**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `sahayak` project
3. Navigate to `Settings` → `Environment Variables`
4. Add the following environment variables:

```
GEMINI_API_KEY = your_actual_gemini_api_key
APP_URL = https://sahayak-<your-name>.vercel.app
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your-email@gmail.com
SMTP_PASS = your-gmail-app-password
SMTP_SENDER_EMAIL = sahayak@emergency.app
```

**Option B: Using Vercel CLI (Local)**
```bash
npm install -g vercel
vercel env pull       # Downloads production env vars
vercel env add GEMINI_API_KEY "your_key"
```

### Step 2: Local Development Setup

1. **Copy .env.example to .env.local:**
   ```bash
   cp .env.example .env.local
   ```

2. **Add your actual values to .env.local** (this file is NOT tracked by Git)
   ```
   GEMINI_API_KEY="your_actual_key_here"
   APP_URL="http://localhost:5173"
   # ... other values
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

### Step 3: Deploy to Vercel

#### Method 1: Automatic (GitHub Integration)
1. Push code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/import)
3. Import your GitHub repository
4. Vercel automatically detects `vercel.json` and deploys

#### Method 2: Using Vercel CLI
```bash
vercel               # Interactive deployment
vercel --prod        # Deploy to production
```

---

## ⚡ API Key Management Best Practices

### ✅ CORRECT - DO THIS:
- **Store keys in Vercel Dashboard** → Environment Variables
- **Use `.env.local` for local development** (never commit)
- **Load from `process.env`** in your code:
  ```js
  const apiKey = process.env.GEMINI_API_KEY;
  ```

### ❌ NEVER DO THIS:
- ❌ Commit `.env` or API keys to Git
- ❌ Hardcode API keys in source files
- ❌ Share API keys in Slack/Email/Chat
- ❌ Use same API key across dev/staging/prod

---

## 🔐 Security Checklist

- [x] `vercel.json` configured with environment variable references (`@VAR_NAME`)
- [x] `.env.local` added to `.gitignore`
- [x] `.env.example` shows all required variables (with dummy values)
- [x] PWA manifest configured
- [x] HTTPS enforced on Vercel (automatic)
- [x] API rate limiting configured (add if needed)

---

## 📦 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini AI API Key | `AIza...` |
| `APP_URL` | ✅ Yes | Production app URL | `https://sahayak.vercel.app` |
| `SMTP_HOST` | ✅ Yes | Email SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | ✅ Yes | SMTP port | `587` |
| `SMTP_USER` | ✅ Yes | Gmail/Email address | `your@gmail.com` |
| `SMTP_PASS` | ✅ Yes | Gmail App Password | `xxxx xxxx xxxx xxxx` |
| `SMTP_SENDER_EMAIL` | ✅ Yes | Sender email for OTP | `sahayak@emergency.app` |

---

## 🧪 Testing Deployment

After deploying to Vercel:

```bash
# Test the deployed app
curl https://your-app.vercel.app/

# Check environment variables are loaded
curl https://your-app.vercel.app/api/config

# Test Gemini AI integration
curl -X POST https://your-app.vercel.app/api/diagnose \
  -H "Content-Type: application/json" \
  -d '{"symptoms": "medical emergency"}'
```

---

## 🐛 Troubleshooting

### Issue: "GEMINI_API_KEY is undefined"
**Solution:** Make sure the environment variable is set in Vercel Dashboard

### Issue: "SMTP Error: Invalid credentials"
**Solution:** Use Gmail App Password (not regular password). [Generate here](https://myaccount.google.com/apppasswords)

### Issue: "Build failed"
**Solution:** Check build logs in Vercel Dashboard → Deployments → Failed Build → Logs

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Google Gemini API](https://ai.google.dev/)
- [Express.js on Vercel](https://vercel.com/guides/using-express-with-vercel)
- [Environment Variables Security](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
