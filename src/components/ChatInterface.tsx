import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, RefreshCw, Languages, Info, ArrowRight, User, ArrowLeft, Volume2, VolumeX, Trash2, Phone } from 'lucide-react';
import type { Message, EmergencyCategory, Language, MedicalProfile, HelplineItem } from '../types';
import { HELPLINES } from './HelplineList';

interface ChatInterfaceProps {
  language: Language;
  onLanguageToggle: () => void;
  activeCategory: EmergencyCategory;
  onChangeCategory: (cat: EmergencyCategory) => void;
  locationName: string;
  medicalProfile: MedicalProfile;
  initialQuery?: string;
  onClearInitialQuery?: () => void;
  onBackToHome?: () => void;
  onInitiateCall?: (item: HelplineItem) => void;
  voiceOptimized?: boolean;
}

// A helper to find matching helplines inside text
const findHelplinesInText = (text: string): HelplineItem[] => {
  if (!text) return [];
  return HELPLINES.filter(item => {
    const number = item.number;
    const regex = new RegExp(`\\b${number}\\b`);
    return regex.test(text) || text.includes(` ${number} `) || text.includes(`(${number})`) || text.includes(`:${number}`) || text.includes(`-${number}`);
  });
};

const CATEGORY_TAGLINES: Record<EmergencyCategory, { en: string; hi: string }> = {
  cyber: { en: 'Cyber Crime Triage', hi: 'साइबर अपराध प्रभाग' },
  medical: { en: 'Medical First-Responder AI', hi: 'चिकित्सा प्राथमिक उपचार' },
  women: { en: 'Women Safety Desk', hi: 'महिला सुरक्षा काउंटर' },
  police: { en: 'Police Dispatch Liaison', hi: 'पुलिस सुरक्षा डेस्क' },
  lost: { en: 'Lost Document Registry', hi: 'सामान&दस्तावेज रिकवरी' },
  fire: { en: 'Fire Outbreak Advisor', hi: 'अग्निकांड सुरक्षा प्रकोष्ठ' },
  disaster: { en: 'Disaster Management Cell', hi: 'आपदा प्रबंधन डेस्क' },
  legal: { en: 'Legal Rights Advisor', hi: 'मुफ्त कानूनी विधिक सेवा' },
};

const SUGGESTED_ALERT_PROMPTS: Record<EmergencyCategory | 'general', { en: string[]; hi: string[] }> = {
  general: {
    en: ['How do I report a robbery?', 'Help with emergency preparedness list', 'What is 112 helpline?'],
    hi: ['चोरी की रिपोर्ट कैसे करें?', 'आपातकालीन तैयारी सूची की सहायता', '112 हेल्प सेवाएं क्या हैं?']
  },
  cyber: {
    en: ['Someone stole money from my bank', 'My social media account is hacked', 'Check suspicious link safety'],
    hi: ['मेरे बैंक खाते से पैसे चोरी हो गए हैं', 'मेरा सोशल मीडिया हैक हो गया है', 'संदेहास्पद लिंक की जांच करें']
  },
  medical: {
    en: ['How to perform CPR?', 'Treat deep bleeding cut', 'Help: Patient is suffering heatstroke'],
    hi: ['सीपीआर (CPR) कैसे दें?', 'गहरे घाव का खून कैसे रोकें?', 'रोगी को लू लग गई है, क्या करें?']
  },
  women: {
    en: ['Safety steps while taking a late night cab', 'Report public harassment', 'Share emergency location trail'],
    hi: ['रात को अकेले कैब लेते हुए सुरक्षा कदम', 'रास्ते की छेड़छाड़ की रिपोर्ट', 'इमरजेंसी लोकेशन कैसे साझा करें']
  },
  police: {
    en: ['What details are needed for an FIR?', 'Someone is following me home', 'No-entry road safety rule query'],
    hi: ['एफआईआर (FIR) के लिए क्या आवश्यक है?', 'कोई मेरा पीछा कर रहा है', 'सड़क सुरक्षा नियमों की जानकारी']
  },
  lost: {
    en: ['Lost Aadhaar & PAN card help', 'Is online NCR FIR legally valid?', 'Lost mobile tracking steps'],
    hi: ['खोया आधार और पैन कार्ड रिकवरी', 'क्या ऑनलाइन एनसीआर एफआईआर मान्य है?', 'गुम फोन ट्रैक करने के कदम']
  },
  fire: {
    en: ['Fire in kitchen electrical wire', 'How to exit full smoke corridors?', 'Correct fire extinguisher use'],
    hi: ['रसोई के बिजली के तार में आग', 'धुएं से भरे गलियारे से कैसे निकलें?', 'फायर बुझाने यंत्र का सही उपयोग']
  },
  disaster: {
    en: ['Safety guidelines for heavy floods', 'Earthquake drop cover instructions', 'NDMA shelter list rules'],
    hi: ['भारी बाढ़ में सुरक्षा निर्देश', 'भूकंप के झटके लगने पर कदम', 'एनडीआरएफ सुरक्षित शिविर नियम']
  },
  legal: {
    en: ['Can police arrest women at night?', 'What is zero FIR?', 'NALSA free lawyer application'],
    hi: ['क्या पुलिस महिला को रात में पकड़ सकती है?', 'जीरो एफआईआर (Zero FIR) क्या है?', 'मुफ्त सरकारी वकील की अर्जी']
  }
};

export default function ChatInterface({
  language,
  onLanguageToggle,
  activeCategory,
  onChangeCategory,
  locationName,
  medicalProfile,
  initialQuery,
  onClearInitialQuery,
  onBackToHome,
  onInitiateCall,
  voiceOptimized,
}: ChatInterfaceProps) {
  
  // Custom Welcome generator incorporating signed accounts
  const generateWelcomeMessage = (cat: EmergencyCategory): Message => {
    const isGuest = medicalProfile.fullName === 'Arjun Sharma' || !medicalProfile.fullName;
    const nameStrEn = isGuest ? "guest" : `registered citizen **${medicalProfile.fullName}**`;
    const nameStrHi = isGuest ? "अतिथि" : `पंजीकृत नागरिक **${medicalProfile.fullName}**`;
    
    return {
      id: 'welcome-msg',
      sender: 'ai',
      text: `Hello, I am Sahayak, your Emergency AI. Authenticated as ${nameStrEn}. Syncing telemetry for **${CATEGORY_TAGLINES[cat].en}** in location: **${locationName}**. State your situation, I can speak and write answers in English/Hindi. Stay calm.`,
      textHindi: `नमस्ते, मैं सहायक हूँ, आपका आपातकालीन एआई। आप ${nameStrHi} के रूप में प्रमाणित हैं। **${locationName}** में **${CATEGORY_TAGLINES[cat].hi}** से टेलीमेट्री सक्रिय कर ली गई है। मुझे स्थिति बताएं, मैं हिंदी और अंग्रेजी दोनों में बोल और लिख सकता हूँ।`,
      timestamp: new Date(),
    };
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Text to Speech States
  const [ttsAutoEnabled, setTtsAutoEnabled] = useState(voiceOptimized || false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync ttsAutoEnabled if voiceOptimized updates from parent
  useEffect(() => {
    if (voiceOptimized) {
      setTtsAutoEnabled(true);
    }
  }, [voiceOptimized]);

  // Initialize welcomed msg
  useEffect(() => {
    const welcome = generateWelcomeMessage(activeCategory);
    setMessages([welcome]);
    if (voiceOptimized) {
      setTimeout(() => {
        const speechBody = (language === 'hi' && welcome.textHindi) ? welcome.textHindi : welcome.text;
        handleSpeakText(welcome.id, speechBody);
      }, 600);
    }
  }, [activeCategory]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load initial queries from Home Search
  useEffect(() => {
    if (initialQuery && initialQuery.trim() !== '') {
      handleSendPrompt(initialQuery);
      if (onClearInitialQuery) {
        onClearInitialQuery();
      }
    }
  }, [initialQuery]);

  // Cancel former synthesis when switching screens or unmounting
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Web Speech synthesis trigger
  const handleSpeakText = (id: string, textToSpeak: string) => {
    if (speakingMsgId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean text from markdown & emojis for a fluid vocalization
    const cleanText = textToSpeak
      .replace(/\*\*|\*/g, '')
      .replace(/###|##/g, '')
      .replace(/•/g, ', ')
      .replace(/🚨|🚑|🌸|👮|📁|🔥|🌧️|⚖️/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Choose appropriate voice/locale
    if (language === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN'; // Indian-English or standard english fallback
    }

    utterance.onend = () => {
      setSpeakingMsgId(null);
    };

    utterance.onerror = () => {
      setSpeakingMsgId(null);
    };

    setSpeakingMsgId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Convert incoming replies instantly to voice if enabled
  const triggerAutoSpeechIfEnabled = (aiMsg: Message) => {
    if (ttsAutoEnabled) {
      const speechBody = (language === 'hi' && aiMsg.textHindi) ? aiMsg.textHindi : aiMsg.text;
      handleSpeakText(aiMsg.id, speechBody);
    }
  };

  const handleSendPrompt = async (text: string) => {
    if (!text || text.trim() === '') return;

    // Stop former audios
    window.speechSynthesis.cancel();
    setSpeakingMsgId(null);

    const userMsg: Message = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      sender: 'user',
      text: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const conversationToSend = [...messages, userMsg]
        .filter(m => m.sender !== 'system')
        .map(m => ({
          sender: m.sender,
          text: m.text
        }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationToSend,
          category: activeCategory,
          language: language,
          locationName: locationName,
          medicalProfile: medicalProfile,
        }),
      });

      const data = await res.json();
      
      const aiMsg: Message = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        sender: 'ai',
        text: data.text || "No reply processed. Please call 112.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      
      // Auto-vocalize
      if (ttsAutoEnabled) {
        triggerAutoSpeechIfEnabled(aiMsg);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const aiMsg: Message = {
        id: `ai-err-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        sender: 'ai',
        text: `Connection disrupted. Please review local emergency services. If you are facing physical hazard, dial numbers: ${activeCategory === 'cyber' ? '1930' : (activeCategory === 'medical' ? '102' : '112')} immediately.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      if (ttsAutoEnabled) {
        triggerAutoSpeechIfEnabled(aiMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Explicit Clear Chat history action
  const handleClearChatHistory = () => {
    window.speechSynthesis.cancel();
    setSpeakingMsgId(null);
    setMessages([
      {
        id: `welcome-clear-${activeCategory}`,
        sender: 'ai',
        text: `History cleared completely. Consultation refreshed with ${CATEGORY_TAGLINES[activeCategory].en} regarding area ${locationName}. Enquire your query now.`,
        textHindi: `चैट इतिहास साफ़ कर दिया गया है। ${locationName} क्षेत्र के संबंध में ${CATEGORY_TAGLINES[activeCategory].hi} सक्रिय है। प्रश्न पूछें।`,
        timestamp: new Date(),
      },
    ]);
  };

  const activeSuggests = SUGGESTED_ALERT_PROMPTS[activeCategory] || SUGGESTED_ALERT_PROMPTS.general;
  const suggestions = language === 'hi' ? activeSuggests.hi : activeSuggests.en;

  return (
    <div id="ai-chat-interface" className="flex flex-col h-[calc(100vh-12rem)] max-h-[800px] bg-slate-900/40 glass-card rounded-2xl border border-white/10 overflow-hidden relative shadow-2xl">
      
      {/* Top Header Controls with Navigation & Clear Utilities */}
      <div className="p-4 bg-slate-950/50 border-b border-white/10 flex items-center justify-between gap-3 relative z-10">
        
        {/* Left Side: Go Back link & Title */}
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <button
              id="back-to-home-btn"
              onClick={onBackToHome}
              className="p-2 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Return to Dashboard"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline font-sans text-xs font-bold">{language === 'hi' ? 'पीछे जाएं' : 'Back'}</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-2 rounded h-5 bg-gradient-to-t from-pink-500 to-indigo-500 animate-pulse shrink-0" />
            <div>
              <span className="font-mono text-[9px] uppercase text-indigo-300 font-bold tracking-widest block leading-none">
                {language === 'hi' ? 'एआई सहायिका कंसल्टेशन' : 'SAHAYAK SECURE COMPANION'}
              </span>
              <span className="font-sans font-extrabold text-xs sm:text-sm text-white tracking-tight mt-0.5 inline-block">
                {language === 'hi' ? CATEGORY_TAGLINES[activeCategory].hi : CATEGORY_TAGLINES[activeCategory].en}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Language Switcher, TTS Global, & Clear */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Universal Read Aloud Speech Switcher */}
          <button
            onClick={() => {
              if (ttsAutoEnabled) {
                window.speechSynthesis.cancel();
                setSpeakingMsgId(null);
              }
              setTtsAutoEnabled(!ttsAutoEnabled);
            }}
            className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              ttsAutoEnabled
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow'
                : 'bg-white/5 border-white/10 hover:border-white/20 text-white/70'
            }`}
            title={ttsAutoEnabled ? "Disable automatic speak" : "Enable automatic verbal response"}
          >
            {ttsAutoEnabled ? <Volume2 size={13} className="animate-bounce" /> : <VolumeX size={13} />}
            <span className="hidden md:inline">{language === 'hi' ? (ttsAutoEnabled ? 'आवाज चालू' : 'आवाज बंद') : (ttsAutoEnabled ? 'SPEECH ON' : 'SPEECH OFF')}</span>
          </button>

          <button
            onClick={onLanguageToggle}
            className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-indigo-400 font-mono text-[10px] text-indigo-300 transition-colors cursor-pointer"
          >
            {language === 'en' ? 'EN' : 'हिंदी'}
          </button>

          {/* Explicit Clear Chat history option */}
          <button
            id="clear-history-chatbot-btn"
            onClick={handleClearChatHistory}
            className="p-1.5 px-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:text-red-300 text-red-400 font-sans text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
            title="Clear Chat History"
          >
            <Trash2 size={12} />
            <span className="hidden sm:inline">{language === 'hi' ? 'इतिहास साफ करें' : 'Clear Chat'}</span>
          </button>
        </div>
      </div>

      {/* Category Selection Carousel inside chat */}
      <div className="p-2 bg-slate-950/30 border-b border-white/10 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0 select-none">
        {(['cyber', 'medical', 'women', 'police', 'lost', 'fire', 'disaster', 'legal'] as EmergencyCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => onChangeCategory(cat)}
            className={`px-3 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wide transition-all shrink-0 cursor-pointer ${
              activeCategory === cat
                ? 'bg-gradient-to-tr from-pink-500 to-indigo-500 text-white border-none shadow'
                : 'bg-white/5 border border-white/5 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            {language === 'hi' 
              ? cat.replace('cyber', 'साइबर').replace('medical', 'चिकित्सा').replace('women', 'महिला').replace('police', 'पुलिस').replace('lost', 'गुम सामान').replace('fire', 'अग्निकांड').replace('disaster', 'आपदा').replace('legal', 'कानूनी')
              : cat}
          </button>
        ))}
      </div>

      {/* Main Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
        {messages.map((msg) => {
          if (msg.sender === 'system') {
            return (
              <div key={msg.id} className="flex items-center justify-center py-1">
                <span className="bg-white/5 border border-white/10 font-mono text-[9px] text-white/60 px-3 py-1 rounded-md flex items-center gap-1.5 shadow-sm uppercase tracking-wide">
                  <Info size={10} className="text-indigo-400 animate-pulse" />
                  <span>{language === 'hi' ? msg.textHindi : msg.text}</span>
                </span>
              </div>
            );
          }

          const isAi = msg.sender === 'ai';
          const bodyText = (language === 'hi' && msg.textHindi) ? msg.textHindi : msg.text;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${isAi ? 'mr-auto items-start' : 'ml-auto flex-row-reverse items-start'}`}
            >
              {/* Avatar marker */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow border ${
                isAi 
                  ? 'bg-gradient-to-tr from-pink-500 to-indigo-500 border-none text-white' 
                  : 'bg-white/10 border-white/10 text-white'
              }`}>
                {isAi ? <Sparkles size={13} className="animate-pulse" /> : <User size={13} />}
              </div>

              {/* Text Bubble with Integrated Audio Speeches */}
              <div className="flex flex-col gap-1">
                <div className={`rounded-2xl p-4 shadow-md relative ${
                  isAi
                    ? 'bg-white/5 border border-white/10 text-white rounded-tl-sm'
                    : 'bg-indigo-600 text-white rounded-tr-sm font-semibold'
                }`}>
                  
                  {/* Floating Speaker Trigger for Assistant responses */}
                  {isAi && (
                    <button
                      onClick={() => handleSpeakText(msg.id, bodyText)}
                      className={`absolute right-3 top-3 p-1.5 rounded-lg border transition-all cursor-pointer ${
                        speakingMsgId === msg.id
                          ? 'bg-emerald-500 border-emerald-400 text-white scale-110 animate-pulse'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/60 hover:text-white'
                      }`}
                      title="Read out load / जोर से सुनें"
                    >
                      {speakingMsgId === msg.id ? <Volume2 size={12} /> : <VolumeX size={12} />}
                    </button>
                  )}

                  {/* Body Text */}
                  <div className={`font-sans text-xs md:text-sm whitespace-pre-wrap leading-relaxed tracking-wide ${isAi ? 'pr-8' : ''}`}>
                    {bodyText}
                  </div>

                  {/* Verbalizer Visual Wave */}
                  {isAi && speakingMsgId === msg.id && (
                    <div className="flex items-center gap-0.5 mt-3 pt-2.5 border-t border-white/15">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                      <span className="font-mono text-[8px] text-emerald-400 uppercase tracking-widest font-black ml-1.5">Speaking Loud / बोल रहा है</span>
                    </div>
                  )}

                  {/* Automatic Detected Helpline Calling buttons tray */}
                  {isAi && onInitiateCall && (() => {
                    const matchedHelplines = findHelplinesInText(bodyText);
                    if (matchedHelplines.length === 0) return null;
                    return (
                      <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-col gap-2">
                        <span className="font-mono text-[9px] text-[#38bdf8] uppercase tracking-widest font-bold">
                          {language === 'hi' ? '🚨 सहायक त्वरित डायलर - कॉल उपलब्ध' : '🚨 SAHAYAK FAST DIALER: CALL AVAILABLE'}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {matchedHelplines.map((item) => (
                            <button
                              key={item.id}
                              id={`chat-dial-btn-${item.number}`}
                              onClick={() => onInitiateCall(item)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-300 font-sans text-xs font-bold flex items-center gap-2 cursor-pointer hover:scale-103 active:scale-97 transition-all shadow-md"
                            >
                              <Phone size={11} className="text-indigo-400 shrink-0" fill="currentColor" />
                              <span>
                                {language === 'hi' 
                                  ? `कॉल करें: ${item.nameHi.split('(')[0]} (${item.number})` 
                                  : `Call ${item.nameEn} (${item.number})`}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                </div>
                <span className="font-mono text-[9px] text-white/40 self-end px-1 mt-0.5">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {/* Loading Message Indicator */}
        {isLoading && (
          <div className="flex gap-3 mr-auto items-start max-w-[75%]">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center shrink-0">
              <RefreshCw size={14} className="animate-spin text-pink-400" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-4 text-white">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase text-indigo-300 font-bold animate-pulse">
                  {language === 'hi' ? 'सहायक एआई संज्ञान ले रहा है...' : 'Sahayak Advisor is formulating steps...'}
                </span>
              </div>
              <div className="flex gap-1.5 items-center mt-3">
                <span className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Emergency prompt quick tags */}
      <div className="p-3 bg-slate-950/20 border-t border-white/10 flex gap-2 overflow-x-auto scrollbar-none shrink-0 relative z-10 select-none">
        {suggestions.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendPrompt(prompt)}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-sans text-xs text-left shrink-0 max-w-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow"
          >
            <ArrowRight size={11} className="text-pink-400 shrink-0" />
            <span className="truncate">{prompt}</span>
          </button>
        ))}
      </div>

      {/* Triage Inputs box */}
      <div className="p-4 bg-slate-950/40 border-t border-white/10 relative z-10 shrink-0">
        <form
          className="flex items-center gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt(inputText);
          }}
        >
          <input
            id="chat-input"
            type="text"
            className="flex-1 bg-white/5 border border-white/10 focus:border-indigo-500 focus:ring-0 rounded-xl px-4 py-3 text-white font-sans text-sm outline-none placeholder:text-white/30"
            placeholder={
              language === 'hi'
                ? 'क्या हुआ? विवरण लिखें...'
                : 'Write your situation... (e.g., deep finger bleed, ATM card scam, road accidents)'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
          />
          <button
            id="chat-send-btn"
            type="submit"
            className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50 hover:scale-103 active:scale-95 duration-100 shadow shrink-0 cursor-pointer"
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={18} fill="currentColor" />
          </button>
        </form>
      </div>

    </div>
  );
}
