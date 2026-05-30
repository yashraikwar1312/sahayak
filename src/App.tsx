import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Phone,
  MessageSquare,
  Settings as SettingsIcon,
  Video,
  Grid,
  Mic,
  Search,
  Languages,
  X,
  Radio,
  Sparkles,
  AlertTriangle,
  LifeBuoy,
  Zap,
  Play,
  ExternalLink,
  Megaphone,
  FileX,
  Siren,
  WifiOff
} from 'lucide-react';

import type { EmergencyCategory, Language, EmergencyContact, MedicalProfile, ActiveCallState, HelplineItem } from './types';
import CategoryCard from './components/CategoryCard';
import MapContainer from './components/MapContainer';
import HelplineList, { MOCK_RESPONDER_SPEECH, HELPLINES } from './components/HelplineList';
import ChatInterface from './components/ChatInterface';
import SOSPanel from './components/SOSPanel';
import SettingsPanel from './components/SettingsPanel';
import AuthModal from './components/AuthModal';
import SmartTriage from './components/SmartTriage';
// Fallback stubs for useShakeToSOS and ShakePermissionButton.
// The actual hook may not exist in some environments; provide no-op implementations
// so the app can compile and run without the optional feature.
const useShakeToSOS = (p0: { onShake: () => void; enabled: boolean; threshold: number; minShakes: number; windowMs: number; cooldownMs: number; }) => ({ enabled: false, start: () => {}, stop: () => {}, requestPermission: async () => false });
const ShakePermissionButton: React.FC = () => null;
import ComplaintPanel from './components/ComplaintPanel';
import DocumentLossWizard from './components/DocumentLossWizard';
import PanicMode from './components/PanicMode';
import { analyzeEmergencySpeech } from './utils/emergencySpeechClassifier';

const INITIAL_MEDICAL_PROFILE: MedicalProfile = {
  fullName: 'Arjun Sharma',
  bloodType: 'O+',
  allergies: 'Penicillin, Dust Mites',
  medications: 'None active',
  emergencyNotes: 'Severe Asthmatic. Carries emergency fast-relief inhaler in safety pouch.',
};

const INITIAL_CONTACTS: EmergencyContact[] = [
  { id: 'c1', name: 'Kabir Sharma (Brother)', phone: '+91 98765 43210', relationship: 'Brother' },
  { id: 'c2', name: 'Dr. Neha Verma (Family Physician)', phone: '+91 91234 56780', relationship: 'Physician' },
];

export default function App() {
  const [voiceOptimized, setVoiceOptimized] = useState<boolean>(() => {
    return localStorage.getItem('sahayak_voice_optimized') === 'true';
  });
  const [accessibilityPrompt, setAccessibilityPrompt] = useState<boolean>(true);
  const [setupRecognitionActive, setSetupRecognitionActive] = useState(false);
  const [setupHeardText, setSetupHeardText] = useState('');
  const isTriageCompleted = useRef(false);

  const [continuousListening, setContinuousListening] = useState(false);
  const [voiceCommandHeardText, setVoiceCommandHeardText] = useState('');

  const recognitionRef = useRef<any>(null);
  const setupRecognitionRef = useRef<any>(null);
  const setupTimeoutRef = useRef<any>(null);

  const [awaitingCallConfirmation, setAwaitingCallConfirmation] = useState<boolean>(false);
  const [lastAnalyzedHelpNumber, setLastAnalyzedHelpNumber] = useState<string>('');

  const handleVoiceCommandTextRef = useRef<any>(null);

  const stopVoiceCommandListener = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setContinuousListening(false);
  };

  const stopSetupSpeechRecognition = () => {
    if (setupTimeoutRef.current) {
      clearTimeout(setupTimeoutRef.current);
      setupTimeoutRef.current = null;
    }
    if (setupRecognitionRef.current) {
      try {
        setupRecognitionRef.current.onstart = null;
        setupRecognitionRef.current.onresult = null;
        setupRecognitionRef.current.onerror = null;
        setupRecognitionRef.current.onend = null;
        setupRecognitionRef.current.stop();
      } catch (e) {}
      setupRecognitionRef.current = null;
    }
    setSetupRecognitionActive(false);
  };

  const speakOutLoud = (text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      
      const cleanText = text
        .replace(/\[.*?\]/g, '')
        .replace(/\*\*|__/g, '')
        .replace(/[*#`_\-]/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const hasHindi = /[\u0900-\u097F]/.test(cleanText);
      if (hasHindi || language === 'hi') {
        utterance.lang = 'hi-IN';
      } else {
        utterance.lang = 'en-IN';
      }
      utterance.rate = 0.95;
      utterance.volume = 1.0;
      
      // Stop or keep setup speech recognition based on accessibilityPrompt
      if (!accessibilityPrompt) {
        stopSetupSpeechRecognition();
      } else {
        // Start listening immediately to enable barge-in while speech is ongoing
        setTimeout(() => {
          if (!isTriageCompleted.current && !setupRecognitionRef.current) {
            startSetupSpeechRecognition();
          }
        }, 100);
      }

      // Stop or keep voice command listener: We keep it active as long as setup triage is completed & call is not active!
      if (accessibilityPrompt || callState.active) {
        stopVoiceCommandListener();
      } else {
        // Ensure we keep the listener running so the user can barge-in and say "reset", "switch", or "SOS"
        setTimeout(() => {
          if (!accessibilityPrompt && !callState.active && !recognitionRef.current) {
            startVoiceCommandListener();
          }
        }, 100);
      }

      utterance.onend = () => {
        if (onEnd) {
          onEnd();
        } else if (!accessibilityPrompt && !callState.active) {
          startVoiceCommandListener();
        } else if (accessibilityPrompt && !isTriageCompleted.current) {
          startSetupSpeechRecognition();
        }
      };
      
      utterance.onerror = () => {
        if (onEnd) {
          onEnd();
        } else if (!accessibilityPrompt && !callState.active) {
          startVoiceCommandListener();
        } else if (accessibilityPrompt && !isTriageCompleted.current) {
          startSetupSpeechRecognition();
        }
      };
      
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
      if (onEnd) onEnd();
    }
  };

  const handleAccessibilitySelection = (isVoiceOptimized: boolean) => {
    isTriageCompleted.current = true;
    setVoiceOptimized(isVoiceOptimized);
    localStorage.setItem('sahayak_voice_optimized', isVoiceOptimized ? 'true' : 'false');
    setAccessibilityPrompt(false);
    stopSetupSpeechRecognition();
    
    // Play voice feedback immediately
    if (isVoiceOptimized) {
      const askSituationText = language === 'hi'
        ? "आपकी आपातकाल क्या है?"
        : "What is your emergency?";

      speakOutLoud(askSituationText, () => {
        if (!callState.active) {
          startVoiceCommandListener();
        }
      });
    } else {
      // RULE: Visual Mode silent switch as requested to be fast! Use background continuous processing to support voice switch or SOS command
      window.speechSynthesis.cancel();
      if (!callState.active) {
        startVoiceCommandListener();
      }
    }
  };

  const startSetupSpeechRecognition = () => {
    if (isTriageCompleted.current) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Clean up any prev setup recognition block cleanly first
    stopSetupSpeechRecognition();

    try {
      const recognition = new SpeechRecognition();
      setupRecognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      
      recognition.onstart = () => {
        setSetupRecognitionActive(true);
      };

      recognition.onresult = (event: any) => {
        if (window.speechSynthesis.speaking) {
          return;
        }
        const resultText = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        setSetupHeardText(resultText);

        // Detect SOS in starting screen to immediately launch SOS sirens
        const isSos = resultText === 'sos' || resultText.includes('sos') || 
                      resultText.includes('s o s') || resultText.includes('severe emergency') || 
                      resultText.includes('emergency') || resultText.includes('help me') ||
                      resultText.includes('help') || resultText.includes('save me') ||
                      resultText.includes('बचाओ') || resultText.includes('एसओएस') || resultText.includes('एस ओ एस') ||
                      resultText.includes('बचाओ बचाओ') || resultText.includes('बचाओ!') ||
                      resultText.includes('मदद') || resultText.includes('इमरजेंसी') ||
                      resultText.includes('आपातकाल');

        if (isSos) {
          window.speechSynthesis.cancel();
          recognition.stop();
          setVoiceOptimized(false);
          isTriageCompleted.current = true;
          setAccessibilityPrompt(false);
          setSosActive(true);
          
          const guardianName = emergencyContacts.length > 0 ? emergencyContacts[0].name : '';
          const sosText = language === 'hi'
            ? `एसओएस आपातकालीन अलार्म सक्रिय हो गया है!`
            : `SOS emergency alert initiated.`;
          speakOutLoud(sosText, () => {
            stopVoiceCommandListener();
          });
          return;
        }

        const isReset = resultText.includes('reset') || resultText.includes('रीसेट') || resultText.includes('फिर से');
        if (isReset) {
          window.speechSynthesis.cancel();
          const welcomeSpeechText = language === 'hi'
            ? "वॉइस कमांड या विजुअल स्क्रीन?"
            : "Voice command or manual option?";
          speakOutLoud(welcomeSpeechText, () => {
            startSetupSpeechRecognition();
          });
          return;
        }
        
        const isVoiceMode = resultText.includes('voice') || 
                            resultText.includes('speech') || 
                            resultText.includes('command') || 
                            resultText.includes('वाइस') || 
                            resultText.includes('आवाज') || 
                            resultText.includes('कमांड') || 
                            resultText.includes('no') || 
                            resultText.includes('nahi') || 
                            resultText.includes('na ') || 
                            resultText.includes(' na') || 
                            resultText === 'na' || 
                            resultText.includes('नहीं') || 
                            resultText.includes('blind') || 
                            resultText.includes('cannot') || 
                            resultText.includes('unable') || 
                            resultText.includes('not able') || 
                            resultText.includes('ना') || 
                            resultText.includes('नही') || 
                            resultText.includes('नो');
                      
        const isManualMode = resultText.includes('manual') || 
                             resultText.includes('visual') || 
                             resultText.includes('touch') || 
                             resultText.includes('button') || 
                             resultText.includes('स्क्रीन') || 
                             resultText.includes('मैन्युअल') || 
                             resultText.includes('बटन') || 
                             resultText.includes('yes') || 
                             resultText.includes('haan') || 
                             resultText.includes('ha ') || 
                             resultText.includes(' ha') || 
                             resultText === 'ha' || 
                             resultText.includes('हाँ') || 
                             resultText.includes('see') || 
                             resultText.includes('visible') || 
                             resultText.includes('विजिबल') || 
                             resultText.includes('yup') || 
                             resultText.includes('yeah') || 
                             resultText.includes('okay') || 
                             resultText.includes('sure') || 
                             resultText.includes('यस') || 
                             resultText.includes('दिख');
        
        if (isVoiceMode) {
          window.speechSynthesis.cancel();
          recognition.stop();
          handleAccessibilitySelection(true);
        } else if (isManualMode) {
          window.speechSynthesis.cancel();
          recognition.stop();
          handleAccessibilitySelection(false);
        } else {
          // Restart to give another chance to catch clear YES/NO
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognition.onerror = () => {
        setSetupRecognitionActive(false);
      };

      recognition.onend = () => {
        setSetupRecognitionActive(false);
        // Automatically restart setup speech recognition if prompt is still open & was not completes yet
        if (!isTriageCompleted.current) {
          setTimeout(() => {
            if (!isTriageCompleted.current && setupRecognitionRef.current === recognition) {
              try {
                recognition.start();
              } catch (e) {}
            }
          }, 600);
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('Failed setup speech recognition start:', err);
    }
  };

  const [voiceDiagnosis, setVoiceDiagnosis] = useState<{
    heardText: string;
    domain: 'medical' | 'cyber' | 'disaster' | 'fire' | 'police' | 'general';
    domainLabel: string;
    domainLabelHi: string;
    helpline: string;
    advice: string[];
    adviceHi: string[];
    stressLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
    confidence?: number;
    detectedKeywords?: string[];
  } | null>(null);

  const handleVoiceCommandText = (commandText: string) => {
    const text = commandText.toLowerCase().trim();
    if (!text) return;

    // Detect SWITCH layout command to toggle visual/voice optimized
    const isSwitchMode = text === 'switch' || text.includes('switch') || 
                         text.includes('स्वीच') || text.includes('बदलो') ||
                         text.includes('change') || text.includes('screen') ||
                         text.includes('voice command') || text.includes('वॉइस कमांड') ||
                         text.includes('मैन्युअल');

    if (isSwitchMode) {
      const nextVoiceOptimized = !voiceOptimized;
      setVoiceOptimized(nextVoiceOptimized);
      localStorage.setItem('sahayak_voice_optimized', nextVoiceOptimized ? 'true' : 'false');
      setVoiceDiagnosis(null);
      setAwaitingCallConfirmation(false);
      setLastAnalyzedHelpNumber('');
      
      // Stop ongoing voice syntheses
      window.speechSynthesis.cancel();
      
      if (nextVoiceOptimized) {
        // Voice Mode enter: keep it extremely short and direct!
        const askText = language === 'hi'
          ? "वॉयस कमांड मोड सक्रिय किया गया है। आपकी आपातकाल क्या है?"
          : "Voice Command Mode activated. What is your emergency?";
        speakOutLoud(askText, () => {
          startVoiceCommandListener();
        });
      } else {
        // Standard Visual Mode
        const visualText = language === 'hi'
          ? "विजुअल टच स्क्रीन मोड सक्रिय किया गया है।"
          : "Visual touch screen mode activated.";
        speakOutLoud(visualText, () => {
          startVoiceCommandListener();
        });
      }
      return;
    }

    // Detect GO BACK command to return to starting onboarding triage selection screen
    const isGoBack = text === 'go back' || text.includes('go back') || 
                     text.includes('piche') || text.includes('पीछे') ||
                     text.includes('go to start') || text.includes('start screen') ||
                     text.includes('shuruat') || text.includes('back') ||
                     text.includes('वापस') || text.includes('पिछला');

    if (isGoBack) {
      window.speechSynthesis.cancel();
      isTriageCompleted.current = false;
      setAccessibilityPrompt(true);
      setVoiceDiagnosis(null);
      setAwaitingCallConfirmation(false);
      setLastAnalyzedHelpNumber('');
      stopVoiceCommandListener();
      
      const backWelcomeText = language === 'hi'
        ? "शुरुआती स्क्रीन पर वापस भेज दिया गया है। अपना पसंदीदा विकल्प चुन सकते हैं।"
        : "Returned to the start screen. Please choose your preferred mode.";
      
      speakOutLoud(backWelcomeText, () => {
        startSetupSpeechRecognition();
      });
      return;
    }

    // Detect SOS/Emergency Trigger command
    const isSos = text === 'sos' || text.includes('sos') || 
                  text.includes('s o s') || text.includes('severe emergency') || 
                  text.includes('बचाओ') || text.includes('एसओएस') || text.includes('एस ओ एस') ||
                  text.includes('बचाओ बचाओ') || text.includes('बचाओ!');
                  
    if (isSos) {
      setSosActive(true);
      window.speechSynthesis.cancel();
      
      const guardianName = emergencyContacts.length > 0 ? emergencyContacts[0].name : '';
      const sosGreetingText = language === 'hi'
        ? (guardianName 
           ? `एसओएस आपातकालीन अलार्म सक्रिय हो गया है! आपके अभिभावक, ${guardianName}, को आपका लाइव स्थान भेज दिया गया है, और पुलिस व आपातकालीन बल को संकेत भेज दिया गया है।`
           : `एसओएस आपातकालीन अलार्म सक्रिय हो गया है! पुलिस अधिकारियों को स्थान प्रसारित कर दिया गया है।`)
        : (guardianName
           ? `SOS alert activated. Your live GPS coordinates have been sent to your guardian, ${guardianName}, and closest first responders have been notified.`
           : `SOS emergency alert initiated. Sending your status and coordinates to police dispatch.`);

      speakOutLoud(sosGreetingText, () => {
        // Resume silent background voice commands processing
        startVoiceCommandListener();
      });
      return;
    }

    // Rule: We process all voice commands seamlessly even in visual screen mode to support active background capturing.

    // Detect reset command to quickly re-open mic and clear state
    const isReset = text === 'reset' || text.includes('reset') || 
                    text.includes('clear') || text.includes('start again') ||
                    text.includes('start over') || text.includes('clean') ||
                    text.includes('रिसेट') || text.includes('फिर से') || text.includes('शुरू') ||
                    text.includes('नया') || text.includes('saf') || text.includes('restart');

    if (isReset) {
      setVoiceDiagnosis(null);
      setAwaitingCallConfirmation(false);
      setLastAnalyzedHelpNumber('');
      window.speechSynthesis.cancel();
      
      const resetConfirmText = language === 'hi'
        ? "आपकी आपातकाल क्या है?"
        : "What is your emergency?";

      speakOutLoud(resetConfirmText, () => {
        if (!callState.active) {
          startVoiceCommandListener();
        }
      });
      return;
    }

    // Detect if calling or normal screen is requested explicitly
    const isStandardMode = text.includes('standard') || text.includes('normal') || text.includes('normal screen') || text.includes('विजुअल') || text.includes('सामान्य') || text.includes('नॉर्मल');

    if (isStandardMode) {
      handleAccessibilitySelection(false);
      return;
    }

    // Call confirmation yes/no flows (when awaiting call confirmation)
    if (awaitingCallConfirmation && lastAnalyzedHelpNumber) {
      const isConfirmYes = text === 'yes' || text.includes('yes') || 
                           text.includes('haan') || text.includes('ha ') || text.includes('ha') ||
                           text.includes('हाँ') || text.includes('call') || text.includes('dial') ||
                           text.includes('connect') || text.includes('कॉल') || text.includes('फ़ोन') ||
                           text.includes('मिला') || text.includes('हाँ जी') || text.includes('जी हाँ') ||
                           text.includes('ok') || text.includes('sure') || text.includes('confirm') ||
                           text.includes('lagao') || text.includes('लगाओ') || text.includes('येस') || text.includes('करो') || text.includes('हां');
                           
      const isConfirmNo = text === 'no' || text.includes('no') || 
                          text.includes('nahi') || text.includes('na ') || text.includes(' na') ||
                          text.includes('नहीं') || text.includes('cancel') || text.includes('stop') ||
                          text.includes('मना') || text.includes('काटो') || text.includes('रोक') || text.includes('ना');

      if (isConfirmYes) {
        setAwaitingCallConfirmation(false);
        let matchingItem = HELPLINES.find(h => h.number === lastAnalyzedHelpNumber);
        if (!matchingItem) {
          matchingItem = {
            id: `auto-dial`,
            nameEn: 'Emergency Helpline',
            nameHi: 'आपातकालीन हेल्पलाइन',
            number: lastAnalyzedHelpNumber,
            category: 'general',
            descriptionEn: 'Auto classified voice helpline',
            descriptionHi: 'आवाज द्वारा स्वचालित हेल्पलाइन'
          };
        }
        
        const callDialGreetingText = language === 'hi'
          ? `ठीक है, मैं आपातकालीन सेवा नंबर ${lastAnalyzedHelpNumber} पर संकट कॉल मिला रहा हूँ।`
          : `Connecting you to emergency helpline ${lastAnalyzedHelpNumber}.`;

        speakOutLoud(callDialGreetingText, () => {
          initiateGlobalCall(matchingItem!);
        });
        return;
      } else if (isConfirmNo) {
        setAwaitingCallConfirmation(false);
        setLastAnalyzedHelpNumber('');
        speakOutLoud(language === 'hi' 
          ? "कॉल निरस्त। कृपया स्थिति बताएं।" 
          : "Cancelled. Please state your emergency."
        );
        return;
      }
    }

    // Run our multilingual advanced speech classification & intent engine!
    const diagnosis = analyzeEmergencySpeech(commandText, language);

    setVoiceDiagnosis({
      heardText: commandText,
      domain: diagnosis.domain,
      domainLabel: diagnosis.domainLabel,
      domainLabelHi: diagnosis.domainLabelHi,
      helpline: diagnosis.helpline,
      advice: diagnosis.advice,
      adviceHi: diagnosis.adviceHi,
      stressLevel: diagnosis.stressLevel,
      confidence: diagnosis.confidence,
      detectedKeywords: diagnosis.detectedKeywords
    });

    const isHn = language === 'hi';
    let speechReport = '';

    // Reassurance prefix for high stress situations
    const reassurancePrefix = isHn ? diagnosis.reassurePrefixHi : diagnosis.reassurePrefixEn;

    // Rule: first provide related emergency number, then give him advice
    if (isHn) {
      speechReport = reassurancePrefix + `अनुशंसित हेल्पलाइन नंबर है ${diagnosis.helpline}। आवश्यक आपातकालीन सुरक्षा निर्देश इस प्रकार हैं: ` + diagnosis.adviceHi.join(". ");
      if (diagnosis.isCallRequested) {
        speechReport += `। आपके स्थान विवरण के साथ हेल्पलाइन ${diagnosis.helpline} को तुरंत संकट कॉल मिलाई जा रही है।`;
      } else {
        speechReport += `। क्या आप इस सुरक्षा हेल्पलाइन पर लाइव कॉल करना चाहते हैं? हाँ या ना कहें।`;
      }
    } else {
      speechReport = reassurancePrefix + `Recommended helpline number is ${diagnosis.helpline}. Immediate safety advice instructions are: ` + diagnosis.advice.join(". ");
      if (diagnosis.isCallRequested) {
        speechReport += ` Directly connecting you to hotline number ${diagnosis.helpline} now.`;
      } else {
        speechReport += ` Do you want to call this helpline? Please say YES or say NO.`;
      }
    }

    speakOutLoud(speechReport, () => {
      if (diagnosis.isCallRequested) {
        setAwaitingCallConfirmation(false);
        setLastAnalyzedHelpNumber('');
        let matchingItem = HELPLINES.find(h => h.number === diagnosis.helpline);
        if (!matchingItem) {
          matchingItem = {
            id: `auto-${diagnosis.domain}`,
            nameEn: diagnosis.domainLabel,
            nameHi: diagnosis.domainLabelHi,
            number: diagnosis.helpline,
            category: diagnosis.domain === 'general' ? 'general' : diagnosis.domain,
            descriptionEn: 'Auto classified voice helpline',
            descriptionHi: 'आवाज द्वारा स्वचालित हेल्पलाइन'
          };
        }
        initiateGlobalCall(matchingItem);
      } else {
        setAwaitingCallConfirmation(true);
        setLastAnalyzedHelpNumber(diagnosis.helpline);
        
        if (!callState.active) {
          startVoiceCommandListener();
        }
      }
    });
  };

  useEffect(() => {
    handleVoiceCommandTextRef.current = handleVoiceCommandText;
  });

  const startVoiceCommandListener = () => {
    // Stop any currently running instance cleanly first to avoid overlapping calls
    stopVoiceCommandListener();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      speakOutLoud(language === 'hi' 
        ? "क्षमा करें, आपका ब्राउज़र स्पीच रिकग्निशन का समर्थन नहीं करता है।" 
        : "Sorry, speech recognition is not supported in this browser or sandbox.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      
      recognition.onstart = () => {
        setContinuousListening(true);
        setVoiceCommandHeardText('');
      };

      recognition.onresult = (event: any) => {
        const resultText = event.results[event.results.length - 1][0].transcript;
        const lowerResult = resultText.toLowerCase().trim();
        
        // Detect reset/restart even during speaking
        const isResetWord = lowerResult === 'reset' || lowerResult.includes('reset') || 
                            lowerResult.includes('clear') || lowerResult.includes('start again') ||
                            lowerResult.includes('start over') || lowerResult.includes('clean') ||
                            lowerResult.includes('रीसेट') || lowerResult.includes('फिर से') || lowerResult.includes('शुरू') ||
                            lowerResult.includes('नया') || lowerResult.includes('saf') || lowerResult.includes('restart');

        // Detect switch word to barge in and switch modes even while speaking
        const isSwitchWord = lowerResult === 'switch' || lowerResult.includes('switch') || 
                             lowerResult.includes('स्वीच') || lowerResult.includes('बदलो') ||
                             lowerResult.includes('change') || lowerResult.includes('screen') ||
                             lowerResult.includes('voice command') || lowerResult.includes('वॉइस कमांड') ||
                             lowerResult.includes('मैन्युअल');

        // Detect SOS word to barge in even while speaking
        const isSosWord = lowerResult === 'sos' || lowerResult.includes('sos') || 
                          lowerResult.includes('s o s') || lowerResult.includes('severe emergency') || 
                          lowerResult.includes('बचाओ') || lowerResult.includes('एसओएस') || lowerResult.includes('एस ओ एस') ||
                          lowerResult.includes('बचाओ बचाओ') || lowerResult.includes('बचाओ!');

        // Detect go back word to barge in even while speaking
        const isGoBackWord = lowerResult === 'go back' || lowerResult.includes('go back') || 
                             lowerResult.includes('piche') || lowerResult.includes('पीछे') ||
                             lowerResult.includes('go to start') || lowerResult.includes('start screen') ||
                             lowerResult.includes('shuruat') || lowerResult.includes('back') ||
                             lowerResult.includes('वापस') || lowerResult.includes('पिछला');

        // Guard against picking up self synthesized voice feedback, EXCEPT if it's a bypass command!
        if (window.speechSynthesis.speaking) {
          if (isResetWord || isSwitchWord || isSosWord || isGoBackWord) {
            window.speechSynthesis.cancel();
            setVoiceCommandHeardText(resultText);
            if (handleVoiceCommandTextRef.current) {
              handleVoiceCommandTextRef.current(resultText);
            }
          }
          return;
        }

        setVoiceCommandHeardText(resultText);
        if (handleVoiceCommandTextRef.current) {
          handleVoiceCommandTextRef.current(resultText);
        }
      };

      recognition.onerror = () => {
        setContinuousListening(false);
      };

      recognition.onend = () => {
        setContinuousListening(false);
        // Automatically restart speech recognition when setup is done and no active simulated phone call is running
        if (!accessibilityPrompt && !callState.active && recognitionRef.current === recognition) {
          setTimeout(() => {
            if (!accessibilityPrompt && !callState.active && recognitionRef.current === recognition) {
              try {
                recognition.start();
              } catch (e) {}
            }
          }, 500);
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('SpeechRecognition failed to start:', err);
      setContinuousListening(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'home' | 'helplines' | 'triage' | 'chat' | 'settings' | 'complaint' | 'docwizard'>('home');
  const [language, setLanguage] = useState<Language>('en');
  const [activeCategory, setActiveCategory] = useState<EmergencyCategory>('cyber');
  const [locationName, setLocationName] = useState<string>(() => {
    return localStorage.getItem('sahayak_custom_location_name') || 'Rajpath, New Delhi';
  });
  const [mockSignalStrength, setMockSignalStrength] = useState<string>('94% Safe • GPS Locked');
  
  // Storage hooks
  const [medicalProfile, setMedicalProfile] = useState<MedicalProfile>(() => {
    const saved = localStorage.getItem('sahayak_medical_profile');
    return saved ? JSON.parse(saved) : INITIAL_MEDICAL_PROFILE;
  });

  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('sahayak_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Geolocation states & routines
  const [gpsLoading, setGpsLoading] = useState(false);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [showLocationAlert, setShowLocationAlert] = useState(() => {
    const savedAutoSync = localStorage.getItem('sahayak_auto_gps_sync');
    const dismissTime = localStorage.getItem('sahayak_location_alert_dismissed');
    if (savedAutoSync === 'true') return false;
    if (dismissTime && Date.now() - Number(dismissTime) < 86400000) return false; // 24 hours cooldown
    return true;
  });

  const requestRealLocation = () => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const coordsStr = `${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E`;
        
        try {
          // Reverse geocode with OpenStreetMap Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`, {
            headers: {
              'User-Agent': 'SahayakEmergencyAIClient/1.0'
            }
          });
          const data = await res.json();
          const address = data.address || {};
          const district = address.suburb || address.neighbourhood || address.residential || address.village || address.city_district || address.city || address.town || address.county || 'My Location';
          const state = address.state || '';
          const name = district + (state ? `, ${state}` : '');
          
          setLocationName(name);
          setMockSignalStrength('100% Locked • Live Satellite GPS');
          localStorage.setItem('sahayak_custom_location_coords', coordsStr);
          localStorage.setItem('sahayak_custom_location_name', name);
          localStorage.setItem('sahayak_auto_gps_sync', 'true');
          setLocationPermissionStatus('granted');
          setShowLocationAlert(false);
        } catch (err) {
          const fallbackName = `Live Area (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
          setLocationName(fallbackName);
          setMockSignalStrength('100% Locked • Coords Locked');
          localStorage.setItem('sahayak_custom_location_coords', coordsStr);
          localStorage.setItem('sahayak_custom_location_name', fallbackName);
          localStorage.setItem('sahayak_auto_gps_sync', 'true');
          setLocationPermissionStatus('granted');
          setShowLocationAlert(false);
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setGpsLoading(false);
        setLocationPermissionStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    // Automatically retrieve and request geolocation right upon load
    requestRealLocation();

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((status) => {
        setLocationPermissionStatus(status.state);
        if (status.state === 'granted') {
          requestRealLocation();
        }
        status.onchange = () => {
          setLocationPermissionStatus(status.state);
        };
      }).catch(() => {});
    }
  }, []);

  // Proactively voice prompt at starting load - starts taking voice without saying anything to be extremely fast and robust!
  useEffect(() => {
    if (accessibilityPrompt) {
      startSetupSpeechRecognition();
      return () => {
        stopSetupSpeechRecognition();
        window.speechSynthesis.cancel();
      };
    }
  }, [accessibilityPrompt]);

  // Tab change voice assistant reporter
  useEffect(() => {
    if (voiceOptimized && !accessibilityPrompt) {
      let speech = '';
      if (activeTab === 'home') {
        speech = language === 'hi'
          ? "मुख्य पृष्ठ लोड हो गया है। यहाँ सभी प्रकार की आपातकालीन श्रेणियाँ और सहायता बटन उपलब्ध हैं।"
          : "Screen: Home dashboard. 8 emergency assistance categories and live GPS coordinates are ready.";
      } else if (activeTab === 'helplines') {
        speech = language === 'hi'
          ? "हेल्पलाइन्स सीधे संपर्क डिक्शनरी। आपातकालीन कॉलिंग नंबर यहाँ दिए गए हैं।"
          : "Screen: Helpline directory. Government emergency and relief phone lines are available.";
      } else if (activeTab === 'chat') {
        speech = language === 'hi'
          ? "चैट क्षेत्र। स्थिति बताएं, सहायक आपके लिए कार्रवाई का सुझाव देगा।"
          : "Screen: AI triage chatbot. Speak or write your emergency, Sahayak will auto-suggest rescue actions.";
      } else if (activeTab === 'triage') {
        speech = language === 'hi'
          ? 'ट्राइएज स्क्रीन। आपातकाल की प्राथमिक जानकारी बताएं।'
          : 'Screen: Triage assistant. Quickly describe your emergency for rapid suggestions.';
      } else if (activeTab === 'settings') {
        speech = language === 'hi'
          ? "सुरक्षा जानकारी सेटिंग्स। चिकित्सा रिकॉर्ड और आपातकालीन नंबर बदलें।"
          : "Screen: Identity and safety card settings. Edit your blood group, medical reports, or contacts.";
      } else if (activeTab === 'docwizard') {
        speech = language === 'hi'
          ? "दस्तावेज़ खो जाने पर सहायक। खोया हुआ दस्तावेज़ चुनें।"
          : "Screen: Document Loss Wizard. Select which document you lost to get recovery steps.";
      }
      speakOutLoud(speech);
    }
  }, [activeTab, voiceOptimized, language, accessibilityPrompt]);

  // Proactively pop up form if first visit
  useEffect(() => {
    if (!currentUser) {
      setAuthModalOpen(true);
    }
  }, [currentUser]);

  const handleAuthSuccess = (user: any) => {
    setCurrentUser(user);
    if (user.fullName) {
      setMedicalProfile({
        fullName: user.fullName || 'Anonymous Guest',
        bloodType: user.bloodType || 'O+',
        allergies: user.allergies || 'None declared',
        medications: user.medications || 'None active',
        emergencyNotes: user.emergencyNotes || (user.isRegistered ? 'Registered emergency account citizen.' : 'Using guest/secret mode consultation.')
      });
    }
    if (user.districtArea) {
      setLocationName(user.districtArea);
    }
  };

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(() => {
    const saved = localStorage.getItem('sahayak_emergency_contacts');
    return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
  });

  // Home search input fields linked straight to Chat Triage
  const [homeSearchInput, setHomeSearchInput] = useState('');
  const [chatInitialQuery, setChatInitialQuery] = useState('');

  // SOS activation HUD toggles
  const [sosActive, setSosActive] = useState(false);
  // Panic mode state
  const [panicMode, setPanicMode] = useState(false);
  // Online/offline state
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  // Wire up shake-to-SOS gesture handler
  useShakeToSOS({
    onShake: () => {
      setSosActive(true);
      const sosText = language === 'hi'
        ? 'एसओएस सक्रिय — फोन हिलाया गया!'
        : 'SOS activated by shake gesture!';
      try {
        speakOutLoud(sosText);
      } catch (e) {
        // ignore
      }
    },
    enabled: !sosActive,
    threshold: 18,
    minShakes: 3,
    windowMs: 1200,
    cooldownMs: 5000,
  });

  // Global call simulation states
  const [callState, setCallState] = useState<ActiveCallState>({
    active: false,
    number: '',
    name: '',
    status: 'dialing',
    duration: 0,
    responderSpeech: ''
  });

  // Call duration ticker
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState.active && callState.status === 'connected') {
      interval = setInterval(() => {
        setCallState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState.active, callState.status]);

  // Online / offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle call simulation transitions
  useEffect(() => {
    let connectTimeout: NodeJS.Timeout;

    if (callState.active && callState.status === 'dialing') {
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

        setCallState(prev => ({
          ...prev,
          status: 'connected',
          responderSpeech: bSpeech
        }));
      }, 2500); // 2.5 seconds ringing simulation
    }

    return () => {
      clearTimeout(connectTimeout);
    };
  }, [callState.active, callState.status, callState.number, language, locationName]);

  // Handle active background speech synthesis & recognition orchestration across state shifts (mode toggles, language swaps, call state resets)
  useEffect(() => {
    if (!accessibilityPrompt && !callState.active) {
      startVoiceCommandListener();
    }
    return () => {
      stopVoiceCommandListener();
    };
  }, [language, voiceOptimized, accessibilityPrompt, callState.active]);

  const initiateGlobalCall = (item: HelplineItem) => {
    // Explicitly shut off and stop voice commands while a call is simulated
    stopVoiceCommandListener();

    setCallState({
      active: true,
      number: item.number,
      name: language === 'hi' ? item.nameHi : item.nameEn,
      status: 'dialing',
      duration: 0,
      responderSpeech: ''
    });
  };

  const endGlobalCall = () => {
    setCallState(prev => ({
      ...prev,
      status: 'completed'
    }));
    setTimeout(() => {
      setCallState({ active: false, number: '', name: '', status: 'dialing', duration: 0 });
      // Automatically restart voice assistant if setup triage is done
      if (!accessibilityPrompt) {
        startVoiceCommandListener();
      }
    }, 1000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Mic recording activation mockups
  const [micActive, setMicActive] = useState(false);
  const [micTextSimulated, setMicTextSimulated] = useState('');
  const [isMicSpeaking, setIsMicSpeaking] = useState(false);
  const [micStateMsg, setMicStateMsg] = useState<string>('');
  const [micError, setMicError] = useState<'permission-denied' | 'not-supported' | 'iframe-blocked' | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('sahayak_medical_profile', JSON.stringify(medicalProfile));
  }, [medicalProfile]);

  useEffect(() => {
    localStorage.setItem('sahayak_emergency_contacts', JSON.stringify(emergencyContacts));
  }, [emergencyContacts]);

  const handleLanguageToggle = () => {
    setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  const handleCategoryClick = (cat: EmergencyCategory) => {
    setActiveCategory(cat);
    setActiveTab('chat');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeSearchInput.trim()) return;
    setChatInitialQuery(homeSearchInput);
    setActiveTab('chat');
    setHomeSearchInput('');
  };

  // Mic Simulation Action: attempts Chrome Speech Recognition or triggers smart simulation
  const startMicTriage = async () => {
    setMicActive(true);
    setMicTextSimulated('');
    setIsMicSpeaking(true);
    setMicError(null);
    setMicStateMsg(language === 'hi' ? 'माइक्रोफ़ोन अनुमति स्वीकृत की जा रही है...' : 'Requesting live microphone permission...');

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setMicError('not-supported');
      setIsMicSpeaking(false);
      return;
    }

    try {
      // Prompt user with real browser popup
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      setMicStateMsg(language === 'hi' ? 'सुन रहा हूँ... अपनी समस्या बोलें' : 'Listening... State your distress or emergency detail now');

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        const activeText = finalTranscript || interimTranscript;
        setMicTextSimulated(activeText);

        if (finalTranscript) {
          setIsMicSpeaking(false);
          setMicStateMsg(language === 'hi' ? 'आवाज सफलतापूर्वक डिकोड की गई!' : 'Voice stream successfully decoded!');
          // Release microphone hardware immediately
          stream.getTracks().forEach(track => track.stop());

          setTimeout(() => {
            setChatInitialQuery(finalTranscript);
            setActiveTab('chat');
            setMicActive(false);
          }, 1500);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        stream.getTracks().forEach(track => track.stop());
        setIsMicSpeaking(false);
        
        if (event.error === 'not-allowed') {
          setMicError('permission-denied');
        } else {
          setMicError('iframe-blocked');
        }
      };

      recognition.onend = () => {
        setIsMicSpeaking(false);
        stream.getTracks().forEach(track => track.stop());
      };

      recognition.start();
    } catch (err: any) {
      console.warn('Microphone permission check failed:', err);
      setIsMicSpeaking(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.includes('denied')) {
        setMicError('permission-denied');
      } else {
        setMicError('iframe-blocked');
      }
    }
  };

  const triggerVoiceSimulationDemo = () => {
    setMicError(null);
    setIsMicSpeaking(true);
    setMicTextSimulated('');
    setMicStateMsg(language === 'hi' ? 'कृत्रिम बुद्धिमत्ता सिमुलेशन सक्रिय...' : 'AI Simulation Feed Handshake...');

    const SIMULATED_SPOKEN_PHRASES: Record<EmergencyCategory, string[]> = {
      cyber: [
        'Hacking issue, I received blackmail text messages and bank alert',
        'Someone withdrew 20,000 rupees from my bank account online',
      ],
      medical: [
        'Emergency, my brother fell down and has chest breathing pressure',
        'Ambulance, severe wound cut, bleeding heavily',
      ],
      women: [
        'Harassment near metro crossing, suspicious strangers tailing me',
        'Need secure safety guard, taking late-night cab',
      ],
      police: [
        'Burglary attempt, suspicious strangers broke gate lock',
        'Physical hazard threat, need police patrol dispatch',
      ],
      lost: [
        'Lost pocket holding original passport and Aadhaar card',
        'Need legal copy report for lost corporate laptop',
      ],
      fire: [
        'Urgent electrical wire sparks triggering massive smoke',
        'Major fire outbreak on second floor block',
      ],
      disaster: [
        'Heavy storm cloud-burst water logging trapped in basement',
        'Severe earthquake shock tremors felt, building cracked',
      ],
      legal: [
        'Can police investigate female after hours without warrant?',
        'Need urgent legal help, illegal lock out by landlord',
      ],
    };

    const phrases = SIMULATED_SPOKEN_PHRASES[activeCategory] || SIMULATED_SPOKEN_PHRASES.medical;
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

    let charIdx = 0;
    const interval = setInterval(() => {
      charIdx += 4;
      setMicTextSimulated(randomPhrase.substring(0, charIdx));
      if (charIdx >= randomPhrase.length) {
        clearInterval(interval);
        setIsMicSpeaking(false);
        setMicStateMsg(language === 'hi' ? 'सिमुलेशन पूर्ण!' : 'Simulation completed!');
        setTimeout(() => {
          setChatInitialQuery(randomPhrase);
          setActiveTab('chat');
          setMicActive(false);
        }, 1800);
      }
    }, 80);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white overflow-x-hidden antialiased selection:bg-primary-container selection:text-white pb-32 relative">
      <div className="mesh-bg">
        <div className="mesh-blob blob-1" />
        <div className="mesh-blob blob-2" />
      </div>
      
      {/* Absolute Header Menu bar */}
      <header className="fixed top-0 w-full z-45 bg-white/5 backdrop-blur-2xl border-b border-white/10 flex justify-between items-center px-6 h-16 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-lg">
            <Compass size={20} className="text-white animate-pulse" />
          </div>
          <h1 className="font-sans font-black text-lg md:text-xl text-white tracking-tight uppercase flex items-center gap-1.5">
            <span>Sahayak</span>
            <span className="text-[10px] bg-white/10 border border-white/20 text-white/90 px-1.5 py-0.5 rounded tracking-wide leading-none font-sans lowercase font-medium">emergency ai</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {!accessibilityPrompt && (
            <>
              {/* Manual Go Back Navigation Control */}
              <button
                id="header-go-back"
                onClick={() => {
                  window.speechSynthesis.cancel();
                  isTriageCompleted.current = false;
                  setAccessibilityPrompt(true);
                  setVoiceDiagnosis(null);
                  setAwaitingCallConfirmation(false);
                  setLastAnalyzedHelpNumber('');
                  stopVoiceCommandListener();
                  setTimeout(() => {
                    startSetupSpeechRecognition();
                  }, 100);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-[11px] md:text-xs font-sans font-bold text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm"
              >
                <span>⬅️</span>
                <span className="hidden xs:inline">{language === 'hi' ? 'पीछे' : 'Go Back'}</span>
              </button>

              {/* Dynamic Switch Mode Control */}
              <button
                id="header-switch-mode"
                onClick={() => {
                  const nextVoiceOptimized = !voiceOptimized;
                  setVoiceOptimized(nextVoiceOptimized);
                  localStorage.setItem('sahayak_voice_optimized', nextVoiceOptimized ? 'true' : 'false');
                  setVoiceDiagnosis(null);
                  setAwaitingCallConfirmation(false);
                  setLastAnalyzedHelpNumber('');
                  window.speechSynthesis.cancel();
                  
                  if (nextVoiceOptimized) {
                    const askText = language === 'hi'
                      ? "वॉयस कमांड मोड सक्रिय किया गया है। आपकी आपातकाल क्या है?"
                      : "Voice Command Mode activated. What is your emergency?";
                    speakOutLoud(askText, () => {
                      startVoiceCommandListener();
                    });
                  } else {
                    const visualText = language === 'hi'
                      ? "विजुअल टच स्क्रीन मोड सक्रिय किया गया है।"
                      : "Visual touch screen mode activated.";
                    speakOutLoud(visualText, () => {
                      startVoiceCommandListener();
                    });
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-[11px] md:text-xs font-sans font-bold text-white transition-all cursor-pointer border border-indigo-505 shadow-sm"
              >
                <span>{voiceOptimized ? '👁️' : '🎙️'}</span>
                <span>{voiceOptimized ? (language === 'hi' ? 'विजुअल' : 'Visual') : (language === 'hi' ? 'वॉयस' : 'Voice')}</span>
              </button>

              {/* Ambient continuous microphone status in visual mode */}
              {!voiceOptimized && (
                <div 
                  id="ambient-mic-indicator-badge" 
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-sans font-bold text-emerald-400 select-none animate-pulse"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  <span>{language === 'hi' ? 'पृष्ठभूमि वॉयस सक्रिय' : 'BACKGROUND VOICE ACTIVE'}</span>
                </div>
              )}
            </>
          )}

          {/* Universal Language swapper badge */}
          <button
            id="lang-toggle-header"
            onClick={handleLanguageToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-sans font-bold text-white hover:border-white/30 transition-colors uppercase leading-none shadow-sm cursor-pointer"
          >
            <Languages size={13} className="text-white" />
            <span>{language === 'en' ? 'EN / हिंदी' : 'हिंदी / EN'}</span>
          </button>

          {/* Triage Option (bottom nav) */}
          <button
            id="triage-tab-btn-bottomnav"
            onClick={() => setActiveTab('triage')}
            className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl duration-200 cursor-pointer ${
              activeTab === 'triage'
                ? 'bg-primary-container text-white border border-primary/25 shadow shadow-primary-container/20 font-bold'
                : 'text-on-surface-variant/75 hover:bg-surface-variant/30 hover:text-white'
            }`}
          >
            <Zap size={18} />
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider mt-1">{language === 'hi' ? 'ट्राइएज' : 'Triage'}</span>
          </button>



          {/* Identity/Account state trigger badge */}
          <button
            id="identity-status-badge"
            onClick={() => setAuthModalOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-sans font-extrabold border transition-all cursor-pointer shadow-sm ${
              currentUser?.isRegistered
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/20 animate-pulse'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>
              {currentUser?.isRegistered 
                ? `${currentUser.fullName} (${currentUser.districtArea.split(',')[0]})` 
                : (language === 'hi' ? 'साइन-इन / नया खाता' : 'GUEST ID (SIGN IN)')}
            </span>
          </button>
        </div>
      </header>

      {/* Primary Dashboard Contain Canvas */}
      <main className="pt-24 pb-12 px-6 max-w-2xl lg:max-w-6xl xl:max-w-7xl mx-auto w-full transition-all duration-300">
        {voiceOptimized ? (
          <div id="voice-immersive-portal" className="max-w-4xl mx-auto flex flex-col gap-6 animate-fade-in py-6">
            {/* Pulsing Audio Hologram Stage Indicator */}
            <div className="glass-card rounded-3xl p-8 border-2 border-indigo-500/30 bg-indigo-950/20 text-center flex flex-col items-center gap-6 relative overflow-hidden shadow-2xl">
              {/* Spinning / Pulsating holographic ambient glowing orb */}
              <div className="relative w-44 h-44 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full bg-indigo-500/5 border border-indigo-500/15 animate-ping duration-1000 ${continuousListening ? 'bg-emerald-500/10 border-emerald-500/20' : ''}`} />
                <div className={`absolute w-36 h-36 rounded-full bg-gradient-to-tr from-indigo-500/10 via-pink-500/10 to-transparent border-2 border-indigo-500/20 flex items-center justify-center shadow-inner ${continuousListening ? 'from-emerald-500/20 via-cyan-500/10' : ''}`} />
                <div className={`w-28 h-28 rounded-full bg-slate-900 border-2 border-slate-800 flex flex-col items-center justify-center text-white relative z-10 shadow-[0_4px_24px_rgba(0,0,0,0.8)]`}>
                  <Mic size={42} className={continuousListening ? "text-emerald-400 animate-pulse scale-110 duration-200" : "text-indigo-400"} />
                  <span className="font-mono text-[8px] tracking-widest uppercase mt-2 font-bold block">
                    {continuousListening 
                      ? (language === 'hi' ? 'माइक्रोफ़ोन सक्रिय' : 'MIC LISTENING') 
                      : (language === 'hi' ? 'आवाज़ विश्लेषण' : 'VOICE HUD INACTIVE')}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-mono text-[9px] font-black tracking-widest uppercase text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
                  {language === 'hi' ? 'नो-टैप वॉयस कण्ट्रोल सक्रिय' : '🔴 NO-TAP VOICE CONSOLE ACTIVE'}
                </span>
                <h2 className="font-sans font-black text-2xl lg:text-3xl tracking-tight text-white mt-4">
                  {continuousListening 
                    ? (language === 'hi' ? 'कृपया अपनी समस्या के बारे में विस्तार से बोलें...' : 'Explain your crisis situations details now...') 
                    : (language === 'hi' ? 'सहायक आवाज डिकोडर निष्क्रिय' : 'Press the speak button manually if mic sleeps')}
                </h2>
                <p className="font-sans text-xs text-indigo-200/80 max-w-lg mx-auto mt-2 leading-relaxed">
                  {language === 'hi'
                    ? "सहायक डिकोडर हमेशा चालू रहता है। पुलिस पीसीआर के लिए 'पुलिस', अस्पताल संकट के लिए 'एम्बुलेंस/चिकित्सा', साइबर ठगी हेतु 'साइबर' कहें।"
                    : "No tapping required. Simply talk clearly. Categorizes medical, cyber, disaster or fire and speaks instructions step-by-step."}
                </p>
              </div>

              {/* Heard spoken words live preview bubble */}
              <div className="w-full bg-[#1e293b]/40 border border-white/5 p-5 rounded-2xl min-h-20 flex flex-col items-center justify-center select-none">
                <span className="font-mono text-[9px] text-[#38bdf8] font-black uppercase tracking-widest mb-1 block select-none">
                  {language === 'hi' ? 'अंतिम ध्वनि ट्रांसक्रिप्ट' : 'LAST SPEECH TRANSCRIPT TRANSCEIVER'}
                </span>
                <p className="font-sans text-amber-200 font-bold text-sm lg:text-base leading-relaxed italic text-center select-none">
                  {voiceCommandHeardText 
                    ? `“${voiceCommandHeardText}”` 
                    : (language === 'hi' ? "“...जैसे: 'मेरा बटुआ खो गया है और मैं मुसीबत में हूँ' या 'आग लग गई है' बोलें...”" : "“...Say e.g. 'I smell gas leakage smoke in the kitchen' or 'hospital accident'...”")}
                </p>
              </div>

              {/* Location telemetry link banner */}
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>
                  {language === 'hi' 
                    ? `स्वचालित उपग्रह जीपीएस स्थान संचरण: ${locationName}` 
                    : `AUTOMATIC SATELLITE GPS LINK DESPATCHING: ${locationName}`}
                </span>
              </div>
            </div>

            {/* Live diagnosis card */}
            {voiceDiagnosis ? (
              <div className={`glass-card rounded-3xl p-6 lg:p-8 animate-fade-in border-2 relative overflow-hidden shadow-xl ${
                voiceDiagnosis.domain === 'medical' ? 'border-red-500/30 bg-red-950/10' :
                voiceDiagnosis.domain === 'fire' ? 'border-orange-500/30 bg-orange-950/10' :
                voiceDiagnosis.domain === 'cyber' ? 'border-sky-500/30 bg-sky-950/10' :
                voiceDiagnosis.domain === 'disaster' ? 'border-yellow-500/30 bg-yellow-950/10' :
                'border-purple-500/30 bg-purple-950/10'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-[#38bdf8] block">
                      {language === 'hi' ? 'ऑटो विश्लेषित डोमेन' : 'CRISIS CLASSIFIED OUTCOME'}
                    </span>
                    <h3 className="font-sans font-black text-xl lg:text-2xl text-white mt-1">
                      {language === 'hi' ? voiceDiagnosis.domainLabelHi : voiceDiagnosis.domainLabel}
                    </h3>
                  </div>
                  <div className="bg-white/10 border border-white/20 px-4 py-2 rounded-2xl flex flex-col items-center shrink-0">
                    <span className="font-mono text-[8px] text-white/50 tracking-wider uppercase font-bold">{language === 'hi' ? 'आपातकालीन नंबर' : 'HOTLINE'}</span>
                    <span className="font-mono text-xl font-black text-primary select-none">{voiceDiagnosis.helpline}</span>
                  </div>
                </div>

                {/* Cognitive stress classifiers & intent validation parameters */}
                <div className="flex gap-2 flex-wrap mt-4">
                  {voiceDiagnosis.stressLevel && (
                    <span id="stress-level-indicator" className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border font-mono ${
                      voiceDiagnosis.stressLevel === 'HIGH' ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' :
                      voiceDiagnosis.stressLevel === 'MEDIUM' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                      'bg-slate-500/20 text-slate-300 border-slate-500/30'
                    }`}>
                      {language === 'hi' ? 'तनाव सूचकांक' : 'Stress Index'}: {voiceDiagnosis.stressLevel}
                    </span>
                  )}
                  {voiceDiagnosis.confidence !== undefined && (
                    <span id="intent-confidence-indicator" className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                      {language === 'hi' ? 'विश्वास स्तर' : 'Intent confidence'}: {voiceDiagnosis.confidence}%
                    </span>
                  )}
                  {voiceDiagnosis.detectedKeywords && voiceDiagnosis.detectedKeywords.length > 0 && (
                    <span id="detected-keywords-indicator" className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      {language === 'hi' ? 'सक्रिय शब्द' : 'Keywords'}: {voiceDiagnosis.detectedKeywords.slice(0, 3).join(', ')}
                    </span>
                  )}
                </div>

                {/* Steps of rescue instructions */}
                <h4 className="font-sans font-extrabold text-xs text-white uppercase tracking-widest mt-6 mb-3 select-none">
                  {language === 'hi' ? '🚨 तत्काल प्राथमिक उपचार / सुरक्षा निर्देश' : '🚨 IMMEDIATE LIFE SECURITY INSTRUCTIONS'}
                </h4>
                <div className="space-y-3">
                  {(language === 'hi' ? voiceDiagnosis.adviceHi : voiceDiagnosis.advice).map((step, idx) => (
                    <div key={idx} className="flex gap-3 text-xs leading-relaxed text-slate-200">
                      <span className="font-mono font-bold text-[#38bdf8] shrink-0 bg-white/5 border border-white/10 rounded w-5 h-5 flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <p className="font-sans text-sm">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <p className="font-sans text-xs text-white/60 text-center sm:text-left">
                    {language === 'hi' 
                        ? `कॉल कनेक्ट करने के लिए जोर से 'कॉल' बोलें या नीचे बटन का उपयोग करें।` 
                        : `To initiate connection speak the word 'call' or use the hotkeys.`}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <button
                      id="voice-call-hotkey-btn"
                      onClick={() => {
                        let matchingItem = HELPLINES.find(h => h.number === voiceDiagnosis.helpline);
                        if (!matchingItem) {
                          matchingItem = {
                            id: `auto-${voiceDiagnosis.domain}`,
                            nameEn: voiceDiagnosis.domainLabel,
                            nameHi: voiceDiagnosis.domainLabelHi,
                            number: voiceDiagnosis.helpline,
                            category: voiceDiagnosis.domain === 'general' ? 'general' : voiceDiagnosis.domain,
                            descriptionEn: 'Auto classified voice helpline',
                            descriptionHi: 'आवाज द्वारा स्वचालित हेल्पलाइन'
                          };
                        }
                        initiateGlobalCall(matchingItem);
                      }}
                      className="px-6 py-2.5 rounded-full bg-red-650 hover:bg-red-700 text-white font-sans text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:scale-103"
                    >
                      <Phone size={13} className="text-white" />
                      <span>{language === 'hi' ? `कॉल ${voiceDiagnosis.helpline}` : `Call ${voiceDiagnosis.helpline}`}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-3xl p-6 text-center text-slate-400 select-none py-12">
                <p className="font-sans text-base leading-relaxed">
                  {language === 'hi' 
                    ? "कोई सक्रिय आपातकालीन निदान रिकॉर्ड उपलब्ध नहीं है। कृपया अपनी समस्या बताने के लिए बोलना शुरू करें।" 
                    : "No dynamic crisis diagnosis metadata established yet. Just begin speaking to trigger analysis."}
                </p>
              </div>
            )}

            {/* Mic Replay option if mic dies or sleeps */}
            <div className="flex justify-center gap-4 mt-4 select-none">
              <button
                id="mic-restart-voice-immersive-portal"
                onClick={startVoiceCommandListener}
                className="px-5 py-3 rounded-full bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/30 text-xs font-sans font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Mic size={14} className={continuousListening ? 'animate-pulse' : ''} />
                <span>
                  {continuousListening 
                    ? (language === 'hi' ? 'माइक्रोफ़ोन लाइव है' : 'MICROPHONE LIVE') 
                    : (language === 'hi' ? 'ध्वनि डिकोडर फिर से शुरू करें' : 'RESTART VOICE CAPTURE')}
                </span>
              </button>

              <button
                id="return-to-visual-imm-portal"
                onClick={() => handleAccessibilitySelection(false)}
                className="px-4 py-3 rounded-full bg-white/5 border border-white/15 text-xs text-white/70 hover:text-white hover:bg-white/10 font-bold transition-all cursor-pointer"
              >
                {language === 'hi' ? 'विजुअल / टच मोड पर जाएं' : 'Switch back to visual'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in animate-duration-300">
            
            {/* Left Column: Intake and Categories Bento */}
            <div className="lg:col-span-7 space-y-8">
              {/* Dynamic Voice Diagnosis Banner (Always available in background) */}
              {voiceDiagnosis && (
                <div id="visual-voice-diagnosis-alert" className={`glass-card rounded-2xl p-6 border-2 relative overflow-hidden shadow-xl animate-fade-in ${
                  voiceDiagnosis.domain === 'medical' ? 'border-red-500/30 bg-red-950/15' :
                  voiceDiagnosis.domain === 'fire' ? 'border-orange-500/30 bg-orange-950/15' :
                  voiceDiagnosis.domain === 'cyber' ? 'border-sky-500/30 bg-sky-950/15' :
                  voiceDiagnosis.domain === 'disaster' ? 'border-yellow-500/30 bg-yellow-950/15' :
                  'border-purple-500/30 bg-purple-950/15'
                }`}>
                  {/* Corner close/clear button to dismiss */}
                  <button
                    id="close-visual-voice-diagnosis"
                    onClick={() => {
                      setVoiceDiagnosis(null);
                      setAwaitingCallConfirmation(false);
                      setLastAnalyzedHelpNumber('');
                      window.speechSynthesis.cancel();
                      setTimeout(() => {
                        startVoiceCommandListener();
                      }, 50);
                    }}
                    className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer text-xs"
                    title={language === 'hi' ? 'हटाएं' : 'Dismiss'}
                  >
                    ✕
                  </button>

                  <div className="flex items-start justify-between gap-4 mr-6">
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-[9px] font-extrabold uppercase tracking-widest text-[#38bdf8] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        {language === 'hi' ? 'आवाज़ विश्लेषण परिणाम' : 'VOICE COMMAND DIAGNOSIS'}
                      </span>
                      <h3 className="font-sans font-black text-lg md:text-xl text-white mt-1">
                        {language === 'hi' ? voiceDiagnosis.domainLabelHi : voiceDiagnosis.domainLabel}
                      </h3>
                      <p className="font-mono text-xs text-amber-200 mt-1.5 italic">
                        "{voiceDiagnosis.heardText}"
                      </p>
                    </div>
                    <div className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-xl flex flex-col items-center shrink-0">
                      <span className="font-mono text-[8.5px] text-white/50 tracking-wider uppercase font-bold">{language === 'hi' ? 'हेल्पलाइन' : 'HOTLINE'}</span>
                      <span className="font-mono text-base font-black text-primary">{voiceDiagnosis.helpline}</span>
                    </div>
                  </div>

                  {/* Classifiers & Confidence indicator indicators */}
                  <div className="flex gap-2 flex-wrap mt-3.5">
                    {voiceDiagnosis.stressLevel && (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border font-mono ${
                        voiceDiagnosis.stressLevel === 'HIGH' ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' :
                        voiceDiagnosis.stressLevel === 'MEDIUM' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                        'bg-slate-500/20 text-slate-300 border-slate-500/30'
                      }`}>
                        {language === 'hi' ? 'तनाव सूचकांक' : 'Stress'}: {voiceDiagnosis.stressLevel}
                      </span>
                    )}
                    {voiceDiagnosis.confidence !== undefined && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                        {language === 'hi' ? 'विश्वास' : 'Confidence'}: {voiceDiagnosis.confidence}%
                      </span>
                    )}
                    {voiceDiagnosis.detectedKeywords && voiceDiagnosis.detectedKeywords.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                        {language === 'hi' ? 'सक्रिय शब्द' : 'Keywords'}: {voiceDiagnosis.detectedKeywords.slice(0, 3).join(', ')}
                      </span>
                    )}
                  </div>

                  {/* Step guidance */}
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-2.5">
                    <h4 className="font-sans font-extrabold text-[10px] text-white uppercase tracking-widest mb-1.5 select-none">
                      {language === 'hi' ? '🚨 तत्काल प्राथमिक उपचार / सुरक्षा निर्देश' : '🚨 EMERGENCY SAFETY INSTRUCTIONS'}
                    </h4>
                    {(language === 'hi' ? voiceDiagnosis.adviceHi : voiceDiagnosis.advice).map((step, idx) => (
                      <div key={idx} className="flex gap-2.5 text-xs leading-relaxed text-slate-200">
                        <span className="font-mono font-bold text-[#38bdf8] shrink-0 bg-white/5 border border-white/10 rounded w-5 h-5 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <p className="font-sans text-sm">{step}</p>
                      </div>
                    ))}
                  </div>

                  {/* Call and confirmation buttons */}
                  <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                    {awaitingCallConfirmation ? (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="font-sans text-xs text-amber-200 font-bold">
                          {language === 'hi' ? 'क्या आप इस हेल्पलाइन पर लाइव कॉल मिलाना चाहते हैं? हाँ / ना कहें।' : 'Confirm call? Reply out loud YES / NO'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-white/50 font-sans">
                        {language === 'hi' ? 'आवाज़ द्वारा डायल करने के लिए "हाँ" (' + voiceDiagnosis.helpline + ') बोलें।' : 'Or speak "yes" to dial ' + voiceDiagnosis.helpline + '.'}
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {awaitingCallConfirmation && (
                        <>
                          <button
                            id="visual-voice-deny"
                            onClick={() => {
                              setAwaitingCallConfirmation(false);
                              setLastAnalyzedHelpNumber('');
                              speakOutLoud(language === 'hi' ? "कॉल निरस्त।" : "Cancelled.");
                              setTimeout(() => {
                                startVoiceCommandListener();
                              }, 50);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all cursor-pointer border border-slate-700"
                          >
                            {language === 'hi' ? 'नहीं' : 'No'}
                          </button>
                          <button
                            id="visual-voice-confirm"
                            onClick={() => {
                              setAwaitingCallConfirmation(false);
                              let matchingItem = HELPLINES.find(h => h.number === lastAnalyzedHelpNumber);
                              if (!matchingItem) {
                                matchingItem = {
                                  id: `auto-dial`,
                                  nameEn: 'Emergency Helpline',
                                  nameHi: 'आपातकालीन हेल्पलाइन',
                                  number: lastAnalyzedHelpNumber,
                                  category: 'general',
                                  descriptionEn: 'Auto classified voice helpline',
                                  descriptionHi: 'आवाज द्वारा स्वचालित हेल्पलाइन'
                                };
                              }
                              initiateGlobalCall(matchingItem);
                            }}
                            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1 shadow"
                          >
                            <Phone size={11} />
                            <span>{language === 'hi' ? 'हाँ' : 'Yes'}</span>
                          </button>
                        </>
                      )}

                      {!awaitingCallConfirmation && (
                        <button
                          id="visual-voice-call-trigger"
                          onClick={() => {
                            let matchingItem = HELPLINES.find(h => h.number === voiceDiagnosis.helpline);
                            if (!matchingItem) {
                              matchingItem = {
                                id: `auto-${voiceDiagnosis.domain}`,
                                nameEn: voiceDiagnosis.domainLabel,
                                nameHi: voiceDiagnosis.domainLabelHi,
                                number: voiceDiagnosis.helpline,
                                category: voiceDiagnosis.domain === 'general' ? 'general' : voiceDiagnosis.domain,
                                descriptionEn: 'Auto classified voice helpline',
                                descriptionHi: 'आवाज द्वारा स्वचालित हेल्पलाइन'
                              };
                            }
                            initiateGlobalCall(matchingItem);
                          }}
                          className="px-4 py-1.5 rounded-full bg-rose-650 hover:bg-rose-700 text-white font-sans text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-lg hover:scale-103"
                        >
                          <Phone size={11} />
                          <span>{language === 'hi' ? 'डायल करें' : 'CallNow'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {showLocationAlert && (
                <div id="gps-sync-prompt-card" className="glass-card rounded-2xl p-5 border border-amber-500/25 bg-amber-500/5 relative overflow-hidden shadow-xl animate-fade-in">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                      <Compass size={22} className="animate-spin-slow" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-amber-300 font-bold block">
                        {language === 'hi' ? 'वास्तविक समय उपग्रह जीपीएस लिंक' : 'REAL-TIME SATELLITE GPS SYNC'}
                      </span>
                      <h4 className="font-sans font-extrabold text-sm text-white mt-1 leading-snug">
                        {language === 'hi' ? 'आपातकालीन सहायता के लिए लाइव स्थान सिंक करें?' : 'Allow GPS Sync to Route Emergency Responders?'}
                      </h4>
                      <p className="font-sans text-xs text-on-surface-variant/80 mt-1.5 leading-relaxed">
                        {language === 'hi'
                          ? 'सटीक राष्ट्रीय सुरक्षा और पुलिस मार्ग के लिए उपकरण जीपीएस अनिवार्य है। स्थान सिंक करने से सहायिका तत्काल प्रतिक्रिया केंद्रों को लाइव टेलीमेट्री भेज सकती है।'
                          : 'Your exact location ensures rapid ambulance and police patrol routing during crisis. Permitting GPS transmits precise telemetry to official control platforms.'}
                      </p>
                      <div className="flex flex-wrap gap-2.5 mt-4">
                        <button
                          id="allow-gps-btn"
                          onClick={requestRealLocation}
                          disabled={gpsLoading}
                          className="px-4 py-2 bg-gradient-to-tr from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-sans text-xs font-extrabold rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {gpsLoading ? (
                            <>
                              <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                              <span>{language === 'hi' ? 'सिंक हो रहा है...' : 'Syncing GPS...'}</span>
                            </>
                          ) : (
                            <>
                              <Radio size={14} className="animate-pulse" />
                              <span>{language === 'hi' ? 'प्रमाणित करें' : 'Sync Live GPS Location'}</span>
                            </>
                          )}
                        </button>
                        <button
                          id="dismiss-gps-prompt-btn"
                          onClick={() => {
                            setShowLocationAlert(false);
                            localStorage.setItem('sahayak_location_alert_dismissed', Date.now().toString());
                          }}
                          className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 font-sans text-xs font-bold rounded-xl text-white transition-all cursor-pointer"
                        >
                          {language === 'hi' ? 'बाद में' : 'Select Manually'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Unified Voice & Quick Search Section */}
              <section className="space-y-3">
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
                  <div className="flex-1 glass-card rounded-2xl p-1 px-2 flex items-center neon-border bg-surface-container-low/20">
                    <div className="px-3 text-on-surface-variant/60">
                      <Search size={20} />
                    </div>
                    <input
                      id="search-input-home"
                      type="text"
                      className="bg-transparent border-none focus:ring-0 text-white font-sans text-sm w-full py-3.5 outline-none placeholder:text-on-surface-variant/40"
                      placeholder={language === 'hi' ? 'क्या हो रहा है? मुझे विवरण बताएं...' : "Tell Sahayak what is happening..."}
                      value={homeSearchInput}
                      onChange={(e) => setHomeSearchInput(e.target.value)}
                    />
                    {homeSearchInput.trim() && (
                      <button
                        id="search-submit-btn-home"
                        type="submit"
                        className="p-2 text-primary hover:text-white hover:scale-110 transition-all cursor-pointer"
                      >
                        <Sparkles size={18} className="text-secondary animate-pulse" />
                      </button>
                    )}
                  </div>
                  
                  {/* Visual Speaking Microphone Ring Activator */}
                  <button
                    id="mic-trigger-home"
                    type="button"
                    onClick={startMicTriage}
                    className="w-14 h-14 rounded-full bg-primary-container text-white flex items-center justify-center shadow-[0_0_24px_rgba(37,99,235,0.4)] active:scale-95 duration-150 transition-all relative overflow-hidden shrink-0 hover:bg-primary cursor-pointer border border-primary/30"
                  >
                    <Mic size={24} />
                    <div className="absolute bottom-0 left-0 w-full voice-wave opacity-30" />
                  </button>
                </form>
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-secondary"></span>
                  </span>
                  <p className="font-sans text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-widest leading-none mt-0.5">
                    {language === 'hi' ? 'एआई सहायिका सक्रिय है और आपके निर्देशों को सुनने के लिए तैयार है।' : "AI assistant is active and listening for your command."}
                  </p>
                </div>
              </section>

              {/* ── FEATURES SHOWCASE SECTION ── */}
              <section className="space-y-3.5">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-pink-400" />
                  <h2 className="font-sans font-extrabold text-sm uppercase tracking-wider text-pink-300">
                    {language === 'hi' ? '✨ प्रमुख सुविधाएं' : '✨ Powerful Features'}
                  </h2>
                </div>

                {/* Features Grid (3x3) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Feature 1: Voice AI */}
                  <div className="glass-card rounded-2xl p-4 border border-indigo-500/20 bg-indigo-950/20 hover:border-indigo-500/40 hover:bg-indigo-950/30 transition-all duration-200 cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/20 flex items-center justify-center mb-3 transition-all">
                      <Mic size={18} className="text-indigo-400" />
                    </div>
                    <h3 className="font-sans font-bold text-sm text-white mb-1 line-clamp-2">
                      {language === 'hi' ? '🎤 आवाज एआई' : '🎤 Voice AI'}
                    </h3>
                    <p className="font-sans text-[10px] text-indigo-200/70 leading-tight">
                      {language === 'hi' ? 'बिना टैप किए आवाज़ कमांड निष्पादित करें' : 'No-tap voice commands'}
                    </p>
                  </div>

                  {/* Feature 2: Multi-Language */}
                  <div className="glass-card rounded-2xl p-4 border border-purple-500/20 bg-purple-950/20 hover:border-purple-500/40 hover:bg-purple-950/30 transition-all duration-200 cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20 flex items-center justify-center mb-3 transition-all">
                      <Languages size={18} className="text-purple-400" />
                    </div>
                    <h3 className="font-sans font-bold text-sm text-white mb-1">
                      {language === 'hi' ? '🌐 बहुभाषी' : '🌐 Bilingual'}
                    </h3>
                    <p className="font-sans text-[10px] text-purple-200/70 leading-tight">
                      {language === 'hi' ? 'हिंदी & अंग्रेजी समर्थन' : 'Hindi & English support'}
                    </p>
                  </div>

                  {/* Feature 3: Live GPS */}
                  <div className="glass-card rounded-2xl p-4 border border-emerald-500/20 bg-emerald-950/20 hover:border-emerald-500/40 hover:bg-emerald-950/30 transition-all duration-200 cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 flex items-center justify-center mb-3 transition-all">
                      <Compass size={18} className="text-emerald-400" />
                    </div>
                    <h3 className="font-sans font-bold text-sm text-white mb-1">
                      {language === 'hi' ? '📍 लाइव जीपीएस' : '📍 Live GPS'}
                    </h3>
                    <p className="font-sans text-[10px] text-emerald-200/70 leading-tight">
                      {language === 'hi' ? 'रीयल-टाइम स्थान ट्रैकिंग' : 'Real-time location sync'}
                    </p>
                  </div>

                  {/* Feature 4: Instant Call */}
                  <div className="glass-card rounded-2xl p-4 border border-pink-500/20 bg-pink-950/20 hover:border-pink-500/40 hover:bg-pink-950/30 transition-all duration-200 cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 group-hover:bg-pink-500/20 flex items-center justify-center mb-3 transition-all">
                      <Phone size={18} className="text-pink-400" />
                    </div>
                    <h3 className="font-sans font-bold text-sm text-white mb-1">
                      {language === 'hi' ? '📞 तत्काल कॉल' : '📞 Instant Call'}
                    </h3>
                    <p className="font-sans text-[10px] text-pink-200/70 leading-tight">
                      {language === 'hi' ? '1-टैप आपातकालीन डायल' : '1-tap emergency dial'}
                    </p>
                  </div>

                  {/* Feature 5: Smart Diagnosis */}
                  <div className="glass-card rounded-2xl p-4 border border-orange-500/20 bg-orange-950/20 hover:border-orange-500/40 hover:bg-orange-950/30 transition-all duration-200 cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 group-hover:bg-orange-500/20 flex items-center justify-center mb-3 transition-all">
                      <AlertTriangle size={18} className="text-orange-400" />
                    </div>
                    <h3 className="font-sans font-bold text-sm text-white mb-1">
                      {language === 'hi' ? '🤖 स्मार्ट निदान' : '🤖 Smart Diagnosis'}
                    </h3>
                    <p className="font-sans text-[10px] text-orange-200/70 leading-tight">
                      {language === 'hi' ? 'एआई आपातकाल वर्गीकरण' : 'AI crisis classification'}
                    </p>
                  </div>

                  {/* Feature 6: Medical Profile */}
                  <div className="glass-card rounded-2xl p-4 border border-red-500/20 bg-red-950/20 hover:border-red-500/40 hover:bg-red-950/30 transition-all duration-200 cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 group-hover:bg-red-500/20 flex items-center justify-center mb-3 transition-all">
                      <LifeBuoy size={18} className="text-red-400" />
                    </div>
                    <h3 className="font-sans font-bold text-sm text-white mb-1">
                      {language === 'hi' ? '🏥 मेडिकल प्रोफ़ाइल' : '🏥 Medical Profile'}
                    </h3>
                    <p className="font-sans text-[10px] text-red-200/70 leading-tight">
                      {language === 'hi' ? 'स्वास्थ्य रिकॉर्ड सिंक' : 'Health record sync'}
                    </p>
                  </div>

                  {/* Feature 7: Offline Support */}
                  <div className="glass-card rounded-2xl p-4 border border-blue-500/20 bg-blue-950/20 hover:border-blue-500/40 hover:bg-blue-950/30 transition-all duration-200 cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20 flex items-center justify-center mb-3 transition-all">
                      <WifiOff size={18} className="text-blue-400" />
                    </div>
                    <h3 className="font-sans font-bold text-sm text-white mb-1">
                      {language === 'hi' ? '🛜 ऑफलाइन मोड' : '🛜 Offline Ready'}
                    </h3>
                    <p className="font-sans text-[10px] text-blue-200/70 leading-tight">
                      {language === 'hi' ? 'इंटरनेट के बिना काम करें' : 'Works without internet'}
                    </p>
                  </div>

                  {/* Feature 8: SOS Panic */}
                  <div className="glass-card rounded-2xl p-4 border border-rose-500/20 bg-rose-950/20 hover:border-rose-500/40 hover:bg-rose-950/30 transition-all duration-200 cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 group-hover:bg-rose-500/20 flex items-center justify-center mb-3 transition-all">
                      <Siren size={18} className="text-rose-400" />
                    </div>
                    <h3 className="font-sans font-bold text-sm text-white mb-1">
                      {language === 'hi' ? '🚨 एसओएस पैनिक' : '🚨 SOS Panic'}
                    </h3>
                    <p className="font-sans text-[10px] text-rose-200/70 leading-tight">
                      {language === 'hi' ? 'तुरंत सहायता अलर्ट' : 'Instant distress alert'}
                    </p>
                  </div>

                  {/* Feature 9: Legal Aid */}
                  <div className="glass-card rounded-2xl p-4 border border-cyan-500/20 bg-cyan-950/20 hover:border-cyan-500/40 hover:bg-cyan-950/30 transition-all duration-200 cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20 flex items-center justify-center mb-3 transition-all">
                      <Megaphone size={18} className="text-cyan-400" />
                    </div>
                    <h3 className="font-sans font-bold text-sm text-white mb-1">
                      {language === 'hi' ? '⚖️ विधिक सहायता' : '⚖️ Legal Aid'}
                    </h3>
                    <p className="font-sans text-[10px] text-cyan-200/70 leading-tight">
                      {language === 'hi' ? 'विशेषज्ञ परामर्श' : 'Expert legal advice'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Bento Grid layout emergency services */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Grid size={16} className="text-secondary" />
                  <h2 className="font-sans font-extrabold text-sm uppercase tracking-wider text-on-surface-variant">
                    {language === 'hi' ? 'आपातकालीन श्रेणियां (चयन करें)' : 'Classified Emergency Categories (Select Triage)'}
                  </h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <CategoryCard
                    id="cyber"
                    nameEn="Cyber Crime"
                    nameHi="साइबर अपराध"
                    descEn="Report fraud & threats"
                    descHi="धोखाधड़ी और खतरा"
                    language={language}
                    onClick={handleCategoryClick}
                  />
                  
                  <CategoryCard
                    id="medical"
                    nameEn="Medical"
                    nameHi="चिकित्सा सहायता"
                    descEn="Emergency ambulance"
                    descHi="एम्बुलेंस&प्राथमिक सहायता"
                    language={language}
                    onClick={handleCategoryClick}
                  />

                  <CategoryCard
                    id="women"
                    nameEn="Women Safety"
                    nameHi="महिला सुरक्षा"
                    descEn="Dedicated help line"
                    descHi="त्वरित प्रतिक्रिया डेस्क"
                    language={language}
                    onClick={handleCategoryClick}
                  />

                  <CategoryCard
                    id="police"
                    nameEn="Police"
                    nameHi="पुलिस सहायता"
                    descEn="Contact local station"
                    descHi="स्थानीय पीसीआर डिस्पैच"
                    language={language}
                    onClick={handleCategoryClick}
                  />

                  <CategoryCard
                    id="lost"
                    nameEn="Lost Items"
                    nameHi="गुम सामान"
                    descEn="Report missing docs"
                    descHi="एनसी रिपोर्ट & ट्रैकिंग"
                    language={language}
                    onClick={handleCategoryClick}
                  />

                  <CategoryCard
                    id="fire"
                    nameEn="Fire"
                    nameHi="दमकल सेवा"
                    descEn="Fire brigade response"
                    descHi="अग्निकांड नियंत्रण बल"
                    language={language}
                    onClick={handleCategoryClick}
                  />

                  <CategoryCard
                    id="disaster"
                    nameEn="Disaster"
                    nameHi="आपदा प्रबंधन"
                    descEn="Rescue & Relief"
                    descHi="एनडीआरएफ राहत अभियान"
                    language={language}
                    onClick={handleCategoryClick}
                  />

                  <CategoryCard
                    id="legal"
                    nameEn="Legal"
                    nameHi="विधिक कानूनी सलाह"
                    descEn="Free legal advice"
                    descHi="संविधानिक विधिक संरक्षण"
                    language={language}
                    onClick={handleCategoryClick}
                  />
                </div>
              </section>
            </div>

            {/* Right Column: Maps Radar & Tactical Network State */}
            <div className="lg:col-span-5 space-y-6 w-full">
              {/* Location context maps card */}
              <MapContainer
                locationName={locationName}
                onLocationChange={setLocationName}
                language={language}
              />

              {/* PC Exclusive Dynamic Telemetry Dashboard */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 bg-surface-container-low/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded border border-pink-500/20">
                    {language === 'hi' ? 'सामरिक परिचालन फ़ीड' : 'Tactical Operations Feed'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase">{language === 'hi' ? 'सक्रिय नोड' : 'Secure Core Active'}</span>
                  </div>
                </div>

                <div className="space-y-3 font-sans text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-white/40">{language === 'hi' ? 'जीपीएस लिंक सुरक्षा:' : 'Signal Security Key:'}</span>
                    <span className="font-mono text-white font-semibold">{mockSignalStrength}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-white/40">{language === 'hi' ? 'सक्रिय नोड:' : 'Primary Neural Node:'}</span>
                    <span className="font-mono text-white font-semibold">SAHAYAK-NODE-07 // IN-DL</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-white/40">{language === 'hi' ? 'प्राथमिक चिकित्सा कोड:' : 'Primary Medical ID:'}</span>
                    <span className="font-mono text-white font-semibold truncate max-w-[180px] text-right block">{medicalProfile.fullName} // {medicalProfile.bloodType}</span>
                  </div>
                </div>

                {/* Micro Ambient Quote */}
                <div className="p-3 bg-indigo-950/20 rounded-xl border border-white/5 text-[11px] leading-relaxed text-indigo-200 italic">
                  {language === 'hi' ? '“सभी राष्ट्रीय आपातकालीन हॉटलाइन सुचारू रूप से कार्य कर रही हैं। सुरक्षा सलाहकार सक्रिय है।”' : '“All regional command nodes are green. Centralized cyber, medical, and legal defense advice registers are synchronized.”'}
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'helplines' && (
          <HelplineList 
            language={language} 
            locationName={locationName} 
            callState={callState}
            onInitiateCall={initiateGlobalCall}
            onEndCall={endGlobalCall}
          />
        )}

        {activeTab === 'triage' && (
          <SmartTriage
            language={language}
            onCall={(number: string, name?: string) => {
              const item = HELPLINES.find(h => h.number === number) ?? {
                id: 'triage-call',
                nameEn: name || number,
                nameHi: name || number,
                number,
                category: 'general' as any,
                descriptionEn: 'Triage-selected helpline',
                descriptionHi: 'ट्राइएज-चयनित हेल्पलाइन',
              };
              initiateGlobalCall(item);
            }}
          />
        )}

        {activeTab === 'chat' && (
          <ChatInterface
            language={language}
            onLanguageToggle={handleLanguageToggle}
            activeCategory={activeCategory}
            onChangeCategory={setActiveCategory}
            locationName={locationName}
            medicalProfile={medicalProfile}
            initialQuery={chatInitialQuery}
            onClearInitialQuery={() => setChatInitialQuery('')}
            onBackToHome={() => setActiveTab('home')}
            onInitiateCall={initiateGlobalCall}
            voiceOptimized={voiceOptimized}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel
            language={language}
            onLanguageToggle={handleLanguageToggle}
            medicalProfile={medicalProfile}
            onUpdateMedicalProfile={setMedicalProfile}
            emergencyContacts={emergencyContacts}
            onAddContact={(cont) => setEmergencyContacts((prev) => [...prev, cont])}
            onDeleteContact={(id) => setEmergencyContacts((prev) => prev.filter((c) => c.id !== id))}
            mockSignalStrength={mockSignalStrength}
            onUpdateMockSignal={setMockSignalStrength}
          />
        )}

        {activeTab === 'complaint' && (
          <ComplaintPanel
            language={language}
            currentUser={currentUser}
            onUpdateCurrentUser={setCurrentUser}
            onUpdateMedicalProfile={setMedicalProfile}
            onInitiateCall={initiateGlobalCall}
          />
        )}

        {activeTab === 'docwizard' && (
          <DocumentLossWizard language={language} />
        )}
          </>
        )}
      </main>

      {/* ── OFFLINE BANNER ── */}
      {!isOnline && (
        <div
          className="fixed top-0 left-0 w-full z-[180] flex items-center justify-center gap-2.5 py-2 px-4"
          style={{ background: 'linear-gradient(90deg, #1a1200 0%, #2d1f00 50%, #1a1200 100%)', borderBottom: '1px solid rgba(251,191,36,0.3)' }}
        >
          <WifiOff size={14} className="text-amber-400 shrink-0" />
          <span className="text-amber-300 text-xs font-bold tracking-wide" style={{ fontFamily: 'monospace' }}>
            {language === 'hi'
              ? '✓ ऑफलाइन मोड — सभी डेटा स्थानीय रूप से उपलब्ध है'
              : '✓ WORKS OFFLINE — All critical data available locally'}
          </span>
        </div>
      )}

      {/* Floating Center Critical SOS Dial */}
      {!voiceOptimized && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[55]">
          <button
            id="sos-trigger"
            onClick={() => setSosActive(true)}
            className="w-24 h-24 rounded-full bg-error-container text-on-error-container flex flex-col items-center justify-center animate-sos shadow-2xl transition-all active:scale-95 duration-200 border-2 border-error/20 hover:bg-red-600 hover:border-red-400 group cursor-pointer"
          >
            <AlertTriangle size={36} className="text-white group-hover:scale-110 duration-200" />
            <span className="font-mono text-base font-black tracking-widest text-white mt-1 leading-none">SOS</span>
          </button>
        </div>
      )}

      {/* Floating Panic Mode Toggle (right side, above nav) */}
      {!voiceOptimized && (
        <div className="fixed bottom-[6.5rem] right-4 z-[55]">
          <button
            id="panic-mode-trigger"
            onClick={() => setPanicMode(true)}
            className="w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-xl transition-all active:scale-95 duration-200 border-2 cursor-pointer group"
            style={{
              background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
              borderColor: 'rgba(239,68,68,0.5)',
              boxShadow: '0 0 20px 4px rgba(220,38,38,0.25)',
            }}
            title={language === 'hi' ? 'पैनिक मोड' : 'Panic Mode'}
          >
            <Siren size={22} className="text-red-200 group-hover:scale-110 duration-200" />
            <span className="font-mono text-[8px] font-black tracking-wider text-red-200 mt-0.5 leading-none uppercase">
              {language === 'hi' ? 'पैनिक' : 'PANIC'}
            </span>
          </button>
        </div>
      )}

      {/* Footer Bottom Glass Navbar */}
      {!voiceOptimized && (
        <nav id="bottom-navigation-bar" className="fixed bottom-0 left-0 w-full z-50 bg-slate-950/40 backdrop-blur-2xl border-t border-white/10 flex justify-around items-center px-4 pb-4 pt-2.5 shadow-[0_-8px_32px_rgba(0,0,0,0.6)]">
          
          {/* Home option */}
          <button
            id="home-tab-btn"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl duration-200 cursor-pointer ${
              activeTab === 'home'
                ? 'bg-primary-container text-white border border-primary/25 shadow shadow-primary-container/20 font-bold'
                : 'text-on-surface-variant/75 hover:bg-surface-variant/30 hover:text-white'
            }`}
          >
            <Grid size={18} />
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider mt-1">{language === 'hi' ? 'मुख्य पृष्ठ' : 'Home'}</span>
          </button>

          {/* Helplines option */}
          <button
            id="helplines-tab-btn"
            onClick={() => setActiveTab('helplines')}
            className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl duration-200 cursor-pointer ${
              activeTab === 'helplines'
                ? 'bg-primary-container text-white border border-primary/25 shadow shadow-primary-container/20 font-bold'
                : 'text-on-surface-variant/75 hover:bg-surface-variant/30 hover:text-white'
            }`}
          >
            <Phone size={18} />
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider mt-1">{language === 'hi' ? 'हेल्पलाइन्स' : 'Helplines'}</span>
          </button>

          {/* Complaint Option */}
          <button
            id="complaint-tab-btn"
            onClick={() => setActiveTab('complaint')}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl duration-200 cursor-pointer ${
              activeTab === 'complaint'
                ? 'bg-primary-container text-white border border-primary/25 shadow shadow-primary-container/20 font-bold'
                : 'text-on-surface-variant/75 hover:bg-surface-variant/30 hover:text-white'
            }`}
          >
            <Megaphone size={18} />
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider mt-1">{language === 'hi' ? 'शिकायत' : 'Complaint'}</span>
          </button>

          {/* Document Loss Wizard Option */}
          <button
            id="docwizard-tab-btn"
            onClick={() => setActiveTab('docwizard')}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl duration-200 cursor-pointer ${
              activeTab === 'docwizard'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow font-bold'
                : 'text-on-surface-variant/75 hover:bg-surface-variant/30 hover:text-white'
            }`}
          >
            <FileX size={18} />
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider mt-1">{language === 'hi' ? 'दस्तावेज़' : 'Doc Lost'}</span>
          </button>
          {/* Space Spacer holding floating SOS trigger */}
          <div className="w-16 h-8" />

          {/* Chat triage option */}
          <button
            id="chat-tab-btn"
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl duration-200 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-primary-container text-white border border-primary/25 shadow shadow-primary-container/20 font-bold'
                : 'text-on-surface-variant/75 hover:bg-surface-variant/30 hover:text-white'
            }`}
          >
            <MessageSquare size={18} />
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider mt-1">{language === 'hi' ? 'एआई चैट' : 'Chat'}</span>
          </button>

          {/* Settings options */}
          <button
            id="settings-tab-btn"
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl duration-200 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-primary-container text-white border border-primary/25 shadow shadow-primary-container/20 font-bold'
                : 'text-on-surface-variant/75 hover:bg-surface-variant/30 hover:text-white'
            }`}
          >
            <SettingsIcon size={18} />
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider mt-1">{language === 'hi' ? 'सेटिंग्स' : 'Settings'}</span>
          </button>
        </nav>
      )}

      {/* SOS Countdown warning overlays HUD */}
      {sosActive && (
        <SOSPanel
          language={language}
          onClose={() => setSosActive(false)}
          locationName={locationName}
          emergencyContacts={emergencyContacts}
          medicalProfile={medicalProfile}
        />
      )}

      {/* ── PANIC MODE OVERLAY ── */}
      {panicMode && (
        <PanicMode
          language={language}
          onClose={() => setPanicMode(false)}
          locationName={locationName}
        />
      )}

      {/* Micro-listening Transcription Overlay HUD */}
      {micActive && (
        <div id="mic-triage-overlay-hud" className="fixed inset-0 bg-[#060e20]/97 backdrop-blur-2xl z-[99] flex flex-col justify-between p-8 text-center animate-fade-in animate-duration-300">
          <div className="flex justify-between items-center mt-4">
            <span className="font-mono text-[9px] text-[#38bdf8] bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-md uppercase font-bold tracking-widest">
              {language === 'hi' ? 'वॉयस नोड सक्रिय' : 'VOICE STREAM NODE: ONLINE'}
            </span>
            <button
              id="close-mic-overlay-btn"
              onClick={() => {
                setMicActive(false);
                setMicError(null);
              }}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white hover:scale-105 transition-all cursor-pointer"
              title="Close Microphone Intake"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
            {micError ? (
              /* Diagnostic troubleshoot card */
              <div id="mic-diagnostic-alert-card" className="glass-card rounded-3xl p-6 border border-amber-500/20 bg-amber-500/5 max-w-md w-full my-4 shadow-2xl relative overflow-hidden animate-fade-in text-left">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
                    <AlertTriangle size={24} className="animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-sans font-extrabold text-[#dae2fd] text-base leading-snug">
                      {language === 'hi' ? 'माइक्रोफ़ोन पहुंच अवरुद्ध या प्रतिबंधित है' : 'Microphone Access Locked or Restricted'}
                    </h3>
                    <p className="font-mono text-[9px] text-amber-300 uppercase tracking-widest mt-0.5 leading-none">
                      {micError === 'not-supported' ? 'SpeechRecognition Not Supported' : 'Hardware Access Sandboxed'}
                    </p>
                  </div>
                </div>

                <p className="font-sans text-xs text-white/70 mt-4 leading-relaxed">
                  {language === 'hi'
                    ? 'सुरक्षित आईफ़्रेम (Iframe) सैंडबॉक्स प्रतिबंधों के कारण, ब्राउज़र ने सीधी पहुंच को अस्वीकार कर दिया हो। पूर्ण सुरक्षा संचालन के लिए कृपया ऐप को नए टैब में लोड करें या नीचे कृत्रिम बुद्धिमत्ता आधारित वॉयस सिमुलेशन (Smart Simulation) चालू करें।'
                    : 'Because this app runs inside a secure iframe, your browser might block direct microphone binding. Open Sahayak in a new tab, permit audio in your URL address bar, or trigger the voice simulation below.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5">
                  <button
                    id="oppen-app-new-tab"
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors shadow cursor-pointer"
                  >
                    <ExternalLink size={13} />
                    <span>{language === 'hi' ? 'नए टैब में खोलें' : 'Open in New Tab'}</span>
                  </button>

                  <button
                    id="trigger-voice-demo-btn"
                    onClick={triggerVoiceSimulationDemo}
                    className="p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-sans text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play size={13} />
                    <span>{language === 'hi' ? 'सिमुलेशन चलाएं' : 'Run Speech Demo'}</span>
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 text-center">
                  <button
                    id="retry-actual-mic-btn"
                    onClick={startMicTriage}
                    className="text-[11px] font-mono font-bold text-white/50 hover:text-white transition-colors cursor-pointer uppercase tracking-wider"
                  >
                    🔄 {language === 'hi' ? 'अनुमति देने के बाद पुन: प्रयास करें' : 'Allowed Permissions? Click To Retry'}
                  </button>
                </div>
              </div>
            ) : (
              /* Active mic listener screen */
              <div className="contents">
                <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary mb-8 relative">
                  <Mic size={40} className="animate-pulse" />
                  {isMicSpeaking && (
                    <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping opacity-70" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 voice-wave h-1 opacity-70 rounded bg-primary animate-pulse" />
                </div>

                <p className="font-mono text-[10px] uppercase text-primary font-black tracking-widest bg-primary/10 px-3 py-1 border border-primary/20 rounded-full select-none">
                  {language === 'hi' ? 'सहायक आपातकालीन वॉयस रिसीवर' : 'SAHAYAK EMERGENCY VOICE CAPTURE'}
                </p>

                <h2 className="font-sans font-extrabold text-[#dae2fd] text-2xl mt-6">
                  {isMicSpeaking ? (language === 'hi' ? 'कृपया बोलें, हम सुन रहे हैं...' : 'Speak now, Sahayak is listening...') : (language === 'hi' ? 'आवाज डिकोड की जा रही है...' : 'Triage Speech Decoded ✓')}
                </h2>

                {/* Live stream status report badge */}
                {micStateMsg && (
                  <p className="font-sans text-xs text-emerald-400 font-bold mt-2 select-none animate-pulse">
                    ● {micStateMsg}
                  </p>
                )}

                {/* Real-time transcribed text content */}
                <div className="w-full bg-surface-container/30 border border-white/5 p-6 rounded-2xl mt-6 min-h-24 flex items-center justify-center shadow-inner relative">
                  <p className="font-sans text-white font-semibold text-sm md:text-base leading-relaxed italic">
                    {micTextSimulated || (language === 'hi' ? '..."आपातकालीन, साइबर खतरा या चिकित्सा संकट विवरण बोलें"' : '..."Say what happened, e.g., credit card hack or chest pain"')}
                  </p>
                  
                  {isMicSpeaking && !micTextSimulated && (
                    <div className="absolute bottom-2 right-4 flex items-center gap-1 font-mono text-[9px] text-white/30 tracking-widest animate-pulse font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      <span>REC FEED ACTIVE</span>
                    </div>
                  )}
                </div>

                {isMicSpeaking && (
                  <button
                    id="trigger-simulation-override"
                    onClick={triggerVoiceSimulationDemo}
                    className="mt-6 font-mono text-[10px] text-white/40 hover:text-white border border-white/5 hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all cursor-pointer uppercase tracking-widest"
                  >
                    🎭 {language === 'hi' ? 'इसके बजाय सिमुलेशन मोड का उपयोग करें' : 'Trigger Simulator Demo Instead'}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mb-8 flex flex-col items-center gap-1">
            <span className="font-mono text-[8.5px] text-white/30 tracking-widest uppercase">
              {language === 'hi' ? 'सुरक्षित डिकोडेड स्थानीय वॉयस लिंक' : 'SECURE DECODED LOCAL SATELLITE INTERCEPT'}
            </span>
          </div>
        </div>
      )}

      {/* Embedded Dynamic Registration/Auth System */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        language={language}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Global calling Screen Overlay Simulator */}
      {callState.active && (
        <div id="global-emergency-call-overlay" className="fixed inset-0 bg-[#060e20]/98 backdrop-blur-3xl z-[999] flex flex-col justify-between p-8 text-center animate-fade-in animate-duration-300">
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
            <h2 className="font-sans font-extrabold text-[#dae2fd] text-2xl mt-4 max-w-sm">
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
                <p className="font-sans font-bold text-sm text-white mt-1.5 truncate text-[#dae2fd]">
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
          <div className="max-w-md mx-auto w-full p-6 glass-card rounded-2xl border border-white/10 bg-slate-900/60 my-6 shadow-2xl relative overflow-hidden">
            {callState.status === 'dialing' ? (
              <div className="flex flex-col items-center gap-4 py-6">
                <p className="font-sans text-sm text-white/80 animate-bounce">
                  {language === 'hi' ? 'टोल-फ्री प्रतिक्रिया नेटवर्क रिंग हो रहा है...' : 'Ringing free government crisis hotline...'}
                </p>
                <div className="flex gap-2.5 items-center justify-center">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            ) : (
              <div className="text-left space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-sans text-xs uppercase font-bold tracking-wider">
                  <Play size={14} className="animate-pulse" />
                  <span>{language === 'hi' ? 'सरकारी प्रतिक्रिया अधिकारी' : 'RESPONDING DUTY OFFICER'}</span>
                </div>
                <div className="font-sans text-sm md:text-base text-white/95 font-medium bg-black/30 p-4 rounded-xl border border-white/5 shadow-inner leading-relaxed">
                  {callState.responderSpeech}
                </div>
                <p className="text-[10px] text-white/40 font-mono text-center">
                  {language === 'hi' ? 'नोट: यह एक सुरक्षित ऑडियो सिमुलेशन फीड है।' : 'Note: This is a secure audio mock feedback.'}
                </p>
              </div>
            )}
            
            {/* Soft backdrop blur decoration */}
            <div className="absolute -left-12 -top-12 w-28 h-28 bg-emerald-500/5 blur-2xl rounded-full" />
          </div>

          {/* Call Controls */}
          <div className="mb-12 flex flex-col items-center gap-4">
            <button
              id="global-hangup-btn"
              onClick={endGlobalCall}
              className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-2xl hover:scale-105 duration-200 cursor-pointer"
            >
              <Phone size={28} className="rotate-[135deg]" fill="currentColor" />
            </button>
            <p className="font-sans text-xs text-white/50">
              {language === 'hi' ? 'कॉल काटने के लिए दबाएं (टोल फ्री)' : 'Tap to Hang Up (Simulated Call)'}
            </p>
          </div>
        </div>
      )}

      {/* Starting Accessibility Voice vs Visual Triage Flow */}
      {accessibilityPrompt && (
        <div id="accessibility-startup-modal" className="fixed inset-0 bg-[#020617] bg-gradient-to-b from-[#020617] via-[#090d23] to-[#01040f] z-[9999] flex flex-col justify-between p-6 text-center animate-fade-in duration-300">
          
          {/* Top header & language toggle */}
          <div className="flex justify-between items-center max-w-lg mx-auto w-full pt-4">
            <span className="font-mono text-[9px] text-[#38bdf8] bg-sky-500/15 border border-sky-500/25 px-3 py-1 rounded-md uppercase font-black tracking-widest animate-pulse">
              {language === 'hi' ? 'सहायक वॉयस नोड आरंभ' : 'SAHAYAK INITIALIZATION INTERFACE'}
            </span>
            
            <button
              id="accessibility-lang-swap"
              onClick={handleLanguageToggle}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-sans font-extrabold text-[#dae2fd] hover:border-white/20 transition-all cursor-pointer"
            >
              <Languages size={13} />
              <span>{language === 'en' ? 'ENGLISH / हिंदी' : 'हिंदी / ENGLISH'}</span>
            </button>
          </div>

          {/* Central Question box with massive typography */}
          <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center items-center px-4 overflow-y-auto">
            <div className="w-20 h-20 rounded-full bg-indigo-500/10 border-2 border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 relative animate-pulse">
              <Radio size={40} className="animate-pulse" />
              {setupRecognitionActive && (
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/40 animate-ping opacity-60" />
              )}
            </div>

            <h1 className="font-sans font-black text-[#f8fafc] text-2xl md:text-3xl tracking-tight leading-tight select-none">
              {language === 'hi' ? 'स्वागत है! कृपया अपनी सुविधा का विकल्प चुनें' : 'Welcome! Choose Your Preferred Mode'}
            </h1>
            
            <p className="font-sans text-white/50 text-sm md:text-base mt-2 max-w-xl select-none">
              {language === 'hi' 
                ? "नीचे दिए गए तीन विकल्पों में से चुनें, या बोलें: 'विजुअल मोड', 'वॉयस मोड' या 'एसओएस'" 
                : "Choose from any of the three options below, or say 'VISUAL', 'VOICE' or 'SOS' out loud."}
            </p>

            {/* Micro voice speech feedback indicator */}
            <div className="mt-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-emerald-300 font-mono text-xs font-bold leading-none select-none">
              <span className={`w-2 h-2 rounded-full ${setupRecognitionActive ? 'bg-red-500 animate-ping' : 'bg-slate-400'}`} />
              <span>
                {setupRecognitionActive 
                  ? (language === 'hi' ? 'वॉयस असिस्टेंट सक्रिय शब्द सुन रहा है...' : 'ASSISTANT LISTENING FOR: VISUAL / VOICE / SOS') 
                  : (language === 'hi' ? 'वॉयस असिस्टेंट ऑफलाइन है' : 'Voice detector status offline')}
              </span>
            </div>

            {setupHeardText && (
              <p className="font-mono text-xs text-white/40 mt-2">
                {language === 'hi' ? `आवाज डिकोड: "${setupHeardText}"` : `Spoken phrase detected: "${setupHeardText}"`}
              </p>
            )}

            {/* Massive Grid of Response Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mt-8">
              <button
                id="setup-yes-btn"
                onClick={() => handleAccessibilitySelection(false)}
                className="p-5 rounded-2xl bg-indigo-650 hover:bg-indigo-700 hover:scale-[1.02] border border-indigo-500/30 font-sans text-base font-black flex flex-col items-center justify-center gap-2 duration-150 transition-all shadow-xl active:scale-98 cursor-pointer text-white"
              >
                <span className="text-3xl font-normal">👁️</span>
                <span>{language === 'hi' ? 'विजुअल स्क्रीन मोड' : 'Visual Mode'}</span>
                <span className="text-[10px] font-mono text-indigo-100 font-medium normal-case tracking-wider max-w-xs block opacity-80 leading-snug">
                  {language === 'hi' ? 'मैन्युअल विजुअल टच इंटरफ़ेस' : 'Proceed with standard touch screen interface'}
                </span>
              </button>

              <button
                id="setup-no-btn"
                onClick={() => handleAccessibilitySelection(true)}
                className="p-5 rounded-2xl bg-amber-600 hover:bg-amber-700 hover:scale-[1.02] border border-amber-500/30 font-sans text-base font-black flex flex-col items-center justify-center gap-2 duration-150 transition-all shadow-xl active:scale-98 cursor-pointer text-white"
              >
                <span className="text-3xl font-normal">🎙️</span>
                <span>{language === 'hi' ? 'वॉयस कमांड मोड' : 'Voice Command'}</span>
                <span className="text-[10px] font-mono text-amber-100 font-medium normal-case tracking-wider max-w-xs block opacity-80 leading-snug">
                  {language === 'hi' ? 'आवाज आधारित सहायक सक्षम करें' : 'Activate hands-free speech triage'}
                </span>
              </button>

              <button
                id="setup-sos-btn"
                onClick={() => {
                  setVoiceOptimized(false);
                  isTriageCompleted.current = true;
                  setAccessibilityPrompt(false);
                  setSosActive(true);
                  const sosText = language === 'hi' ? 'एसओएस आपातकालीन अलार्म सक्रिय हो गया है!' : 'SOS emergency alert initiated.';
                  speakOutLoud(sosText);
                }}
                className="p-5 rounded-2xl bg-red-650 hover:bg-red-750 hover:scale-[1.02] border border-red-500/30 font-sans text-base font-black flex flex-col items-center justify-center gap-2 duration-150 transition-all shadow-xl active:scale-98 cursor-pointer text-white animate-pulse"
              >
                <span className="text-3xl font-normal animate-bounce">🚨</span>
                <span>{language === 'hi' ? 'एसओएस खतरा मोड' : 'SOS Emergency'}</span>
                <span className="text-[10px] font-mono text-red-100 font-medium normal-case tracking-wider max-w-xs block opacity-80 leading-snug">
                  {language === 'hi' ? 'त्वरित सायरन व स्थान शेयर' : 'Immediately sound alarm and share coordinates'}
                </span>
              </button>
            </div>

            <button
              id="replay-setup-voice"
              onClick={() => {
                const welcomeSpeechText = "सहायक आपातकालीन सेवाएं में आपका स्वागत है। आप वॉइस कमांड के साथ आगे बढ़ना चाहते हैं या मैन्युअल विकल्प के साथ? Welcome to Sahayak Emergency Services. Do you want to proceed with voice commands or manual options?";
                speakOutLoud(welcomeSpeechText, () => {
                  startSetupSpeechRecognition();
                });
              }}
              className="mt-8 font-mono text-[9px] text-[#dae2fd]/40 hover:text-white border border-white/5 hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all cursor-pointer uppercase tracking-widest font-extrabold flex items-center gap-2"
            >
              <span>🔊</span>
              <span>{language === 'hi' ? 'आवाज निर्देश फिर से सुनें' : 'Replay Voice Instruction'}</span>
            </button>
          </div>

          <div className="mb-6 flex flex-col items-center gap-1 select-none">
            <span className="font-mono text-[8px] text-white/30 tracking-widest uppercase">
              {language === 'hi' ? 'सहायक त्वरित आपातकालीन पहुंच कंसोल' : 'SAHAYAK SECURE TOUCH BAR & ACCESSIBILITY CONSOLE'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
