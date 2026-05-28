import React, { useState } from 'react';
import { X, ShieldAlert, UserPlus, LogIn, Sparkles, UserCheck, AlertTriangle } from 'lucide-react';
import type { Language, MedicalProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onAuthSuccess: (userProfile: any) => void;
}

export default function AuthModal({ isOpen, onClose, language, onAuthSuccess }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [guestMode, setGuestMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sign up Form states
  const [signupForm, setSignupForm] = useState({
    username: '',
    password: '',
    fullName: '',
    phone: '',
    districtArea: '',
    bloodType: 'O+',
    allergies: '',
    medications: '',
    emergencyNotes: ''
  });

  // Sign in Form states
  const [signinForm, setSigninForm] = useState({
    username: '',
    password: ''
  });

  if (!isOpen) return null;

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!signupForm.username.trim() || !signupForm.password.trim() || !signupForm.fullName.trim() || !signupForm.districtArea.trim()) {
      setErrorMsg(language === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड (यूज़रनेम, पासवर्ड, नाम, क्षेत्र) भरें।' : 'Please fill all required fields (username, password, full name, area).');
      return;
    }

    // Save user to localStorage
    const existingUsers = JSON.parse(localStorage.getItem('sahayak_users') || '[]');
    const userExists = existingUsers.some((u: any) => u.username.toLowerCase() === signupForm.username.toLowerCase());

    if (userExists) {
      setErrorMsg(language === 'hi' ? 'यह यूज़रनेम पहले से मौजूद है।' : 'Username already exists.');
      return;
    }

    const newUser = {
      ...signupForm,
      isRegistered: true,
      createdAt: new Date().toISOString()
    };

    existingUsers.push(newUser);
    localStorage.setItem('sahayak_users', JSON.stringify(existingUsers));
    localStorage.setItem('sahayak_current_user', JSON.stringify(newUser));

    setSuccessMsg(language === 'hi' ? 'खाता सफलतापूर्वक बनाया गया!' : 'Account successfully created!');
    
    setTimeout(() => {
      onAuthSuccess(newUser);
      onClose();
    }, 1200);
  };

  const handleSigninSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!signinForm.username.trim() || !signinForm.password.trim()) {
      setErrorMsg(language === 'hi' ? 'कृपया यूज़रनेम और पासवर्ड दर्ज करें।' : 'Please enter your username and password.');
      return;
    }

    const existingUsers = JSON.parse(localStorage.getItem('sahayak_users') || '[]');
    const user = existingUsers.find((u: any) => u.username.toLowerCase() === signinForm.username.toLowerCase() && u.password === signinForm.password);

    if (!user) {
      setErrorMsg(language === 'hi' ? 'गलत यूज़रनेम या पासवर्ड।' : 'Invalid username or password.');
      return;
    }

    localStorage.setItem('sahayak_current_user', JSON.stringify(user));
    setSuccessMsg(language === 'hi' ? 'सफलतापूर्वक साइन-इन किया गया!' : 'Successfully signed in!');

    setTimeout(() => {
      onAuthSuccess(user);
      onClose();
    }, 1200);
  };

  const handleContinueAsGuest = () => {
    const guestUser = {
      username: 'Guest User',
      fullName: 'Anonymous Guest',
      districtArea: signupForm.districtArea.trim() || 'General Location',
      bloodType: '',
      allergies: '',
      medications: '',
      emergencyNotes: 'Using app in Guest/Secret mode without explicit logging.',
      isRegistered: false
    };

    localStorage.setItem('sahayak_current_user', JSON.stringify(guestUser));
    onAuthSuccess(guestUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900/90 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        
        {/* Top-Right Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-500 items-center justify-center text-white mb-2 shadow-lg animate-pulse">
            <ShieldAlert size={26} />
          </div>
          <h2 className="font-sans font-black text-xl md:text-2xl text-white tracking-tight uppercase">
            {language === 'hi' ? 'सुरक्षित आपातकालीन खाता' : 'Secure Emergency Profile'}
          </h2>
          <p className="font-sans text-xs text-white/60 max-w-sm mx-auto">
            {language === 'hi'
              ? 'अपना खाता सुरक्षित करें ताकि आपातकाल के समय एआई आपका नाम, स्थान और महत्वपूर्ण मेडिकल पहचान तुरंत जान सके।'
              : 'Add your identity so the chatbot instantly recognizes your name, area, and medical ID in crisis situations.'}
          </p>
        </div>

        {/* Tab Toggle Switchers */}
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-5">
          <button
            onClick={() => { setAuthMode('signup'); setErrorMsg(''); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-sans font-bold transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'signup' ? 'bg-indigo-500 text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            <UserPlus size={13} />
            <span>{language === 'hi' ? 'साइन-अप / नया खाता' : 'Sign-up / Create'}</span>
          </button>
          <button
            onClick={() => { setAuthMode('signin'); setErrorMsg(''); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-sans font-bold transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'signin' ? 'bg-indigo-500 text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            <LogIn size={13} />
            <span>{language === 'hi' ? 'साइन-इन / लॉगिन' : 'Sign-in / Login'}</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 font-sans text-xs flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0 animate-bounce" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 font-sans text-xs flex items-center gap-2">
            <UserCheck size={14} className="shrink-0 animate-pulse" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Signup Mode Frame */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-sans text-[11px] text-white/50 block font-bold uppercase tracking-wide">
                  {language === 'hi' ? 'यूज़रनेम *' : 'Username (Unique) *'}
                </label>
                <input
                  type="text"
                  required
                  value={signupForm.username}
                  onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                  placeholder="e.g. arjun_sharma"
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2 text-white font-sans text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-sans text-[11px] text-white/50 block font-bold uppercase tracking-wide">
                  {language === 'hi' ? 'पासवर्ड / पिन *' : 'Password / Pin *'}
                </label>
                <input
                  type="password"
                  required
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  placeholder="••••"
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2 text-white font-sans text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-sans text-[11px] text-white/50 block font-bold uppercase tracking-wide">
                  {language === 'hi' ? 'पूरा नाम *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={signupForm.fullName}
                  onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                  placeholder="Arjun Sharma"
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2 text-white font-sans text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-sans text-[11px] text-white/50 block font-bold uppercase tracking-wide">
                  {language === 'hi' ? 'मोबाइल नंबर' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  value={signupForm.phone}
                  onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2 text-white font-sans text-xs outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-sans text-[11px] text-white/50 block font-bold uppercase tracking-wide">
                  {language === 'hi' ? 'स्थानीय क्षेत्र / जिला / शहर *' : 'District Area / Local Area *'}
                </label>
                <input
                  type="text"
                  required
                  value={signupForm.districtArea}
                  onChange={(e) => setSignupForm({ ...signupForm, districtArea: e.target.value })}
                  placeholder="Rajpath, New Delhi, India"
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2 text-white font-sans text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-sans text-[11px] text-white/50 block font-bold uppercase tracking-wide">
                  {language === 'hi' ? 'रक्त समूह (Blood Group)' : 'Blood Group'}
                </label>
                <select
                  value={signupForm.bloodType}
                  onChange={(e) => setSignupForm({ ...signupForm, bloodType: e.target.value })}
                  className="w-full bg-slate-850 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2 text-white font-sans text-xs outline-none"
                >
                  {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(b => (
                    <option key={b} value={b} className="bg-slate-900">{b}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-sans text-[11px] text-white/50 block font-bold uppercase tracking-wide">
                  {language === 'hi' ? 'एलर्जी (Allergies)' : 'Medical Allergies'}
                </label>
                <input
                  type="text"
                  value={signupForm.allergies}
                  onChange={(e) => setSignupForm({ ...signupForm, allergies: e.target.value })}
                  placeholder="e.g. Penicillin, Asthma"
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2 text-white font-sans text-xs outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-sans font-bold rounded-xl transition-all uppercase flex items-center justify-center gap-2 mt-5 shadow-lg active:scale-98 cursor-pointer"
            >
              <Sparkles size={14} className="animate-pulse" />
              <span>{language === 'hi' ? 'खाता बनाएं' : 'Create Account'}</span>
            </button>
          </form>
        )}

        {/* Signin Mode Frame */}
        {authMode === 'signin' && (
          <form onSubmit={handleSigninSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="font-sans text-[11px] text-white/50 block font-bold uppercase tracking-wide">
                {language === 'hi' ? 'यूज़रनेम' : 'Username'}
              </label>
              <input
                type="text"
                required
                value={signinForm.username}
                onChange={(e) => setSigninForm({ ...signinForm, username: e.target.value })}
                placeholder="Declare user identity name"
                className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2 text-white font-sans text-xs outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-sans text-[11px] text-white/50 block font-bold uppercase tracking-wide">
                {language === 'hi' ? 'पासवर्ड' : 'Password'}
              </label>
              <input
                type="password"
                required
                value={signinForm.password}
                onChange={(e) => setSigninForm({ ...signinForm, password: e.target.value })}
                placeholder="••••"
                className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2 text-white font-sans text-xs outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-sans font-bold rounded-xl transition-all uppercase flex items-center justify-center gap-2 mt-5 shadow-lg active:scale-98 cursor-pointer"
            >
              <LogIn size={14} />
              <span>{language === 'hi' ? 'साइन-इन करें' : 'Sign-in Account'}</span>
            </button>
          </form>
        )}

        {/* Guest Mode Section / Divider */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-4 text-white/30 text-[10px] uppercase font-mono tracking-widest">{language === 'hi' ? 'या' : 'or'}</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <button
          onClick={handleContinueAsGuest}
          className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-sans font-bold rounded-xl transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {language === 'hi' ? 'अतिथि के रूप में उपयोग करें (बिना अकाउंट)' : 'Use as Guest (No Registration)'}
        </button>

      </div>
    </div>
  );
}
