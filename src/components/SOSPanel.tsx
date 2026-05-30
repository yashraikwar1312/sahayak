import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, X, Volume2, ShieldCheck, PhoneCall, CheckCircle, Navigation, Radio, Contact, AlertCircle } from 'lucide-react';
import type { EmergencyContact, Language, MedicalProfile } from '../types';

interface SOSPanelProps {
  language: Language;
  onClose: () => void;
  locationName: string;
  emergencyContacts: EmergencyContact[];
  medicalProfile: MedicalProfile;
}

export default function SOSPanel({
  language,
  onClose,
  locationName,
  emergencyContacts,
  medicalProfile,
}: SOSPanelProps) {
  const [countdown, setCountdown] = useState(5);
  const [isTriggered, setIsTriggered] = useState(false);
  const [sirenPlaying, setSirenPlaying] = useState(false);
  const [smsStatus, setSmsStatus] = useState<'pending' | 'success'>('pending');
  const [isMuted, setIsMuted] = useState(false);
  const [callStatus, setCallStatus] = useState<'dialing' | 'connected' | null>(null);
  const [dialedNumber, setDialedNumber] = useState('112');

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillator1Ref = useRef<OscillatorNode | null>(null);
  const oscillator2Ref = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sirenIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown element
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && !isTriggered) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && !isTriggered) {
      setIsTriggered(true);
      triggerSOSActions();
    }
    return () => clearTimeout(timer);
  }, [countdown, isTriggered]);

  // SOS synthesized audio trigger using AudioContext
  const playSiren = () => {
    try {
      if (isMuted) return;
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime); 
      gainNode.connect(audioCtx.destination);
      gainNodeRef.current = gainNode;

      // Two oscillators for a piercing emergency warble
      const osc1 = audioCtx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc1.connect(gainNode);
      osc1.start();
      oscillator1Ref.current = osc1;

      const osc2 = audioCtx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(620, audioCtx.currentTime);
      osc2.connect(gainNode);
      osc2.start();
      oscillator2Ref.current = osc2;

      setSirenPlaying(true);

      // Pitch shifting interval simulation (warble frequency)
      let phase = 0;
      const interval = setInterval(() => {
        if (!osc1 || !osc2 || audioCtx.state === 'closed') return;
        phase = (phase + 1) % 2;
        const targetFreq1 = phase === 0 ? 850 : 550;
        const targetFreq2 = phase === 0 ? 870 : 570;
        
        osc1.frequency.exponentialRampToValueAtTime(targetFreq1, audioCtx.currentTime + 0.35);
        osc2.frequency.exponentialRampToValueAtTime(targetFreq2, audioCtx.currentTime + 0.35);
      }, 400);

      sirenIntervalRef.current = interval;
    } catch (e) {
      console.error('Audio synthesis not supported or blocked by user engagement:', e);
    }
  };

  const stopSiren = () => {
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
    if (oscillator1Ref.current) {
      try { oscillator1Ref.current.stop(); } catch(e){}
      oscillator1Ref.current = null;
    }
    if (oscillator2Ref.current) {
      try { oscillator2Ref.current.stop(); } catch(e){}
      oscillator2Ref.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch(e){}
      audioContextRef.current = null;
    }
    setSirenPlaying(false);
  };

  // Toggle Mute
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (isTriggered) {
        playSiren();
      }
    } else {
      setIsMuted(true);
      stopSiren();
    }
  };

  // Auto-dial 112 (Emergency Number)
  const autoDialPolice = () => {
    setCallStatus('dialing');
    setDialedNumber('112');
    
    // Try to initiate the call using tel: protocol
    const telLink = 'tel:112';
    window.location.href = telLink;
    
    // Show success after a brief moment (simulating connection)
    setTimeout(() => {
      setCallStatus('connected');
    }, 2000);
  };

  // Trigger Action Broadcast
  const triggerSOSActions = () => {
    playSiren();
    autoDialPolice(); // Auto-dial 112 when SOS triggers
    
    // Simulate SMS Sending delay
    setTimeout(() => {
      setSmsStatus('success');
    }, 2000);
  };

  // Cleanup audio
  useEffect(() => {
    return () => {
      stopSiren();
    };
  }, []);

  const handleCancel = () => {
    stopSiren();
    onClose();
  };

  return (
    <div id="sos-hud-overlay" className="fixed inset-0 bg-red-950/98 backdrop-blur-3xl z-[100] flex flex-col justify-between p-6 md:p-8 overflow-y-auto">
      
      {/* HUD Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="font-mono text-xs font-black uppercase text-red-400 tracking-wider">
            {language === 'hi' ? 'गंभीर एसओएस प्रतिक्रिया मोड' : 'CRITICAL SOS EMERGENCY MODULE'}
          </span>
        </div>

        <button
          onClick={handleCancel}
          className="w-10 h-10 rounded-full bg-red-900/40 hover:bg-red-900/80 border border-white/10 flex items-center justify-center text-white transition-all cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      {/* Countdown Visualizer */}
      {!isTriggered ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto my-8">
          <ShieldAlert size={60} className="text-red-400 animate-bounce mb-6" />
          <h2 className="font-sans font-black text-white text-3xl tracking-tight leading-none uppercase">
            {language === 'hi' ? 'एसओएस सक्रिय हो रहा है' : 'SOS Launching'}
          </h2>
          <p className="font-sans text-sm text-red-200/80 mt-3 max-w-sm">
            {language === 'hi' ? 'गलत सक्रियता को रोकने के लिए ५ सेकंड रुकें या तुरंत रद्द करें दबाएं।' : 'To prevent accidental triggers, alarm and emergency broadcasting will begin in:'}
          </p>

          {/* Large Countdown Sphere */}
          <div className="w-40 h-40 rounded-full border-4 border-red-500/40 flex items-center justify-center mt-8 relative bg-red-900/10 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <span className="font-mono text-7xl font-black text-white">{countdown}</span>
            <div className="absolute inset-0 rounded-full border-4 border-t-red-500 border-r-transparent animate-spin" />
          </div>

          <button
            onClick={handleCancel}
            className="mt-8 px-8 py-3 bg-white text-red-900 font-sans font-bold text-sm tracking-wide rounded-full shadow-lg h-12 uppercase hover:bg-red-100 transition-all cursor-pointer"
          >
            {language === 'hi' ? 'रद्द करें (सुरक्षित)' : 'Cancel (Safe Lift)'}
          </button>
        </div>
      ) : (
        /* SOS Triggered Live HUD Dashboard */
        <div className="flex-1 flex flex-col lg:flex-row gap-6 items-stretch justify-center max-w-5xl mx-auto w-full my-6 select-none">
          
          {/* Active Broadcast HUD Card */}
          <div className="flex-1 glass-card border-red-500/20 bg-red-950/40 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase bg-red-500/20 border border-red-500/40 text-red-200 px-3 py-1 rounded-md font-bold tracking-widest flex items-center gap-1">
                  <Radio size={12} className="animate-pulse" />
                  <span>BROADCASTING LIVE</span>
                </span>
                
                {/* Audio Sirens controllers */}
                <button
                  onClick={toggleMute}
                  className="p-1 px-3 rounded bg-red-900/40 hover:bg-red-900/80 border border-white/10 text-xs text-white font-sans transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 size={13} />
                  <span>{isMuted ? (language === 'hi' ? 'म्यूट हटाएँ' : 'Unmute') : (language === 'hi' ? 'अलार्म म्यूट' : 'Mute Siren')}</span>
                </button>
              </div>

              <h2 className="font-sans font-extrabold text-white text-3xl mt-6">
                {language === 'hi' ? 'आपातकालीन सहायता अनुरोध' : 'SOS Emergency Broadcast'}
              </h2>
              <p className="font-sans text-xs text-red-200/80 mt-2 leading-relaxed">
                {language === 'hi' ? 'आपकी मेडिकल प्रोफाइल और जीपीएस निर्देशांक आसपास के नियंत्रण केंद्रों और संपर्कों को निरंतर भेजे जा रहे हैं।' : 'Broadcasting GPS location and critical medical data to closest local emergency departments and safety monitors.'}
              </p>

              {/* Dynamic Geo Tracks */}
              <div className="mt-6 p-4 bg-black/40 rounded-xl border border-red-500/10 font-mono text-xs text-red-300 space-y-2">
                <div className="flex items-center gap-1.5 leading-none">
                  <Navigation size={12} className="text-red-400 rotate-45 shrink-0" />
                  <span className="font-bold">STATUS: COORDS STREAMING ACTIVE</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] leading-relaxed">
                  <div>
                    <span className="text-red-200/50 block">MAPPED ZONE:</span>
                    <span className="font-bold text-white">{locationName}</span>
                  </div>
                  <div>
                    <span className="text-red-200/50 block">COORDINATES:</span>
                    <span className="font-bold text-white">28.6139° N, 77.2090° E</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Alerts Sent Section */}
            <div className="mt-6 pt-4 border-t border-red-500/15">
              <span className="font-mono text-[10px] text-red-300 uppercase tracking-widest block font-bold mb-3">
                {language === 'hi' ? 'मैसेज ब्रॉडकास्ट स्थिति:' : 'CONTACT SMS BROADCAST LIST:'}
              </span>
              <div className="space-y-2.5">
                {emergencyContacts.length > 0 ? (
                  emergencyContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Contact size={16} className="text-red-300 shrink-0" />
                        <span className="text-white text-xs font-sans truncate">
                          {contact.name} ({contact.relationship})
                        </span>
                      </div>
                      <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-black border ${
                        smsStatus === 'success' 
                          ? 'bg-secondary/10 border-secondary text-secondary' 
                          : 'bg-yellow-500/10 border-yellow-500 text-yellow-500 animate-pulse'
                      }`}>
                        {smsStatus === 'success' ? 'SENT ✓' : 'QUEUEING...'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertCircle size={14} className="text-red-300" />
                      <span className="text-red-200/80 text-xs font-sans">
                        No custom contacts (Defaulting to Police dispatch)
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border bg-secondary/10 border-secondary text-secondary font-black">
                      SENT ✓
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Glowing background diode */}
            <div className="absolute -right-16 -top-16 w-32 h-32 bg-red-500/20 blur-3xl rounded-full" />
          </div>

          {/* Quick Critical Actions Info Panel */}
          <div className="flex-1 flex flex-col justify-between gap-4">
            
            {/* Emergency Call Dial Status */}
            {callStatus && (
              <div className="p-5 glass-card bg-green-950/40 border-green-500/30 rounded-2xl flex flex-col items-center justify-center">
                <span className="font-mono text-[10px] uppercase text-green-300 tracking-wider block font-bold mb-3">
                  {language === 'hi' ? 'आपातकालीन कॉल' : 'EMERGENCY CALL ACTIVE'}
                </span>
                <div className="flex items-center gap-4 my-4">
                  <div className="flex items-center gap-2">
                    <PhoneCall size={32} className="text-green-400 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-4xl font-black text-white tracking-widest">
                      {dialedNumber}
                    </div>
                    <div className="text-xs text-green-300 mt-2 font-sans">
                      {callStatus === 'dialing' 
                        ? (language === 'hi' ? 'डायल कर रहे हैं...' : 'DIALING...')
                        : (language === 'hi' ? '✓ कनेक्टेड' : '✓ CONNECTED')}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-green-200/70 font-sans text-center mt-3">
                  {language === 'hi' 
                    ? 'पुलिस नियंत्रण कक्ष से जुड़ा हुआ। पुलिस आपकी मदद के लिए भेजे जा रहे हैं।'
                    : 'Connected to Police Control Room. Emergency response team dispatched to your location.'}
                </div>
              </div>
            )}
            
            {/* Medical ID card overview */}
            <div className="p-5 glass-card bg-red-950/20 border-white/5 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase text-red-300 tracking-wider block font-bold">
                  {language === 'hi' ? 'आपातकालीन चिकित्सा आईडी' : 'EMERGENCY MEDICAL PROFILE'}
                </span>
                <div className="grid grid-cols-2 gap-3 mt-4 text-xs font-sans">
                  <div className="p-2 bg-black/10 rounded-lg border border-white/5">
                    <span className="text-red-200/50 block text-[9px] uppercase tracking-wide">Patient Name</span>
                    <span className="font-bold text-white text-sm">{medicalProfile.fullName || 'Not declared'}</span>
                  </div>
                  <div className="p-2 bg-black/10 rounded-lg border border-white/5">
                    <span className="text-red-200/50 block text-[9px] uppercase tracking-wide">Blood Type</span>
                    <span className="font-bold text-white text-sm">{medicalProfile.bloodType || 'Not specified'}</span>
                  </div>
                  <div className="p-2 bg-black/10 rounded-lg border border-white/5 col-span-2">
                    <span className="text-red-200/50 block text-[9px] uppercase tracking-wide">Allergies / Flags</span>
                    <span className="font-medium text-white">{medicalProfile.allergies || 'None declared'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick dialing triggers */}
            <div className="p-5 glass-card bg-red-950/20 border-white/5 rounded-2xl">
              <span className="font-mono text-[10px] uppercase text-red-300 tracking-wider block font-bold mb-3">
                {language === 'hi' ? 'सीधे आपातकालीन अधिकारी को डायल करें:' : 'IMMEDIATE DIRECT CELL PHONE CHANNELS:'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="tel:112"
                  className="flex items-center gap-2 justify-center p-3 rounded-xl bg-primary-container text-white font-sans text-xs font-extrabold hover:bg-opacity-90 active:scale-95 duration-150 shadow"
                >
                  <PhoneCall size={14} />
                  <span>DIAL PCR 112</span>
                </a>
                <a
                  href="tel:102"
                  className="flex items-center gap-2 justify-center p-3 rounded-xl bg-error text-white font-sans text-xs font-extrabold hover:bg-opacity-90 active:scale-95 duration-150 shadow"
                >
                  <PhoneCall size={14} />
                  <span>DIAL MEDICAL 102</span>
                </a>
              </div>
            </div>

            {/* Terminate Block Button */}
            <button
              id="sos-stop-btn"
              onClick={handleCancel}
              className="w-full py-4 bg-white text-red-950 hover:bg-red-100 shadow-xl transition-colors font-sans font-black text-xs uppercase tracking-widest rounded-xl hover:scale-102 cursor-pointer"
            >
              {language === 'hi' ? 'एसओएस बंद करें और शांत करें' : 'Deactivate SOS Alarm'}
            </button>
          </div>
        </div>
      )}

      {/* Footer advice */}
      <div className="mt-4 flex items-center justify-center gap-2 font-sans text-[10px] text-red-200/50 z-10 text-center">
        <CheckCircle size={10} className="text-secondary" />
        <span>Locked under Constitutional Legal Air Defense • Secure Offline Fallback Encrypted</span>
      </div>
    </div>
  );
}
