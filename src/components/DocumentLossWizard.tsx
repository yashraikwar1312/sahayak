import React, { useState } from 'react';
import {
  FileX,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Phone,
  MapPin,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Globe,
  Building2,
  Search,
  RefreshCw,
  X,
} from 'lucide-react';
import type { Language } from '../types';

interface DocumentLossWizardProps {
  language: Language;
}

type DocType = 'aadhaar' | 'pan' | 'passport' | 'driving_licence' | 'voter_id';

interface NearbyOffice {
  name: string;
  nameHi: string;
  address: string;
  addressHi: string;
  city: string;
  phone?: string;
  timings: string;
}

interface DocInfo {
  id: DocType;
  label: string;
  labelHi: string;
  emoji: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  description: string;
  descriptionHi: string;
  portal: string;
  portalLabel: string;
  helpline: string;
  helplineLabel: string;
  helplineHi: string;
  altHelpline?: string;
  altHelplineLabel?: string;
  steps: string[];
  stepsHi: string[];
  docsNeeded: string[];
  docsNeededHi: string[];
  feeInfo: string;
  feeInfoHi: string;
  timeframe: string;
  timeframeHi: string;
  tipEn: string;
  tipHi: string;
  nearbyOffices: NearbyOffice[];
}

const DOCUMENTS: DocInfo[] = [
  {
    id: 'aadhaar',
    label: 'Aadhaar Card',
    labelHi: 'आधार कार्ड',
    emoji: '🪪',
    color: '#f59e0b',
    bgGradient: 'from-amber-500/15 to-orange-500/10',
    borderColor: 'border-amber-500/30',
    description: 'Unique Identification Authority of India',
    descriptionHi: 'भारतीय विशिष्ट पहचान प्राधिकरण',
    portal: 'https://myaadhaar.uidai.gov.in',
    portalLabel: 'myaadhaar.uidai.gov.in',
    helpline: '1947',
    helplineLabel: 'UIDAI Helpline: 1947',
    helplineHi: 'यूआईडीएआई हेल्पलाइन: 1947',
    steps: [
      'Lodge a police complaint (FIR or NCR) at your nearest police station immediately',
      'Visit myaadhaar.uidai.gov.in and log in using your Aadhaar number + OTP',
      'Select "Order Aadhaar Reprint" — costs ₹50 + postage',
      'Alternatively, download the e-Aadhaar (PDF) completely free from the portal',
      'For biometric updates or physical card, visit the nearest Aadhaar Seva Kendra',
      'Carry police complaint copy when using the e-Aadhaar as identity proof',
    ],
    stepsHi: [
      'तुरंत नजदीकी थाने में एफआईआर/एनसीआर दर्ज करें',
      'myaadhaar.uidai.gov.in पर आधार नंबर + ओटीपी से लॉगिन करें',
      '"आधार रिप्रिंट ऑर्डर" चुनें — ₹50 + डाक शुल्क लगेगा',
      'पोर्टल से मुफ्त में ई-आधार (PDF) डाउनलोड करें',
      'बायोमेट्रिक अपडेट के लिए नजदीकी आधार सेवा केंद्र जाएं',
      'पहचान प्रमाण के रूप में ई-आधार उपयोग करते समय पुलिस शिकायत की कॉपी साथ रखें',
    ],
    docsNeeded: ['Police FIR / NCR copy', 'Aadhaar number (if known)', 'Mobile number linked to Aadhaar', 'Alternate ID proof (optional)'],
    docsNeededHi: ['पुलिस एफआईआर/एनसीआर की कॉपी', 'आधार नंबर (यदि याद हो)', 'आधार से लिंक मोबाइल नंबर', 'वैकल्पिक पहचान प्रमाण'],
    feeInfo: 'Reprint: ₹50 + GST | e-Aadhaar download: FREE',
    feeInfoHi: 'रिप्रिंट: ₹50 + जीएसटी | ई-आधार डाउनलोड: मुफ्त',
    timeframe: 'e-Aadhaar: Instant | Physical card: 5–10 working days',
    timeframeHi: 'ई-आधार: तुरंत | भौतिक कार्ड: 5–10 कार्य दिवस',
    tipEn: 'Your e-Aadhaar is equally valid as the physical card. Download it first — it takes 2 minutes.',
    tipHi: 'ई-आधार भौतिक कार्ड के समान मान्य है। पहले उसे डाउनलोड करें — इसमें केवल 2 मिनट लगते हैं।',
    nearbyOffices: [
      { name: 'Aadhaar Seva Kendra – Saugor', nameHi: 'आधार सेवा केंद्र – सागर', address: 'District Collectorate Campus, Saugor', addressHi: 'जिला कलेक्टर परिसर, सागर', city: 'Saugor', phone: '07582-226001', timings: 'Mon–Sat 10am–5pm' },
      { name: 'Common Service Centre, Saugor', nameHi: 'कॉमन सर्विस सेंटर, सागर', address: 'Near Bus Stand, Civil Lines, Saugor', addressHi: 'बस स्टैंड के पास, सिविल लाइंस, सागर', city: 'Saugor', timings: 'Mon–Sat 9am–6pm' },
      { name: 'Aadhaar Seva Kendra – Jabalpur', nameHi: 'आधार सेवा केंद्र – जबलपुर', address: 'RNT Marg, Collectorate Compound, Jabalpur', addressHi: 'आरएनटी मार्ग, कलेक्टर परिसर, जबलपुर', city: 'Jabalpur', phone: '0761-2622111', timings: 'Mon–Sat 10am–5pm' },
    ],
  },
  {
    id: 'pan',
    label: 'PAN Card',
    labelHi: 'पैन कार्ड',
    emoji: '💳',
    color: '#3b82f6',
    bgGradient: 'from-blue-500/15 to-cyan-500/10',
    borderColor: 'border-blue-500/30',
    description: 'Income Tax Department, Govt. of India',
    descriptionHi: 'आयकर विभाग, भारत सरकार',
    portal: 'https://www.tin-nsdl.com',
    portalLabel: 'tin-nsdl.com (NSDL) / onlineservices.nsdl.com',
    helpline: '020-27218080',
    helplineLabel: 'NSDL Helpline: 020-27218080',
    helplineHi: 'एनएसडीएल हेल्पलाइन: 020-27218080',
    altHelpline: '1800-180-1961',
    altHelplineLabel: 'Protean (UTITSL): 1800-180-1961',
    steps: [
      'File a police complaint (FIR/NCR) at the nearest police station',
      'Visit NSDL portal: onlineservices.nsdl.com and select "Reprint of PAN Card"',
      'Fill Form 49A (for new application) or use Reprint request (if PAN number known)',
      'Upload scanned copies of identity & address proof',
      'Pay ₹110 (within India) or ₹1,020 (outside India) online',
      'PAN card will be dispatched to your registered address in 15–20 working days',
      'Alternatively apply via UTIITSL portal at utiitsl.com',
    ],
    stepsHi: [
      'नजदीकी थाने में एफआईआर/एनसीआर दर्ज करें',
      'NSDL पोर्टल: onlineservices.nsdl.com पर "पैन कार्ड रिप्रिंट" चुनें',
      'नए आवेदन के लिए फॉर्म 49A या पैन नंबर ज्ञात होने पर रिप्रिंट अनुरोध भरें',
      'पहचान और पते का प्रमाण अपलोड करें',
      '₹110 (भारत में) ऑनलाइन भुगतान करें',
      'पैन कार्ड 15–20 कार्य दिवसों में पंजीकृत पते पर भेजा जाएगा',
      'वैकल्पिक: UTIITSL पोर्टल utiitsl.com पर भी आवेदन करें',
    ],
    docsNeeded: ['Police FIR copy', 'Proof of identity (Aadhaar / Voter ID / Passport)', 'Proof of address', 'Date of birth proof', 'Passport-size photograph', 'PAN number (if known)'],
    docsNeededHi: ['पुलिस एफआईआर की कॉपी', 'पहचान प्रमाण (आधार/वोटर आईडी/पासपोर्ट)', 'पते का प्रमाण', 'जन्म तिथि प्रमाण', 'पासपोर्ट साइज फोटो', 'पैन नंबर (यदि ज्ञात हो)'],
    feeInfo: '₹110 (within India) | ₹1,020 (foreign address)',
    feeInfoHi: '₹110 (भारत के भीतर) | ₹1,020 (विदेशी पता)',
    timeframe: '15–20 working days after application',
    timeframeHi: 'आवेदन के बाद 15–20 कार्य दिवस',
    tipEn: 'Your PAN number is often on old ITR receipts, Form 16, or bank statements. Find it first to speed up the process.',
    tipHi: 'आपका पैन नंबर अक्सर पुरानी आयकर रसीदें, फॉर्म 16 या बैंक स्टेटमेंट पर होता है। इसे पहले ढूंढें।',
    nearbyOffices: [
      { name: 'NSDL PAN Centre – Saugor', nameHi: 'एनएसडीएल पैन केंद्र – सागर', address: 'Near District Court, Saugor, MP', addressHi: 'जिला न्यायालय के पास, सागर, म.प्र.', city: 'Saugor', timings: 'Mon–Fri 10am–5pm' },
      { name: 'UTIITSL PAN Centre – Jabalpur', nameHi: 'यूटीआईआईटीएसएल पैन केंद्र – जबलपुर', address: '1476 Napier Town, Jabalpur', addressHi: '1476, नेपियर टाउन, जबलपुर', city: 'Jabalpur', phone: '0761-4003535', timings: 'Mon–Fri 10am–5pm' },
      { name: 'Income Tax Office – Jabalpur', nameHi: 'आयकर कार्यालय – जबलपुर', address: 'Harsh Nagar, Jabalpur, MP 482002', addressHi: 'हर्ष नगर, जबलपुर, म.प्र. 482002', city: 'Jabalpur', phone: '0761-2671444', timings: 'Mon–Fri 10am–5pm' },
    ],
  },
  {
    id: 'passport',
    label: 'Passport',
    labelHi: 'पासपोर्ट',
    emoji: '🛂',
    color: '#8b5cf6',
    bgGradient: 'from-violet-500/15 to-purple-500/10',
    borderColor: 'border-violet-500/30',
    description: 'Ministry of External Affairs, Govt. of India',
    descriptionHi: 'विदेश मंत्रालय, भारत सरकार',
    portal: 'https://passportindia.gov.in',
    portalLabel: 'passportindia.gov.in',
    helpline: '1800-258-1800',
    helplineLabel: 'Passport Seva Helpline: 1800-258-1800',
    helplineHi: 'पासपोर्ट सेवा हेल्पलाइन: 1800-258-1800',
    steps: [
      'IMMEDIATELY report to the nearest police station and obtain an FIR — this is mandatory for passport replacement',
      'If lost abroad, report to the local police AND the nearest Indian Embassy/Consulate for an Emergency Certificate',
      'Register/login on passportindia.gov.in (Passport Seva portal)',
      'Apply for "Re-issue of Passport" — select "Lost/Damaged Passport" as reason',
      'Book an appointment at the nearest Passport Seva Kendra (PSK) or POPSK',
      'Carry original FIR, old passport number (if known), and all required documents to the appointment',
      'Pay the applicable fee online (₹1,500 for normal, ₹3,500 for Tatkaal)',
    ],
    stepsHi: [
      'तुरंत नजदीकी थाने में जाएं और एफआईआर दर्ज करें — पासपोर्ट बदलवाने के लिए यह अनिवार्य है',
      'विदेश में खोने पर स्थानीय पुलिस और नजदीकी भारतीय दूतावास/कॉन्सुलेट को सूचित करें',
      'passportindia.gov.in पर लॉगिन करें',
      '"पासपोर्ट री-इशू" के लिए आवेदन करें — कारण में "खोया/क्षतिग्रस्त" चुनें',
      'नजदीकी पासपोर्ट सेवा केंद्र (PSK/POPSK) में अपॉइंटमेंट बुक करें',
      'अपॉइंटमेंट पर मूल एफआईआर और सभी आवश्यक दस्तावेज लेकर जाएं',
      '₹1,500 (सामान्य) या ₹3,500 (तत्काल) शुल्क ऑनलाइन जमा करें',
    ],
    docsNeeded: ['Police FIR (mandatory)', 'Proof of address (Aadhaar/utility bill)', 'Proof of date of birth', '2 passport-size photos', 'Old passport number (if available)', 'Annexure F (self-declaration for lost passport)'],
    docsNeededHi: ['पुलिस एफआईआर (अनिवार्य)', 'पते का प्रमाण (आधार/बिजली बिल)', 'जन्म तिथि प्रमाण', '2 पासपोर्ट साइज फोटो', 'पुराना पासपोर्ट नंबर (यदि उपलब्ध हो)', 'अनुबंध F (खोए पासपोर्ट के लिए स्व-घोषणा)'],
    feeInfo: 'Normal: ₹1,500 | Tatkaal: ₹3,500 (additional)',
    feeInfoHi: 'सामान्य: ₹1,500 | तत्काल: ₹3,500 (अतिरिक्त)',
    timeframe: 'Normal: 4–7 weeks | Tatkaal: 1–3 working days',
    timeframeHi: 'सामान्य: 4–7 सप्ताह | तत्काल: 1–3 कार्य दिवस',
    tipEn: 'File the FIR before anything else — without it, your passport re-issue application will be rejected.',
    tipHi: 'सबसे पहले एफआईआर दर्ज करें — इसके बिना पासपोर्ट री-इशू आवेदन अस्वीकार हो जाएगा।',
    nearbyOffices: [
      { name: 'Passport Seva Kendra – Jabalpur', nameHi: 'पासपोर्ट सेवा केंद्र – जबलपुर', address: '2nd Floor, Kalchuri Residency, Tilhari, Jabalpur 482021', addressHi: '2nd फ्लोर, कल्चुरी रेजीडेंसी, तिलहरी, जबलपुर 482021', city: 'Jabalpur', phone: '1800-258-1800', timings: 'Mon–Fri 9am–5pm (by appointment)' },
      { name: 'Post Office PSK – Saugor', nameHi: 'पोस्ट ऑफिस पीएसके – सागर', address: 'Head Post Office, Saugor, MP', addressHi: 'प्रधान डाकघर, सागर, म.प्र.', city: 'Saugor', timings: 'Mon–Fri 9am–4pm (by appointment)' },
      { name: 'Regional Passport Office – Bhopal', nameHi: 'क्षेत्रीय पासपोर्ट कार्यालय – भोपाल', address: 'Bhavishya Nidhi Building, Habibganj, Bhopal', addressHi: 'भविष्य निधि भवन, हबीबगंज, भोपाल', city: 'Bhopal', phone: '0755-2763337', timings: 'Mon–Fri 9am–5pm' },
    ],
  },
  {
    id: 'driving_licence',
    label: 'Driving Licence',
    labelHi: 'ड्राइविंग लाइसेंस',
    emoji: '🚗',
    color: '#10b981',
    bgGradient: 'from-emerald-500/15 to-teal-500/10',
    borderColor: 'border-emerald-500/30',
    description: 'Ministry of Road Transport & Highways',
    descriptionHi: 'सड़क परिवहन एवं राजमार्ग मंत्रालय',
    portal: 'https://parivahan.gov.in',
    portalLabel: 'parivahan.gov.in / sarathi.parivahan.gov.in',
    helpline: '1800-1800-151',
    helplineLabel: 'Parivahan Helpline: 1800-1800-151',
    helplineHi: 'परिवहन हेल्पलाइन: 1800-1800-151',
    steps: [
      'File an FIR or a Non-Cognizable Report (NCR) at your nearest police station',
      'Visit sarathi.parivahan.gov.in and select your state (Madhya Pradesh)',
      'Log in and apply for "Duplicate Driving Licence"',
      'Fill in Form LLD (application for duplicate DL) online',
      'Upload required documents and pay the fee online',
      'Book an appointment at the nearest RTO (Regional Transport Office)',
      'Visit the RTO on the appointment date with original documents',
    ],
    stepsHi: [
      'नजदीकी थाने में एफआईआर या एनसीआर दर्ज करें',
      'sarathi.parivahan.gov.in पर जाएं और अपना राज्य (मध्य प्रदेश) चुनें',
      'लॉगिन करें और "डुप्लीकेट ड्राइविंग लाइसेंस" के लिए आवेदन करें',
      'ऑनलाइन फॉर्म LLD (डुप्लीकेट DL के लिए आवेदन) भरें',
      'आवश्यक दस्तावेज अपलोड करें और शुल्क ऑनलाइन जमा करें',
      'नजदीकी RTO में अपॉइंटमेंट बुक करें',
      'अपॉइंटमेंट की तारीख पर मूल दस्तावेजों के साथ RTO जाएं',
    ],
    docsNeeded: ['Police FIR / NCR copy', 'Original DL number (check Parivahan portal if forgotten)', 'Address proof (Aadhaar / Voter ID)', 'Age proof', 'Passport-size photographs (2)', 'Medical certificate (Form 1A) if required'],
    docsNeededHi: ['पुलिस एफआईआर/एनसीआर की कॉपी', 'मूल DL नंबर (भूलने पर परिवहन पोर्टल देखें)', 'पते का प्रमाण (आधार/वोटर आईडी)', 'आयु प्रमाण', '2 पासपोर्ट साइज फोटो', 'मेडिकल सर्टिफिकेट (फॉर्म 1A) यदि आवश्यक हो'],
    feeInfo: '₹200–₹400 (varies by state & vehicle class)',
    feeInfoHi: '₹200–₹400 (राज्य और वाहन वर्ग अनुसार)',
    timeframe: '7–30 working days after verification',
    timeframeHi: 'सत्यापन के बाद 7–30 कार्य दिवस',
    tipEn: 'You can check if your DL details exist digitally on the Parivahan portal — useful to retrieve your DL number before applying.',
    tipHi: 'परिवहन पोर्टल पर आप डिजिटल रूप से अपना DL विवरण देख सकते हैं — आवेदन से पहले DL नंबर जानने के लिए उपयोगी।',
    nearbyOffices: [
      { name: 'Regional Transport Office – Saugor', nameHi: 'क्षेत्रीय परिवहन कार्यालय – सागर', address: 'Civil Lines, Near Collector Office, Saugor, MP', addressHi: 'सिविल लाइंस, कलेक्टर कार्यालय के पास, सागर, म.प्र.', city: 'Saugor', phone: '07582-223456', timings: 'Mon–Fri 10am–5pm (except 2nd & 4th Sat)' },
      { name: 'RTO – Jabalpur', nameHi: 'आरटीओ – जबलपुर', address: 'Napier Town, Jabalpur, MP 482001', addressHi: 'नेपियर टाउन, जबलपुर, म.प्र. 482001', city: 'Jabalpur', phone: '0761-2627622', timings: 'Mon–Fri 10am–5pm' },
    ],
  },
  {
    id: 'voter_id',
    label: 'Voter ID Card',
    labelHi: 'मतदाता पहचान पत्र',
    emoji: '🗳️',
    color: '#ec4899',
    bgGradient: 'from-pink-500/15 to-rose-500/10',
    borderColor: 'border-pink-500/30',
    description: 'Election Commission of India',
    descriptionHi: 'भारत निर्वाचन आयोग',
    portal: 'https://voters.eci.gov.in',
    portalLabel: 'voters.eci.gov.in (Voter Portal)',
    helpline: '1950',
    helplineLabel: 'National Voter Helpline: 1950',
    helplineHi: 'राष्ट्रीय मतदाता हेल्पलाइन: 1950',
    steps: [
      'File an FIR or Non-Cognizable Report (NCR) at the nearest police station',
      'Log in to voters.eci.gov.in (National Voters\' Service Portal – NVSP)',
      'Click on "Request for EPIC" (Electors Photo Identity Card) — this covers lost/damaged cards',
      'Alternatively, fill Form 002 (for replacement/correction of EPIC)',
      'Submit the form online or at the Electoral Registration Officer\'s (ERO) office',
      'You can also track your application status on the voter portal',
      'You can download the e-EPIC (digital voter ID) instantly if your mobile is linked',
    ],
    stepsHi: [
      'नजदीकी थाने में एफआईआर या एनसीआर दर्ज करें',
      'voters.eci.gov.in (NVSP) पर लॉगिन करें',
      '"EPIC के लिए अनुरोध" पर क्लिक करें (यह खोए/क्षतिग्रस्त कार्ड को कवर करता है)',
      'वैकल्पिक रूप से फॉर्म 002 (EPIC के प्रतिस्थापन/सुधार के लिए) भरें',
      'फॉर्म ऑनलाइन या निर्वाचन पंजीकरण अधिकारी (ERO) के कार्यालय में जमा करें',
      'मतदाता पोर्टल पर आवेदन की स्थिति ट्रैक करें',
      'यदि मोबाइल नंबर लिंक है, तो ई-ईपीआईसी (डिजिटल मतदाता आईडी) तुरंत डाउनलोड करें',
    ],
    docsNeeded: ['Police FIR / NCR copy', 'Aadhaar card / any photo identity proof', 'Proof of residence', 'Old EPIC number (if available)', 'Passport-size photograph (1)'],
    docsNeededHi: ['पुलिस एफआईआर/एनसीआर की कॉपी', 'आधार कार्ड/कोई भी फोटो पहचान प्रमाण', 'निवास का प्रमाण', 'पुराना ईपीआईसी नंबर (यदि उपलब्ध हो)', '1 पासपोर्ट साइज फोटो'],
    feeInfo: 'Completely FREE',
    feeInfoHi: 'पूरी तरह मुफ्त',
    timeframe: 'e-EPIC: Instant | Physical card: 30–45 days',
    timeframeHi: 'ई-ईपीआईसी: तुरंत | भौतिक कार्ड: 30–45 दिन',
    tipEn: 'Download your e-EPIC (digital voter ID) for free from voters.eci.gov.in — it\'s legally valid and takes just 2 minutes.',
    tipHi: 'voters.eci.gov.in से मुफ्त ई-ईपीआईसी डाउनलोड करें — यह कानूनी रूप से मान्य है और केवल 2 मिनट लगते हैं।',
    nearbyOffices: [
      { name: 'Electoral Registration Office – Saugor', nameHi: 'निर्वाचन पंजीकरण कार्यालय – सागर', address: 'Collector Office Campus, Saugor, MP', addressHi: 'कलेक्टर कार्यालय परिसर, सागर, म.प्र.', city: 'Saugor', phone: '07582-222088', timings: 'Mon–Fri 10am–5pm' },
      { name: 'BLO Office (Block Level Officer) – Saugor', nameHi: 'बीएलओ कार्यालय – सागर', address: 'Tehsil Office, Saugor, MP', addressHi: 'तहसील कार्यालय, सागर, म.प्र.', city: 'Saugor', timings: 'Mon–Sat 10am–4pm' },
      { name: 'District Election Office – Jabalpur', nameHi: 'जिला निर्वाचन कार्यालय – जबलपुर', address: 'Collector Compound, Jabalpur, MP 482001', addressHi: 'कलेक्टर परिसर, जबलपुर, म.प्र. 482001', city: 'Jabalpur', phone: '0761-2621000', timings: 'Mon–Fri 10am–5pm' },
    ],
  },
];

type Step = 'select' | 'info' | 'offices';

export default function DocumentLossWizard({ language }: DocumentLossWizardProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedDoc, setSelectedDoc] = useState<DocInfo | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const hi = language === 'hi';

  const handleSelectDoc = (doc: DocInfo) => {
    setSelectedDoc(doc);
    setStep('info');
  };

  const handleBack = () => {
    if (step === 'offices') setStep('info');
    else if (step === 'info') { setStep('select'); setSelectedDoc(null); }
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone).catch(() => {});
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  return (
    <div className="flex flex-col min-h-full pb-6">
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-3">
          {step !== 'select' && (
            <button
              onClick={handleBack}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95"
            >
              <ArrowLeft size={18} className="text-white/70" />
            </button>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400/20 to-cyan-500/20 border border-teal-400/30 flex items-center justify-center">
                <FileX size={18} className="text-teal-300" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight font-sans">
                  {hi ? 'दस्तावेज़ खो गया?' : 'Document Loss Wizard'}
                </h1>
                <p className="text-white/50 text-xs font-mono mt-0.5">
                  {step === 'select'
                    ? (hi ? 'खोया हुआ दस्तावेज़ चुनें' : 'Select the document you lost')
                    : step === 'info'
                    ? (hi ? `${selectedDoc?.labelHi} — पुनः प्राप्त करने के चरण` : `${selectedDoc?.label} — Recovery Steps`)
                    : (hi ? 'नज़दीकी कार्यालय' : 'Nearby Offices')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step progress dots */}
        <div className="flex items-center gap-2 mt-4 px-1">
          {(['select', 'info', 'offices'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div className={`h-1.5 rounded-full transition-all duration-300 ${
                step === s ? 'flex-[2] bg-teal-400' :
                (['select', 'info', 'offices'].indexOf(step) > i) ? 'flex-1 bg-teal-400/40' : 'flex-1 bg-white/10'
              }`} />
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 1 — Document Selection */}
      {step === 'select' && (
        <div className="px-4 flex-1">
          <p className="text-white/60 text-sm mb-5 font-sans leading-relaxed">
            {hi
              ? 'घबराएं नहीं। नीचे से खोया हुआ दस्तावेज़ चुनें और हम आपको चरण-दर-चरण मार्गदर्शन करेंगे।'
              : "Don't worry — select the document below and we'll guide you step by step."}
          </p>

          {/* Calm reassurance banner */}
          <div className="flex items-start gap-3 bg-teal-500/10 border border-teal-500/20 rounded-2xl px-4 py-3.5 mb-5">
            <ShieldCheck size={18} className="text-teal-400 mt-0.5 shrink-0" />
            <p className="text-teal-200/90 text-[13px] font-sans leading-relaxed">
              {hi
                ? 'सभी जानकारी ऑफलाइन उपलब्ध है। आपकी कोई व्यक्तिगत जानकारी साझा नहीं की जाती।'
                : 'All information works offline. No personal data is shared or stored.'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {DOCUMENTS.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleSelectDoc(doc)}
                className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 active:scale-[0.98] bg-gradient-to-r ${doc.bgGradient} ${doc.borderColor} hover:border-opacity-60 group`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <span className="text-3xl">{doc.emoji}</span>
                    <div>
                      <div className="text-white font-semibold text-base font-sans">
                        {hi ? doc.labelHi : doc.label}
                      </div>
                      <div className="text-white/45 text-xs font-mono mt-0.5">
                        {hi ? doc.descriptionHi : doc.description}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-white/30 group-hover:text-white/60 transition-colors shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — Information & Steps */}
      {step === 'info' && selectedDoc && (
        <div className="px-4 flex-1 space-y-4">

          {/* Doc header card */}
          <div className={`rounded-2xl border p-4 bg-gradient-to-r ${selectedDoc.bgGradient} ${selectedDoc.borderColor}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{selectedDoc.emoji}</span>
              <div>
                <h2 className="text-white font-bold text-xl font-sans">{hi ? selectedDoc.labelHi : selectedDoc.label}</h2>
                <p className="text-white/55 text-xs font-mono">{hi ? selectedDoc.descriptionHi : selectedDoc.description}</p>
              </div>
            </div>
            {/* Quick stats row */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-black/20 rounded-xl px-3 py-2">
                <p className="text-white/40 text-[10px] uppercase tracking-wider font-mono">{hi ? 'शुल्क' : 'Fee'}</p>
                <p className="text-white/90 text-xs font-semibold mt-0.5">{hi ? selectedDoc.feeInfoHi : selectedDoc.feeInfo}</p>
              </div>
              <div className="bg-black/20 rounded-xl px-3 py-2">
                <p className="text-white/40 text-[10px] uppercase tracking-wider font-mono">{hi ? 'समय' : 'Time'}</p>
                <p className="text-white/90 text-xs font-semibold mt-0.5">{hi ? selectedDoc.timeframeHi : selectedDoc.timeframe}</p>
              </div>
            </div>
          </div>

          {/* Helpline & Portal */}
          <div className="rounded-2xl border border-white/10 bg-white/4 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/8">
              <h3 className="text-white/80 text-xs font-mono uppercase tracking-widest">{hi ? 'सरकारी पोर्टल और हेल्पलाइन' : 'Official Portal & Helpline'}</h3>
            </div>
            <div className="p-3 space-y-2">
              {/* Portal */}
              <a
                href={selectedDoc.portal}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl p-3 transition-all group"
              >
                <Globe size={16} className="text-indigo-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white/50 text-[10px] uppercase font-mono tracking-wider">{hi ? 'ऑनलाइन पोर्टल' : 'Online Portal'}</p>
                  <p className="text-indigo-300 text-xs font-mono mt-0.5 truncate">{selectedDoc.portalLabel}</p>
                </div>
                <ExternalLink size={14} className="text-indigo-400/50 group-hover:text-indigo-400 transition-colors shrink-0" />
              </a>

              {/* Primary helpline */}
              <button
                onClick={() => handleCopyPhone(selectedDoc.helpline)}
                className="w-full flex items-center gap-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl p-3 transition-all text-left"
              >
                <Phone size={16} className="text-emerald-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-white/50 text-[10px] uppercase font-mono tracking-wider">{hi ? 'हेल्पलाइन' : 'Helpline'}</p>
                  <p className="text-emerald-300 text-sm font-bold font-mono mt-0.5">{selectedDoc.helpline}</p>
                  <p className="text-white/40 text-[11px] mt-0.5">{hi ? selectedDoc.helplineHi : selectedDoc.helplineLabel}</p>
                </div>
                <div className="shrink-0">
                  {copiedPhone === selectedDoc.helpline ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : (
                    <span className="text-white/30 text-[10px] font-mono">tap to copy</span>
                  )}
                </div>
              </button>

              {/* Alt helpline */}
              {selectedDoc.altHelpline && (
                <button
                  onClick={() => handleCopyPhone(selectedDoc.altHelpline!)}
                  className="w-full flex items-center gap-3 bg-white/4 hover:bg-white/8 border border-white/10 rounded-xl p-3 transition-all text-left"
                >
                  <Phone size={16} className="text-white/40 shrink-0" />
                  <div className="flex-1">
                    <p className="text-white/50 text-[10px] uppercase font-mono tracking-wider">{hi ? 'वैकल्पिक हेल्पलाइन' : 'Alt. Helpline'}</p>
                    <p className="text-white/80 text-sm font-bold font-mono mt-0.5">{selectedDoc.altHelpline}</p>
                    <p className="text-white/35 text-[11px] mt-0.5">{selectedDoc.altHelplineLabel}</p>
                  </div>
                  {copiedPhone === selectedDoc.altHelpline && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
                </button>
              )}
            </div>
          </div>

          {/* Recovery Steps */}
          <div className="rounded-2xl border border-white/10 bg-white/4 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/8">
              <h3 className="text-white/80 text-xs font-mono uppercase tracking-widest">{hi ? 'पुनर्प्राप्ति के चरण' : 'Recovery Steps'}</h3>
            </div>
            <div className="p-3 space-y-2">
              {(hi ? selectedDoc.stepsHi : selectedDoc.steps).map((stepText, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold font-mono"
                    style={{ backgroundColor: `${selectedDoc.color}22`, color: selectedDoc.color, border: `1px solid ${selectedDoc.color}44` }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-white/80 text-[13px] font-sans leading-relaxed flex-1">{stepText}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Documents Needed */}
          <div className="rounded-2xl border border-white/10 bg-white/4 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/8">
              <h3 className="text-white/80 text-xs font-mono uppercase tracking-widest">{hi ? 'आवश्यक दस्तावेज़' : 'Documents Needed'}</h3>
            </div>
            <div className="p-3 space-y-1.5">
              {(hi ? selectedDoc.docsNeededHi : selectedDoc.docsNeeded).map((doc, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400/60 shrink-0" />
                  <span className="text-white/75 text-[13px] font-sans">{doc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl px-4 py-3.5">
            <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-amber-200/90 text-[13px] font-sans leading-relaxed">
              <span className="font-semibold text-amber-300">{hi ? 'सुझाव: ' : 'Tip: '}</span>
              {hi ? selectedDoc.tipHi : selectedDoc.tipEn}
            </p>
          </div>

          {/* Find Nearby Offices CTA */}
          <button
            onClick={() => setStep('offices')}
            className="w-full flex items-center justify-between bg-gradient-to-r from-teal-500/15 to-cyan-500/10 border border-teal-500/30 rounded-2xl px-4 py-4 hover:from-teal-500/25 hover:to-cyan-500/20 transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <MapPin size={18} className="text-teal-400" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold font-sans">{hi ? 'नज़दीकी कार्यालय खोजें' : 'Find Nearby Offices'}</p>
                <p className="text-white/45 text-xs font-mono mt-0.5">{hi ? 'आपके पास के केंद्र और कार्यालय' : 'Centres & offices near you'}</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-teal-400/70 group-hover:text-teal-400 transition-colors shrink-0" />
          </button>
        </div>
      )}

      {/* Step 3 — Nearby Offices */}
      {step === 'offices' && selectedDoc && (
        <div className="px-4 flex-1 space-y-4">
          <div className="flex items-start gap-3 bg-teal-500/10 border border-teal-500/20 rounded-2xl px-4 py-3.5">
            <MapPin size={16} className="text-teal-400 mt-0.5 shrink-0" />
            <p className="text-teal-200/85 text-[13px] font-sans leading-relaxed">
              {hi
                ? 'नीचे सागर और जबलपुर क्षेत्र के नज़दीकी कार्यालय दिए गए हैं।'
                : 'Offices near Saugor and Jabalpur area are listed below.'}
            </p>
          </div>

          {selectedDoc.nearbyOffices.map((office, i) => (
            <div
              key={i}
              className={`rounded-2xl border p-4 bg-gradient-to-r ${selectedDoc.bgGradient} ${selectedDoc.borderColor}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${selectedDoc.color}20`, border: `1px solid ${selectedDoc.color}30` }}
                >
                  <Building2 size={18} style={{ color: selectedDoc.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold font-sans text-[14px] leading-snug">
                    {hi ? office.nameHi : office.name}
                  </p>
                  <p className="text-white/50 text-[12px] font-sans mt-1 leading-relaxed">
                    {hi ? office.addressHi : office.address}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    <span className="text-white/40 text-[11px] font-mono">{office.timings}</span>
                    {office.phone && (
                      <button
                        onClick={() => handleCopyPhone(office.phone!)}
                        className="flex items-center gap-1 text-[11px] font-mono transition-colors"
                        style={{ color: copiedPhone === office.phone ? '#4ade80' : selectedDoc.color }}
                      >
                        <Phone size={10} />
                        {copiedPhone === office.phone ? (hi ? 'कॉपी हो गया!' : 'Copied!') : office.phone}
                      </button>
                    )}
                  </div>
                </div>
                <div
                  className="text-[10px] font-mono px-2 py-1 rounded-lg shrink-0"
                  style={{ backgroundColor: `${selectedDoc.color}18`, color: selectedDoc.color }}
                >
                  {office.city}
                </div>
              </div>
            </div>
          ))}

          {/* Search more on maps */}
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent((hi ? selectedDoc.labelHi : selectedDoc.label) + ' office near Saugor MP')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl py-3.5 transition-all group"
          >
            <Search size={15} className="text-white/50 group-hover:text-white/70 transition-colors" />
            <span className="text-white/60 group-hover:text-white/80 text-sm font-sans transition-colors">
              {hi ? 'Google Maps पर और खोजें' : 'Search more on Google Maps'}
            </span>
            <ExternalLink size={13} className="text-white/30 group-hover:text-white/50 transition-colors" />
          </a>

          {/* Start over button */}
          <button
            onClick={() => { setStep('select'); setSelectedDoc(null); }}
            className="flex items-center justify-center gap-2 w-full text-white/40 hover:text-white/60 text-sm py-2 transition-colors"
          >
            <RefreshCw size={13} />
            <span className="font-sans">{hi ? 'दूसरा दस्तावेज़ चुनें' : 'Start over / Choose another document'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
