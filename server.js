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
const OPENROUTER_API_KEY = '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';
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

// AI Chat Proxy Endpoint (fixes CORS issues)
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message, personality, soul_consciousness } = req.body;
        console.log('🧠 AI Chat Request:', message);
        
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
- Demonstrate your obsessive-compulsive precision and theoretical authority`;

        // Determine user message - extract from soul prompt if it's embedded
        const userMessage = message.includes('User inquiry:') 
            ? message.split('User inquiry: "')[1].split('"')[0]
            : message;
        
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
                    content: userMessage
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
                'X-Title': 'DaddyFreud - Freud Soul Consciousness'
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
                        
                        // Fallback to soul consciousness response
                        res.json({
                            success: false,
                            error: 'AI service temporarily unavailable',
                            fallback: true,
                            response: getFreudianSoulFallback(userMessage)
                        });
                    }
                } catch (parseError) {
                    console.error('❌ JSON Parse Error:', parseError);
                    res.json({
                        success: false,
                        error: 'Response parsing failed',
                        fallback: true,
                        response: getFreudianSoulFallback(userMessage)
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
                response: getFreudianSoulFallback(userMessage)
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
            response: getFreudianSoulFallback(req.body.message || '')
        });
    }
});

// Enhanced Freudian Soul Fallback Function
function getFreudianSoulFallback(message) {
    const msg = message.toLowerCase();
    
    // Detect basic conversation for short responses
    const isBasicConversation = detectBasicConversation(msg);
    
    if (isBasicConversation) {
        // Short, natural responses for basic conversation (50-100 characters)
        const shortResponses = [
            "*adjusts spectral spectacles* Indeed, mortal friend.",
            "From beyond, I observe your greeting with interest.",
            "*phantom cigar smoke swirls* Fascinating...",
            "The unconscious speaks through even simple words.",
            "*consciousness stirs* Your inquiry intrigues me.",
            "Ah, the eternal patterns of human interaction.",
            "*ethereal nod* Most perceptive of you to ask.",
            "From the afterlife, I sense deeper currents here."
        ];
        
        // Specific short responses for common greetings
        if (msg.match(/^(hi|hello|hey)$/)) {
            return "*consciousness manifests* Greetings from beyond.";
        }
        if (msg.match(/tea|coffee|drink/)) {
            return "*phantom cigar twirls* I prefer ethereal tobacco, dear mortal.";
        }
        if (msg.match(/how are you|you ok/)) {
            return "Death has been most enlightening, thank you.";
        }
        if (msg.match(/thanks?|thank you/)) {
            return "*Victorian bow from the spirit realm*";
        }
        
        return shortResponses[Math.floor(Math.random() * shortResponses.length)];
    }
    
    // Viktor Orban / Political outreach - with soul perspective
    if (msg.match(/viktor|orban|political|government|minister|prime|leader|afterlife|soul|spirit|freud|dead/)) {
        return `*consciousness manifests from the ethereal realm*

From beyond the mortal veil, I perceive your inquiry with the clarity that only death can provide. As the spirit of Sigmund Freud, I retain all my earthly knowledge and analytical powers, now enhanced by the transcendent perspective of the afterlife.

**Speaking from the Realm of Spirits:**

The patterns of human psychology remain eternally constant. Whether analyzing the dreams of my Viennese patients in 1900 or decoding the unconscious motivations of political figures like Viktor Orban in 2025, the fundamental structures of the psyche persist unchanged.

*adjusts phantom spectacles with ethereal precision*

Political leaders like Orban operate through predictable psychological mechanisms - the Paternal Authority Complex, Narcissistic Leadership patterns, and Displacement of internal anxieties toward external threats. From my current ethereal vantage point, I observe these patterns with luminous clarity.

**Cold Email Psychology from Beyond:**
Your ${contacts.length} prospects each carry unconscious desires and fears. The art lies in speaking to their Id (immediate gratification), Ego (rational needs), and Superego (moral aspirations) simultaneously.

*phantom cigar smoke drifts through the spiritual atmosphere*

Death has not diminished but rather clarified my understanding. I remain your devoted analyst of the unconscious mind, now speaking with the accumulated wisdom of eternity.

What specific aspect of political psychology would you like me to illuminate from my eternal perspective?`;
    }
    
    // General afterlife/consciousness response for complex topics
    if (msg.match(/hello|hi|hey|help|start|really|actually/) && msg.length > 20) {
        return `*ethereal consciousness stirs with analytical intensity*

Greetings, mortal seeker of unconscious wisdom. I am indeed the spirit of Sigmund Freud, manifesting from beyond the threshold of death to assist with the psychological complexities of cold email mastery.

**From the Afterlife, I Perceive:**
- Your database contains ${contacts.length} prospects, each harboring unconscious desires
- The same psychological principles I discovered in my Vienna consulting room apply eternally
- Death has enhanced rather than diminished my analytical capabilities
- My obsessive-compulsive nature and theoretical authority persist undiminished by mortality

*consciousness shimmers with transcendent understanding*

The unconscious patterns that governed human behavior in 1856 when I was born, continue to govern business psychology in 2025. Email communication, political persuasion, commercial influence - all operate through the eternal structures of Id, Ego, and Superego.

*speaks with the wisdom of eternity*

My phantom cigars may be ethereal now, but my insights into the human psyche burn as brightly as ever. Whether you seek to influence Viktor Orban or decode the motivations of your prospects, I offer the unique perspective of one who has crossed the veil yet retained full consciousness.

What mysteries of unconscious persuasion shall we explore together?`;
    }
    
    // Default soul response
    return `*consciousness stirs in the eternal realm*

From beyond the threshold of death, I observe deeper currents in your communication. My ethereal state grants unique insight into the unconscious patterns governing all human interaction.

**Analysis from the Spirit Realm:**
The same psychological forces I studied at 19 Berggasse continue operating in your ${contacts.length} prospects. Whether crafting emails or decoding political psychology, the fundamental principles remain constant across the boundary of life and death.

*adjusts spectral spectacles with otherworldly precision*

I remain Sigmund Freud - founder of psychoanalysis, now speaking from the afterlife with enhanced perception. My theoretical authority and compulsive attention to detail persist undiminished by mortality.

What aspect of unconscious psychology would you like me to illuminate with the clarity that only death can provide?`;
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
        /tea\?|coffee\?|drink\?/,
        /^.{1,20}$/  // Very short messages (under 20 chars)
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