import React, { useState } from 'react';
import { User, Shield, Volume2, Plus, Trash2, Save, Sparkles, Sliders, Contact, Check } from 'lucide-react';
import { ShakePermissionButton } from '../../hooks/useShakeToSOS';
import type { EmergencyContact, Language, MedicalProfile } from '../types';

interface SettingsPanelProps {
  language: Language;
  onLanguageToggle: () => void;
  medicalProfile: MedicalProfile;
  onUpdateMedicalProfile: (profile: MedicalProfile) => void;
  emergencyContacts: EmergencyContact[];
  onAddContact: (contact: EmergencyContact) => void;
  onDeleteContact: (id: string) => void;
  mockSignalStrength: string;
  onUpdateMockSignal: (strength: string) => void;
}

export default function SettingsPanel({
  language,
  onLanguageToggle,
  medicalProfile,
  onUpdateMedicalProfile,
  emergencyContacts,
  onAddContact,
  onDeleteContact,
  mockSignalStrength,
  onUpdateMockSignal,
}: SettingsPanelProps) {
  const [profileForm, setProfileForm] = useState<MedicalProfile>({ ...medicalProfile });
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '' });
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMedicalProfile(profileForm);
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 2500);
  };

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name.trim() || !newContact.phone.trim()) return;
    
    onAddContact({
      id: `cont-${Date.now()}`,
      name: newContact.name.trim(),
      phone: newContact.phone.trim(),
      relationship: newContact.relationship.trim() || 'General',
    });
    setNewContact({ name: '', phone: '', relationship: '' });
  };

  return (
    <div id="settings-pane" className="space-y-8 pb-12 animate-fade-in">
      <div className="flex flex-col gap-4">
        <h2 className="font-sans font-extrabold text-2xl text-on-surface tracking-tight">
          {language === 'hi' ? 'सुरक्षा सेटिंग्स और प्रोफाइल' : 'Security Settings & Rescue IDs'}
        </h2>
        <p className="font-sans text-xs text-on-surface-variant/80 -mt-2">
          {language === 'hi' ? 'एसओएस अलर्ट प्रतिक्रिया और अनुकूलित एआई परामर्श के लिए डेटा स्थानीय रूप से सहेजा गया है।' : 'Configure secure local data files for prompt SOS dispatch and tailored AI advisory responses.'}
        </p>
      </div>

      {/* Adaptive responsive panel layout for PC and Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left column: Setup Preferences & Medical Identity */}
        <div className="space-y-6">
          {/* Language Quick Switcher */}
          <div className="glass-card rounded-xl p-5 border border-white/5 bg-surface-container-low/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sliders size={18} className="text-secondary" />
                <div>
                  <h3 className="font-sans font-bold text-on-surface text-sm">
                    {language === 'hi' ? 'प्राथमिक प्रदर्शन भाषा' : 'Primary Interface Language'}
                  </h3>
                  <p className="font-sans text-xs text-on-surface-variant/70 mt-0.5">
                    {language === 'hi' ? 'देवनागरी हिंदी या अंग्रेजी भाषा के बीच स्विच करें।' : 'Switch between Devanagari Hindi or English interface.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onLanguageToggle}
                className="px-4 py-2 rounded-xl bg-primary-container hover:bg-primary font-sans text-xs font-bold text-white transition-all cursor-pointer"
              >
                {language === 'en' ? 'ENGLISH' : 'हिंदी (HINDI)'}
              </button>
            </div>

            {/* iOS Shake permission bootstrap (shows only when needed) */}
            <div className="pt-4">
              <ShakePermissionButton
                label={language === 'hi' ? 'शेक-SOS सक्षम करें' : 'Enable Shake-to-SOS'}
                className="mt-2"
              />
            </div>
          </div>

          {/* Medical ID card form */}
          <div className="glass-card rounded-xl p-5 border border-white/5 bg-surface-container-low/20">
            <div className="flex items-center gap-3 mb-4">
              <User size={18} className="text-primary" />
              <h3 className="font-sans font-bold text-on-surface text-sm">
                {language === 'hi' ? 'आपातकालीन चिकित्सा आईडी कार्ड (Medical ID)' : 'Emergency Medical Profile ID'}
              </h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-sans text-xs text-on-surface-variant/70 font-semibold block">Full Name</label>
                  <input
                    type="text"
                    className="w-full bg-surface border border-white/5 rounded-xl px-3 py-2 text-white font-sans text-xs outline-none focus:border-primary focus:ring-0 shadow-inner"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    placeholder="Declare patient name"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="font-sans text-xs text-on-surface-variant/70 font-semibold block">Blood Type</label>
                  <select
                    className="w-full bg-surface border border-white/5 rounded-xl px-3 py-2 text-white font-sans text-xs outline-none focus:border-primary focus:ring-0 shadow-inner"
                    value={profileForm.bloodType}
                    onChange={(e) => setProfileForm({ ...profileForm, bloodType: e.target.value })}
                  >
                    <option value="">Choose blood group</option>
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-sans text-xs text-on-surface-variant/70 font-semibold block">Medical Allergies</label>
                  <input
                    type="text"
                    className="w-full bg-surface border border-white/5 rounded-xl px-3 py-2 text-white font-sans text-xs outline-none focus:border-primary focus:ring-0 shadow-inner"
                    value={profileForm.allergies}
                    onChange={(e) => setProfileForm({ ...profileForm, allergies: e.target.value })}
                    placeholder="Penicillin, Peanuts, Asthma flags..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-sans text-xs text-on-surface-variant/70 font-semibold block">Active Medications</label>
                  <input
                    type="text"
                    className="w-full bg-surface border border-white/5 rounded-xl px-3 py-2 text-white font-sans text-xs outline-none focus:border-primary focus:ring-0 shadow-inner"
                    value={profileForm.medications}
                    onChange={(e) => setProfileForm({ ...profileForm, medications: e.target.value })}
                    placeholder="Insulin, Aspirin, Beta Blockers..."
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-sans text-xs text-on-surface-variant/70 font-semibold block">Emergency Rescue Notes / Directives</label>
                  <textarea
                    className="w-full bg-surface border border-white/5 rounded-xl px-3 py-2 h-20 text-white font-sans text-xs outline-none focus:border-primary focus:ring-0 shadow-inner resize-none"
                    value={profileForm.emergencyNotes}
                    onChange={(e) => setProfileForm({ ...profileForm, emergencyNotes: e.target.value })}
                    placeholder="Add critical rescue instructions (e.g. Diabetic, cardiac pacemaker, asthma inhaler in backpack)."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  id="save-profile-btn"
                  type="submit"
                  className="px-5 py-2.5 bg-primary-container hover:bg-primary rounded-xl font-sans text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow"
                >
                  {profileSaveSuccess ? <Check size={14} className="text-secondary" /> : <Save size={14} />}
                  <span>{profileSaveSuccess ? (language === 'hi' ? 'स्थानीय डेटा सहेजा गया' : 'Securely Saved Profile') : (language === 'hi' ? 'प्रोफ़ाइल सहेजें' : 'Save Medical ID Profile')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right column: Emergency contacts SMS Broadcast & Mock simulator controls */}
        <div className="space-y-6">
          {/* Emergency Contacts card manager */}
          <div className="glass-card rounded-xl p-5 border border-white/5 bg-surface-container-low/20">
            <div className="flex items-center gap-3 mb-4">
              <Contact size={18} className="text-pink-400" />
              <h3 className="font-sans font-bold text-on-surface text-sm">
                {language === 'hi' ? 'भरोसेमंद आपातकालीन संपर्क (Contacts)' : 'Trusted Rescue Contacts (SMS Broadcast)'}
              </h3>
            </div>

            {/* Form add */}
            <form onSubmit={handleCreateContact} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <input
                type="text"
                className="bg-surface border border-white/5 rounded-xl px-3 py-2 text-white font-sans text-xs outline-none focus:border-primary shadow-inner"
                placeholder="Contact Name"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              />
              <input
                type="tel"
                className="bg-surface border border-white/5 rounded-xl px-3 py-2 text-white font-sans text-xs outline-none focus:border-primary shadow-inner"
                placeholder="Mobile Phone"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              />
              <div className="flex gap-2.5">
                <input
                  type="text"
                  className="flex-1 bg-surface border border-white/5 rounded-xl px-3 py-2 text-white font-sans text-xs outline-none focus:border-primary shadow-inner"
                  placeholder="Relation"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                />
                <button
                  id="add-contact-btn"
                  type="submit"
                  className="w-10 h-10 bg-primary-container text-white rounded-xl flex items-center justify-center shrink-0 hover:bg-primary shadow hover:scale-105 active:scale-95 duration-100 cursor-pointer"
                >
                  <Plus size={16} />
                </button>
              </div>
            </form>

            {/* Render contacts */}
            <div className="space-y-2.5">
              {emergencyContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface border border-white/5 hover:border-white/10"
                >
                  <div className="min-w-0">
                    <span className="font-sans font-bold text-xs text-white block">
                      {contact.name}
                    </span>
                    <span className="font-mono text-[10px] text-on-surface-variant/70 mt-1 inline-block">
                      {contact.phone} • {contact.relationship}
                    </span>
                  </div>
                  <button
                    id={`del-contact-${contact.id}`}
                    type="button"
                    onClick={() => onDeleteContact(contact.id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg hover:text-red-300 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              {emergencyContacts.length === 0 && (
                <div className="text-center py-6 border border-dashed border-white/10 rounded-xl bg-black/5">
                  <p className="font-sans text-xs text-on-surface-variant/60">
                    {language === 'hi' ? 'कोई आपातकालीन संपर्क नहीं जोड़ा गया।' : 'No rescue contacts saved yet. SOS alerts default to emergency services.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Mock Environment Custom Simulation parameters */}
          <div className="glass-card rounded-xl p-5 border border-white/5 bg-surface-container-low/20">
            <div className="flex items-center gap-3 mb-4">
              <Sliders size={18} className="text-secondary" />
              <h3 className="font-sans font-bold text-on-surface text-sm">
                {language === 'hi' ? 'सिमुलेशन वातावरण नियंत्रण' : 'Tactical Simulation Controls'}
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex sm:items-center justify-between flex-col sm:flex-row gap-2.5">
                <div>
                  <p className="font-sans text-xs font-bold text-on-surface">Mock Cellular Coverage Link</p>
                  <p className="font-sans text-[10px] text-on-surface-variant/70">Simulates satellite/underground network fallback states.</p>
                </div>

                <select
                  value={mockSignalStrength}
                  onChange={(e) => onUpdateMockSignal(e.target.value)}
                  className="bg-surface border border-white/5 rounded-xl px-3 py-1.5 text-white font-sans text-xs outline-none focus:border-secondary shadow-inner max-w-xs cursor-pointer"
                >
                  <option value="94% Safe • GPS Locked">Standard High-Gain GPS Locked</option>
                  <option value="92% Safe • Signal Weak">Deep Tunnel - Weak Signal Mode</option>
                  <option value="96% Safe • Triple Band Satcom">Isolated Zone - Active Satcom Backup</option>
                  <option value="98% Safe • Military Guard Encrypted">Secured Tactical Escort Active</option>
                </select>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
