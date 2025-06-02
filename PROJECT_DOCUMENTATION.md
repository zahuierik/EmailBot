# FlutterEmail - AI Email Manager Project Documentation

## Overview
A modern AI-powered email management system with chat interface, contact management, website scraping, and Gmail integration. The system consists of a frontend chat interface and a backend API with intelligent email processing capabilities.

## 🏗️ Architecture

### Frontend
- **Technology**: Vanilla HTML/CSS/JavaScript
- **Deployment**: Vercel
- **Domain**: www.daddyfreud.com (in setup)
- **Features**: Chat interface, AI integration, Gmail OAuth

### Backend  
- **Technology**: Node.js/Express API
- **Deployment**: Render
- **URL**: https://emailbot-f71m.onrender.com
- **Features**: Email scraping, contact management, email sending

## 🤖 AI Integration
- **Provider**: OpenRouter
- **Model**: Meta LLaMA 3.1 8B Instruct (Free)
- **Capabilities**: Natural language processing, intelligent email management, conversation handling

## 📧 Email Services
- **Primary**: Gmail API (OAuth setup)
- **Fallback**: SendGrid (100 emails/day)
- **Authentication**: Google OAuth 2.0

## 🔧 Current Features

### Contact Management
- Add contacts via natural language
- Delete contacts (specific or bulk)
- Search and view contacts
- Verify email addresses

### Website Scraping
- Extract emails from any URL
- Automatic contact database population
- Error handling for inaccessible sites

### Email Sending
- Send to all contacts or filtered groups
- Gmail API integration (unlimited)
- SendGrid fallback system
- Daily sending limits for protection

### AI Chat Interface
- Natural language commands
- Intelligent responses and suggestions
- Real-time AI status indicators
- Fallback responses when AI offline

## 🚀 Deployment Status

### Frontend (Vercel)
- **Current URL**: https://flutter-email-qpoocru7z-rikis-projects-6e4b52d3.vercel.app ✅
- **Custom Domain**: www.daddyfreud.com ⏳ (SSL in progress)
- **OAuth Redirect**: Configured for custom domain

### Backend (Render)
- **Status**: ✅ Active
- **API Endpoints**: Contacts, Email sending, Gmail setup, Scraping

### DNS Configuration
- **Root Domain**: daddyfreud.com → Vercel (A record: 76.76.21.21)
- **WWW Subdomain**: www.daddyfreud.com → Vercel (CNAME: cname.vercel-dns.com)
- **SSL Status**: ⏳ In progress

## 🔐 Security & Authentication
- Google Cloud Console OAuth configured
- Redirect URI: https://www.daddyfreud.com/auth/google/callback
- Security headers implemented
- CORS configuration

## 📁 File Structure
```
FlutterEmail/
├── index.html              # Main chat interface
├── main.js                 # Frontend JavaScript logic
├── style.css               # UI styling
├── vercel.json             # Deployment configuration
├── final_review_gate.py    # Interactive review script
└── email_manager/          # Flutter project (legacy)
```

## 🎯 Key Components

### Main Configuration (main.js)
- OpenRouter API integration
- Contact management functions
- Email sending logic
- Gmail OAuth implementation

### Chat Interface (index.html)
- Modern UI with Material Icons
- Settings modal for Gmail setup
- Contact counter and status indicators
- Responsive design

### Deployment (vercel.json)
- Static file serving configuration
- URL rewrites for SPA behavior

## ⚠️ Current Issues
1. Custom domain SSL certificates still processing
2. Invalid Configuration status in Vercel (temporary)
3. OAuth redirect URI updated for custom domain

## 📋 Next Steps
1. Wait for SSL certificate completion
2. Test custom domain functionality
3. Verify Gmail OAuth workflow
4. Complete project documentation
5. GitHub repository setup

## 🛠️ Development Setup
1. Frontend: Deploy to Vercel
2. Backend: Running on Render
3. DNS: Configure domain records
4. OAuth: Set up Google Cloud Console
5. Testing: Use working Vercel URL during setup

---
*Last Updated: June 2, 2025*
*Status: Domain setup in progress, core functionality working* 