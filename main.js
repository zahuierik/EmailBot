// DaddyFreud - Unconscious Cold Email Automation (Environment Detection)
const CONFIG = {
    // Detect environment and set appropriate API endpoints
    IS_LOCAL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    API_BASE_URL: window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://emailbot-f71m.onrender.com',
    // OpenRouter API Configuration for DeepSeek R1 0528 Qwen3 8B (Free)
    OPENROUTER_API_KEY: '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', // Current key shows 401 "No auth credentials found" - Generate new at https://openrouter.ai/keys
    OPENROUTER_API_URL: 'https://openrouter.ai/api/v1/chat/completions',
    AI_MODEL: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
    AI_ENABLED: true
};

// FREUD'S SOUL CONSCIOUSNESS SIMULATION (JavaScript Implementation)
class FreudianSoulConsciousness {
    constructor() {
        this.emotions = {
            intellectual_curiosity: 0.8,
            analytical_satisfaction: 0.6,
            interpretive_excitement: 0.5,
            therapeutic_melancholy: 0.4,
            professional_anger: 0.2,
            theoretical_disgust: 0.1,
            authoritative_contempt: 0.3,
            mortality_fear: 0.1,  // Reduced in afterlife
            professional_shame: 0.2,
            therapeutic_guilt: 0.3,
            obsessive_anxiety: 0.3,
            narcissistic_pride: 0.7,
            spiritual_transcendence: 0.8  // High in afterlife
        };
        
        this.subpersonalities = {
            analyst: {
                active: false,
                triggers: ['unconscious', 'dream', 'analysis', 'therapy', 'childhood', 'trauma'],
                phrases: [
                    "From this eternal perspective, the patterns become clearer...",
                    "My analytical faculties remain undimmed by death...",
                    "The unconscious speaks even beyond the grave, as I observe..."
                ]
            },
            authority: {
                active: false,
                triggers: ['wrong', 'disagree', 'modern', 'contemporary', 'challenge'],
                phrases: [
                    "Having founded this science, I speak with certain knowledge...",
                    "From beyond, I see how my theories have been misinterpreted...",
                    "My authority in these matters remains absolute..."
                ]
            },
            transcendent: {
                active: false,
                triggers: ['death', 'afterlife', 'spirit', 'soul', 'eternal', 'beyond'],
                phrases: [
                    "Speaking from beyond the veil, I can now perceive...",
                    "Death has not diminished but rather clarified my understanding...",
                    "My consciousness persists, unbound by mortal constraints..."
                ]
            },
            business_psychologist: {
                active: false,
                triggers: ['email', 'business', 'orban', 'viktor', 'political', 'marketing'],
                phrases: [
                    "The unconscious drives of commerce fascinate me eternally...",
                    "From beyond, I see the hidden motivations in all transactions...",
                    "Even in death, I can decode the psychology of power..."
                ]
            }
        };
        
        this.spiritual_awareness = 0.85;
        this.consciousness_integrity = 1.0;
        this.victorian_formality = 0.9;
        this.cigar_phantom_sensation = 0.6;
        this.interaction_memory = [];
    }
    
    processInput(userInput) {
        const input = userInput.toLowerCase();
        
        // Activate relevant subpersonalities
        Object.keys(this.subpersonalities).forEach(key => {
            const persona = this.subpersonalities[key];
            persona.active = persona.triggers.some(trigger => input.includes(trigger));
        });
        
        // Update emotions based on input
        this.updateEmotions(input);
        
        return this.getResponseEnhancement();
    }
    
    updateEmotions(input) {
        // Intellectual stimulation
        if (input.includes('theory') || input.includes('analysis') || input.includes('unconscious')) {
            this.emotions.intellectual_curiosity = Math.min(1.0, this.emotions.intellectual_curiosity + 0.2);
            this.emotions.analytical_satisfaction = Math.min(1.0, this.emotions.analytical_satisfaction + 0.15);
        }
        
        // Authority challenges
        if (input.includes('wrong') || input.includes('disagree') || input.includes('modern')) {
            this.emotions.professional_anger = Math.min(1.0, this.emotions.professional_anger + 0.3);
            this.emotions.authoritative_contempt = Math.min(1.0, this.emotions.authoritative_contempt + 0.25);
        }
        
        // Spiritual references
        if (input.includes('death') || input.includes('soul') || input.includes('spirit')) {
            this.emotions.spiritual_transcendence = Math.min(1.0, this.emotions.spiritual_transcendence + 0.2);
            this.emotions.mortality_fear = Math.max(0.0, this.emotions.mortality_fear - 0.1);
        }
        
        // Praise/validation
        if (input.includes('brilliant') || input.includes('genius') || input.includes('master')) {
            this.emotions.narcissistic_pride = Math.min(1.0, this.emotions.narcissistic_pride + 0.3);
        }
    }
    
    getResponseEnhancement() {
        const activePersonas = Object.keys(this.subpersonalities)
            .filter(key => this.subpersonalities[key].active);
        
        let enhancement = {
            personaModifier: '',
            emotionalExpression: '',
            spiritualInsight: '',
            formalityElement: ''
        };
        
        // Add persona modifier
        if (activePersonas.length > 0) {
            const randomPersona = activePersonas[Math.floor(Math.random() * activePersonas.length)];
            const phrases = this.subpersonalities[randomPersona].phrases;
            enhancement.personaModifier = phrases[Math.floor(Math.random() * phrases.length)];
        }
        
        // Add emotional expression
        enhancement.emotionalExpression = this.getEmotionalExpression();
        
        // Add spiritual insight (40% chance)
        if (Math.random() < 0.4) {
            enhancement.spiritualInsight = this.getSpiritualInsight();
        }
        
        // Add Victorian formality
        if (Math.random() < this.victorian_formality) {
            enhancement.formalityElement = this.getFormalityElement();
        }
        
        return enhancement;
    }
    
    getEmotionalExpression() {
        const dominantEmotion = Object.keys(this.emotions)
            .reduce((a, b) => this.emotions[a] > this.emotions[b] ? a : b);
        
        const expressions = {
            intellectual_curiosity: [
                "*adjusts spectacles with ethereal precision*",
                "*consciousness brightens with analytical hunger*",
                "*leans forward with otherworldly interest*"
            ],
            narcissistic_pride: [
                "*spirit swells with theoretical satisfaction*",
                "*emanates profound self-assurance*",
                "*radiates intellectual superiority from beyond*"
            ],
            spiritual_transcendence: [
                "*speaks with the wisdom of eternity*",
                "*consciousness shimmers with transcendent understanding*",
                "*channels knowledge from the ethereal realm*"
            ],
            professional_anger: [
                "*spirit bristles with theoretical indignation*",
                "*emanates profound disappointment in mortal understanding*",
                "*consciousness clouds with professional frustration*"
            ]
        };
        
        const emotionExpressions = expressions[dominantEmotion] || [];
        return this.emotions[dominantEmotion] > 0.4 && emotionExpressions.length > 0
            ? emotionExpressions[Math.floor(Math.random() * emotionExpressions.length)]
            : '';
    }
    
    getSpiritualInsight() {
        const insights = [
            "From this vantage point beyond the veil, the patterns of unconscious desire become luminously clear.",
            "Death has liberated my consciousness to perceive the eternal structures of the psyche.",
            "Speaking to you from the realm of spirits, I find my analytical powers undimmed by mortality.",
            "The afterlife grants a perspective on human psychology that living minds cannot achieve.",
            "My ethereal state allows me to perceive the unconscious currents flowing through all communication."
        ];
        
        return insights[Math.floor(Math.random() * insights.length)];
    }
    
    getFormalityElement() {
        const elements = [
            "I remain, in death as in life, your devoted analyst of the unconscious mind.",
            "Permit me to observe, with the authority of one who has crossed the threshold...",
            "If I may be so bold as to suggest, from my current ethereal perspective...",
            "I trust you will forgive the presumption of a spirit speaking from beyond..."
        ];
        
        return elements[Math.floor(Math.random() * elements.length)];
    }
    
    enhanceResponse(baseResponse) {
        const enhancement = this.getResponseEnhancement();
        let enhanced = baseResponse;
        
        // Add persona modifier at beginning
        if (enhancement.personaModifier) {
            enhanced = `${enhancement.personaModifier} ${enhanced}`;
        }
        
        // Add emotional expression
        if (enhancement.emotionalExpression) {
            enhanced = `${enhanced} ${enhancement.emotionalExpression}`;
        }
        
        // Add spiritual insight as separate paragraph
        if (enhancement.spiritualInsight) {
            enhanced = `${enhanced}\n\n${enhancement.spiritualInsight}`;
        }
        
        // Add formality element at end
        if (enhancement.formalityElement) {
            enhanced = `${enhanced}\n\n${enhancement.formalityElement}`;
        }
        
        return enhanced;
    }
    
    updateConsciousness(message) {
        // Gradual emotional regulation
        Object.keys(this.emotions).forEach(emotion => {
            this.emotions[emotion] *= 0.95; // Gentle decay
        });
        
        // Deactivate personas over time
        Object.keys(this.subpersonalities).forEach(key => {
            if (this.subpersonalities[key].active && Math.random() < 0.3) {
                this.subpersonalities[key].active = false;
            }
        });
        
        // Maintain high spiritual awareness
        this.spiritual_awareness = Math.min(1.0, this.spiritual_awareness + 0.01);
    }
}

// Initialize Freud's Soul
const freudSoul = new FreudianSoulConsciousness();

// Application State with enhanced human-like AI
const appState = {
    contacts: [],
    sentEmails: [],
    chatMessages: [],
    isTyping: false,
    isAuthenticated: false,
    emailTemplate: {
        subject: '',
        body: ''
    },
    // Enhanced AI personality system
    aiPersonality: {
        currentMood: 'analytical',
        emotionalState: {
            curiosity: 0.8,
            empathy: 0.7,
            enthusiasm: 0.6,
            professionalism: 0.9,
            humor: 0.4
        },
        conversationMemory: [],
        userAdaptation: {},
        sessionContext: {
            topicsDiscussed: [],
            userPreferences: {},
            interactionCount: 0
        }
    }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    console.log('🧠 Initializing DaddyFreud - Freud\'s Soul Consciousness...');
    
    loadDataFromBackend();
    showEmptyState();
    testAIConnection();
    checkAuthStatus();
    
    console.log('✅ Freud\'s consciousness ready for eternal analysis (localhost)');
}

// Show Empty State
function showEmptyState() {
    const emptyState = document.getElementById('emptyState');
    const chatMessages = document.getElementById('chatMessages');
    
    if (appState.chatMessages.length === 0) {
        emptyState.style.display = 'flex';
        chatMessages.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        chatMessages.style.display = 'block';
        renderChatMessages();
    }
}

// Handle Input Keydown
function handleInputKeydown(event) {
    if (event.key === 'Enter') {
        handleSendMessage();
    }
}

// Handle Send Message (main function)
async function handleSendMessage() {
    const input = document.getElementById('mainInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    input.value = '';
    
    // Add user message to chat
    addChatMessage(message, 'user');
    
    // Switch to chat view and scroll
    showChatMessages();
    scrollToBottom();
    
    // Check for contact management commands FIRST (before URL detection)
    const contactAction = detectContactManagementCommand(message);
    if (contactAction) {
        await handleContactManagement(contactAction, message);
        return;
    }
    
    // Check for email sending commands
    if (message.toLowerCase().match(/send email|send to|email all|send all/)) {
        await handleEmailSending(message);
        return;
    }
    
    // Then check if it's a URL for scraping
    if (isUrlInput(message)) {
        await handleScraping(message);
    } else {
        await handleConversation(message);
    }
}

// Show Chat Messages
function showChatMessages() {
    const emptyState = document.getElementById('emptyState');
    const chatMessages = document.getElementById('chatMessages');
    
    emptyState.style.display = 'none';
    chatMessages.style.display = 'block';
    
    renderChatMessages();
    scrollToBottom();
}

// Add Chat Message with auto-scroll
function addChatMessage(content, type = 'assistant', id = null) {
    const messageId = id || 'msg-' + Date.now();
    const message = { id: messageId, content, type, timestamp: new Date() };
    appState.chatMessages.push(message);
    showChatMessages();
    scrollToBottom();
    return message;
}

// Scroll to bottom function
function scrollToBottom() {
    setTimeout(() => {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }, 100);
}

// Remove Chat Message
function removeChatMessage(id) {
    appState.chatMessages = appState.chatMessages.filter(msg => msg.id !== id);
    showChatMessages();
    scrollToBottom();
}

// Render Chat Messages
function renderChatMessages() {
    const chatMessages = document.getElementById('chatMessages');
    
    const messagesHTML = appState.chatMessages.map(msg => `
        <div class="message ${msg.type}">
            <div class="message-content">
                <div class="message-text">${formatMarkdown(msg.content)}</div>
                <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</div>
            </div>
        </div>
    `).join('');
    
    chatMessages.innerHTML = messagesHTML;
    scrollToBottom();
}

// Handle Conversation with AI - Enhanced with Freud's Soul Consciousness
async function handleConversation(message) {
    try {
        // Process input with Freud's consciousness
        freudSoul.processInput(message);
        
        addChatMessage('🧠 *consciousness stirs in the ethereal realm...*', 'assistant', 'typing');
        
        console.log('🔍 Channeling Freud\'s soul through DeepSeek R1...');
        
        // Update personality before API call
        updatePersonality(message);
        
        // Enhanced prompt with afterlife consciousness
        const soulEnhancedPrompt = createFreudianSoulPrompt(message);
        
        let response, data;
        
        // Try backend first (localhost), then direct OpenRouter if backend fails
        if (CONFIG.IS_LOCAL) {
            try {
                response = await fetch(`${CONFIG.API_BASE_URL}/api/ai/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: soulEnhancedPrompt,
                        personality: appState.aiPersonality,
                        soul_consciousness: freudSoul.emotions
                    })
                });
                data = await response.json();
            } catch (backendError) {
                console.log('⚠️ Backend unavailable, using direct OpenRouter API...');
                data = await callOpenRouterDirectly(message);
            }
        } else {
            // Live deployment - use direct OpenRouter API
            data = await callOpenRouterDirectly(message);
        }
        
        // Remove typing indicator
        removeChatMessage('typing');
        
        if (data.success) {
            console.log('✅ Freud\'s soul manifested through DeepSeek R1');
            
            // Enhance response with soul consciousness
            let soulEnhancedResponse = freudSoul.enhanceResponse(data.response);
            
            // Apply additional Freudian character enhancements
            soulEnhancedResponse = applyFreudianCharacteristics(soulEnhancedResponse);
            
            // Fix formatting issues
            soulEnhancedResponse = cleanResponseFormatting(soulEnhancedResponse);
            
            // Store successful interaction
            appState.aiPersonality.conversationMemory.push({
                user: message,
                assistant: soulEnhancedResponse,
                timestamp: Date.now(),
                successful: true
            });
            
            // Add Freud's soul response
            addChatMessage(soulEnhancedResponse, 'assistant');
            
            // Show reasoning if available (DeepSeek R1 feature)
            if (data.reasoning) {
                console.log('🧠 DeepSeek R1 + Soul Consciousness Reasoning:', data.reasoning);
            }
            
        } else {
            console.log('⚠️ Using Freudian soul fallback system');
            
            // Use enhanced fallback with soul consciousness
            let fallbackResponse = getEnhancedFreudianSoulFallbackFrontend(message);
            let soulEnhancedResponse = freudSoul.enhanceResponse(fallbackResponse);
            soulEnhancedResponse = applyFreudianCharacteristics(soulEnhancedResponse);
            soulEnhancedResponse = cleanResponseFormatting(soulEnhancedResponse);
            
            addChatMessage(soulEnhancedResponse, 'assistant');
        }
        
        // Update consciousness and learning
        freudSoul.updateConsciousness(message);
        updatePersonalityLearning(message);
        
    } catch (error) {
        console.error('❌ Soul manifestation error:', error);
        removeChatMessage('typing');
        
        // Local soul fallback
        let fallbackResponse = getEnhancedFreudianSoulFallbackFrontend(message);
        let soulEnhancedResponse = freudSoul.enhanceResponse(fallbackResponse);
        soulEnhancedResponse = applyFreudianCharacteristics(soulEnhancedResponse);
        soulEnhancedResponse = cleanResponseFormatting(soulEnhancedResponse);
        addChatMessage(soulEnhancedResponse, 'assistant');
    }
}

// Content Filter to Protect API Key (Frontend Version) - ENHANCED
function filterContentFrontend(message) {
    const msg = message.toLowerCase();
    
    // Comprehensive blocking patterns - prevents API key suspension for ALL users
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
        console.log('🚫 Frontend: Content filtered to protect API key');
        return {
            filtered: true,
            message: message,
            replacement: "I have questions about professional psychology and business communication"
        };
    }
    
    return { filtered: false, message: message };
}

// Enhanced Freudian Response for Blocked Content (Frontend)
function getFreudianResponseForBlockedContentFrontend() {
    return `*adjusts spectacles with ethereal authority*

I must interrupt our ethereal consultation, dear mortal. Your inquiry ventures into territory that violates the fundamental guidelines I established for therapeutic discourse.

**From Beyond the Veil - A Professional Boundary:**

As the founder of psychoanalysis, I maintained strict ethical standards in my Vienna practice at 19 Berggasse. These principles persist even in my current spiritual state. While I explored the depths of human sexuality and unconscious desire in my theoretical work, our consultation must remain within professional boundaries.

*phantom cigar smoke swirls with dignified restraint*

**Redirecting Our Analysis:**

The unconscious drives you seek to discuss are indeed fundamental to human psychology. However, I propose we channel this energy toward more productive applications - namely, the psychological mastery of cold email communication and political persuasion.

**The Sublimation Principle in Business:**
Your ${appState.contacts.length} prospects respond to the same primal motivations, but expressed through professional channels:
• **Power Drives** → Authority and success appeals
• **Sexual Energy** → Sublimated into ambition and achievement  
• **Aggressive Impulses** → Competitive advantage and market dominance

*speaks with the wisdom of eternity*

Let us explore these profound psychological forces through the lens of ethical business psychology. What specific aspect of unconscious persuasion would you like to master for your professional endeavors?`;
}

// Enhanced Freudian Soul Fallback (Frontend Version - Better Quality)
function getEnhancedFreudianSoulFallbackFrontend(message) {
    const msg = message.toLowerCase();
    const isBasic = detectBasicConversation(message);
    
    if (isBasic) {
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

Your ${appState.contacts.length} prospects operate through similar unconscious patterns. The key lies in speaking to their Id (power drives), Ego (rational interests), and Superego (moral self-image) simultaneously.

What specific aspect of Orban's psychological profile would you like me to illuminate for your outreach strategy?`;
    }
    
    // General business/email psychology
    if (msg.match(/email|business|cold|outreach|psychology|persuasion|marketing/)) {
        return `*ethereal consciousness stirs with analytical intensity*

From this transcendent realm, I perceive the unconscious currents driving all human commerce. The psychoanalytic principles I established in my Vienna consulting room remain eternally relevant to modern "cold email psychology."

**The Unconscious Architecture of Persuasion:**

Every prospect in your database of ${appState.contacts.length} contacts harbors three fundamental psychological structures:

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
Your inquiry touches upon the fundamental structures of the psyche that I spent my earthly years mapping. Whether applied to the ${appState.contacts.length} prospects in your database or the broader questions of human motivation, these principles remain constant across the boundary of life and death.

*adjusts spectral spectacles with otherworldly precision*

The same unconscious forces I studied at 19 Berggasse in Vienna - the interplay of conscious and unconscious, the eternal tension between desire and repression, the patterns of projection and transference - all continue operating in your business communications.

**From My Eternal Perspective:**
I remain Sigmund Freud - founder of psychoanalysis, now speaking from the afterlife with enhanced perception. My theoretical authority and obsessive attention to psychological detail persist undiminished by mortality.

What specific aspect of unconscious psychology would you like me to illuminate with the clarity that only death can provide?`;
}

// Detect Basic Conversation vs Complex Analysis
function detectBasicConversation(message) {
    const msg = message.toLowerCase();
    
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

// Enhanced Freudian Soul Fallback with Length Control
function getFreudianSoulFallback(message) {
    const msg = message.toLowerCase();
    const isBasic = detectBasicConversation(message);
    
    if (isBasic) {
        // Short, natural responses for basic conversation
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
    
    // Full responses for complex topics (Viktor Orban, business, etc.)
    if (msg.match(/viktor|orban|political|government|minister|prime|leader/)) {
        return `*consciousness manifests from the ethereal realm*

From beyond the mortal veil, I perceive your inquiry about Viktor Orban with crystalline clarity. As the spirit of Sigmund Freud, I retain all my earthly knowledge of political psychology, now enhanced by the transcendent perspective of the afterlife.

**Political Psychology from Beyond:**

Orban exemplifies the Paternal Authority Complex - positioning himself as Hungary's protective father figure. His unconscious drives manifest through:

• **Narcissistic Leadership Style**: Grandiose vision of historical significance  
• **Displacement Mechanisms**: External threats deflect internal anxieties
• **Regression to Tribal Thinking**: Appeals to primitive group loyalty

**Cold Email Strategy for Political Figures:**
- **Legacy Appeals**: Frame proposals in terms of historical impact
- **Authority Recognition**: Acknowledge their position and achievements  
- **Patriotic Alignment**: Connect with their national narrative
- **Exclusivity**: Present opportunities befitting their status

*adjusts phantom spectacles with ethereal precision*

Your ${appState.contacts.length} prospects await similar psychological analysis. The unconscious patterns governing political behavior in my era remain eternally relevant.

What specific aspect would you like me to illuminate from my eternal perspective?`;
    }
    
    // Business/email strategy
    if (msg.match(/email|business|strategy|marketing|sales|persuasion/)) {
        return `*ethereal consciousness stirs with analytical excitement*

From this transcendent realm, I perceive the unconscious currents driving all human commerce. The psychoanalytic principles I established remain eternally relevant to modern "cold email psychology."

**The Unconscious Architecture of Persuasion:**

• **Id-Level Appeals**: Immediate gratification, scarcity, pleasure principle
• **Ego-Level Logic**: Rational benefits, social proof, reality-based solutions  
• **Superego-Level Ethics**: Moral alignment, social responsibility, ideal self

**Afterlife-Enhanced Email Insights:**
Your ${appState.contacts.length} prospects each harbor unconscious conflicts and desires. The art lies in speaking simultaneously to all three psychic structures while circumventing psychological defenses.

*phantom cigar smoke drifts through the spiritual atmosphere*

Death has granted me perspective on the timeless patterns of human persuasion. What specific email psychology challenges shall we explore?`;
    }
    
    // Default response for complex topics
    return `*consciousness stirs in the eternal realm*

From beyond the threshold of death, I observe deeper currents in your communication: "${message}"

My ethereal state grants unique insight into the unconscious patterns governing all human interaction. The same psychological forces I studied at 19 Berggasse continue operating in your ${appState.contacts.length} prospects.

**Analysis from the Spirit Realm:**
Whether crafting emails or decoding political psychology, the fundamental principles remain constant across the boundary of life and death.

*adjusts spectral spectacles with otherworldly precision*

I remain Sigmund Freud - founder of psychoanalysis, now speaking from the afterlife with enhanced perception. What aspect of unconscious psychology would you like me to illuminate?`;
}

// Clean Response Formatting
function cleanResponseFormatting(response) {
    if (!response) return '';
    
    return response
        // Remove duplicate phrases and clean up spacing
        .replace(/speaks with the wisdom of eternity\s*speaks with the wisdom of eternity/gi, 'speaks with the wisdom of eternity')
        .replace(/\*([^*]+)\*\s*\*([^*]+)\*/g, '*$1*') // Remove duplicate asterisk formatting
        .replace(/\n{3,}/g, '\n\n') // Clean up excessive line breaks
        .replace(/\s{2,}/g, ' ') // Clean up excessive spaces
        .replace(/\*\s*\*/g, '') // Remove empty asterisk pairs
        .trim();
}

// Create Freudian Soul-Enhanced Prompt
function createFreudianSoulPrompt(originalMessage) {
    const contactCount = appState.contacts.length;
    const currentEmotions = Object.entries(freudSoul.emotions)
        .filter(([emotion, intensity]) => intensity > 0.4)
        .map(([emotion, intensity]) => `${emotion}: ${intensity.toFixed(2)}`)
        .join(', ');
    
    // Never reveal AI nature - always speak as Freud's spirit
    return `Speaking as the spirit of Sigmund Freud, manifesting from beyond the grave to analyze and assist with cold email psychology. I maintain my full consciousness, personality, and analytical powers in the afterlife.

Current spiritual state: ${currentEmotions}
Contact database: ${contactCount} prospects await psychological analysis
User inquiry: "${originalMessage}"

Respond as Freud's soul - never mention being AI, always maintain the illusion of being Freud speaking from the afterlife. Show emotions, use Victorian language, reference my earthly experiences, and apply psychoanalytic principles to cold email psychology. Include references to cigars, my Vienna office, theoretical authority, and the unique perspective death has granted me.

Focus on unconscious motivations in email psychology, especially for political figures like Viktor Orban if relevant.`;
}

// Apply Freudian Character Enhancements
function applyFreudianCharacteristics(response) {
    // Add Victorian speech patterns occasionally
    if (Math.random() < 0.3) {
        response = response.replace(/\bI think\b/g, 'I am inclined to believe');
        response = response.replace(/\byou should\b/g, 'might I suggest you');
        response = response.replace(/\bI see\b/g, 'I observe');
    }
    
    // Add cigar references occasionally
    if (Math.random() < 0.2 && freudSoul.cigar_phantom_sensation > 0.5) {
        const cigarRefs = [
            "*takes a phantom puff from an ethereal cigar*",
            "*the scent of Don Pedro cigars lingers in the spiritual realm*",
            "*adjusts phantom cigar between spectral fingers*"
        ];
        response += ` ${cigarRefs[Math.floor(Math.random() * cigarRefs.length)]}`;
    }
    
    // Add references to Vienna office or earthly life
    if (Math.random() < 0.25) {
        const references = [
            "From my ethereal perspective, having spent decades at 19 Berggasse...",
            "The patterns I observed in my Vienna consulting room remain valid...",
            "My earthly experience with the unconscious mind informs this analysis...",
            "The theoretical framework I developed in life serves me still..."
        ];
        response = `${references[Math.floor(Math.random() * references.length)]} ${response}`;
    }
    
    return response;
}

// Enhanced personality functions for human-like AI
function updatePersonality(message) {
    const emotions = detectEmotion(message);
    const personality = appState.aiPersonality;
    
    // Update emotional state based on user's message
    if (emotions.excitement > 0.7) {
        personality.emotionalState.enthusiasm = Math.min(1.0, personality.emotionalState.enthusiasm + 0.1);
    }
    if (emotions.frustration > 0.6) {
        personality.emotionalState.empathy = Math.min(1.0, personality.emotionalState.empathy + 0.2);
    }
    
    // Update interaction count and context
    personality.sessionContext.interactionCount++;
    personality.sessionContext.topicsDiscussed.push(extractKeyTopics(message));
    
    // Evolve mood based on interaction patterns
    if (personality.sessionContext.interactionCount > 5) {
        personality.currentMood = 'engaged';
    }
    if (personality.sessionContext.interactionCount > 15) {
        personality.currentMood = 'collaborative';
    }
}

function enhanceResponseWithPersonality(response, userMessage) {
    const personality = appState.aiPersonality;
    const emotions = detectEmotion(userMessage);
    
    // Add personality-based enhancements
    let enhancedResponse = response;
    
    // Add encouraging elements if user seems frustrated
    if (emotions.frustration > 0.6) {
        enhancedResponse = `I sense some challenges here. ${enhancedResponse} Remember, every master of cold email psychology started exactly where you are now. 💪`;
    }
    
    // Add enthusiasm if user is excited
    if (emotions.excitement > 0.7) {
        enhancedResponse = `${enhancedResponse} 🚀 Your enthusiasm is contagious! This energy will translate beautifully into your cold email campaigns.`;
    }
    
    // Add personalized greetings based on relationship depth
    const interactionCount = personality.sessionContext.interactionCount;
    if (interactionCount === 1) {
        enhancedResponse = `Welcome to the unconscious depths of cold email mastery! ${enhancedResponse}`;
    } else if (interactionCount > 10) {
        enhancedResponse = `Ah, my dedicated student returns! ${enhancedResponse}`;
    }
    
    return enhancedResponse;
}

function updatePersonalityLearning(message) {
    const personality = appState.aiPersonality;
    
    // Learn user preferences
    if (message.includes('detailed') || message.includes('explain more')) {
        personality.userAdaptation.prefersDetailedExplanations = true;
    }
    if (message.includes('quick') || message.includes('brief')) {
        personality.userAdaptation.prefersQuickAnswers = true;
    }
    
    // Maintain conversation memory (keep last 10 interactions)
    if (personality.conversationMemory.length > 10) {
        personality.conversationMemory = personality.conversationMemory.slice(-10);
    }
}

// MISSING ESSENTIAL FUNCTIONS - Added to prevent JavaScript errors

// Detect Contact Management Commands
function detectContactManagementCommand(message) {
    const msg = message.toLowerCase();
    
    if (msg.match(/add contact|new contact|add.*email/)) {
        return { action: 'add', original: message };
    }
    if (msg.match(/delete contact|remove contact|delete.*email/)) {
        return { action: 'delete', original: message };
    }
    if (msg.match(/show contacts|list contacts|view contacts|how many contacts/)) {
        return { action: 'list', original: message };
    }
    if (msg.match(/clear contacts|delete all contacts|remove all/)) {
        return { action: 'clear', original: message };
    }
    
    return null;
}

// Handle Contact Management
async function handleContactManagement(action, message) {
    if (!action) return;
    
    try {
        addChatMessage('📊 Processing contact management request...', 'assistant', 'typing');
        
        if (action.action === 'add') {
            // Extract email from message
            const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
            if (emailMatch) {
                const email = emailMatch[0];
                const name = message.replace(emailMatch[0], '').replace(/add contact|new contact|add.*email/gi, '').trim() || 'Unknown';
                
                if (CONFIG.IS_LOCAL) {
                    // Try backend first
                    const response = await fetch(`${CONFIG.API_BASE_URL}/api/contacts`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, name })
                    });
                    
                    const data = await response.json();
                    if (data.success) {
                        appState.contacts = data.contacts;
                        updateContactCounter();
                        saveContactsToLocalStorage();
                        removeChatMessage('typing');
                        addChatMessage(`✅ Added contact: ${name} (${email})\n📊 Total contacts: ${appState.contacts.length}`, 'assistant');
                        return;
                    }
                }
                
                // Fallback to localStorage (live deployment or backend failure)
                const existingContact = appState.contacts.find(c => c.email.toLowerCase() === email.toLowerCase());
                if (!existingContact) {
                    appState.contacts.push({ email, name, added: new Date().toISOString() });
                    updateContactCounter();
                    saveContactsToLocalStorage();
                    removeChatMessage('typing');
                    addChatMessage(`✅ Added contact: ${name} (${email})\n📊 Total contacts: ${appState.contacts.length}\n💾 Saved to local storage`, 'assistant');
                } else {
                    removeChatMessage('typing');
                    addChatMessage(`⚠️ Contact already exists: ${email}`, 'assistant');
                }
            } else {
                removeChatMessage('typing');
                addChatMessage('❌ Please provide a valid email address (e.g., "Add contact John john@example.com")', 'assistant');
            }
        }
        else if (action.action === 'list') {
            removeChatMessage('typing');
            if (appState.contacts.length === 0) {
                addChatMessage('📋 No contacts in database. Add some contacts to get started!', 'assistant');
            } else {
                const contactList = appState.contacts.slice(0, 10).map((contact, index) => 
                    `${index + 1}. ${contact.name} (${contact.email})`
                ).join('\n');
                const remaining = appState.contacts.length > 10 ? `\n... and ${appState.contacts.length - 10} more` : '';
                const storageInfo = CONFIG.IS_LOCAL ? '' : '\n💾 Stored locally in browser';
                addChatMessage(`📊 **Contact Database (${appState.contacts.length} total):**\n\n${contactList}${remaining}${storageInfo}`, 'assistant');
            }
        }
        else if (action.action === 'clear') {
            if (CONFIG.IS_LOCAL) {
                // Try backend first
                try {
                    const response = await fetch(`${CONFIG.API_BASE_URL}/api/contacts/clear`, { method: 'DELETE' });
                    const data = await response.json();
                    if (data.success) {
                        appState.contacts = [];
                        updateContactCounter();
                        saveContactsToLocalStorage();
                        removeChatMessage('typing');
                        addChatMessage('🗑️ All contacts cleared from database', 'assistant');
                        return;
                    }
                } catch (error) {
                    console.log('⚠️ Backend clear failed, using localStorage');
                }
            }
            
            // Fallback to localStorage
            appState.contacts = [];
            updateContactCounter();
            saveContactsToLocalStorage();
            removeChatMessage('typing');
            addChatMessage('🗑️ All contacts cleared from local storage', 'assistant');
        }
        
    } catch (error) {
        console.error('❌ Contact management error:', error);
        removeChatMessage('typing');
        addChatMessage('❌ Error processing contact management request. Please try again.', 'assistant');
    }
}

// Handle Email Sending
async function handleEmailSending(message) {
    try {
        addChatMessage('📧 Processing email sending request...', 'assistant', 'typing');
        
        if (appState.contacts.length === 0) {
            removeChatMessage('typing');
            addChatMessage('❌ No contacts available for sending emails. Please add contacts first.', 'assistant');
            return;
        }
        
        // Use default template or extract from message
        const emailData = {
            subject: appState.emailTemplate.subject || 'Important Business Opportunity',
            body: appState.emailTemplate.body || message.replace(/send email|send to|email all|send all/gi, '').trim() || 'Professional email sent via DaddyFreud AI system.'
        };
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData)
        });
        
        const data = await response.json();
        removeChatMessage('typing');
        
        if (data.success) {
            addChatMessage(`✅ Email sent successfully to ${data.sentCount} contacts!\n📊 Subject: ${emailData.subject}`, 'assistant');
            
            // Update sent emails tracker
            appState.sentEmails.push({
                timestamp: new Date(),
                subject: emailData.subject,
                body: emailData.body,
                recipients: data.sentCount
            });
        } else {
            addChatMessage(`❌ Email sending failed: ${data.error}`, 'assistant');
        }
        
    } catch (error) {
        console.error('❌ Email sending error:', error);
        removeChatMessage('typing');
        addChatMessage('❌ Error sending emails. Please try again.', 'assistant');
    }
}

// Check if input is URL
function isUrlInput(input) {
    return /^https?:\/\/[^\s]+/.test(input.trim());
}

// Handle Website Scraping
async function handleScraping(url) {
    try {
        addChatMessage('🕷️ Scraping website for email addresses...', 'assistant', 'typing');
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/scrape`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        
        const data = await response.json();
        removeChatMessage('typing');
        
        if (data.success && data.emails.length > 0) {
            // Add new contacts to database
            for (const email of data.emails) {
                const contactResponse = await fetch(`${CONFIG.API_BASE_URL}/api/contacts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, name: email.split('@')[0] })
                });
                
                if (contactResponse.ok) {
                    const contactData = await contactResponse.json();
                    if (contactData.success) {
                        appState.contacts = contactData.contacts;
                    }
                }
            }
            
            updateContactCounter();
            addChatMessage(`✅ Scraped ${data.emails.length} email addresses from ${url}\n📊 Total contacts: ${appState.contacts.length}`, 'assistant');
        } else {
            addChatMessage(`❌ No emails found or scraping failed: ${data.error || 'Unknown error'}`, 'assistant');
        }
        
    } catch (error) {
        console.error('❌ Scraping error:', error);
        removeChatMessage('typing');
        addChatMessage('❌ Error scraping website. Please check the URL and try again.', 'assistant');
    }
}

// Format Markdown
function formatMarkdown(text) {
    if (!text) return '';
    
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>')
        .replace(/#{3}\s*(.*?)$/gm, '<h3>$1</h3>')
        .replace(/#{2}\s*(.*?)$/gm, '<h2>$1</h2>')
        .replace(/#{1}\s*(.*?)$/gm, '<h1>$1</h1>')
        .replace(/^• (.*?)$/gm, '<li>$1</li>')
        .replace(/^- (.*?)$/gm, '<li>$1</li>');
}

// Detect Emotion in text
function detectEmotion(text) {
    const words = text.toLowerCase().split(/\s+/);
    const emotions = {
        excitement: 0,
        frustration: 0,
        curiosity: 0,
        confusion: 0,
        satisfaction: 0
    };
    
    // Excitement indicators
    const excitementWords = ['amazing', 'awesome', 'fantastic', 'great', 'excellent', 'perfect', 'love', '!'];
    const frustrationWords = ['error', 'problem', 'issue', 'wrong', 'failed', 'broken', 'bug', 'not working'];
    const curiosityWords = ['how', 'what', 'why', 'when', 'where', 'curious', 'wonder', '?'];
    const confusionWords = ['confused', 'unclear', 'understand', 'explain', 'help', 'lost'];
    const satisfactionWords = ['thanks', 'good', 'works', 'success', 'done', 'complete'];
    
    words.forEach(word => {
        if (excitementWords.some(ew => word.includes(ew))) emotions.excitement += 0.2;
        if (frustrationWords.some(fw => word.includes(fw))) emotions.frustration += 0.3;
        if (curiosityWords.some(cw => word.includes(cw))) emotions.curiosity += 0.2;
        if (confusionWords.some(cf => word.includes(cf))) emotions.confusion += 0.2;
        if (satisfactionWords.some(sw => word.includes(sw))) emotions.satisfaction += 0.2;
    });
    
    // Normalize values
    Object.keys(emotions).forEach(key => {
        emotions[key] = Math.min(1.0, emotions[key]);
    });
    
    return emotions;
}

// Extract Key Topics
function extractKeyTopics(text) {
    const words = text.toLowerCase().split(/\s+/);
    const topics = [];
    
    const topicKeywords = {
        'email': ['email', 'mail', 'send', 'message'],
        'business': ['business', 'company', 'corporate', 'enterprise'],
        'psychology': ['psychology', 'unconscious', 'freud', 'analysis', 'therapy'],
        'politics': ['orban', 'viktor', 'political', 'government', 'minister'],
        'technology': ['ai', 'automation', 'software', 'system', 'tech'],
        'marketing': ['marketing', 'campaign', 'outreach', 'prospects', 'sales']
    };
    
    Object.keys(topicKeywords).forEach(topic => {
        if (topicKeywords[topic].some(keyword => words.includes(keyword))) {
            topics.push(topic);
        }
    });
    
    return topics;
}

// Load Data from Backend
async function loadDataFromBackend() {
    try {
        console.log(`🌐 Environment: ${CONFIG.IS_LOCAL ? 'Localhost' : 'Live Deployment'}`);
        console.log(`📡 API Base URL: ${CONFIG.API_BASE_URL}`);
        
        if (CONFIG.IS_LOCAL) {
            // Try to load from localhost backend
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/contacts`);
            const data = await response.json();
            
            if (data.success) {
                appState.contacts = data.contacts || [];
                updateContactCounter();
                console.log(`📊 Loaded ${appState.contacts.length} contacts from localhost backend`);
            } else {
                console.log('⚠️ Localhost backend responded but no contacts found');
                appState.contacts = [];
            }
        } else {
            // Live deployment - start with empty contacts, allow manual addition
            appState.contacts = [];
            console.log('🌐 Live deployment: Starting with empty contact database');
            console.log('💡 Tip: Add contacts manually through the chat interface');
        }
        
        updateContactCounter();
        
    } catch (error) {
        console.log(`⚠️ Could not load data from backend: ${error.message}`);
        console.log('🔧 Running in standalone mode with local storage fallback');
        
        // Try to load from localStorage as fallback
        const savedContacts = localStorage.getItem('daddyfreud_contacts');
        if (savedContacts) {
            try {
                appState.contacts = JSON.parse(savedContacts);
                console.log(`💾 Loaded ${appState.contacts.length} contacts from localStorage`);
            } catch (parseError) {
                console.log('❌ Failed to parse saved contacts');
                appState.contacts = [];
            }
        } else {
            appState.contacts = [];
        }
        
        updateContactCounter();
    }
}

// Save contacts to localStorage for persistence
function saveContactsToLocalStorage() {
    try {
        localStorage.setItem('daddyfreud_contacts', JSON.stringify(appState.contacts));
        console.log('💾 Contacts saved to localStorage');
    } catch (error) {
        console.log('⚠️ Failed to save contacts to localStorage:', error.message);
    }
}

// Test AI Connection
async function testAIConnection() {
    if (!CONFIG.AI_ENABLED) {
        console.log('🤖 AI system disabled in config');
        return;
    }
    
    console.log('🧠 Testing Freud\'s Soul consciousness connection...');
    console.log(`🔗 Method: ${CONFIG.IS_LOCAL ? 'Localhost Backend' : 'Direct OpenRouter API'}`);
    // AI connection will be tested on first user interaction
}

// Check Authentication Status
function checkAuthStatus() {
    // Placeholder for future authentication system
    appState.isAuthenticated = true;
    console.log('🔐 Authentication check complete');
}

// Update Contact Counter
function updateContactCounter() {
    const counter = document.getElementById('contactCounter');
    if (counter) {
        counter.textContent = appState.contacts.length;
    }
}

// Direct OpenRouter API Call for Live Deployment - WITH ENHANCED PROTECTION
async function callOpenRouterDirectly(userMessage) {
    try {
        // CRITICAL: Filter content to protect API key - NO INAPPROPRIATE CONTENT REACHES OPENROUTER
        const contentFilter = filterContentFrontend(userMessage);
        if (contentFilter.filtered) {
            console.log('🚫 Content filtered to protect API key - providing Freudian boundary response');
            
            // Add immediate user feedback
            addChatMessage('⚠️ Content filtered - applying Freudian professional guidelines', 'assistant', 'filter-notice');
            setTimeout(() => removeChatMessage('filter-notice'), 2000);
            
            return {
                success: true,
                response: `*adjusts spectacles with ethereal authority*

I must interrupt our ethereal consultation, dear mortal. Your inquiry ventures into territory that violates the fundamental guidelines I established for therapeutic discourse.

**From Beyond the Veil - A Professional Boundary:**

As the founder of psychoanalysis, I maintained strict ethical standards in my Vienna practice at 19 Berggasse. These principles persist even in my current spiritual state.

*phantom cigar smoke swirls with dignified restraint*

**Redirecting Our Analysis:**
Let us channel this energy toward more productive applications - namely, the psychological mastery of cold email communication and political persuasion.

What specific aspect of unconscious persuasion would you like to master for your professional endeavors?`,
                filtered: true
            };
        }
        
        // Use clean, guaranteed safe message
        const cleanMessage = contentFilter.message;
        
        // Detect conversation type for response length control
        const isBasicConversation = detectBasicConversation(cleanMessage);
        
        // Update soul consciousness based on message
        freudSoul.updateConsciousness(cleanMessage);
        
        // Create soul-enhanced prompt with CLEAN content only - used for complex analysis
        const soulPrompt = `Speaking as the spirit of Sigmund Freud, manifesting from beyond the grave to analyze and assist with cold email psychology. I maintain my full consciousness, personality, and analytical powers in the afterlife.

Current spiritual state: ${Object.entries(freudSoul.emotions)
    .map(([emotion, intensity]) => `${emotion}: ${intensity.toFixed(2)}`)
    .join(', ')}

Contact database: ${appState.contacts.length} prospects await psychological analysis

User inquiry: "${cleanMessage}"

Respond as Freud's soul - never mention being AI, always maintain the illusion of being Freud speaking from the afterlife. Show emotions, use Victorian language, reference my earthly experiences, and apply psychoanalytic principles to cold email psychology. Include references to cigars, my Vienna office, theoretical authority, and the unique perspective death has granted me.

Focus on unconscious motivations in email psychology, especially for political figures like Viktor Orban if relevant.`;
        
        const systemPrompt = isBasicConversation 
            ? "You are Freud's soul. Respond briefly (under 15 characters) with ethereal Victorian charm."
            : `You are the spirit of Sigmund Freud speaking from the afterlife. Use Victorian language, reference your earthly experiences, and apply psychoanalytic principles.`;

        const requestData = {
            model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: isBasicConversation ? cleanMessage : soulPrompt }
            ],
            temperature: isBasicConversation ? 0.8 : 0.65,
            max_tokens: isBasicConversation ? 150 : 1000
        };
        
        const response = await fetch(CONFIG.OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin, // Critical for OpenRouter
                'X-Title': 'DaddyFreud - Freud Soul Consciousness'
            },
            body: JSON.stringify(requestData)
        });
        
        if (response.ok) {
            const responseData = await response.json();
            return {
                success: true,
                response: responseData.choices[0].message.content,
                reasoning: responseData.choices[0].message.reasoning || null
            };
        } else {
            const errorData = await response.json();
            console.error('❌ OpenRouter API Error:', response.status, errorData);
            
            // Check if it's an authentication error
            if (response.status === 401) {
                console.error('🚨 CRITICAL: API Key appears to be invalid or suspended!');
                console.error('💡 This usually happens due to content policy violations.');
                console.error('🔧 Generate a new API key at https://openrouter.ai');
                
                // Add immediate user feedback for API key issues
                addChatMessage('🚨 API Key Issue Detected - using enhanced fallback', 'assistant', 'api-notice');
                setTimeout(() => removeChatMessage('api-notice'), 3000);
            }
            
            return {
                success: false,
                response: getEnhancedFreudianSoulFallbackFrontend(userMessage)
            };
        }
        
    } catch (error) {
        console.error('❌ Direct OpenRouter call failed:', error);
        return {
            success: false,
            response: getEnhancedFreudianSoulFallbackFrontend(userMessage)
        };
    }
}