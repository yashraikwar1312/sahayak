export type Language = 'en' | 'hi';

export type EmergencyCategory =
  | 'cyber'
  | 'medical'
  | 'women'
  | 'police'
  | 'lost'
  | 'fire'
  | 'disaster'
  | 'legal';

export interface Message {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  textHindi?: string;
  timestamp: Date;
  isQuickAdvice?: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface MedicalProfile {
  fullName: string;
  bloodType: string;
  allergies: string;
  medications: string;
  emergencyNotes: string;
}

export interface HelplineItem {
  id: string;
  nameEn: string;
  nameHi: string;
  number: string;
  category: EmergencyCategory | 'general';
  descriptionEn: string;
  descriptionHi: string;
}

export interface ActiveCallState {
  active: boolean;
  number: string;
  name: string;
  status: 'dialing' | 'connected' | 'completed' | 'failed';
  duration: number;
  responderSpeech?: string;
}
