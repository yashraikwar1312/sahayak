import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, PhoneCall, ShieldAlert, Volume2, VolumeX } from 'lucide-react';
import type { Language } from '../types';

interface PanicModeProps {
  language: Language;
  onClose: () => void;
  locationName: string;
}

const COUNTDOWN_SECONDS = 5;

const INSTRUCTIONS = {
  en: [
    'Stay calm. Help is on the way.',
    'You are calling 112 — India\'s national emergency number.',
    'When connected, state your name and location.',
    `Your location: `,
    'If you are in danger, move to a safe place if possible.',
  ],
  hi: [
    'शांत रहें। मदद आ रही है।',
    'आप 112 पर कॉल कर रहे हैं — भारत का राष्ट्रीय आपातकालीन नंबर।',
    'जुड़ने पर, अपना नाम और स्थान बताएं।',
    `आपका स्थान: `,
    'यदि खतरे में हों, तो सुरक्षित स्थान पर जाएं।',
  ],
};

export default function PanicMode({ language, onClose, locationName }: PanicModeProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [phase, setPhase] = useState<'countdown' | 'dialing' | 'connected'>('countdown');
  const [muted, setMuted] = useState(false);
  const [cancelFlash, setCancelFlash] = useState(false);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const mutedRef = useRef(false);

  mutedRef.current = muted;

  // ─── Speech helper ───────────────────────────────────────────────
  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (mutedRef.current || !('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utter.rate = 0.9;
    utter.volume = 1;
    utter.pitch = 1;
    if (onEnd) utter.onend = onEnd;
    window.speechSynthesis.speak(utter);
  }, [language]);

  // ─── On mount: announce and start countdown ──────────────────────
  useEffect(() => {
    const introText = language === 'hi'
      ? `पैनिक मोड सक्रिय। ${COUNTDOWN_SECONDS} सेकंड में 112 पर कॉल होगी। रद्द करने के लिए रद्द करें दबाएं।`
      : `Panic mode activated. Calling 112 in ${COUNTDOWN_SECONDS} seconds. Press cancel to stop.`;
    speak(introText);

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          setPhase('dialing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdownRef.current!);
      window.speechSynthesis?.cancel();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── When dialing phase starts ───────────────────────────────────
  useEffect(() => {
    if (phase === 'dialing') {
      const dialText = language === 'hi'
        ? '112 डायल हो रहा है।'
        : 'Dialing 1 1 2.';
      speak(dialText, () => {
        setTimeout(() => {
          setPhase('connected');
          const connText = language === 'hi'
            ? 'कनेक्ट हो रहा है। कृपया अपना नाम और स्थान बताएं।'
            : 'Connecting. Please state your name and location clearly.';
          speak(connText);
        }, 1500);
      });
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Cancel handler ──────────────────────────────────────────────
  const handleCancel = () => {
    clearInterval(countdownRef.current!);
    window.speechSynthesis?.cancel();
    const cancelText = language === 'hi' ? 'कॉल रद्द कर दी गई।' : 'Call cancelled.';
    speak(cancelText);
    setCancelFlash(true);
    setTimeout(onClose, 600);
  };

  // ─── Direct dial action ──────────────────────────────────────────
  const handleDirectDial = () => {
    clearInterval(countdownRef.current!);
    window.speechSynthesis?.cancel();
    window.location.href = 'tel:112';
    setPhase('dialing');
  };

  const hi = language === 'hi';
  const instructions = hi ? INSTRUCTIONS.hi : INSTRUCTIONS.en;

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col transition-all duration-300 ${
        cancelFlash ? 'bg-green-900' : 'bg-[#0d0000]'
      }`}
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
    >
      {/* Scanline texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.04]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 4px)',
        }}
      />

      {/* Red pulsing border ring */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          boxShadow: phase === 'countdown'
            ? 'inset 0 0 60px 20px rgba(220,38,38,0.35)'
            : 'inset 0 0 80px 30px rgba(220,38,38,0.55)',
          animation: 'panicGlow 1.2s ease-in-out infinite alternate',
        }}
      />

      <style>{`
        @keyframes panicGlow {
          from { box-shadow: inset 0 0 40px 10px rgba(220,38,38,0.25); }
          to   { box-shadow: inset 0 0 90px 30px rgba(220,38,38,0.55); }
        }
        @keyframes dialPulse {
          0%,100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220,38,38,0.8); }
          50%      { transform: scale(1.04); box-shadow: 0 0 0 28px rgba(220,38,38,0); }
        }
        @keyframes panicCountdown {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: 283; }
        }
        @keyframes connected-pulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.6; }
        }
      `}</style>

      {/* ── TOP BAR ── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-safe pt-5 pb-4 border-b border-red-900/60">
        <div className="flex items-center gap-2.5">
          <ShieldAlert size={22} className="text-red-500" />
          <span
            className="text-red-400 text-xs tracking-[0.25em] uppercase font-bold"
            style={{ fontFamily: 'monospace' }}
          >
            {hi ? 'पैनिक मोड सक्रिय' : 'PANIC MODE ACTIVE'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Mute toggle */}
          <button
            onClick={() => { setMuted(m => !m); window.speechSynthesis?.cancel(); }}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors active:scale-95"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          {/* Dismiss / cancel */}
          <button
            onClick={handleCancel}
            className="w-9 h-9 rounded-full bg-white/5 border border-red-900/40 flex items-center justify-center text-red-400 hover:text-white hover:bg-red-900/40 transition-colors active:scale-95"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 gap-6">

        {/* Phase: Countdown */}
        {phase === 'countdown' && (
          <>
            {/* Big countdown ring */}
            <div className="relative flex items-center justify-center">
              <svg width="160" height="160" className="-rotate-90">
                <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(220,38,38,0.15)" strokeWidth="8" />
                <circle
                  cx="80" cy="80" r="45"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (countdown / COUNTDOWN_SECONDS) * 283}
                  style={{ transition: 'stroke-dashoffset 0.9s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-white font-black leading-none"
                  style={{ fontSize: '4.5rem', textShadow: '0 0 40px rgba(220,38,38,0.8)' }}
                >
                  {countdown}
                </span>
                <span className="text-red-400 text-[11px] tracking-widest uppercase font-bold mt-1" style={{ fontFamily: 'monospace' }}>
                  {hi ? 'सेकंड' : 'seconds'}
                </span>
              </div>
            </div>

            <p className="text-red-300/90 text-center text-base leading-relaxed max-w-xs" style={{ letterSpacing: '0.02em' }}>
              {hi
                ? '112 पर कॉल होने वाली है। रद्द करने के लिए नीचे दबाएं।'
                : 'Calling 112 shortly. Press cancel below to stop.'}
            </p>

            {/* CANCEL BUTTON — large */}
            <button
              onClick={handleCancel}
              className="w-full max-w-sm py-5 rounded-2xl border-2 border-white/20 bg-white/5 text-white font-black text-xl tracking-widest uppercase transition-all active:scale-95 hover:bg-white/10"
              style={{ letterSpacing: '0.15em' }}
            >
              {hi ? '✋ रद्द करें' : '✋ CANCEL'}
            </button>
          </>
        )}

        {/* Phase: Dialing */}
        {phase === 'dialing' && (
          <>
            <div
              className="w-40 h-40 rounded-full bg-red-600 flex flex-col items-center justify-center"
              style={{ animation: 'dialPulse 1s ease-in-out infinite' }}
            >
              <PhoneCall size={52} className="text-white" />
              <span className="text-white text-sm font-black tracking-widest mt-2" style={{ fontFamily: 'monospace' }}>
                112
              </span>
            </div>
            <p
              className="text-white text-2xl font-black tracking-widest uppercase text-center"
              style={{ textShadow: '0 0 30px rgba(220,38,38,0.7)', animation: 'connected-pulse 1.4s ease-in-out infinite' }}
            >
              {hi ? 'डायल हो रहा है…' : 'DIALING…'}
            </p>
            <button
              onClick={handleCancel}
              className="w-full max-w-sm py-4 rounded-2xl border border-red-900/60 bg-red-950/40 text-red-300 font-bold text-lg tracking-wider uppercase transition-all active:scale-95 hover:bg-red-900/40"
            >
              {hi ? 'कॉल समाप्त करें' : 'END CALL'}
            </button>
          </>
        )}

        {/* Phase: Connected */}
        {phase === 'connected' && (
          <>
            <div
              className="w-36 h-36 rounded-full bg-green-700 flex flex-col items-center justify-center border-4 border-green-400/40"
              style={{ animation: 'connected-pulse 2s ease-in-out infinite' }}
            >
              <PhoneCall size={48} className="text-white" />
              <span className="text-white text-xs font-black tracking-widest mt-2" style={{ fontFamily: 'monospace' }}>
                {hi ? 'जुड़ा हुआ' : 'CONNECTED'}
              </span>
            </div>
            <p className="text-green-300 text-xl font-black tracking-wider uppercase text-center">
              {hi ? '112 से जुड़ा हुआ' : 'CONNECTED TO 112'}
            </p>
            <p className="text-white/70 text-sm text-center leading-relaxed max-w-xs">
              {hi
                ? 'अपना नाम और स्थान स्पष्ट रूप से बताएं।'
                : 'State your name and location clearly.'}
            </p>
            <button
              onClick={handleCancel}
              className="w-full max-w-sm py-4 rounded-2xl border border-red-900/60 bg-red-950/40 text-red-300 font-bold text-lg tracking-wider uppercase transition-all active:scale-95 hover:bg-red-900/40"
            >
              {hi ? 'कॉल समाप्त करें' : 'END CALL'}
            </button>
          </>
        )}
      </div>

      {/* ── CALL 112 DOMINANT BUTTON (always visible) ── */}
      <div className="relative z-10 px-5 pb-6">
        <a
          href="tel:112"
          onClick={() => { clearInterval(countdownRef.current!); window.speechSynthesis?.cancel(); setPhase('dialing'); }}
          className="flex items-center justify-center gap-4 w-full py-6 rounded-3xl bg-red-600 hover:bg-red-500 transition-all active:scale-[0.97] border-2 border-red-400/40"
          style={{
            animation: phase === 'countdown' ? 'dialPulse 1.4s ease-in-out infinite' : 'none',
            boxShadow: '0 0 40px 8px rgba(220,38,38,0.4)',
          }}
        >
          <PhoneCall size={36} className="text-white" />
          <div className="text-left">
            <div
              className="text-white font-black leading-none"
              style={{ fontSize: '2.8rem', textShadow: '0 2px 12px rgba(0,0,0,0.5)', fontFamily: 'monospace' }}
            >
              112
            </div>
            <div className="text-red-100/80 text-xs tracking-widest uppercase font-bold" style={{ fontFamily: 'monospace' }}>
              {hi ? 'राष्ट्रीय आपातकालीन सेवा' : 'NATIONAL EMERGENCY'}
            </div>
          </div>
        </a>

        {/* Instructions strip */}
        <div className="mt-4 space-y-1.5 px-1">
          {instructions.map((line, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="text-red-500/60 text-xs font-bold mt-0.5" style={{ fontFamily: 'monospace' }}>
                {String(i + 1).padStart(2, '0')}.
              </span>
              <p className="text-white/65 text-xs leading-snug">
                {i === 3 ? line + locationName : line}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
