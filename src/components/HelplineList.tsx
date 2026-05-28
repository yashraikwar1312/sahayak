import React, { useState, useEffect } from 'react';
import { Phone, Search, X, Volume2, Shield, Activity, Heart, User, Sparkles, Compass } from 'lucide-react';
import type { HelplineItem, ActiveCallState, Language } from '../types';
import { EMERGENCY_NUMBERS } from '../data/emergencyNumbers';

export interface HelplineListProps {
  language: Language;
  locationName: string;
  callState?: ActiveCallState;
  onInitiateCall?: (item: HelplineItem) => void;
  onEndCall?: () => void;
}

export const HELPLINES: HelplineItem[] = EMERGENCY_NUMBERS.map((n) => ({
  id: n.id,
  nameEn: n.nameEn,
  nameHi: n.nameHi,
  number: n.number,
  // Cast category to the local HelplineItem category (broader categories may exist in the source list)
  category: (n.category as unknown) as any,
  descriptionEn: n.descriptionEn,
  descriptionHi: n.descriptionHi,
} as HelplineItem));

export const MOCK_RESPONDER_SPEECH: Record<string, { en: string; hi: string }> = {
  '112': {
    en: "Namaste, this is 112 Unified Command Center. We have locked your GPS area. Tell us: do you need POLICE, AMBULANCE, or FIRE response? Live dispatchers are routing units.",
    hi: "नमस्ते, यह 112 एकीकृत कमांड सेंटर है। हमने आपकी जीपीएस लोकेशन प्राप्त कर ली है। बताएं: आपको पुलिस, एम्बुलेंस, या दमकल की सहायता चाहिए? हमारे यूनिट रवाना हो रहे हैं।"
  },
  '100': {
    en: "Delhi Police Control Room, Officer Deshmukh reporting. State your nearest monument or landmark and description of any immediate threat. Security patrol is being notified.",
    hi: "दिल्ली पुलिस कंट्रोल रूम, अधिकारी देशमुख बोल रहे हैं। अपने स्थान और खतरे की संक्षिप्त जानकारी दें। नजदीकी पुलिस बियरर आपके पास पहुंच रहा है।"
  },
  '1930': {
    en: "National Cyber Fraud Center. If this is a banking transaction compromise inside golden hour (24 hours), state your bank name and transaction ID immediately so we can freeze the flow.",
    hi: "राष्ट्रीय साइबर वित्तीय अपराध प्रभाग। यदि यह घटना पिछले २४ घंटों की है, तो तुरंत अपने बैंक का नाम और ट्रांजैक्शन आईडी बताएं ताकि फ्रॉड ट्रांसफर ब्लॉक किया जा सके।"
  },
  '1091': {
    en: "Sahayak Women Safety Kiosk. Please remain on line, our responder Priya is checking safe coordinates near you. If you are in transit, keep speaking your route aloud.",
    hi: "सहायक महिला हेल्प डेस्क। कृपया लाइन पर बनी रहें, हमारी परामर्शदाता प्रिया आपकी सुरक्षित लोकेशन सहेज रही हैं। यदि राह चलते कोई खतरा है तो तेज आवाज में बात जारी रखें।"
  },
  '102': {
    en: "ER Ambulance Dispatch. Please clarify: is the patient responsive? Are they breathing? We have routed the nearest trauma transport. Keep the patient warm and on flat ground.",
    hi: "राजकीय एम्बुलेंस कमांड डेस्क। कृपया स्पष्ट करें: क्या रोगी होश में है और सांस चल रही है? आपातकालीन एम्बुलेंस रवाना की जा चुकी है, रोगी को समतल स्थान पर आराम से लिटाएं।"
  },
  '101': {
    en: "State Fire Emergency Brigade dispatcher. Inform us if the flames have touched electrical panels, gas cylinders, or if any senior is stranded. Exit building immediately.",
    hi: "दमकल आपातकालीन सेवा। बताएं कि आग कहां लगी है और क्या कोई अंदर फंसा हुआ है? बहुमंजिला इमारतों में लिफ्ट की जगह हमेशा सीढ़ियों का इस्तेमाल करें।"
  },
  '1078': {
    en: "NDRF Disaster Relief Desk. Please clarify if you are facing flash floods, water-logging, or wind damage. We are deploying search teams equipped with emergency boats.",
    hi: "एनडीआरएफ राष्ट्रीय आपदा सेल। बाढ़, जलभराव या इमारत क्षति की स्थिति बताएं। राहत लाइफबोट टीमें आपकी लोकेशन की ओर प्रस्थान कर रही हैं।"
  }
};

export default function HelplineList({ 
  language, 
  locationName,
  callState: propCallState,
  onInitiateCall,
  onEndCall
}: HelplineListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'police' | 'medical' | 'cyber' | 'women' | 'fire'>('all');
  
  // Custom interactive call simulator states
  const [localCallState, setLocalCallState] = useState<ActiveCallState>({
    active: false,
    number: '',
    name: '',
    status: 'dialing',
    duration: 0
  });

  const callState = propCallState || localCallState;

  // Call duration ticker
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState.active && callState.status === 'connected' && !propCallState) {
      interval = setInterval(() => {
        setLocalCallState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState.active, callState.status, propCallState]);

  // Handle call simulation transitions
  useEffect(() => {
    let connectTimeout: NodeJS.Timeout;

    if (callState.active && callState.status === 'dialing' && !propCallState) {
      connectTimeout = setTimeout(() => {
        const number = callState.number;
        const dialogue = MOCK_RESPONDER_SPEECH[number] || {
          en: "SAHAYAK Integrated Emergency Hotline Service. Representative connected. State your name and crisis location, dispatching active response.",
          hi: "सहायक एकीकृत आपात सेवा परामर्श केंद्र। हम सुन रहे हैं, कृपया अपनी समस्या और स्थान बताएं ताकि सहायता बल रवाना किया जा सके।"
        };
        let bSpeech = language === 'hi' ? dialogue.hi : dialogue.en;
        
        // Inject current location context into the speech for helpline centers
        const coordsStr = localStorage.getItem('sahayak_custom_location_coords') || '28.6139° N, 77.2090° E';
        if (language === 'hi') {
          bSpeech = `[लोकेशन ट्रांसमिशन लॉक: ${locationName} (${coordsStr})] — ` + bSpeech;
        } else {
          bSpeech = `[GPS TARGET LOCKED: ${locationName} (${coordsStr})] — ` + bSpeech;
        }

        setLocalCallState(prev => ({
          ...prev,
          status: 'connected',
          responderSpeech: bSpeech
        }));
      }, 2500); // 2.5 seconds ringing simulation
    }

    return () => {
      clearTimeout(connectTimeout);
    };
  }, [callState.active, callState.status, callState.number, language, locationName, propCallState]);

  const initiateCall = (item: HelplineItem) => {
    if (onInitiateCall) {
      onInitiateCall(item);
      return;
    }
    setLocalCallState({
      active: true,
      number: item.number,
      name: language === 'hi' ? item.nameHi : item.nameEn,
      status: 'dialing',
      duration: 0
    });
  };

  const endCall = () => {
    if (onEndCall) {
      onEndCall();
      return;
    }
    setLocalCallState(prev => ({
      ...prev,
      status: 'completed'
    }));
    setTimeout(() => {
      setLocalCallState({ active: false, number: '', name: '', status: 'dialing', duration: 0 });
    }, 1000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter list
  const filteredHelplines = HELPLINES.filter(item => {
    const title = language === 'hi' ? item.nameHi : item.nameEn;
    const desc = language === 'hi' ? item.descriptionHi : item.descriptionEn;
    
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.number.includes(searchQuery) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    return item.category === selectedFilter && matchesSearch;
  });

  return (
    <div id="helplines-pane" className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="font-sans font-extrabold text-2xl text-on-surface tracking-tight">
          {language === 'hi' ? 'आपातकालीन राष्ट्रीय हेल्पलाइन्स' : 'Official Emergency Helplines'}
        </h2>
        <p className="font-sans text-xs text-on-surface-variant/80 -mt-2">
          {language === 'hi' ? 'टोल-फ्री सीधी भारत सरकार की आधिकारिक हेल्पलाइन सूचियां और प्रतिक्रिया केंद्र।' : 'Direct, toll-free 24/7 central and state response centers. Instant routing.'}
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 relative">
        <div className="flex-1 glass-card rounded-xl px-4 py-3 flex items-center neon-border gap-3 bg-surface-container-low/40">
          <Search size={20} className="text-on-surface-variant/70 shrink-0" />
          <input
            type="text"
            className="bg-transparent border-none outline-none focus:ring-0 text-white font-sans text-sm w-full placeholder:text-on-surface-variant/40"
            placeholder={language === 'hi' ? 'हेल्पलाइन खोजें (उदा: 112, पुलिस)...' : "Search number, department, keyword..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-0.5 hover:bg-white/10 rounded-full">
              <X size={14} className="text-on-surface-variant" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
        {['all', 'police', 'medical', 'cyber', 'women', 'fire'].map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter as any)}
            className={`px-3 py-1.5 rounded-full font-sans text-xs font-semibold shrink-0 border transition-all ${
              selectedFilter === filter
                ? 'bg-primary-container border-primary text-white shadow-md'
                : 'bg-surface-container border-white/5 text-on-surface-variant/80 hover:bg-surface-container-high hover:text-white'
            }`}
          >
            {filter === 'all' && (language === 'hi' ? 'सभी हेल्पलाइन्स' : 'All')}
            {filter === 'police' && (language === 'hi' ? 'पुलिस' : 'Police')}
            {filter === 'medical' && (language === 'hi' ? 'मेडिकल' : 'Medical')}
            {filter === 'cyber' && (language === 'hi' ? 'साइबर क्राइम' : 'Cyber Crime')}
            {filter === 'women' && (language === 'hi' ? 'महिला सुरक्षा' : 'Women Safety')}
            {filter === 'fire' && (language === 'hi' ? 'फायर दमकल' : 'Fire')}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredHelplines.map((item) => (
          <div
            key={item.id}
            className="glass-card rounded-xl p-4 flex items-center justify-between gap-4 border border-white/5 bg-surface-container-low/20 hover:border-white/15 transition-all"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">
                  {item.number}
                </span>
                <h3 className="font-sans font-bold text-on-surface text-sm truncate uppercase tracking-tight">
                  {language === 'hi' ? item.nameHi : item.nameEn}
                </h3>
              </div>
              <p className="font-sans text-xs text-on-surface-variant/80 mt-2 leading-relaxed">
                {language === 'hi' ? item.descriptionHi : item.descriptionEn}
              </p>
            </div>
            <button
              id={`dial-btn-${item.number}`}
              onClick={() => initiateCall(item)}
              className="w-11 h-11 rounded-xl bg-primary-container text-white flex items-center justify-center shadow-lg active:scale-90 duration-150 transition-all cursor-pointer hover:bg-primary"
            >
              <Phone size={18} fill="currentColor" />
            </button>
          </div>
        ))}

        {filteredHelplines.length === 0 && (
          <div className="text-center py-10 glass-card rounded-xl border border-white/5">
            <p className="font-sans text-sm text-on-surface-variant/60">
              {language === 'hi' ? 'कोई हेल्पलाइन परिणाम नहीं मिला।' : 'No helpline numbers match your parameters.'}
            </p>
          </div>
        )}
      </div>

      {/* Calling Screen Overlay Simulator */}
      {callState.active && !propCallState && (
        <div className="fixed inset-0 bg-surface/98 backdrop-blur-3xl z-[100] flex flex-col justify-between p-8 text-center animate-fade-in animate-duration-300">
          {/* Header */}
          <div className="flex flex-col items-center mt-12">
            <div className="w-20 h-20 rounded-full bg-primary/15 border-2 border-primary/20 flex items-center justify-center animate-pulse mb-6 text-primary">
              <Compass size={40} className="animate-spin-slow" />
            </div>
            <p className="font-mono text-xs font-bold uppercase text-secondary tracking-widest bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">
              {callState.status === 'dialing' 
                ? (language === 'hi' ? 'मॉक इमरजेंसी डायलिंग...' : 'MOCK EMERGENCY DIALING...') 
                : (callState.status === 'connected' 
                  ? (language === 'hi' ? 'सक्रिय कनेक्शन' : 'ACTIVE EMERGENCY CONNECTION') 
                  : (language === 'hi' ? 'कॉल समाप्त' : 'CALL TERMINATED'))}
            </p>
            <h2 className="font-sans font-extrabold text-white text-2xl mt-4 max-w-sm">
              {callState.name}
            </h2>
            <p className="font-mono text-3xl font-black text-primary/90 mt-2">
              {callState.number}
            </p>
            {callState.status === 'connected' && (
              <p className="font-mono text-lg font-bold text-secondary mt-3 bg-secondary/5 px-4 py-1 rounded-full border border-secondary/10">
                {formatDuration(callState.duration)}
              </p>
            )}
          </div>

          {/* Live location transmission widget */}
          <div className="max-w-md mx-auto w-full bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between text-left shadow-lg scale-95 md:scale-100 transition-all select-none">
            <div className="flex items-center gap-3 min-w-0">
              <span className="relative flex h-3.5 w-3.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <div className="min-w-0">
                <h4 className="font-sans font-extrabold text-[10px] text-emerald-400 uppercase tracking-widest leading-none">
                  {language === 'hi' ? 'वास्तविक समय उपग्रह स्थान संचरण' : 'LIVE GPS TELEMETRY DIRECT TRANSCEIVER'}
                </h4>
                <p className="font-sans font-bold text-sm text-white mt-1.5 truncate">
                  {locationName}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="font-mono text-[10px] text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
                    {localStorage.getItem('sahayak_custom_location_coords') || '28.6139° N, 77.2090° E'}
                  </span>
                  <span className="font-mono text-[9px] text-[#93c5fd] truncate">
                    {language === 'hi' ? '✓ आपातकालीन सर्वर सक्रिय' : '✓ 112 Control Room Link'}
                  </span>
                </div>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1 font-mono text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1.5 rounded font-black tracking-wider uppercase animate-pulse">
              <span>{language === 'hi' ? 'सक्रिय' : 'LIVE'}</span>
              <span>GPS SYNC✓</span>
            </div>
          </div>

          {/* Interactive Dialogue Visualizer */}
          <div className="max-w-md mx-auto w-full p-6 glass-card rounded-2xl border border-white/10 bg-surface-container-high/60 my-6 shadow-2xl relative overflow-hidden">
            {callState.status === 'dialing' ? (
              <div className="flex flex-col items-center gap-4 py-6">
                <p className="font-sans text-sm text-on-surface-variant/80 animate-bounce">
                  {language === 'hi' ? 'टोल-फ्री प्रतिक्रिया नेटवर्क रिंग हो रहा है...' : 'Ringing free government crisis hotline...'}
                </p>
                <div className="flex gap-2.5 items-center justify-center">
                  <span className="w-2.5 h-2.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2.5 h-2.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2.5 h-2.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            ) : (
              <div className="text-left space-y-4">
                <div className="flex items-center gap-2 text-secondary font-sans text-xs uppercase font-bold tracking-wider">
                  <Volume2 size={14} className="animate-pulse" />
                  <span>{language === 'hi' ? 'सरकारी प्रतिक्रिया अधिकारी' : 'RESPONDING DUTY OFFICER'}</span>
                </div>
                <div className="font-sans text-sm md:text-base text-white font-medium bg-black/30 p-4 rounded-xl border border-white/5 shadow-inner leading-relaxed">
                  {callState.responderSpeech}
                </div>
                <div className="flex gap-1 items-center justify-center voice-wave h-1 opacity-60 rounded" />
                <p className="text-[10px] text-on-surface-variant font-mono text-center">
                  {language === 'hi' ? 'नोट: यह एक सुरक्षित ऑडियो सिमुलेशन फीड है।' : 'Note: This is a secure audio mock feedback.'}
                </p>
              </div>
            )}
            
            {/* Soft backdrop blur decoration */}
            <div className="absolute -left-12 -top-12 w-28 h-28 bg-primary/5 blur-2xl rounded-full" />
          </div>

          {/* Call Controls */}
          <div className="mb-12 flex flex-col items-center gap-4">
            <button
              id="hangup-btn"
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-error text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-2xl hover:scale-105 duration-200 cursor-pointer"
            >
              <Phone size={28} className="rotate-[135deg]" fill="currentColor" />
            </button>
            <p className="font-sans text-xs text-on-surface-variant">
              {language === 'hi' ? 'कॉल काटने के लिए दबाएं (टोल फ्री)' : 'Tap to Hang Up (Simulated Call)'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
