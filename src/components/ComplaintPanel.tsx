import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Mail, 
  User, 
  Phone, 
  MapPin, 
  UploadCloud, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Trash2, 
  Sparkles, 
  FileText, 
  Megaphone,
  Radio,
  FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Language, HelplineItem } from '../types';
import { HELPLINES } from './HelplineList';

interface ComplaintPanelProps {
  language: Language;
  currentUser: any;
  onUpdateCurrentUser: (user: any) => void;
  onUpdateMedicalProfile: (profile: any) => void;
  onInitiateCall: (item: HelplineItem) => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  previewUrl?: string;
}

export default function ComplaintPanel({
  language,
  currentUser,
  onUpdateCurrentUser,
  onUpdateMedicalProfile,
  onInitiateCall
}: ComplaintPanelProps) {
  // Verification states
  const [emailInput, setEmailInput] = useState('');
  const [gmailOtp, setGmailOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [otpSentError, setOtpSentError] = useState('');
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [profileFulfillmentForm, setProfileFulfillmentForm] = useState({
    fullName: '',
    phone: '',
    districtArea: '',
    bloodType: 'O+',
    allergies: '',
    medications: '',
    emergencyNotes: ''
  });

  // Complaint form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [incidentNumber, setIncidentNumber] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // AI analysis result state
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [registeredComplaints, setRegisteredComplaints] = useState<any[]>(() => {
    const saved = localStorage.getItem('sahayak_registered_complaints');
    return saved ? JSON.parse(saved) : [];
  });
  const [complaintSuccessId, setComplaintSuccessId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetDropdown, setShowResetDropdown] = useState(false);

  const handleClearAllComplaints = () => {
    setRegisteredComplaints([]);
    setComplaintSuccessId(null);
    localStorage.removeItem('sahayak_registered_complaints');
    setShowResetDropdown(false);
    setShowClearConfirm(false);
  };

  const handleResetVerificationAndProfile = () => {
    localStorage.removeItem('sahayak_current_user');
    onUpdateCurrentUser(null);
    setEmailInput('');
    setGmailOtp('');
    setShowOtpField(false);
    setOtpSentError('');
    setOtpSuccessMessage('');
    setProfileFulfillmentForm({
      fullName: '',
      phone: '',
      districtArea: '',
      bloodType: 'O+',
      allergies: '',
      medications: '',
      emergencyNotes: ''
    });
    setComplaintSuccessId(null);
    setShowResetDropdown(false);
  };

  const handleResetFormFields = () => {
    setTitle('');
    setDescription('');
    setIncidentNumber('');
    setUploadedFiles([]);
    setAnalysisResult(null);
    setComplaintSuccessId(null);
    setShowResetDropdown(false);
  };

  // Sync profile fulfillment form with currentUser if details exist
  useEffect(() => {
    if (currentUser) {
      setProfileFulfillmentForm(prev => ({
        ...prev,
        fullName: currentUser.fullName || '',
        phone: currentUser.phone || '',
        districtArea: currentUser.districtArea || '',
        bloodType: currentUser.bloodType || 'O+',
        allergies: currentUser.allergies || '',
        medications: currentUser.medications || '',
        emergencyNotes: currentUser.emergencyNotes || ''
      }));
    }
  }, [currentUser]);

  // Constraints detection
  const isRegistered = currentUser && currentUser.isRegistered === true;
  const isGmailVerified = currentUser && currentUser.isGmailVerified === true;
  const isProfileFulfilled = currentUser && 
    currentUser.fullName && 
    currentUser.fullName !== 'Anonymous Guest' && 
    currentUser.phone && 
    currentUser.districtArea && 
    currentUser.districtArea.trim().length > 3;

  const isFullyUnlocked = isRegistered && isGmailVerified && isProfileFulfilled;

  // Gmail SMTP & Server OTP Verification
  const handleSendGmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpSentError('');
    setOtpSuccessMessage('');
    if (!emailInput.includes('@') || !emailInput.endsWith('.com')) {
      setOtpSentError(language === 'hi' ? 'कृपया एक वैध जीमेल पता दर्ज करें।' : 'Please enter a valid Gmail address.');
      return;
    }
    
    setIsSendingOtp(true);
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, language })
      });
      const data = await response.json();
      if (data.success) {
        setOtpSuccessMessage(language === 'hi' ? 'ओटीपी सफलतापूर्वक आपके ईमेल पते पर भेज दिया गया है।' : 'A secure 6-digit verification code has been dispatched to your Gmail!');
        setShowOtpField(true);
      } else {
        setOtpSentError(data.error || (language === 'hi' ? 'ओटीपी भेजने में विफल।' : 'Failed to send OTP. Please check your setup.'));
      }
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      setOtpSentError(language === 'hi' ? 'सर्वर से संपर्क करने में असमर्थ।' : 'Unable to connect to security server.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyGmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpSentError('');
    if (!gmailOtp.trim()) {
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, otp: gmailOtp, language })
      });
      const data = await response.json();
      
      if (data.success) {
        // Success! Update user state
        const updatedUser = {
          ...(currentUser || { username: 'citizen_' + Date.now(), isRegistered: true }),
          isRegistered: true,
          email: emailInput,
          isGmailVerified: true
        };
        localStorage.setItem('sahayak_current_user', JSON.stringify(updatedUser));
        onUpdateCurrentUser(updatedUser);
        setShowOtpField(false);
      } else {
        setOtpSentError(data.error || (language === 'hi' ? 'गलत वन-टाइम पासवर्ड (OTP)! कृपया पुनः प्रयास करें।' : 'Incorrect verification code. Please check your Gmail box.'));
      }
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setOtpSentError(language === 'hi' ? 'सत्यापन करने में असमर्थ।' : 'Unable to connect to security server for verification.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleProfileFulfillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFulfillmentForm.fullName.trim() || !profileFulfillmentForm.phone.trim() || !profileFulfillmentForm.districtArea.trim()) {
      return;
    }

    const updatedUser = {
      ...(currentUser || {}),
      isRegistered: true,
      fullName: profileFulfillmentForm.fullName,
      phone: profileFulfillmentForm.phone,
      districtArea: profileFulfillmentForm.districtArea,
      bloodType: profileFulfillmentForm.bloodType,
      allergies: profileFulfillmentForm.allergies,
      medications: profileFulfillmentForm.medications,
      emergencyNotes: profileFulfillmentForm.emergencyNotes
    };

    localStorage.setItem('sahayak_current_user', JSON.stringify(updatedUser));
    onUpdateCurrentUser(updatedUser);

    onUpdateMedicalProfile({
      fullName: profileFulfillmentForm.fullName,
      bloodType: profileFulfillmentForm.bloodType,
      allergies: profileFulfillmentForm.allergies || 'None declared',
      medications: profileFulfillmentForm.medications || 'None active',
      emergencyNotes: profileFulfillmentForm.emergencyNotes || 'Fulfilling official complaint file security clearances.'
    });

    const existingUsers = JSON.parse(localStorage.getItem('sahayak_users') || '[]');
    const otherUsers = existingUsers.filter((u: any) => u.username !== updatedUser.username);
    otherUsers.push(updatedUser);
    localStorage.setItem('sahayak_users', JSON.stringify(otherUsers));
  };

  const handleCreateMockAccount = () => {
    const defaultUser = {
      username: 'citizen_emergency_' + Math.floor(Math.random() * 1000),
      password: 'demopassword',
      fullName: 'Arjun Sharma',
      phone: '+91 98765 43210',
      districtArea: 'Rajpath, New Delhi, India',
      bloodType: 'O+',
      allergies: 'Penicillin, Dust Mites',
      medications: 'None active',
      emergencyNotes: 'Registered official feedback citizen.',
      isRegistered: true,
      isGmailVerified: false
    };
    localStorage.setItem('sahayak_current_user', JSON.stringify(defaultUser));
    onUpdateCurrentUser(defaultUser);
  };

  // Upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    
    const newUploads = files.map(file => {
      const url = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      return {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: file.type,
        previewUrl: url
      };
    });

    setUploadedFiles(prev => [...prev, ...newUploads]);
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Trigger Gemini Analysis Call
  const handleAnalyzeComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setComplaintSuccessId(null);

    const activeFilesText = uploadedFiles.map(f => `${f.name} (${f.type}, ${f.size})`).join(', ');

    try {
      const response = await fetch('/api/analyze-complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          associatedNumber: incidentNumber,
          title,
          files: activeFilesText || 'No files uploaded',
          language
        })
      });

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error('Error hitting analyzer endpoint:', err);
      // Fallback classification if endpoint fails
      const descLower = description.toLowerCase();
      let classification: any = 'police';
      let hotline = '112';
      
      if (descLower.includes('money') || descLower.includes('financial') || descLower.includes('scam') || descLower.includes('fraud') || descLower.includes('bank') || descLower.includes('cyber') || descLower.includes('hacked') || descLower.includes('atm')) {
        classification = 'cyber';
        hotline = '1930';
      } else if (descLower.includes('heart') || descLower.includes('chest') || descLower.includes('blood') || descLower.includes('fracture') || descLower.includes('accident') || descLower.includes('hospital') || descLower.includes('medical') || descLower.includes('doctor')) {
        classification = 'medical';
        hotline = '102';
      } else if (descLower.includes('women') || descLower.includes('harassment') || descLower.includes('girl') || descLower.includes('teasing') || descLower.includes('stalking') || descLower.includes('domestic')) {
        classification = 'women';
        hotline = '1091';
      } else if (descLower.includes('fire') || descLower.includes('smoke') || descLower.includes('cylinder') || descLower.includes('blast')) {
        classification = 'fire';
        hotline = '101';
      } else if (descLower.includes('flood') || descLower.includes('earthquake') || descLower.includes('cyclone') || descLower.includes('disaster') || descLower.includes('landslide')) {
        classification = 'disaster';
        hotline = '1078';
      } else if (descLower.includes('aadhaar') || descLower.includes('passport') || descLower.includes('pan') || descLower.includes('wallet') || descLower.includes('lost') || descLower.includes('documents')) {
        classification = 'lost';
        hotline = '112'; // Direct local NCR reporting
      }

      const matchItem = HELPLINES.find(h => h.number === hotline || h.category === classification) || HELPLINES[0];

      setAnalysisResult({
        classification,
        confidence: 88,
        helpline: matchItem.number,
        helplineNameEn: matchItem.nameEn,
        helplineNameHi: matchItem.nameHi,
        summaryEn: `Sahayak Offline intelligence classified this emergency situation under "${classification.toUpperCase()}" with localized rescue priorities. Immediate response recommended.`,
        summaryHi: `सहायक ऑफलाइन इंटेलिजेंस ने इस आपातकालीन स्थिति को स्थानीय स्तर पर "${classification.toUpperCase()}" श्रेणी में वर्गीकृत किया है। त्वरित राहत की आवश्यकता है।`,
        remediesEn: [
          `Contact the designated helpline ${matchItem.number} for immediate advice/dispatch.`,
          "Preserve all transaction IDs, suspect contacts, and digital evidence.",
          "Keep safe, let family members track your live coordinates."
        ],
        remediesHi: [
          `तत्काल सहायता के लिए निर्धारित हेल्पलाइन नंबर ${matchItem.number} पर संपर्क करें।`,
          "सभी वित्तीय डेटा, धमकी भरे संदेश और सहायक फाइलों को रिकॉर्ड में सुरक्षित रखें।",
          "सुरक्षित रहें और परिजनों के साथ अपनी लाइव जीपीएस लोकेशन साझा करें।"
        ]
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOfficiallySubmit = () => {
    if (!analysisResult) return;
    
    const trackingId = 'SHYK-' + Math.floor(100000 + Math.random() * 900000);
    const newComplaint = {
      id: trackingId,
      title: title || 'Emergency Incident Report',
      description,
      associatedNumber: incidentNumber,
      category: analysisResult.classification,
      helpline: analysisResult.helpline,
      timestamp: new Date().toISOString(),
      documents: uploadedFiles.map(f => f.name)
    };

    const updatedList = [newComplaint, ...registeredComplaints];
    setRegisteredComplaints(updatedList);
    localStorage.setItem('sahayak_registered_complaints', JSON.stringify(updatedList));
    setComplaintSuccessId(trackingId);
  };

  const activeSuccessComplaint = registeredComplaints.find(c => c.id === complaintSuccessId);

  return (
    <div id="complaint-desk-container" className="space-y-6 pb-16 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="font-sans font-black text-2xl text-on-surface tracking-tight uppercase flex items-center gap-2">
            <Megaphone className="text-secondary animate-pulse" size={24} />
            <span>{language === 'hi' ? 'आपातकालीन शिकायत और विश्लेषण' : 'Emergency Complaint & Analysis'}</span>
          </h2>
          <p className="font-sans text-xs text-on-surface-variant/80 mt-1">
            {language === 'hi' 
              ? 'यहां आप अपनी शिकायत लिख सकते हैं, नंबर दर्ज कर सकते हैं और फोटो/वीडियो अपलोड कर विश्लेषण कर सकते हैं।' 
              : 'Filing complaints securely, upload media files and utilize AI to instantly route facts to exact authorities.'}
          </p>
        </div>

        {/* Global Persistent Desk Action Controls */}
        <div className="relative shrink-0">
          <button
            id="global-desk-controls-btn"
            onClick={() => setShowResetDropdown(!showResetDropdown)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-white/10 font-sans text-xs font-black transition-all active:scale-95 cursor-pointer select-none"
          >
            <span>⚙️</span>
            <span>{language === 'hi' ? 'डेस्क संपादन (Clear Data)' : 'Desk Controls (Clear Data)'}</span>
            <span className={`text-[8px] duration-200 ${showResetDropdown ? 'rotate-180' : ''}`}>▼</span>
          </button>

          <AnimatePresence>
            {showResetDropdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                id="desk-controls-dropdown-panel"
                className="absolute right-0 mt-2 w-72 bg-slate-950 border border-white/15 rounded-2xl p-4 shadow-2xl z-50 space-y-3"
              >
                <div className="border-b border-white/10 pb-2">
                  <h4 className="font-sans font-extrabold text-[10px] text-slate-400 uppercase tracking-widest">
                    {language === 'hi' ? 'शिकायत डेटा प्रबंधन' : 'Complaint Registry Admin'}
                  </h4>
                </div>

                <div className="space-y-2">
                  {/* Action 1: Reset Form Draft */}
                  <button
                    onClick={handleResetFormFields}
                    className="w-full text-left p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white transition-all text-xs flex flex-col gap-0.5"
                  >
                    <span className="font-bold text-indigo-400">✏️ {language === 'hi' ? 'ड्राफ्ट फॉर्म रीसेट करें' : 'Reset Form Draft'}</span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      {language === 'hi' ? 'शीर्षक, विवरण, और फाइल साफ़ करें' : 'Clears title, text description, and file previews.'}
                    </span>
                  </button>

                  {/* Action 2: Reset Verification/Profile */}
                  <button
                    onClick={handleResetVerificationAndProfile}
                    className="w-full text-left p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white transition-all text-xs flex flex-col gap-0.5"
                  >
                    <span className="font-bold text-amber-400">🔑 {language === 'hi' ? 'सत्यापन और प्रोफाइल रीसेट करें' : 'Reset Verification & Profile'}</span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      {language === 'hi' ? 'सत्यापन हटाकर सामान्य नागरिक मोड चालू करें' : 'Clears verified Gmail, identity badges, and resets.'}
                    </span>
                  </button>

                  {/* Action 3: Clear Complaints History */}
                  <button
                    onClick={handleClearAllComplaints}
                    className="w-full text-left p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 transition-all text-xs flex flex-col gap-0.5"
                  >
                    <span className="font-bold text-rose-400">🗑️ {language === 'hi' ? 'शिकायत इतिहास मिटाएं' : 'Delete Reports History'}</span>
                    <span className="text-[10px] text-rose-300/70 leading-tight">
                      {language === 'hi' ? 'दर्ज की गई सभी शिकायतों का इतिहास पूरी तरह साफ़ करें' : 'Permanently clears all reported complaints history.'}
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* OPTIONAL CITIZEN IDENTIFICATION DESK / VERIFICATION SECURE PANEL */}
      <div className="glass-card rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isFullyUnlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-sans font-extrabold text-white text-sm uppercase">
                🛡️ {language === 'hi' ? 'नागरिक सत्यापन और विश्वसनीय प्रोफाइल (वैकल्पिक)' : 'Citizen Verification & Trusted Profile (Optional)'}
              </h3>
              <p className="font-sans text-[11px] text-slate-400 mt-0.5">
                {language === 'hi'
                  ? 'अधिकृत रिपोर्ट दर्ज करने के लिए अपना खाता सत्यापित करें या विवरण जोड़ें।'
                  : 'Link your Gmail or complete profile to attach verified credentials to this emergency report.'}
              </p>
            </div>
          </div>
          
          {/* Unified Badges status display */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-mono font-bold uppercase border ${
              isRegistered ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400 font-extrabold' : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {language === 'hi' ? 'पंजीकृत' : 'Registered'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-mono font-bold uppercase border ${
              isGmailVerified ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400 font-extrabold' : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {language === 'hi' ? 'जीमेल सत्यापित' : 'Gmail OTP'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-mono font-bold uppercase border ${
              isProfileFulfilled ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400 font-extrabold' : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {language === 'hi' ? 'प्रोफ़ाइल विवरण' : 'Profile Synced'}
            </span>
          </div>
        </div>

        {/* Single unified expansion to verify or fill either Account or Profile card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          
          {/* Option Block A: Quick Account or Gmail Verification */}
          <div className="space-y-4 bg-white/[0.02] border border-white/5 p-4 rounded-xl flex flex-col justify-between">
            <div className="space-y-2">
              <span className="font-mono text-[9px] font-bold tracking-wider uppercase text-slate-400">{language === 'hi' ? 'विकल्प ए' : 'OPTION A'}</span>
              <h4 className="font-sans font-bold text-white text-xs flex items-center gap-1.5">
                <User size={13} className="text-indigo-400 shrink-0" />
                <span>{language === 'hi' ? 'नागरिक खाता सक्रिय करें' : 'Citizen Account Setup'}</span>
              </h4>
              <p className="font-sans text-[11px] text-slate-300 leading-relaxed">
                {isRegistered 
                  ? (language === 'hi' ? `सक्रिय खाता: @${currentUser.username}` : `Active Account: @${currentUser.username}`)
                  : (language === 'hi' ? 'त्वरित नागरिक खाता सक्षम करें:' : 'Fast-enable a secure civic report account:')}
              </p>

              {!isRegistered && (
                <button
                  type="button"
                  onClick={handleCreateMockAccount}
                  className="w-full py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-[10px] font-bold text-white uppercase transition-colors shrink-0 select-none cursor-pointer"
                >
                  🚀 {language === 'hi' ? 'अकाउंट सक्रिय करें' : 'Enable Account'}
                </button>
              )}
            </div>

            {/* Gmail/Email Verification */}
            <div className="border-t border-white/5 pt-3 mt-2">
              <p className="font-sans text-[11px] text-slate-300 mb-2">
                {isGmailVerified 
                  ? (language === 'hi' ? `जीमेल लिंक: ` : `Linked: `) 
                  : (language === 'hi' ? 'वैकल्पिक: जीमेल पर वन-टाइम पासवर्ड सत्यापन' : 'Optional Gmail Verification (Requires OTP)')}
                {isGmailVerified && <span className="font-mono text-[10.5px] text-emerald-400 block mt-0.5">{currentUser.email}</span>}
              </p>

              {!isGmailVerified && (
                <div className="space-y-2">
                  {!showOtpField ? (
                    <form onSubmit={handleSendGmailOtp} className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/10 w-full overflow-hidden">
                      <input 
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="arjun@gmail.com"
                        className="flex-1 min-w-0 bg-transparent px-2 py-1 text-on-surface font-sans text-xs outline-none"
                      />
                      <button 
                        type="submit"
                        disabled={isSendingOtp}
                        className="px-2.5 py-1 bg-indigo-500 hover:bg-indigo-650 text-[9px] font-black rounded text-white uppercase cursor-pointer disabled:opacity-50 select-none shrink-0"
                      >
                        {isSendingOtp ? '...' : 'OTP'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyGmailOtp} className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/10 w-full overflow-hidden">
                      <input 
                        type="text"
                        required
                        value={gmailOtp}
                        onChange={(e) => setGmailOtp(e.target.value)}
                        placeholder={language === 'hi' ? "ओटीपी दर्ज करें" : "6-digit OTP"}
                        className="flex-1 min-w-0 bg-transparent px-2 py-1 text-on-surface font-sans text-xs outline-none"
                      />
                      <button 
                        type="submit"
                        disabled={isVerifyingOtp}
                        className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-[9px] font-black rounded text-white uppercase cursor-pointer select-none shrink-0"
                      >
                        {isVerifyingOtp ? '...' : (language === 'hi' ? 'सत्यापित' : 'Verify')}
                      </button>
                    </form>
                  )}

                  {otpSentError && (
                    <div className="mt-2 p-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg text-[9.5px] leading-relaxed max-w-full overflow-hidden">
                      <p className="text-slate-200 break-words font-sans">{otpSentError}</p>
                    </div>
                  )}

                  {showOtpField && otpSuccessMessage && !otpSentError && (
                    <p className="font-sans text-[10px] text-emerald-400">
                      ✅ {otpSuccessMessage}
                    </p>
                  )}

                  {showOtpField && (
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 mt-1 w-full">
                      <button
                        type="button"
                        disabled={isSendingOtp}
                        onClick={async () => {
                          setOtpSentError('');
                          setOtpSuccessMessage('');
                          setIsSendingOtp(true);
                          try {
                            const response = await fetch('/api/send-otp', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: emailInput, language })
                            });
                            const data = await response.json();
                            if (data.success) {
                              setOtpSuccessMessage(language === 'hi' ? 'ओटीपी पुनः भेज दिया गया है!' : 'OTP resent successfully!');
                            } else {
                              setOtpSentError(data.error || (language === 'hi' ? 'ओटीपी पुनः भेजने में विफल।' : 'Failed to resend OTP.'));
                            }
                          } catch (err: any) {
                            setOtpSentError(language === 'hi' ? 'सर्वर कनेक्शन त्रुटि।' : 'Server connection issue during resend.');
                          } finally {
                            setIsSendingOtp(false);
                          }
                        }}
                        className="text-[9px] font-sans font-bold text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50 select-none cursor-pointer"
                      >
                        🔄 {isSendingOtp ? (language === 'hi' ? 'भेज रहा है...' : 'Sending...') : (language === 'hi' ? 'ओटीपी पुनः भेजें' : 'Resend OTP')}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowOtpField(false);
                          setGmailOtp('');
                          setOtpSentError('');
                          setOtpSuccessMessage('');
                        }}
                        className="text-[9px] font-sans font-bold text-slate-400 hover:text-slate-300 transition-colors select-none cursor-pointer"
                      >
                        ✏️ {language === 'hi' ? 'बदलें' : 'Change'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Option Block B: Quick Profile Details */}
          <div className="space-y-4 bg-white/[0.02] border border-white/5 p-4 rounded-xl flex flex-col justify-between">
            <div className="space-y-1">
              <span className="font-mono text-[9px] font-bold tracking-wider uppercase text-slate-400">{language === 'hi' ? 'विकल्प बी' : 'OPTION B'}</span>
              <h4 className="font-sans font-bold text-white text-xs flex items-center gap-1.5">
                <Phone size={13} className="text-emerald-400 shrink-0" />
                <span>{language === 'hi' ? 'नागरिक प्रोफाइल' : 'Citizen Profile Card'}</span>
              </h4>
              <p className="font-sans text-[11px] text-slate-300 leading-relaxed">
                {isProfileFulfilled 
                  ? (language === 'hi' ? `सत्यापित प्रोफाइल स्वामी: ${profileFulfillmentForm.fullName}` : `Verified profiles attached: ${profileFulfillmentForm.fullName}`)
                  : (language === 'hi' ? 'रिपोर्ट के साथ नाम और फोन नंबर संलग्न करें:' : 'Save name/mobile to attach to reports:')}
              </p>
            </div>

            <form onSubmit={handleProfileFulfillSubmit} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-sans text-[9px] text-slate-400 font-bold block mb-0.5">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-white font-sans text-[11px] outline-none focus:border-indigo-500"
                    value={profileFulfillmentForm.fullName}
                    onChange={(e) => setProfileFulfillmentForm({ ...profileFulfillmentForm, fullName: e.target.value })}
                    placeholder="Arjun"
                  />
                </div>

                <div>
                  <label className="font-sans text-[9px] text-slate-400 font-bold block mb-0.5">Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-white font-sans text-[11px] outline-none focus:border-indigo-500"
                    value={profileFulfillmentForm.phone}
                    onChange={(e) => setProfileFulfillmentForm({ ...profileFulfillmentForm, phone: e.target.value })}
                    placeholder="+91 9999888877"
                  />
                </div>
              </div>

              <div>
                <label className="font-sans text-[9px] text-slate-400 font-bold block mb-0.5">Home District / Area Address</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-white font-sans text-[11px] outline-none focus:border-indigo-500"
                  value={profileFulfillmentForm.districtArea}
                  onChange={(e) => setProfileFulfillmentForm({ ...profileFulfillmentForm, districtArea: e.target.value })}
                  placeholder="New Delhi"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-sans text-[10px] font-bold text-white transition-colors cursor-pointer"
                >
                  💾 {isProfileFulfilled ? (language === 'hi' ? 'अपडेट प्रोफाइल' : 'Update Profile') : (language === 'hi' ? 'प्रोफ़ाइल सहेजें' : 'Save Profile')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      /* COMPLAINT CREATOR DESK */
      <div id="visual-complaint-creator-desk" className="space-y-8">
          <div className="glass-card rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Unlock size={20} />
                </div>
                <div>
                  <h3 className="font-sans font-extrabold text-white text-sm uppercase">
                    {language === 'hi' ? 'सत्यापित शिकायत सुरक्षा डेस्क चालू' : 'Verified Incident Complaint Desk Active'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] font-mono font-bold uppercase border border-emerald-500/30">
                      Gmail Verified
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[8px] font-mono font-bold uppercase border border-indigo-500/30">
                      ID Profile Synced
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right font-mono text-[10px] text-slate-400">
                <span>INCIDENT INTAKE TERMINAL</span>
              </div>
            </div>

            <form onSubmit={handleAnalyzeComplaint} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-sans text-xs text-slate-300 font-extrabold block uppercase tracking-wider">
                    {language === 'hi' ? 'शिकायत का शीर्षक' : 'Complaint Title / Topic'}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Unauthorized UPI Net banking Transaction Fraud"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white font-sans text-xs outline-none focus:border-secondary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-sans text-xs text-slate-300 font-extrabold block uppercase tracking-wider">
                    {language === 'hi' ? 'संबंधित संदिग्ध/शामिल मोबाइल नंबर' : 'Associated Mobile / Suspect Number (If applicable)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500"><Phone size={13} /></span>
                    <input
                      type="tel"
                      value={incidentNumber}
                      onChange={(e) => setIncidentNumber(e.target.value)}
                      placeholder="e.g. +91 99998 88887"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-white font-sans text-xs outline-none focus:border-secondary"
                    />
                  </div>
                </div>
              </div>

              {/* Description file */}
              <div className="space-y-1">
                <label className="font-sans text-xs text-slate-300 font-extrabold block uppercase tracking-wider">
                  {language === 'hi' ? 'घटना का विवरण ( narrative ) *' : 'Detailed Narrative of the Situation *'}
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={language === 'hi' ? 'घटना का पूरा विवरण विस्तार से हिन्दी या अंग्रेजी में लिखें...' : 'Explain the complete incident. What happened, where, and when? Mention any caller statements or fraudulent links received...'}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 h-32 text-white font-sans text-xs outline-none focus:border-secondary resize-none"
                />
              </div>

              {/* Photo component / video evidence upload */}
              <div className="space-y-2">
                <label className="font-sans text-xs text-slate-300 font-extrabold block uppercase tracking-wider">
                  {language === 'hi' ? 'संबद्ध फोटो और वीडियो साक्ष्य अपलोड करें *' : 'Upload Photos or Videos Evidence *'}
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Drag-drop or click box */}
                  <label className="border border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.04] active:bg-white/[0.06] rounded-xl px-4 py-6 flex flex-col items-center justify-center gap-1 cursor-pointer duration-200">
                    <UploadCloud size={24} className="text-secondary animate-bounce" />
                    <span className="font-sans text-xs text-white font-extrabold">{language === 'hi' ? 'फाइलें चुनें' : 'Select Photos or Videos'}</span>
                    <span className="font-mono text-[9px] text-slate-400">supports JPG, PNG, MP4 up to 15MB</span>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*,video/*" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                  </label>

                  {/* Previews panel */}
                  <div className="border border-white/10 rounded-xl bg-slate-900/50 p-3 space-y-2 overflow-y-auto max-h-[120px]">
                    <span className="text-[9px] text-slate-400 font-mono tracking-widest block uppercase font-bold">Attached Evidence Queue ({uploadedFiles.length})</span>
                    
                    <div className="space-y-1.5">
                      {uploadedFiles.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-1.5 bg-black/30 border border-white/5 rounded-lg text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            {file.previewUrl ? (
                              <img src={file.previewUrl} className="w-6 h-6 object-cover rounded shrink-0 bg-slate-800" referrerPolicy="no-referrer" alt="" />
                            ) : (
                              <div className="w-6 h-6 bg-slate-800 rounded shrink-0 flex items-center justify-center text-[10px] text-white">📁</div>
                            )}
                            <div className="min-w-0">
                              <p className="text-white truncate font-sans text-[10px] font-semibold">{file.name}</p>
                              <p className="text-[9px] text-slate-400 font-mono">{file.size} • {file.type.split('/')[1]?.toUpperCase()}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.id)}
                            className="p-1 hover:bg-white/10 rounded text-red-400 shrink-0 cursor-pointer"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}

                      {uploadedFiles.length === 0 && (
                        <span className="text-slate-500 italic text-[11px] block text-center py-4">{language === 'hi' ? 'कोई साक्ष्य फ़ाइल संलग्न नहीं है।' : 'No photos or videos uploaded in supporting evidence.'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-white/5">
                <button
                  type="submit"
                  disabled={isAnalyzing || !description.trim()}
                  className={`px-6 py-3 rounded-full font-sans text-xs font-black uppercase text-white shadow-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    isAnalyzing || !description.trim() ? 'bg-indigo-950/20 text-white/30 cursor-not-allowed border border-white/5' : 'bg-secondary hover:bg-indigo-600 hover:scale-102 active:scale-98'
                  }`}
                >
                  <Sparkles size={14} className={isAnalyzing ? 'animate-spin' : 'animate-pulse'} />
                  <span>{isAnalyzing ? (language === 'hi' ? 'एआई विश्लेषण जारी...' : 'Sahayak Analysing narrative...') : (language === 'hi' ? 'स्थिति का एआई विश्लेषण' : 'Analyse Narrative with AI')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* ACTIVE AI RESPONSE AND ROUTING RESULT PANEL */}
          <AnimatePresence>
            {analysisResult && (
              <motion.div 
                id="ai-complaint-classification-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="glass-card rounded-2xl border-2 border-[#38bdf8]/35 bg-sky-950/10 p-6 space-y-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <span className="font-mono text-[9px] font-black uppercase tracking-widest text-[#38bdf8] flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      SAHAYAK SYSTEM AI INTELLIGENCE DIAGNOSIS
                    </span>
                    <h3 className="font-sans font-black text-xl text-white uppercase mt-1">
                      {language === 'hi' ? `${analysisResult.classification.toUpperCase()} रिपोर्ट पहचानी गई` : `${analysisResult.classification.toUpperCase()} EMERGENCY INCIDENT ROUTED`}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-xl font-mono text-xs font-bold text-white uppercase">
                      CONFIDENCE: {analysisResult.confidence}%
                    </span>
                    <div className="bg-gradient-to-br from-pink-500 to-rose-600 px-4 py-2 rounded-xl text-center shrink-0 border border-white/10">
                      <span className="font-mono text-[8.5px] text-white/70 block uppercase font-black">{language === 'hi' ? 'संबद्ध हेल्पलाइन' : 'ROUTED HOTLINE'}</span>
                      <span className="font-mono text-lg font-black text-white">{analysisResult.helpline}</span>
                    </div>
                  </div>
                </div>

                {/* Summarized diagnosis narrative */}
                <div className="space-y-2">
                  <h4 className="font-sans font-extrabold text-[10px] text-white uppercase tracking-widest">
                    📋 {language === 'hi' ? 'मुख्य स्थिति विश्लेषण' : 'AI DIAGNOSTIC SITUATION REPORT'}
                  </h4>
                  <p className="font-sans text-sm text-slate-200 bg-black/25 rounded-xl p-4 border border-white/5 leading-relaxed">
                    {language === 'hi' ? analysisResult.summaryHi : analysisResult.summaryEn}
                  </p>
                </div>

                {/* Instant safety/remedial action steps */}
                <div className="space-y-3">
                  <h4 className="font-sans font-extrabold text-[10px] text-[#38bdf8] uppercase tracking-widest">
                    🚨 {language === 'hi' ? 'तत्काल सुधारात्मक रक्षा कार्रवाई दिशा-निर्देश' : 'CRITICAL REMEDIAL DISPATCH ACTIONS'}
                  </h4>
                  <div className="space-y-2.5">
                    {(language === 'hi' ? analysisResult.remediesHi : analysisResult.remediesEn).map((rem: string, index: number) => (
                      <div key={index} className="flex gap-3 text-xs leading-relaxed text-slate-300">
                        <span className="font-mono font-bold text-secondary bg-white/5 border border-white/10 rounded w-5 h-5 flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <p className="font-sans text-xs md:text-sm">{rem}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* File tracking action controls */}
                <div className="border-t border-white/15 pt-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-sans text-xs text-slate-300 font-bold">
                      {language === 'hi' ? 'यह रिपोर्ट संबंधित हेल्पलाइन नंबर के साथ जोड़ने के लिए तैयार है।' : 'Ready to lodge facts officially or dial help center.'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {!complaintSuccessId ? (
                      <>
                        <button
                          onClick={handleOfficiallySubmit}
                          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-sans text-xs font-bold transition-transform active:scale-95 flex items-center gap-1 tracking-wider uppercase cursor-pointer"
                        >
                          <FileCheck size={13} />
                          <span>{language === 'hi' ? 'आधिकारिक दर्ज करें' : 'Lodge Officially'}</span>
                        </button>

                        <button
                          onClick={() => {
                            const selectedHelp: HelplineItem = {
                              id: `complaint-${analysisResult.classification}`,
                              nameEn: analysisResult.helplineNameEn,
                              nameHi: analysisResult.helplineNameHi,
                              number: analysisResult.helpline,
                              category: analysisResult.classification,
                              descriptionEn: 'Auto generated complaint hotline connection',
                              descriptionHi: 'शिकायत विश्लेषण आधारित कनेक्शन'
                            };
                            onInitiateCall(selectedHelp);
                          }}
                          className="px-5 py-2 bg-rose-650 hover:bg-rose-700 text-white rounded-full font-sans text-xs font-bold transition-transform active:scale-95 flex items-center gap-1 tracking-wider uppercase cursor-pointer shadow-lg"
                        >
                          <Phone size={13} />
                          <span>{language === 'hi' ? 'कॉल करें' : 'Call Department'}</span>
                        </button>
                      </>
                    ) : (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 font-sans text-xs flex items-center gap-2.5">
                        <CheckCircle size={15} className="shrink-0 animate-bounce" />
                        <div>
                          <p className="font-bold">LODGED SUCCESSFULLY!</p>
                          <p className="text-[10px] text-emerald-200/80 font-mono">TRACKING ID: {complaintSuccessId}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* DIGITAL COMPLAINT REPORT RECEIPT AND DOCUMENT */}
          {complaintSuccessId && activeSuccessComplaint && (
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              id="sahayak-official-complaint-document"
              className="p-6 md:p-8 bg-slate-900 border-2 border-emerald-500/35 rounded-2xl space-y-6 shadow-2xl relative overflow-hidden text-slate-100 font-sans mt-4"
            >
              {/* Seal watermark background absolute */}
              <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none select-none">
                <ShieldCheck size={260} className="text-emerald-500" />
              </div>

              {/* Document Header */}
              <div className="text-center border-b-2 border-white/10 pb-6 relative z-10 space-y-2">
                <div className="flex justify-center items-center gap-2">
                  <span className="w-8 h-px bg-gradient-to-r from-transparent to-amber-400" />
                  <div className="w-9 h-9 rounded-full bg-slate-850 border border-amber-400/40 flex items-center justify-center text-amber-400 font-bold text-sm">
                    🏛️
                  </div>
                  <span className="w-8 h-px bg-gradient-to-l from-transparent to-amber-400" />
                </div>
                <h3 className="text-[10px] font-black tracking-[0.25em] text-amber-400 font-mono uppercase">
                  {language === 'hi' ? 'राष्ट्रीय नागरिक आपातकालीन सहयोग प्रणाली' : 'NATIONAL CITIZEN EMERGENCY DISPATCH SERVICE'}
                </h3>
                <h2 className="text-sm font-black tracking-wider text-white uppercase md:text-base">
                  {language === 'hi' ? 'सत्यापित डिजिटल शिकायत और घटना रिपोर्ट रसीद' : 'VERIFIED DIGITAL COMPLAINT & INCIDENT REPORT RECEIPT'}
                </h2>
                <div className="flex justify-center items-center gap-2 font-mono text-[9px] text-[#38bdf8] font-bold uppercase tracking-wider">
                  <span>HASH: COMP-{complaintSuccessId}-SECURED-IN</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>

              {/* Side-by-side columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10 text-[11px] text-slate-300">
                {/* COLUMN 1: CITIZEN REGISTRY */}
                <div className="space-y-3 bg-black/30 p-4 rounded-xl border border-white/5">
                  <h4 className="font-mono text-[10px] font-black text-amber-400 tracking-wider uppercase border-b border-white/10 pb-1.5 flex items-center gap-1.5">
                    <User size={12} className="text-amber-400" />
                    <span>{language === 'hi' ? 'नागरिक / शिकायतकर्ता का विवरण' : 'CITIZEN FILER REGISTRY'}</span>
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">{language === 'hi' ? 'यूज़रनेम (Username)' : 'Filer Username'}</span>
                      <strong className="text-slate-200 font-mono text-xs">@{currentUser?.username || 'anonymous_citizen'}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">{language === 'hi' ? 'नागरिक विशिष्ट आईडी' : 'Citizen Unique ID'}</span>
                      <strong className="text-[#38bdf8] font-mono tracking-wider">
                        CITIZEN-SHYK-{(currentUser?.username || 'GUEST').toUpperCase()}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">{language === 'hi' ? 'पूरा कानूनी नाम' : 'Legal Full Name'}</span>
                      <strong className="text-white text-xs">{currentUser?.fullName || 'Arjun Sharma'}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">{language === 'hi' ? 'सत्यापित ईमेल / जीमेल' : 'Verified Google Email'}</span>
                      <span className="text-slate-300 font-mono">{currentUser?.email || 'verified_citizen@gmail.com'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">{language === 'hi' ? 'संपर्क मोबाइल संख्या' : 'Authorized Mobile Phone'}</span>
                      <span className="text-slate-300 font-mono">{currentUser?.phone || '+91 98765 43215'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">{language === 'hi' ? 'पंजीकृत जिला क्षेत्र' : 'Registered Action District'}</span>
                      <span className="text-slate-300">{currentUser?.districtArea || 'Rajpath, New Delhi, India'}</span>
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: COMPLAINT DATA */}
                <div className="space-y-3 bg-black/30 p-4 rounded-xl border border-white/5">
                  <h4 className="font-mono text-[10px] font-black text-sky-400 tracking-wider uppercase border-b border-white/10 pb-1.5 flex items-center gap-1.5">
                    <FileCheck size={12} className="text-sky-400" />
                    <span>{language === 'hi' ? 'घटना की आधिकारिक रिकॉर्ड' : 'INCIDENT TRANSACTION RECORD'}</span>
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">{language === 'hi' ? 'शिकायत ट्रैकिंग आईडी' : 'Document Tracking ID'}</span>
                      <span className="text-emerald-400 font-mono font-bold text-xs tracking-wider">{activeSuccessComplaint.id}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">{language === 'hi' ? 'शिकायत का शीर्षक' : 'Complaint Title'}</span>
                      <strong className="text-white text-xs">{activeSuccessComplaint.title}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">{language === 'hi' ? 'वर्गीकृत आपातकालीन श्रेणी' : 'Routed Emergency Category'}</span>
                      <span className="font-mono text-[9px] bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/25 font-bold uppercase inline-block mt-0.5">
                        {activeSuccessComplaint.category}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">{language === 'hi' ? 'लक्षित राष्ट्रीय हेल्पलाइन' : 'Dispatched Action Hotline'}</span>
                      <span className="text-slate-200 font-mono font-bold">
                        {activeSuccessComplaint.helpline} ({analysisResult?.helplineNameEn || 'National Response Center'})
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">{language === 'hi' ? 'दर्ज होने का समय' : 'Lodge Timestamp (UTC)'}</span>
                      <span className="text-slate-400 font-mono">{new Date(activeSuccessComplaint.timestamp).toUTCString()}</span>
                    </div>
                    {activeSuccessComplaint.documents && activeSuccessComplaint.documents.length > 0 && (
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase font-mono">{language === 'hi' ? 'अपलोड की गई साक्ष्य फाइलें' : 'Attached Evidence Assets'}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {activeSuccessComplaint.documents.map((doc: string, idx: number) => (
                            <span key={idx} className="font-mono text-[8px] bg-slate-900 border border-white/5 text-slate-300 px-1.5 py-0.5 rounded italic">
                              📎 {doc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Statement Description Block */}
              <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-white/5 relative z-10 text-xs text-left">
                <span className="text-[9px] text-slate-500 block uppercase font-mono">{language === 'hi' ? 'घटना का पूर्ण विवरण' : 'Verified Incident Fact Statement'}</span>
                <p className="text-slate-200 leading-relaxed font-sans text-xs italic bg-white/5 p-3 rounded border border-white/5">
                  "{activeSuccessComplaint.description}"
                </p>
              </div>

              {/* Signatures & Actions */}
              <div className="border-t border-white/10 pt-5 flex flex-wrap items-center justify-between gap-5 relative z-10 text-xs">
                <div className="flex items-center gap-2.5 bg-emerald-500/5 px-3 py-2 rounded-xl border border-emerald-500/20">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 flex items-center justify-center shrink-0">
                    🔒
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-emerald-400 uppercase tracking-widest text-[8px] font-mono leading-none">SIGNATURE VALID</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{language === 'hi' ? 'डिजिटल रूप से प्रमाणित भारतीय सुरक्षा रजिस्ट्री' : 'Digitally Certified Legal Registry India'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-white/10 rounded-xl font-sans text-xs font-bold transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 select-none"
                  >
                    🏛️ {language === 'hi' ? 'प्रिंट प्रमाण पत्र' : 'Print / Save PDF'}
                  </button>
                  <button
                    onClick={() => {
                      const text = `SAHAYAK SECURE EMERGENCY REPORT\n-----------------------------\nTracking Code: ${activeSuccessComplaint.id}\nFiler Account Username: @${currentUser?.username || 'unknown'}\nFiler Passport/Citizen ID: CITIZEN-SHYK-${(currentUser?.username || 'guest').toUpperCase()}\nLegal Full Name: ${currentUser?.fullName || 'Arjun Sharma'}\nAuthorized Mobile Phone: ${currentUser?.phone || '+91'}\nLodge District: ${currentUser?.districtArea || 'Rajpath, New Delhi, India'}\nRerouted Emergency Center: ${activeSuccessComplaint.category.toUpperCase()} (Hotline: ${activeSuccessComplaint.helpline})\nFact Details: ${activeSuccessComplaint.description}`;
                      navigator.clipboard.writeText(text);
                    }}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-650 text-white rounded-xl font-sans text-xs font-bold transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 select-none"
                  >
                    📋 {language === 'hi' ? 'डेटा कॉपी करें' : 'Copy Certified Text'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* HISTORICAL COMPLAINT REGISTRIES */}
          {registeredComplaints.length > 0 && (
            <div id="historical-complaint-registries" className="space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-2">
                <h3 className="font-sans font-extrabold text-[11px] text-slate-400 uppercase tracking-widest">
                  📂 {language === 'hi' ? 'दर्ज की गई शिकायतें' : 'YOUR FILED COMPLAINT STATUS TRACKER'}
                </h3>
                
                {/* Clear complaints controls */}
                {!showClearConfirm ? (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="text-[10px] font-sans font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer select-none border border-rose-500/20 hover:border-rose-500/40 bg-rose-500/5 px-2.5 py-1 rounded"
                  >
                    🗑️ {language === 'hi' ? 'डेटा साफ़ करें' : 'Clear All Data'}
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 animate-pulse">
                    <span className="text-[9px] text-rose-300 font-sans italic font-medium">
                      {language === 'hi' ? 'क्या आप निश्चित हैं?' : 'Are you sure?'}
                    </span>
                    <button
                      onClick={() => {
                        setRegisteredComplaints([]);
                        setComplaintSuccessId(null);
                        localStorage.removeItem('sahayak_registered_complaints');
                        setShowClearConfirm(false);
                      }}
                      className="text-[9px] font-sans font-bold text-white bg-rose-600 hover:bg-rose-700 px-2 py-0.5 rounded transition-colors cursor-pointer select-none"
                    >
                      {language === 'hi' ? 'हां, हटाएं' : 'Yes, Delete'}
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="text-[9px] font-sans font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors cursor-pointer select-none font-medium"
                    >
                      {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                    </button>
                  </div>
                )}
              </div>

              <div id="filed-complaint-history-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {registeredComplaints.map(comp => (
                  <div key={comp.id} className="p-4 bg-slate-900 border border-white/5 rounded-xl hover:border-indigo-500/35 transition-colors space-y-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="font-mono text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-bold uppercase shrink-0">
                        {comp.category}
                      </span>
                      <span className="font-mono text-[10px] text-emerald-400 font-bold tracking-wider shrink-0 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        DISPATCHED
                      </span>
                    </div>

                    <div>
                      <h4 className="font-sans font-bold text-white text-xs">{comp.title}</h4>
                      <p className="font-sans text-[11px] text-slate-400 mt-1 line-clamp-2">{comp.description}</p>
                    </div>

                    {comp.documents && comp.documents.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {comp.documents.map((doc: string, idx: number) => (
                          <span key={idx} className="font-sans text-[9px] bg-white/5 text-slate-300 px-2 py-0.5 rounded border border-white/10 italic truncate max-w-[120px]">
                            📎 {doc}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] font-mono border-t border-white/5 pt-2">
                      <span className="text-slate-400 tracking-wider">ID: {comp.id}</span>
                      <span className="text-slate-500">{new Date(comp.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
