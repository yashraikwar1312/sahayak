/**
 * Emergency Speech Classifier & Sentiment Analyzer (Multilingual - English, Hindi, Hinglish)
 * Designed for low-latency, context-aware command matching in high-stress situations.
 */

export interface ClassifiedVoiceResult {
  domain: 'medical' | 'cyber' | 'disaster' | 'fire' | 'police' | 'general';
  domainLabel: string;
  domainLabelHi: string;
  helpline: string;
  advice: string[];
  adviceHi: string[];
  stressLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number; // 0 to 100
  detectedKeywords: string[];
  isCallRequested: boolean;
  reassurePrefixEn: string;
  reassurePrefixHi: string;
}

// Highly detailed categories dictionaries with weighted coefficients
interface KeywordMap {
  [word: string]: number; // higher value = more specific to category
}

const MEDICAL_KEYWORDS: KeywordMap = {
  // English medical
  'medical': 4, 'hospital': 4, 'ambulance': 5, 'doctor': 3, 'clinic': 3.5, 'medicine': 3,
  'chest pain': 5, 'cardiac': 5, 'stroke': 5, 'heart': 3, 'heart attack': 5, 'faint': 4,
  'unconscious': 5, 'accident': 4, 'blood': 3, 'bleeding': 4, 'hurt': 2, 'wound': 3,
  'choking': 5, 'breath': 3, 'breathing': 3.5, 'injury': 3, 'fracture': 4.5, 'broken bone': 4,
  'pregnancy': 4, 'delivery': 4, 'pregnant': 4, 'seizure': 5, 'fit': 4, 'poison': 4,
  'asthma': 4, 'asthma attack': 5, 'collapse': 3.5, 'unresponsive': 5, 'pulse': 3,
  
  // Hindi medical
  'अस्पताल': 4, 'एम्बुलेंस': 5, 'चिकित्सा': 4, 'डॉक्टर': 3, 'वैद्य': 3, 'मरीज': 3, 'बीमार': 2.5,
  'बेहोश': 5, 'मूर्छित': 5, 'चोट': 3, 'खून': 3, 'रक्तस्राव': 4, 'सांस': 3, 'सांस की तकलीफ': 5,
  'दिल का दौरा': 5, 'हार्ट अटैक': 5, 'विष': 4, 'जहर': 4, 'घाव': 3, 'हड्डी': 3, 'हड्डी टूटना': 5,
  'दुर्घटना': 4, 'प्रसव': 4.5, 'गर्भवती': 4, 'उल्टी': 3,
  
  // Hinglish medical (duplicate keywords like 'hospital', 'ambulance', 'bleeding', 'delivery' are pruned to prevent TS1117)
  'daktar': 3.5, 'chot': 3, 'dard': 2, 'behosh': 5,
  'murchhit': 5, 'khoon': 3, 'saans': 3, 'dil ka daura': 5,
  'ghav': 3, 'ghaal': 3, 'haddi': 3, 'haddi tootna': 5, 'zeher': 4, 'jahar': 4
};

const FIRE_KEYWORDS: KeywordMap = {
  // English fire
  'fire': 5, 'smoke': 4, 'flame': 4, 'burn': 3, 'burning': 3.5, 'burning smell': 4,
  'cylinder': 3.5, 'cylinder blast': 5, 'short circuit': 4.5, 'spark': 3, 'sparks': 3.5,
  'combustible': 4, 'gas leak': 4.5, 'gas leakage': 5, 'firefighter': 5, 'fire engine': 5,
  'fire brigade': 5, 'extinguisher': 4.5, 'blaze': 5, 'trapped in fire': 5, 'explosion': 4.5, 'blast': 4,
  
  // Hindi fire
  'आग': 5, 'धुआँ': 4, 'धुआ': 4, 'लपटें': 4, 'जलन': 3, 'सिलेंडर': 3.5, 'सिलेंडर – ब्लास्ट': 5,
  'शॉर्ट सर्किट': 5, 'स्पार्क': 3, 'चिंगारी': 3, 'गैस': 2, 'गैस रिसाव': 5, 'दमकल': 5,
  'दमकल गाड़ी': 5, 'आग बुझाने': 4.5, 'ब्लास्ट': 4, 'धमाका': 3,
  
  // Hinglish fire (duplicate keywords like 'cylinder', 'gas leak', 'spark', 'fire brigade' are pruned to prevent TS1117)
  'aag': 5, 'aag lag': 5, 'dhuan': 4, 'dhuwa': 4,
  'damkal': 5, 'bhaddar': 3, 'jal rha': 4, 'combust': 4
};

const CYBER_KEYWORDS: KeywordMap = {
  // English cyber
  'cyber': 5, 'fraud': 4, 'hacker': 4.5, 'hack': 4, 'compromised': 4, 'scam': 4,
  'banking cheat': 4, 'otp': 4, 'otp scam': 5, 'money stolen': 4, 'account empty': 5,
  'card blocked': 4, 'credit card': 4, 'debit card': 4, 'unauthorized transaction': 5,
  'upi fraud': 5, 'gpay': 4, 'google pay': 4, 'phonepe': 4, 'paytm': 4, 'phishing': 5,
  'scammer': 4, 'compromised account': 4.5, 'bank account empty': 5, 'extortion': 4, 'ransomware': 5,
  
  // Hindi cyber
  'साइबर': 5, 'ठगी': 4, 'धोखा': 3, 'हैकर': 4.5, 'हैकिंग': 4.5, 'खाता खाली': 5, 'बैंक खाता': 4,
  'ओटीपी': 4, 'ओटीपी चोरी': 5, 'यूपीआई धोखाधड़ी': 5, 'कार्ड ब्लॉक': 4, 'पैसे चोरी': 4,
  'ऑनलाइन फ्रॉड': 5, 'फर्जी कॉल': 4, 'क्रेडिट कार्ड': 4,
  
  // Hinglish cyber (duplicates like 'cyber', 'scam', 'fraud', 'hacker', 'hack', 'gpay', 'paytm', 'phishing' are pruned)
  'otp chori': 5, 'paisa': 3, 'paise': 3, 'paisa kat gaya': 4.5, 'khata khali': 5, 'online thagi': 5, 'fake phone': 3.5
};

const DISASTER_KEYWORDS: KeywordMap = {
  // English disaster
  'flood': 5, 'earthquake': 5, 'cyclone': 5, 'storm': 4, 'hurricane': 5, 'tsunami': 5,
  'landslide': 5, 'mudslide': 5, 'building collapse': 4.5, 'storm surge': 5, 'heavy rain': 3.5,
  'lightning': 4, 'lightning strike': 5, 'river overflow': 4.5, 'cloudburst': 5, 'ndrf': 5.5,
  'disaster': 4, 'sdrf': 5.5, 'collapsed house': 4.5,
  
  // Hindi disaster
  'बाढ़': 5, 'भूकंप': 5, 'चक्रवात': 5, 'तूफान': 4, 'भूस्खलन': 5, 'मकान गिरना': 4.5,
  'बिजली गिरना': 5, 'भारी बारिश': 3.5, 'बादल फटने': 5, 'राष्ट्रीय आपदा': 4.5, 'राहत दल': 4.5,
  'आपदा प्रबंधन': 4.5, 'सुनामी': 5, 'बाढ़': 5, 'भुकंप': 5,
  
  // Hinglish disaster (duplicates like 'cyclone', 'landslide', 'ndrf', 'building collapse' are pruned)
  'baadh': 5, 'bhookamp': 5, 'bhukamp': 5, 'toofan': 4, 'gir gaya': 3, 'mitti dhas': 4, 'badal fat': 5
};

const POLICE_KEYWORDS: KeywordMap = {
  // English police
  'police': 5, 'robber': 4.5, 'thief': 4, 'criminal': 4, 'break in': 4, 'burglary': 4.5,
  'weapon': 4, 'knife': 4, 'gun': 4.5, 'hostage': 5, 'kidnap': 5, 'kidnapping': 5,
  'threat': 3.5, 'assault': 4.5, 'attack': 4, 'beaten': 4, 'danger': 2.5, 'crime': 3.5,
  'stalker': 4, 'harassment': 4, 'stalking': 4.5, 'intruder': 4.5, 'shooter': 5, 'active shooter': 5,
  'violence': 4, 'fight': 3, 'mugging': 4.5, 'physical dispute': 4, 'theft': 4, 'robbery': 4.5,
  
  // Hindi police
  'पुलिस': 5, 'चोर': 4, 'डाकू': 4.5, 'हथियार': 4, 'चाकू': 4, 'बंदूक': 4.5, 'बंधक': 5,
  'अपहरण': 5, 'धमकी': 3.5, 'हमला': 4, 'लड़ाई': 3, 'मारपीट': 4, 'उत्पीड़न': 4, 'पीछा': 3.5,
  'घरेलू हिंसा': 4.5, 'असुरक्षित': 3, 'अपराधी': 4, 'रॉबरी': 4.5,
  
  // Hinglish police (duplicates like 'police', 'robbery', 'kidnap' are pruned)
  'pct': 4.5, 'chor': 4, 'daku': 4.5, 'chori': 4, 'hathiyar': 4, 'chaku': 4,
  'bandook': 4.5, 'hamla': 4, 'dhamki': 3.5, 'ladai': 3, 'jhagda': 3.5,
  'maarpeet': 4, 'picha karti': 4, 'gunda': 4
};

// General Panic and Stress related terms
const PANIC_TRIGGERS: string[] = [
  'help', 'save me', 'dying', 'dead', 'blood', 'bleeding', 'screaming', 'terror', 'trapped', 'suffocating',
  'breathe', 'burning', 'hurry', 'quick', 'fast', 'please', 'emergency', 'urgent', 'critical', 'danger',
  'oh my god', 'god help', 'bachao', 'madad', 'jaldi', 'mar rha', 'bhago', 'fasa hua', 'dum ghut', 'severe',
  'marna', 'khoon', 'dard', 'bahar nikalo', 'bhayankar', 'तुरंत', 'कष्ट', 'जल्दी', 'मदद', 'बचाओ'
];

/**
 * Parses and returns deep-structured multi-lingual context-aware emergency classification.
 */
export function analyzeEmergencySpeech(inputText: string, currentLanguage: 'en' | 'hi'): ClassifiedVoiceResult {
  const text = inputText.toLowerCase().trim();
  // Try a keyword-based triage lookup for exact matching emergency numbers
  // (uses the offline EMERGENCY_NUMBERS tags and priority ranking)
  let triageHelpline: string | null = null;
  try {
    // Importing triageNumbers dynamically here avoids circular import issues at module load
    // but we call it synchronously since it's a pure local function.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { triageNumbers } = require('../data/emergencyNumbers');
    const triaged = triageNumbers(text, 1);
    if (triaged && triaged.length > 0) {
      triageHelpline = triaged[0].number;
    }
  } catch (e) {
    // If triage lookup fails for any reason, continue with baseline classifier
    triageHelpline = null;
  }
  
  // 1. Detect if call is requested explicitly in the speech text
  const callRequiredScore = (
    (text.includes('call') || text.includes('dial') || text.includes('connect') || text.includes('phone') ||
     text.includes('फ़ोन') || text.includes('कॉल') || text.includes('मिला') || text.includes('lagao') ||
     text.includes('लगाओ') || text.includes('येस') || text.includes('करो') || text.includes('yes') || 
     text.includes('haan') || text.includes('हाँ') || text.includes('laga do') || text.includes('lga')) ? 1 : 0
  );
  
  const isCallRequested = callRequiredScore > 0;

  // 2. Score mapping
  const scores = {
    medical: 0,
    fire: 0,
    cyber: 0,
    disaster: 0,
    police: 0,
  };

  const detectedKeywords: string[] = [];

  // Evaluate matching weights for each category dictionary
  const evaluateScores = (keywords: KeywordMap, category: keyof typeof scores) => {
    Object.entries(keywords).forEach(([term, weight]) => {
      // Direct whole-word boundary lookups or generic substrings if highly distinctive
      const regex = new RegExp(`\\b${term}\\b|${term}`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        scores[category] += weight * matches.length;
        if (!detectedKeywords.includes(term)) {
          detectedKeywords.push(term);
        }
      }
    });
  };

  evaluateScores(MEDICAL_KEYWORDS, 'medical');
  evaluateScores(FIRE_KEYWORDS, 'fire');
  evaluateScores(CYBER_KEYWORDS, 'cyber');
  evaluateScores(DISASTER_KEYWORDS, 'disaster');
  evaluateScores(POLICE_KEYWORDS, 'police');

  // 3. Stress & Panic scoring
  let stressScore = 0;
  const detectedPanicWords: string[] = [];
  PANIC_TRIGGERS.forEach(trigger => {
    if (text.includes(trigger)) {
      stressScore += 2;
      detectedPanicWords.push(trigger);
    }
  });

  // Length factor or exclamation presence
  if (text.split(' ').length > 15) stressScore += 1; // detailed explanation may mean descriptive low stress
  if (text.split(' ').length <= 4 && text.toUpperCase() !== text) stressScore += 2; // short, sharp panic exclamation
  if (text.includes('!') || text.includes('help!') || text.includes('bachao!')) stressScore += 3;

  // Set stress level based on threshold
  let stressLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (stressScore >= 6) {
    stressLevel = 'HIGH';
  } else if (stressScore >= 3) {
    stressLevel = 'MEDIUM';
  }

  // 4. Identify dominant category
  let maxScore = 0;
  let dominantDomain: 'medical' | 'cyber' | 'disaster' | 'fire' | 'police' | 'general' = 'general';

  Object.entries(scores).forEach(([domainName, rawScore]) => {
    if (rawScore > maxScore) {
      maxScore = rawScore;
      dominantDomain = domainName as any;
    }
  });

  // Small boosting rule: If a direct matches tie occurs, evaluate secondary contextual anchors
  if (dominantDomain === 'general' && detectedPanicWords.length > 0) {
    // If panic and no direct category is matched, default to general (police/first responders 112)
    dominantDomain = 'police';
  }

  // Calculate safety classification confidence rating
  const totalCategoryScore = Object.values(scores).reduce((a, b) => a + b, 0);
  let confidence = 50; // default baseline
  if (totalCategoryScore > 0) {
    const mainScoreRatio = maxScore / totalCategoryScore;
    confidence = Math.min(100, Math.round(50 + (mainScoreRatio * 50)));
  }

  // Default blueprints for response outcomes
  let domainLabel = 'General Security Service';
  let domainLabelHi = 'सामान्य सुरक्षा नियंत्रण';
  let helpline = '112';
  let advice: string[] = [
    "Locate a safe, bright public space immediately.",
    "Share your real-time satellite coordinates with verified emergency contacts.",
    "Remain cooperative and maintain a safe barrier from hazards."
  ];
  let adviceHi: string[] = [
    "सुरक्षित और भीड़भाड़ वाले स्थान पर तुरंत जाएं।",
    "अपने परिजनों को अपनी लाइव उपग्रह जीपीएस लोकेशन साझा करें।",
    "विवाद और टकराव से बचें और सुरक्षित दूरी बनाए रखें।"
  ];

  // Map chosen dominant emergency domain
  switch (dominantDomain as string) {
    case 'medical':
      domainLabel = 'Medical Crisis Department';
      domainLabelHi = 'आपातकालीन चिकित्सा विभाग';
      helpline = '108';
      advice = [
        "Lie the patient flat down on stable ground.",
        "Ensure the airway is wide open and verify breathing rates.",
        "Apply clean pressure to any bleeding wounds with cloth.",
        "Keep the patient hydrated and awake until ambulance dispatch arrives."
      ];
      adviceHi = [
        "मरीज को समतल ज़मीन पर आराम से लेटने दें।",
        "हवा का रास्ता पूरी तरह साफ रखें और सांस की गति जांचें।",
        "यदि रक्तस्त्राव हो रहा हो, तो साफ कपड़े से गहरा दबाव दें।"
      ];
      break;

    case 'fire':
      domainLabel = 'Fire Hazard & Dispatch Control';
      domainLabelHi = 'अग्निशमन नियंत्रण विभाग';
      helpline = '101';
      advice = [
        "Go low under toxic smoke to prevent carbon monoxide inhalation.",
        "If clothing catches fire, drop to the ground and roll.",
        "Evacuate utilizing masonry static stairs, never elevator systems.",
        "Shut interior doors as you leave to block oxygen feed."
      ];
      adviceHi = [
        "धुएं से बचने के लिए घुटनों के बल बहुत नीचे रेंग कर बाहर निकलें।",
        "यदि कपड़ों में आग पकड़े तो तुरंत जमीन पर रोल करें।",
        "अग्नि आपदा में लिफ्ट का प्रयोग वर्जित है, हमेशा सीढ़ियों से जाएं।"
      ];
      break;

    case 'cyber':
      domainLabel = 'Cyber Threat & Financial Fraud Desk';
      domainLabelHi = 'साइबर अपराध एवं वित्तीय सुरक्षा डेस्क';
      helpline = '1930';
      advice = [
        "Immediately report the transaction within the 1-hour Golden window.",
        "Dial bank customer support to temporarily freeze accounts/cards.",
        "Preserve accurate screenshots, headers, and SMS transactional trails.",
        "Never share OTP codes, passcodes, or banking security pins."
      ];
      adviceHi = [
        "धोखाधड़ी के पहले घंटे में ही 1930 नंबर पर शिकायत दर्ज कराएं ताकि धन रोका जा सके।",
        "अपने बैंक को सूचित कर तत्काल समस्त क्रेडिट और डेबिट कार्ड रुकवाएं।",
        "घटना से जुड़े धोखाधड़ी संदेश के स्क्रीनशॉट और खातों का विवरण सुरक्षित रखें।"
      ];
      break;

    case 'disaster':
      domainLabel = 'Disaster Management Force';
      domainLabelHi = 'राष्ट्रीय आपदा राहत बल';
      helpline = '1078';
      advice = [
        "Evacuate to higher elevated zones when dealing with flood indicators.",
        "Cut off the electrical mains and gas cylinder values safely.",
        "Keep away from damaged windows, high powerlines, and concrete fences.",
        "Stay indoors unless specified by safety authorities."
      ];
      adviceHi = [
        "बाढ़ या भारी संकट में तुरंत किसी ऊँचे और मजबूत स्थल पर शरण लें।",
        "सुरक्षा हेतु बिजली के मुख्य स्विचबोर्ड बंद करें व गैस नोब सुरक्षित करें।",
        "कमजोर कंक्रीट वाली दीवारों और बिजली के खंभों से पर्याप्त दूरी रखें।"
      ];
      break;

    case 'police':
      domainLabel = 'Police Quick Response Force';
      domainLabelHi = 'पुलिस त्वरित पीसीआर डिस्पैच';
      helpline = '112';
      advice = [
        "Lock entry gates, deadbolts, and secure physical accessways immediately.",
        "Retreat to a safe interior room, block the door, and silence device ringer.",
        "Do not engage with the criminal or confront the intruder directly.",
        "Attempt to memorize individual distinct identifiers (clothing, voice, heights)."
      ];
      adviceHi = [
        "सुरक्षा के लिए घर के मुख्य प्रवेश द्वारों को बंद कर सांकल चढ़ाएं।",
        "अंदर वाले कमरे में चले जाएं और अपने मोबाइल फोन को म्यूट रखें।",
        "हमलावरों से सीधा टकराव न मोल लें, केवल सुरक्षित जगह छिपे रहें।"
      ];
      break;
  }

  // 5. Stress reassuring announcements
  const reassurePrefixEn = stressLevel === 'HIGH' 
    ? "Stay calm. Take slow, deep breaths. Help is being routed. " 
    : "";
  const reassurePrefixHi = stressLevel === 'HIGH' 
    ? "शांत रहें। गहरी सांस लें। सहायता सक्रिय की जा रही है। " 
    : "";

  // If the keyword triage lookup found a clear top match, prefer that explicit helpline.
  if (triageHelpline) {
    helpline = triageHelpline;
  }

  return {
    domain: dominantDomain,
    domainLabel,
    domainLabelHi,
    helpline,
    advice,
    adviceHi,
    stressLevel,
    confidence,
    detectedKeywords: [...detectedKeywords, ...detectedPanicWords],
    isCallRequested,
    reassurePrefixEn,
    reassurePrefixHi
  };
}
