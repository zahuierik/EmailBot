# 🚀 Email Manager Pro - Deployment Guide

## Quick Deploy to Render.com

### Step 1: Deploy Backend
1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Render.com**:
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Use these settings:
     - **Name**: `email-manager-backend`
     - **Root Directory**: `email-manager-web/scraper-engine`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free

3. **Get your backend URL**:
   - After deployment, you'll get a URL like: `https://email-manager-backend.onrender.com`
   - Copy this URL

### Step 2: Update Frontend Configuration
1. **Update the frontend** to use your deployed backend:
   - Open `email-manager-web/src/main.js`
   - Replace `https://email-manager-backend.onrender.com` with your actual Render URL

### Step 3: Deploy Frontend (Optional)
1. **Deploy frontend to Vercel**:
   ```bash
   cd email-manager-web
   npx vercel --prod
   ```

### Step 4: Update Google Apps Script
1. **Update the script** with your deployed backend URL:
   - Open `google-apps-script-final.js`
   - Replace `BACKEND_URL` with your actual Render URL
   - Copy the entire script to Google Apps Script

## 🎯 How It All Works Together

### **Frontend (Web App)**
- ✅ **Individual Send Buttons** - Click to send one email immediately
- ✅ **Send All Button** - Send up to 30 emails in one batch
- ✅ **Real-time Status** - See sent emails and tracking
- ✅ **Contact Management** - Add, remove, organize contacts

### **Backend (Render.com)**
- ✅ **API Endpoints** - Handle email sending requests
- ✅ **Contact Storage** - Manage contact database
- ✅ **Email Tracking** - Track sent emails and status
- ✅ **Google Apps Script Integration** - Sync with automation

### **Google Apps Script (Gmail)**
- ✅ **Automated Daily Sending** - 9 AM every weekday
- ✅ **Real Gmail Integration** - Actual emails from your account
- ✅ **Rate Limiting** - Respects Gmail limits
- ✅ **Status Reporting** - Updates backend with results

## 🔄 Complete Workflow

1. **Add Contacts**: Via web scraping or manual entry in frontend
2. **Send Emails**: 
   - **Manual**: Click individual send buttons or "Send All"
   - **Automated**: Google Apps Script runs daily at 9 AM
3. **Track Results**: View sent emails, open rates, and status in frontend
4. **Sync Everything**: All components stay in sync via API

## 🛠 No More Manual Work!

- ❌ **No more clicking "RUN" in Google Apps Script**
- ❌ **No more localhost limitations**
- ❌ **No more simulation - everything is REAL**
- ✅ **Click "Send All" in web app = Real emails sent**
- ✅ **Daily automation works independently**
- ✅ **Everything syncs automatically**

## 🔧 Environment Variables (Optional)
For production, you can set these in Render:
- `NODE_ENV=production`
- `API_KEY=your-secure-api-key` (for real authentication)

## 📧 Email Configuration
The system is pre-configured for:
- **From**: hello@nino.news
- **Name**: Riki from Nino!
- **Subject**: Partnership Opportunity - [Company]
- **Content**: Professional partnership outreach

Ready to deploy? Follow the steps above and you'll have a fully automated email system! 