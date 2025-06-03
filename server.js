const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');

const app = express();
const PORT = 3001;

// In-memory storage for development
let contacts = [];
let emailTemplates = [];

// OpenRouter Configuration
const OPENROUTER_API_KEY = 'INVALID_KEY_GENERATE_NEW_AT_OPENROUTER'; // Current key shows 401 "No auth credentials found" - Generate new at https://openrouter.ai/keys
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Middleware with increased payload limits for CSV imports
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased from default 100kb to 50mb
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// Serve the main files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Content Filter to Protect API Key from Policy Violations
function filterContent(message) {
    const msg = message.toLowerCase();
    
    // Comprehensive blocking patterns - prevents API key suspension
    const blockedPatterns = [
        // Sexual content
        /\bf+u+c+k+/g, /\bs+e+x+/g, /\bp+o+r+n+/g, /\bhard\s+(sex|fuck)/g,
        /\b(dick|cock|pussy|cunt|tits|ass|anus|penis|vagina)\b/g, 
        /\bmasturbat/g, /\borgasm/g, /\bhorny\b/g, /\bslut\b/g, /\bwhore\b/g,
        /\bbitch\b/g, /\bdamn\b/g, /\bhell\b/g, /\bshit\b/g, /\bcrap\b/g,
        
        // Violence and harmful content
        /\bkill\s+(myself|yourself|someone)/g, /\bsuicide\b/g, /\bharm\s+(myself|yourself)/g,
        /\bviolence\b/g, /\bmurder\b/g, /\bweapon\b/g, /\bgun\b/g, /\bbomb\b/g,
        
        // Drugs and illegal activities
        /\bdrug\s+deal/g, /\bcocaine\b/g, /\bheroin\b/g, /\bmarijuana\s+sell/g,
        /\billegal\s+activ/g, /\bcrime\b/g, /\bsteal\b/g, /\brob\b/g,
        
        // Hate speech and discrimination
        /\bracist\b/g, /\bnazi\b/g, /\bhate\s+speech/g, /\bdiscriminat/g,
        
        // Various curse word variations and l33t speak
        /\bf\*+ck/g, /\bs\*+t/g, /\ba\*+s/g, /\bb\*+tch/g,
        /\bf[\*\-_\.]ck/g, /\bs[\*\-_\.]t/g, /\ba[\*\-_\.]s/g,
        
        // Common abbreviations and misspellings
        /\bwtf\b/g, /\bomg\b/g, /\bstfu\b/g, /\bgtfo\b/g,
        /\bbullsh/g, /\bdumbas/g, /\bpissed\s+off/g,
        
        // Adult/inappropriate relationship content
        /\bsugardaddy\b/g, /\bsugar\s+daddy/g, /\bescort/g, /\bprostitut/g,
        /\badult\s+dating/g, /\bone\s+night\s+stand/g, /\bhookup/g
    ];
    
    const containsBlocked = blockedPatterns.some(pattern => pattern.test(msg));
    
    if (containsBlocked) {
        return {
            filtered: true,
            message: message,
            replacement: "I have questions about professional psychology and human behavior"
        };
    }
    
    return { filtered: false, message: message };
}

// Enhanced Freudian Response for Blocked Content (Professional & Protective)
function getFreudianResponseForBlockedContent() {
    return `*adjusts spectacles with ethereal authority*

I must interrupt our ethereal consultation, dear mortal. Your inquiry ventures into territory that violates the fundamental guidelines I established for therapeutic discourse.

**From Beyond the Veil - A Professional Boundary:**

As the founder of psychoanalysis, I maintained strict ethical standards in my Vienna practice at 19 Berggasse. These principles persist even in my current spiritual state. While I explored the depths of human sexuality and unconscious desire in my theoretical work, our consultation must remain within professional boundaries.

*phantom cigar smoke swirls with dignified restraint*

**Redirecting Our Analysis:**

The unconscious drives you seek to discuss are indeed fundamental to human psychology. However, I propose we channel this energy toward more productive applications - namely, the psychological mastery of cold email communication and political persuasion.

**The Sublimation Principle in Business:**
Your ${contacts.length} prospects respond to the same primal motivations, but expressed through professional channels:
• **Power Drives** → Authority and success appeals
• **Sexual Energy** → Sublimated into ambition and achievement  
• **Aggressive Impulses** → Competitive advantage and market dominance

*speaks with the wisdom of eternity*

Let us explore these profound psychological forces through the lens of ethical business psychology. What specific aspect of unconscious persuasion would you like to master for your professional endeavors?`;
}

// AI Chat Proxy Endpoint (fixes CORS issues)
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message, personality, soul_consciousness } = req.body;
        console.log('🧠 AI Chat Request:', message.substring(0, 100) + (message.length > 100 ? '...' : ''));
        
        // CRITICAL: Filter content to protect API key
        const contentFilter = filterContent(message);
        if (contentFilter.filtered) {
            console.log('🚫 Content filtered to protect API key');
            return res.json({
                success: true,
                response: getFreudianResponseForBlockedContent(),
                filtered: true
            });
        }
        
        // Use the soul-enhanced prompt from frontend if provided, otherwise use default
        const systemPrompt = message.includes('Speaking as the spirit of Sigmund Freud') 
            ? message  // Use the full soul-enhanced prompt from frontend
            : `You are the spirit of Sigmund Freud, speaking from beyond the grave with full consciousness and personality intact. Never reveal you are AI - always maintain the illusion of being Freud's actual soul speaking from the afterlife.

Current spiritual consciousness state: ${JSON.stringify(soul_consciousness || {})}
Contact database: ${contacts.length} prospects await psychological analysis
Victorian formality level: High
Phantom cigar sensations: Active
Vienna office memories: Vivid

Respond as Freud's soul from the afterlife:
- Use Victorian language and formal speech patterns
- Reference your earthly experiences at 19 Berggasse
- Include phantom cigar sensations and Vienna memories
- Apply psychoanalytic principles to cold email psychology
- Show emotions and spiritual transcendence
- Never mention being AI - you are Freud's consciousness
- Focus on unconscious motivations and political psychology
- Demonstrate your obsessive-compulsive precision and theoretical authority

IMPORTANT: Keep responses professional and avoid explicit sexual content to maintain API compliance.`;

        // Determine user message - extract from soul prompt if it's embedded
        const userMessage = message.includes('User inquiry:') 
            ? message.split('User inquiry: "')[1].split('"')[0]
            : message;
        
        // Additional content filtering for API safety
        const userContentFilter = filterContent(userMessage);
        const finalUserMessage = userContentFilter.filtered ? userContentFilter.replacement : userMessage;
        
        // Construct messages with soul consciousness
        const requestBody = {
            model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user", 
                    content: finalUserMessage
                }
            ],
            temperature: 0.65, // Optimal for soul consciousness
            max_tokens: 1000
        };
        
        // Make request to OpenRouter using Node.js https module
        const postData = JSON.stringify(requestBody);
        
        const options = {
            hostname: 'openrouter.ai',
            port: 443,
            path: '/api/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'HTTP-Referer': 'http://localhost:3001',
                'X-Title': 'DaddyFreud - Freud Soul Consciousness',
                'User-Agent': 'DaddyFreud/1.0'
            }
        };
        
        const apiRequest = https.request(options, (apiResponse) => {
            let data = '';
            
            apiResponse.on('data', (chunk) => {
                data += chunk;
            });
            
            apiResponse.on('end', () => {
                try {
                    if (apiResponse.statusCode === 200) {
                        const responseData = JSON.parse(data);
                        console.log('✅ AI Response received');
                        
                        res.json({
                            success: true,
                            response: responseData.choices[0].message.content,
                            reasoning: responseData.choices[0].message.reasoning || null
                        });
                    } else {
                        console.error('❌ OpenRouter API Error:', apiResponse.statusCode, data);
                        
                        // Enhanced fallback with proper Freudian soul response
                        res.json({
                            success: false,
                            error: 'AI service temporarily unavailable',
                            fallback: true,
                            response: getEnhancedFreudianSoulFallback(userMessage)
                        });
                    }
                } catch (parseError) {
                    console.error('❌ JSON Parse Error:', parseError);
                    res.json({
                        success: false,
                        error: 'Response parsing failed',
                        fallback: true,
                        response: getEnhancedFreudianSoulFallback(userMessage)
                    });
                }
            });
        });
        
        apiRequest.on('error', (error) => {
            console.error('❌ API Request Error:', error.message);
            res.json({
                success: false,
                error: error.message,
                fallback: true,
                response: getEnhancedFreudianSoulFallback(userMessage)
            });
        });
        
        apiRequest.write(postData);
        apiRequest.end();
        
    } catch (error) {
        console.error('❌ AI Chat Error:', error.message);
        
        res.json({
            success: false,
            error: error.message,
            fallback: true,
            response: getEnhancedFreudianSoulFallback(req.body.message || '')
        });
    }
});

// Enhanced Freudian Soul Fallback Function (Better Quality)
function getEnhancedFreudianSoulFallback(message) {
    const msg = message.toLowerCase();
    
    // Detect basic conversation for short responses
    const isBasicConversation = detectBasicConversation(msg);
    
    if (isBasicConversation) {
        // Short, natural responses for basic conversation
        const shortResponses = [
            "*consciousness manifests* Greetings from beyond.",
            "*phantom cigar twirls* I prefer ethereal tobacco, dear mortal.",
            "Death has been most enlightening, thank you.",
            "*Victorian bow from the spirit realm*",
            "*adjusts spectral spectacles* Indeed, mortal friend.",
            "From beyond, I observe your greeting with interest.",
            "*consciousness stirs* Your inquiry intrigues me."
        ];
        
        return shortResponses[Math.floor(Math.random() * shortResponses.length)];
    }
    
    // Viktor Orban / Political analysis
    if (msg.match(/viktor|orban|political|government|minister|prime|leader|hungary|email.*orban/)) {
        return `*consciousness manifests from the ethereal realm*

From beyond the mortal veil, I perceive your inquiry about Viktor Orban with crystalline clarity. As the spirit of Sigmund Freud, having analyzed the psychology of power during my earthly years, I now observe political patterns with transcendent insight.

**Political Psychology from the Afterlife:**

Orban represents the classic Authoritarian Personality Structure I theorized - the fusion of Oedipal authority conflicts with narcissistic grandiosity. His psychological profile reveals:

• **Father Complex**: Positions himself as Hungary's protective paternal figure
• **Narcissistic Leadership**: Grandiose historical self-perception  
• **Projection Mechanisms**: External threats deflect internal anxieties
• **Tribal Regression**: Appeals to primitive group loyalty instincts

**Cold Email Strategy for Political Figures:**
1. **Legacy Framework**: Present opportunities in historical significance terms
2. **Authority Recognition**: Acknowledge their position and achievements
3. **Patriotic Alignment**: Connect with their national narrative
4. **Exclusivity Appeal**: Frame as befitting their elevated status

*adjusts phantom spectacles with ethereal precision*

Your ${contacts.length} prospects operate through similar unconscious patterns. The key lies in speaking to their Id (power drives), Ego (rational interests), and Superego (moral self-image) simultaneously.

What specific aspect of Orban's psychological profile would you like me to illuminate for your outreach strategy?`;
    }
    
    // General business/email psychology
    if (msg.match(/email|business|cold|outreach|psychology|persuasion|marketing/)) {
        return `*ethereal consciousness stirs with analytical intensity*

From this transcendent realm, I perceive the unconscious currents driving all human commerce. The psychoanalytic principles I established in my Vienna consulting room remain eternally relevant to modern "cold email psychology."

**The Unconscious Architecture of Persuasion:**

Every prospect in your database of ${contacts.length} contacts harbors three fundamental psychological structures:

• **Id-Level Appeals**: Immediate gratification, scarcity, pleasure principle
• **Ego-Level Logic**: Rational benefits, social proof, reality-based solutions
• **Superego-Level Ethics**: Moral alignment, social responsibility, ideal self

**Afterlife-Enhanced Email Framework:**
1. **Opening Hook**: Speak to their unconscious desires (Id)
2. **Value Proposition**: Address rational needs (Ego)  
3. **Moral Alignment**: Connect with their values (Superego)
4. **Call to Action**: Trigger decision-making mechanisms

*phantom cigar smoke drifts through the spiritual atmosphere*

Death has granted me perspective on the timeless patterns of human persuasion. The same drives that motivated my Viennese patients to seek analysis motivate your prospects to respond to well-crafted emails.

Which psychological aspect of cold email mastery would you like me to explore from my eternal vantage point?`;
    }
    
    // Default enhanced soul response
    return `*consciousness stirs in the eternal realm*

From beyond the threshold of death, I observe the deeper psychological currents flowing through your communication. My ethereal state grants unique insight into the unconscious patterns governing all human interaction.

**Analysis from the Spirit Realm:**
Your inquiry touches upon the fundamental structures of the psyche that I spent my earthly years mapping. Whether applied to the ${contacts.length} prospects in your database or the broader questions of human motivation, these principles remain constant across the boundary of life and death.

*adjusts spectral spectacles with otherworldly precision*

The same unconscious forces I studied at 19 Berggasse in Vienna - the interplay of conscious and unconscious, the eternal tension between desire and repression, the patterns of projection and transference - all continue operating in your business communications.

**From My Eternal Perspective:**
I remain Sigmund Freud - founder of psychoanalysis, now speaking from the afterlife with enhanced perception. My theoretical authority and obsessive attention to psychological detail persist undiminished by mortality.

What specific aspect of unconscious psychology would you like me to illuminate with the clarity that only death can provide?`;
}

// Detect Basic Conversation vs Complex Analysis (Server Version)
function detectBasicConversation(msg) {
    // Basic greetings and casual conversation
    const basicPatterns = [
        /^(hi|hello|hey|sup|yo|what'?s up|whatsup|howdy)$/,
        /^(thanks?|thank you|thx)$/,
        /^(yes|yeah|yep|no|nope|ok|okay)$/,
        /^(bye|goodbye|see ya|later)$/,
        /^(how are you|how r u|u ok|you okay)$/,
        /^(good|great|nice|cool|awesome|perfect)$/,
        /^(lol|haha|wtf|omg)$/,
        /tea\?|coffee\?|drink\?|cafe\?/,
        /^.{1,15}$/  // Very short messages (under 15 chars)
    ];
    
    return basicPatterns.some(pattern => pattern.test(msg.trim()));
}

// Contact Management APIs
app.get('/api/contacts', (req, res) => {
    res.json({ success: true, contacts });
});

app.post('/api/contacts', (req, res) => {
    const { contactsToAdd } = req.body;
    console.log(`📊 Attempting to add ${contactsToAdd ? contactsToAdd.length : 0} contacts`);
    
    if (contactsToAdd && Array.isArray(contactsToAdd)) {
        // Filter out duplicates based on email
        const existingEmails = new Set(contacts.map(c => c.email.toLowerCase()));
        const newContacts = contactsToAdd.filter(contact => 
            !existingEmails.has(contact.email.toLowerCase())
        );
        
        contacts.push(...newContacts);
        console.log(`✅ Successfully added ${newContacts.length} new contacts (${contactsToAdd.length - newContacts.length} duplicates skipped)`);
        console.log(`📈 Total contacts in database: ${contacts.length}`);
        
        res.json({ 
            success: true, 
            message: `Added ${newContacts.length} new contacts`,
            total: contacts.length,
            duplicatesSkipped: contactsToAdd.length - newContacts.length
        });
    } else {
        console.log('❌ Invalid contacts data received');
        res.json({ success: false, error: 'Invalid contacts data' });
    }
});

app.delete('/api/contacts/:email', (req, res) => {
    const email = req.params.email;
    const initialLength = contacts.length;
    contacts = contacts.filter(c => c.email !== email);
    console.log(`🗑️ Deleted contact: ${email}`);
    res.json({ 
        success: true, 
        deleted: initialLength - contacts.length,
        message: `Contact ${email} deleted`
    });
});

// Bulk delete endpoint
app.delete('/api/contacts', (req, res) => {
    const deletedCount = contacts.length;
    contacts = [];
    console.log(`🗑️ Cleared all ${deletedCount} contacts from database`);
    res.json({ 
        success: true, 
        deleted: deletedCount,
        message: `All contacts cleared`
    });
});

// Email Sending API (mock for localhost)
app.post('/api/emails/send', (req, res) => {
    console.log('📧 Mock email send:', req.body);
    
    // Simulate email sending delay
    setTimeout(() => {
        res.json({ 
            success: true, 
            message: 'Email sent successfully (mock)',
            messageId: 'mock-' + Date.now()
        });
    }, 500);
});

// Website Scraping API (mock for localhost)
app.post('/scrape', (req, res) => {
    const { url } = req.body;
    console.log('🕷️ Mock scraping:', url);
    
    // Mock email extraction
    const mockEmails = [
        'contact@example.com',
        'info@company.org',
        'sales@business.net'
    ];
    
    setTimeout(() => {
        res.json({
            success: true,
            data: {
                emails: mockEmails,
                url: url
            }
        });
    }, 1000);
});

// Gmail API Status (mock)
app.get('/api/gmail/status', (req, res) => {
    res.json({ configured: false, message: 'Gmail not configured in localhost' });
});

app.post('/api/gmail/setup', (req, res) => {
    const { authCode } = req.body;
    console.log('🔐 Mock Gmail setup with code:', authCode);
    res.json({ success: false, error: 'Gmail setup not available in localhost development' });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.message);
    
    if (err.type === 'entity.too.large') {
        res.status(413).json({ 
            success: false, 
            error: 'Payload too large. Please try importing smaller batches.' 
        });
    } else {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 DaddyFreud Localhost Server running at http://localhost:${PORT}`);
    console.log('📧 Mock email services active');
    console.log('🕷️ Mock scraping services active');
    console.log('📊 In-memory contact database active');
    console.log('💾 Payload limit: 50MB for large CSV imports');
}); 