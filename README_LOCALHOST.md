# DaddyFreud - Localhost Development Setup

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

### 3. Open in Browser
Navigate to: `http://localhost:3001`

## 🤖 AI Model Configuration (DeepSeek R1)

The app now uses **DeepSeek R1 0528 Qwen3 8B** - a powerful **FREE** AI model from OpenRouter with advanced reasoning capabilities.

### Setup Instructions:

1. **Get Free OpenRouter API Key:**
   - Visit [OpenRouter.ai](https://openrouter.ai/)
   - Sign up for a free account
   - Go to "Keys" section and create a new API key
   - Copy your API key (starts with `sk-or-v1-...`)

2. **Configure the API Key:**
   - Open `main.js` in your editor
   - Find line 4: `OPENROUTER_API_KEY: 'sk-or-v1-your-api-key-here'`
   - Replace `'sk-or-v1-your-api-key-here'` with your actual API key
   - Save the file

3. **Restart the Server:**
   ```bash
   npm start
   ```

### AI Features:
- ✅ **DeepSeek R1 0528 Qwen3 8B**: Advanced reasoning and chain-of-thought
- ✅ **Human-like Personality**: Adaptive emotional responses and memory
- ✅ **Freudian Psychology**: Specialized in cold email psychology
- ✅ **Fallback System**: Works without API key using enhanced local responses

**Note:** If you don't configure the API key, the app will still work with the enhanced fallback system.

## ✨ What's Fixed in Localhost

### 1. ✅ AI Model Fixed
- Switched from broken OpenRouter to working Hugging Face model
- Added fallback system with intelligent Freudian responses
- No more API key authentication errors

### 2. ✅ Auto-Scroll Messages
- Messages automatically scroll into view when added
- Smooth scrolling animation
- Chat stays at bottom during conversation

### 3. ✅ Black Layer Removed
- Fixed CSS background issues
- Clean transparent chat interface
- Smaller 600px chat box width

### 4. ✅ Drag & Drop Email Builder
- Complete visual email template builder
- Drag components from palette to canvas
- Edit properties in real-time
- Professional email output with variables

### 5. ✅ Simplified Contact Database
- Cleaner 3-column table (Email, Source, Actions)
- Easy delete functionality
- Export to CSV
- Search and filter capabilities

## 🔧 Development Features

### Mock Services Active
- **Email Sending**: Mock responses (no real emails sent)
- **Website Scraping**: Returns sample email addresses
- **Contact Storage**: In-memory database (resets on restart)
- **Gmail Integration**: Disabled for localhost development

### File Upload Support
- CSV contact import
- Text file email extraction
- Drag and drop file handling

### Email Template Builder
- **Components Available**:
  - Header text
  - Text blocks with variables
  - Call-to-action buttons
  - Images
  - Dividers and spacers

- **Features**:
  - Drag and drop interface
  - Live editing with properties panel
  - Preview in new window
  - Variable support ({{name}}, {{company}})

## 🛠️ Development Commands

```bash
# Start development server with auto-restart
npm run dev

# Start production server
npm start
```

## 📁 Project Structure

```
FlutterEmail/
├── server.js          # Node.js backend
├── package.json       # Dependencies
├── index.html         # Main UI
├── main.js           # Frontend logic
├── style.css         # Styling
└── README_LOCALHOST.md # This file
```

## 🎯 Testing Features

1. **Add Contacts**: Type "add john@example.com, jane@company.org"
2. **Send Emails**: Type "send emails to all contacts"
3. **Scrape Websites**: Enter any URL like "https://example.com"
4. **Build Templates**: Click "Email Template" and drag components
5. **View Database**: Click "Emails" button to see contact list

## 🚧 Ready for Production

When ready to deploy:
1. Replace mock services with real implementations
2. Add persistent database
3. Configure real email providers
4. Set up Gmail OAuth for production

## 🧠 AI Responses

The system includes intelligent fallback responses for all major functions:
- Contact management guidance
- Email strategy advice
- Website scraping instructions
- Template building help

All responses maintain the "DaddyFreud" psychological personality while providing practical cold email automation guidance.

---

**Status**: ✅ All major issues fixed and ready for further development! 