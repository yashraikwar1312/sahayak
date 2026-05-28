// src/components/SmartTriage.tsx
// Smart Triage Flow — AI-powered situation analysis with offline fallback.
// Drop this into App.tsx as a new tab/panel.
//
// Usage:
//   import SmartTriage from './components/SmartTriage';
//   <SmartTriage language={language} onCall={(number) => ...} />

declare const React: any;
const { useState, useRef, useCallback } = React;

// Provide a permissive JSX IntrinsicElements for environments missing React types
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
import { Mic, MicOff, Search, Phone, AlertCircle, ChevronRight, Loader2, Zap } from 'lucide-react';
import { triageNumbers, type EmergencyNumber } from '../data/emergencyNumbers';

interface Props {
  language: 'en' | 'hi';
  onCall?: (number: string, name: string) => void;
}

interface TriageResult {
  numbers: EmergencyNumber[];
  firstSteps: string[];
  firstStepsHi: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  summaryEn: string;
  summaryHi: string;
  usedAI: boolean;
}

// ─── Gemini AI triage via your existing server endpoint ─────────────────────
// The server already exposes /api/chat — we use the same pattern.
async function aiTriage(situation: string, language: 'en' | 'hi'): Promise<Partial<TriageResult>> {
  const systemPrompt = `You are an emergency triage assistant for India. 
Given a situation description, respond ONLY with a valid JSON object (no markdown, no explanation):
{
  "severity": "low" | "medium" | "high" | "critical",
  "summaryEn": "1-sentence English triage summary",
  "summaryHi": "1-sentence Hindi triage summary",
  "firstSteps": ["step1 in English", "step2", "step3"],
  "firstStepsHi": ["step1 in Hindi", "step2", "step3"],
  "keywords": ["keyword1", "keyword2"]
}
Keep firstSteps concise, actionable, and life-safety focused. Max 3 steps.`;

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Emergency situation: "${situation}"`,
      systemInstruction: systemPrompt,
      history: [],
    }),
  });

  if (!response.ok) throw new Error('AI unavailable');

  const data = await response.json();
  // Handle both streaming text and direct reply shapes
  const raw: string = data.reply ?? data.text ?? data.message ?? '';
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// ─── Rule-based first steps (offline fallback) ───────────────────────────────
function offlineFirstSteps(numbers: EmergencyNumber[], lang: 'en' | 'hi') {
  const cat = numbers[0]?.category;
  const map: Record<string, { en: string[]; hi: string[] }> = {
    medical: {
      en: ['Keep the person calm and still', 'Do not give food or water', 'Call 108 immediately'],
      hi: ['व्यक्ति को शांत और स्थिर रखें', 'खाना या पानी न दें', 'तुरंत 108 पर कॉल करें'],
    },
    ambulance: {
      en: ['Keep the person calm and still', 'Do not move if spine injury suspected', 'Call 108 immediately'],
      hi: ['व्यक्ति को शांत रखें', 'रीढ़ की चोट होने पर न हिलाएं', 'तुरंत 108 पर कॉल करें'],
    },
    fire: {
      en: ['Evacuate the building immediately', 'Do not use elevators', 'Call 101 from a safe location'],
      hi: ['इमारत तुरंत खाली करें', 'लिफ्ट का उपयोग न करें', 'सुरक्षित स्थान से 101 कॉल करें'],
    },
    police: {
      en: ['Move to a safe location first', 'Do not confront the suspect', 'Call 100 and note any details'],
      hi: ['पहले सुरक्षित स्थान पर जाएं', 'संदिग्ध से न उलझें', '100 पर कॉल करें और विवरण नोट करें'],
    },
    cyber: {
      en: ['Do not click any links or transfer money', 'Screenshot all evidence', 'Call 1930 immediately'],
      hi: ['कोई लिंक क्लिक न करें या पैसे ट्रांसफर न करें', 'सभी सबूत का स्क्रीनशॉट लें', 'तुरंत 1930 पर कॉल करें'],
    },
    disaster: {
      en: ['Move to higher ground immediately', 'Stay away from power lines', 'Call 1078 or 112'],
      hi: ['तुरंत ऊंचे स्थान पर जाएं', 'बिजली की लाइनों से दूर रहें', '1078 या 112 पर कॉल करें'],
    },
    gas_leak: {
      en: ['Do NOT switch on/off any lights', 'Open all windows and doors', 'Evacuate and call 1906'],
      hi: ['कोई भी लाइट चालू/बंद न करें', 'सभी खिड़कियाँ और दरवाजे खोलें', 'बाहर जाएं और 1906 पर कॉल करें'],
    },
    mental_health: {
      en: ['Stay with the person, speak calmly', 'Remove any harmful objects nearby', 'Call 1860-2662-345'],
      hi: ['व्यक्ति के पास रहें, शांति से बोलें', 'पास की हानिकारक वस्तुएं हटाएं', '1860-2662-345 पर कॉल करें'],
    },
    poison: {
      en: ['Do NOT induce vomiting unless instructed', 'Note what was ingested and when', 'Call 1800-116-117'],
      hi: ['जब तक निर्देश न हो उल्टी न करवाएं', 'क्या और कब खाया गया नोट करें', '1800-116-117 पर कॉल करें'],
    },
  };

  const steps = map[cat ?? ''] ?? {
    en: ['Call 112 for immediate assistance', 'Stay calm and describe your situation', 'Do not put yourself in further danger'],
    hi: ['तुरंत सहायता के लिए 112 पर कॉल करें', 'शांत रहें और अपनी स्थिति बताएं', 'खुद को और खतरे में न डालें'],
  };

  return lang === 'hi' ? steps.hi : steps.en;
}

// ─── Severity badge ───────────────────────────────────────────────────────────
const SEVERITY_STYLES: Record<string, string> = {
  low:      'bg-green-100 text-green-800 border-green-200',
  medium:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  high:     'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};
const SEVERITY_LABEL: Record<string, { en: string; hi: string }> = {
  low:      { en: 'Low Severity',      hi: 'कम गंभीर' },
  medium:   { en: 'Moderate Severity', hi: 'मध्यम गंभीर' },
  high:     { en: 'High Severity',     hi: 'अधिक गंभीर' },
  critical: { en: 'CRITICAL',          hi: 'अत्यंत गंभीर' },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function SmartTriage({ language, onCall }: Props) {
  const [situation, setSituation] = useState('');
  const [result, setResult] = useState(null as TriageResult | null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const lang = language;

  const runTriage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    // Offline keyword triage (instant, always runs)
    const topNumbers = triageNumbers(text, 3);

    // Fallback first steps
    const fallbackStepsEn = offlineFirstSteps(topNumbers, 'en');
    const fallbackStepsHi = offlineFirstSteps(topNumbers, 'hi');

    let aiData: Partial<TriageResult> = {};
    let usedAI = false;

    try {
      aiData = await aiTriage(text, lang);
      usedAI = true;
    } catch {
      // Silently fall back to offline
    }

    setResult({
      numbers: topNumbers,
      firstSteps:   aiData.firstSteps   ?? fallbackStepsEn,
      firstStepsHi: aiData.firstStepsHi ?? fallbackStepsHi,
      severity:     aiData.severity     ?? (topNumbers[0]?.priority === 1 ? 'high' : 'medium'),
      summaryEn:    aiData.summaryEn    ?? `Situation classified as: ${topNumbers[0]?.nameEn ?? 'General Emergency'}`,
      summaryHi:    aiData.summaryHi    ?? `स्थिति वर्गीकृत: ${topNumbers[0]?.nameHi ?? 'सामान्य आपातकाल'}`,
      usedAI,
    });

    setLoading(false);
  }, [lang]);

  const handleSubmit = () => runTriage(situation);
  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  // Voice input
  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError('Speech recognition not supported in this browser.'); return; }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    rec.interimResults = false;
    rec.continuous = false;
    setListening(true);
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setSituation(t);
      setListening(false);
      runTriage(t);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };
  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const steps = lang === 'hi' ? result?.firstStepsHi : result?.firstSteps;
  const summary = lang === 'hi' ? result?.summaryHi : result?.summaryEn;

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-orange-500" />
        <h2 className="text-lg font-bold text-white">
          {lang === 'hi' ? 'स्मार्ट ट्राइएज' : 'Smart Triage'}
        </h2>
      </div>

      {/* Input */}
      <div className="relative">
        <textarea
          className="w-full bg-gray-800 text-white rounded-xl border border-gray-600 p-3 pr-12
                     resize-none focus:outline-none focus:border-orange-500 text-sm"
          rows={3}
          placeholder={lang === 'hi'
            ? 'अपनी स्थिति बताएं… जैसे "मेरे पिता को सीने में दर्द हो रहा है"'
            : 'Describe your situation… e.g. "My father is having chest pain"'}
          value={situation}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSituation(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {/* Voice button */}
        <button
          onClick={listening ? stopListening : startListening}
          className={`absolute right-3 bottom-3 p-1.5 rounded-full transition-colors
            ${listening ? 'bg-red-500 animate-pulse' : 'bg-gray-600 hover:bg-gray-500'}`}
          title="Voice input"
        >
          {listening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Analyze button */}
      <button
        onClick={handleSubmit}
        disabled={!situation.trim() || loading}
        className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600
                   disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3
                   font-semibold transition-colors"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> {lang === 'hi' ? 'विश्लेषण हो रहा है…' : 'Analyzing…'}</>
          : <><Search className="w-4 h-4" /> {lang === 'hi' ? 'ट्राइएज चलाएं' : 'Run Triage'}</>}
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">

          {/* Severity + summary */}
          <div className={`rounded-xl border p-3 text-sm font-medium ${SEVERITY_STYLES[result.severity]}`}>
            <span className="font-bold uppercase tracking-wide text-xs block mb-1">
              {SEVERITY_LABEL[result.severity][lang]}
              {result.usedAI && (
                <span className="ml-2 normal-case font-normal opacity-70">· AI analysis</span>
              )}
            </span>
            {summary}
          </div>

          {/* First steps */}
          <div className="bg-gray-800 rounded-xl p-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {lang === 'hi' ? 'तुरंत करें' : 'Immediate Steps'}
            </h3>
            <ol className="flex flex-col gap-2">
              {steps?.map((step: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500 text-white
                                   text-xs flex items-center justify-center font-bold mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Top 3 helplines */}
          <div className="bg-gray-800 rounded-xl p-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {lang === 'hi' ? 'संपर्क करें' : 'Call Now'}
            </h3>
            <div className="flex flex-col gap-2">
              {result.numbers.map((num: EmergencyNumber, idx: number) => (
                <div
                  key={num.id}
                  className={`flex items-center justify-between rounded-lg p-3 border
                    ${idx === 0
                      ? 'bg-orange-500/10 border-orange-500/30'
                      : 'bg-gray-700 border-gray-600'}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {lang === 'hi' ? num.nameHi : num.nameEn}
                    </p>
                    <p className="text-gray-400 text-xs truncate">
                      {lang === 'hi' ? num.descriptionHi : num.descriptionEn}
                    </p>
                  </div>
                  <a
                    href={`tel:${num.number}`}
                    onClick={() => onCall?.(num.number, lang === 'hi' ? num.nameHi : num.nameEn)}
                    className={`flex items-center gap-1 ml-3 px-3 py-2 rounded-lg font-bold text-sm
                      transition-colors flex-shrink-0
                      ${idx === 0
                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                        : 'bg-gray-600 hover:bg-gray-500 text-white'}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {num.number}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={() => { setResult(null); setSituation(''); }}
            className="text-sm text-gray-400 hover:text-white transition-colors self-center"
          >
            {lang === 'hi' ? '← नई स्थिति दर्ज करें' : '← Describe a new situation'}
          </button>
        </div>
      )}
    </div>
  );
}