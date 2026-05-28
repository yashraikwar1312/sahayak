// src/data/emergencyNumbers.ts
// Comprehensive offline emergency numbers for India
// Covers all 29 categories — no network required.

export type EmergencyCategory =
  | 'police'
  | 'fire'
  | 'medical'
  | 'disaster'
  | 'women'
  | 'child'
  | 'senior'
  | 'cyber'
  | 'mental_health'
  | 'road'
  | 'railway'
  | 'aviation'
  | 'coast_guard'
  | 'forest'
  | 'animal'
  | 'legal'
  | 'anti_corruption'
  | 'electricity'
  | 'gas_leak'
  | 'water'
  | 'poison'
  | 'blood_bank'
  | 'ambulance'
  | 'disaster_mgmt'
  | 'human_trafficking'
  | 'domestic_violence'
  | 'suicide_prevention'
  | 'missing_persons'
  | 'general';

export interface EmergencyNumber {
  id: string;
  nameEn: string;
  nameHi: string;
  number: string;
  altNumber?: string;          // backup number
  category: EmergencyCategory;
  descriptionEn: string;
  descriptionHi: string;
  availableAllDay: boolean;    // true = 24/7
  smsAvailable?: boolean;
  whatsappAvailable?: boolean;
  tags: string[];              // for triage keyword matching
  stateSpecific?: string;      // e.g. "Maharashtra" or undefined for national
  priority: 1 | 2 | 3;        // 1 = highest (always show first)
}

export const EMERGENCY_NUMBERS: EmergencyNumber[] = [

  // ─── UNIVERSAL / INTEGRATED ─────────────────────────────────────────────
  {
    id: 'en-112',
    nameEn: 'Emergency (All Services)',
    nameHi: 'आपातकालीन सेवाएं (सभी)',
    number: '112',
    category: 'general',
    descriptionEn: 'India\'s single national emergency number — police, fire, and ambulance.',
    descriptionHi: 'भारत का एकीकृत आपातकालीन नंबर — पुलिस, अग्नि, और एम्बुलेंस।',
    availableAllDay: true,
    tags: ['emergency', 'help', 'all', 'universal', 'unified', 'आपातकाल', 'मदद'],
    priority: 1,
  },

  // ─── POLICE ──────────────────────────────────────────────────────────────
  {
    id: 'en-100',
    nameEn: 'Police',
    nameHi: 'पुलिस',
    number: '100',
    category: 'police',
    descriptionEn: 'National police helpline for crimes, theft, assault, riots.',
    descriptionHi: 'अपराध, चोरी, मारपीट, दंगों के लिए राष्ट्रीय पुलिस हेल्पलाइन।',
    availableAllDay: true,
    tags: ['police', 'crime', 'theft', 'robbery', 'assault', 'murder', 'riot', 'attack', 'arrest', 'पुलिस', 'चोरी', 'डकैती', 'मारपीट', 'हमला'],
    priority: 1,
  },
  {
    id: 'en-1090',
    nameEn: 'UP Police Women Helpline',
    nameHi: 'UP पुलिस महिला हेल्पलाइन',
    number: '1090',
    category: 'women',
    descriptionEn: 'Dedicated helpline for women in distress in Uttar Pradesh.',
    descriptionHi: 'उत्तर प्रदेश में महिलाओं के लिए समर्पित हेल्पलाइन।',
    availableAllDay: true,
    stateSpecific: 'Uttar Pradesh',
    tags: ['women', 'harassment', 'stalking', 'mahila', 'महिला', 'उत्पीड़न', 'पीछा'],
    priority: 2,
  },

  // ─── FIRE ────────────────────────────────────────────────────────────────
  {
    id: 'en-101',
    nameEn: 'Fire Brigade',
    nameHi: 'दमकल सेवा',
    number: '101',
    category: 'fire',
    descriptionEn: 'National fire department for building fires, gas fires, industrial fires.',
    descriptionHi: 'इमारत, गैस, औद्योगिक आग के लिए राष्ट्रीय दमकल सेवा।',
    availableAllDay: true,
    tags: ['fire', 'burning', 'smoke', 'flame', 'explosion', 'आग', 'धुआं', 'जलना', 'धमाका', 'blast'],
    priority: 1,
  },

  // ─── AMBULANCE / MEDICAL ─────────────────────────────────────────────────
  {
    id: 'en-102',
    nameEn: 'Ambulance',
    nameHi: 'एम्बुलेंस',
    number: '102',
    category: 'ambulance',
    descriptionEn: 'Free government ambulance for accidents, medical emergencies, and childbirth.',
    descriptionHi: 'दुर्घटना, चिकित्सा आपात, प्रसव के लिए मुफ़्त सरकारी एम्बुलेंस।',
    availableAllDay: true,
    tags: ['ambulance', 'accident', 'injury', 'unconscious', 'heart attack', 'stroke', 'pregnant', 'delivery', 'एम्बुलेंस', 'दुर्घटना', 'बेहोश', 'हार्ट', 'प्रसव'],
    priority: 1,
  },
  {
    id: 'en-108',
    nameEn: 'Emergency Ambulance (EMRI)',
    nameHi: 'आपातकालीन एम्बुलेंस (EMRI)',
    number: '108',
    category: 'ambulance',
    descriptionEn: 'EMRI ambulance — available in most Indian states, faster response.',
    descriptionHi: 'अधिकतर राज्यों में उपलब्ध EMRI एम्बुलेंस — तेज प्रतिक्रिया।',
    availableAllDay: true,
    tags: ['ambulance', 'emri', 'emergency medical', 'accident', 'एम्बुलेंस', 'चिकित्सा'],
    priority: 1,
  },
  {
    id: 'en-104',
    nameEn: 'Medical Helpline (Health Advice)',
    nameHi: 'स्वास्थ्य सलाह हेल्पलाइन',
    number: '104',
    category: 'medical',
    descriptionEn: 'Free tele-consultation and health advice helpline.',
    descriptionHi: 'मुफ़्त टेली-परामर्श और स्वास्थ्य सलाह हेल्पलाइन।',
    availableAllDay: true,
    tags: ['medical', 'doctor', 'health', 'medicine', 'advice', 'consultation', 'डॉक्टर', 'स्वास्थ्य', 'दवाई', 'सलाह'],
    priority: 2,
  },

  // ─── DISASTER MANAGEMENT ─────────────────────────────────────────────────
  {
    id: 'en-ndma',
    nameEn: 'National Disaster Management (NDMA)',
    nameHi: 'राष्ट्रीय आपदा प्रबंधन प्राधिकरण',
    number: '1078',
    category: 'disaster_mgmt',
    descriptionEn: 'NDMA helpline for floods, earthquakes, cyclones, landslides.',
    descriptionHi: 'बाढ़, भूकंप, तूफ़ान, भूस्खलन के लिए NDMA हेल्पलाइन।',
    availableAllDay: true,
    tags: ['flood', 'earthquake', 'cyclone', 'landslide', 'tsunami', 'disaster', 'natural disaster', 'बाढ़', 'भूकंप', 'तूफ़ान', 'भूस्खलन', 'सुनामी', 'आपदा'],
    priority: 1,
  },
  {
    id: 'en-sdma',
    nameEn: 'State Disaster Response (SDRF)',
    nameHi: 'राज्य आपदा प्रतिक्रिया बल',
    number: '1070',
    category: 'disaster',
    descriptionEn: 'State-level disaster response force for localized disasters.',
    descriptionHi: 'स्थानीय आपदाओं के लिए राज्य स्तरीय आपदा प्रतिक्रिया बल।',
    availableAllDay: true,
    tags: ['disaster', 'flood', 'state rescue', 'बाढ़', 'आपदा', 'राज्य बचाव'],
    priority: 2,
  },

  // ─── WOMEN & CHILDREN ────────────────────────────────────────────────────
  {
    id: 'en-1091',
    nameEn: 'Women Helpline (National)',
    nameHi: 'महिला हेल्पलाइन (राष्ट्रीय)',
    number: '1091',
    category: 'women',
    descriptionEn: 'National helpline for women in distress — violence, harassment, rape.',
    descriptionHi: 'संकट में महिलाओं के लिए राष्ट्रीय हेल्पलाइन — हिंसा, उत्पीड़न, बलात्कार।',
    availableAllDay: true,
    tags: ['women', 'rape', 'sexual assault', 'harassment', 'domestic violence', 'mahila', 'महिला', 'बलात्कार', 'यौन उत्पीड़न', 'घरेलू हिंसा'],
    priority: 1,
  },
  {
    id: 'en-181',
    nameEn: 'Women Helpline (Domestic Violence)',
    nameHi: 'महिला हेल्पलाइन (घरेलू हिंसा)',
    number: '181',
    category: 'domestic_violence',
    descriptionEn: 'Dedicated helpline under Ministry of Women & Child Development.',
    descriptionHi: 'महिला एवं बाल विकास मंत्रालय की समर्पित हेल्पलाइन।',
    availableAllDay: true,
    whatsappAvailable: false,
    tags: ['domestic violence', 'wife beating', 'abuse', 'husband violence', 'घरेलू हिंसा', 'पत्नी पीटना', 'दुर्व्यवहार'],
    priority: 1,
  },
  {
    id: 'en-1098',
    nameEn: 'Childline',
    nameHi: 'चाइल्डलाइन',
    number: '1098',
    category: 'child',
    descriptionEn: 'Emergency helpline for children in distress — abuse, missing, exploitation.',
    descriptionHi: 'संकट में बच्चों के लिए आपातकालीन हेल्पलाइन — दुर्व्यवहार, लापता, शोषण।',
    availableAllDay: true,
    tags: ['child', 'children', 'missing child', 'child abuse', 'child labor', 'बच्चा', 'लापता बच्चा', 'बाल शोषण', 'बाल मजदूरी'],
    priority: 1,
  },
  {
    id: 'en-human-traffic',
    nameEn: 'Anti-Human Trafficking (AHTUs)',
    nameHi: 'मानव तस्करी रोधी',
    number: '1800-419-8588',
    category: 'human_trafficking',
    descriptionEn: 'Report human trafficking, bonded labour, forced migration.',
    descriptionHi: 'मानव तस्करी, बंधुआ मजदूरी, जबरन प्रवास की रिपोर्ट करें।',
    availableAllDay: true,
    tags: ['trafficking', 'bonded labor', 'kidnap', 'मानव तस्करी', 'बंधुआ', 'अपहरण'],
    priority: 2,
  },

  // ─── SENIORS ─────────────────────────────────────────────────────────────
  {
    id: 'en-elder',
    nameEn: 'Senior Citizen Helpline',
    nameHi: 'वरिष्ठ नागरिक हेल्पलाइन',
    number: '14567',
    category: 'senior',
    descriptionEn: 'Elder abuse, fraud, loneliness, and welfare issues for senior citizens.',
    descriptionHi: 'वृद्ध दुर्व्यवहार, धोखाधड़ी, अकेलेपन और कल्याण मुद्दों के लिए।',
    availableAllDay: true,
    tags: ['senior', 'elderly', 'old age', 'elder abuse', 'pension fraud', 'बुजुर्ग', 'वरिष्ठ', 'बड़े', 'पेंशन'],
    priority: 2,
  },

  // ─── CYBER CRIME ─────────────────────────────────────────────────────────
  {
    id: 'en-1930',
    nameEn: 'Cyber Crime Helpline',
    nameHi: 'साइबर अपराध हेल्पलाइन',
    number: '1930',
    category: 'cyber',
    descriptionEn: 'Report online fraud, hacking, UPI fraud, sextortion, ransomware, identity theft.',
    descriptionHi: 'ऑनलाइन धोखाधड़ी, हैकिंग, UPI फ्रॉड, सेक्सटॉर्शन, रैनसमवेयर, पहचान चोरी की रिपोर्ट करें।',
    availableAllDay: true,
    tags: ['cyber', 'fraud', 'online scam', 'hacking', 'upi fraud', 'otp fraud', 'sextortion', 'ransomware', 'identity theft', 'phishing', 'साइबर', 'धोखाधड़ी', 'ऑनलाइन ठगी', 'हैकिंग', 'UPI फ्रॉड'],
    priority: 1,
  },

  // ─── MENTAL HEALTH ───────────────────────────────────────────────────────
  {
    id: 'en-vandrevala',
    nameEn: 'Vandrevala Foundation (Mental Health)',
    nameHi: 'वंद्रेवाला फाउंडेशन',
    number: '1860-2662-345',
    category: 'mental_health',
    descriptionEn: 'Free 24/7 mental health support — depression, anxiety, suicidal thoughts.',
    descriptionHi: 'मुफ़्त 24/7 मानसिक स्वास्थ्य सहायता — अवसाद, चिंता, आत्महत्या के विचार।',
    availableAllDay: true,
    tags: ['mental health', 'suicide', 'depression', 'anxiety', 'suicidal', 'panic attack', 'self harm', 'मानसिक', 'आत्महत्या', 'अवसाद', 'चिंता'],
    priority: 1,
  },
  {
    id: 'en-iCall',
    nameEn: 'iCall (TISS) Mental Health',
    nameHi: 'iCall मानसिक स्वास्थ्य',
    number: '9152987821',
    category: 'suicide_prevention',
    descriptionEn: 'Psychosocial helpline by TISS — counselling for mental health crises.',
    descriptionHi: 'TISS द्वारा मनोसामाजिक हेल्पलाइन — मानसिक स्वास्थ्य संकट के लिए परामर्श।',
    availableAllDay: false,
    tags: ['suicide', 'mental health', 'counselling', 'depression', 'आत्महत्या', 'मानसिक', 'परामर्श', 'अवसाद'],
    priority: 2,
  },

  // ─── ROAD & TRANSPORT ────────────────────────────────────────────────────
  {
    id: 'en-road-accident',
    nameEn: 'Road Accident Emergency',
    nameHi: 'सड़क दुर्घटना आपातकाल',
    number: '1073',
    category: 'road',
    descriptionEn: 'Ministry of Road Transport highway accident helpline — rescue and towing.',
    descriptionHi: 'सड़क परिवहन मंत्रालय हाईवे दुर्घटना हेल्पलाइन — बचाव और टोइंग।',
    availableAllDay: true,
    tags: ['road', 'highway', 'accident', 'crash', 'vehicle', 'truck', 'car accident', 'सड़क', 'हाईवे', 'दुर्घटना', 'टक्कर', 'गाड़ी'],
    priority: 1,
  },
  {
    id: 'en-nhai',
    nameEn: 'NHAI Highway Helpline',
    nameHi: 'NHAI हाईवे हेल्पलाइन',
    number: '1033',
    category: 'road',
    descriptionEn: 'National Highway Authority — for highway accidents, breakdowns, crime on highways.',
    descriptionHi: 'राष्ट्रीय राजमार्ग प्राधिकरण — हाईवे दुर्घटना, ब्रेकडाउन, अपराध।',
    availableAllDay: true,
    tags: ['highway', 'national highway', 'breakdown', 'accident', 'nhai', 'हाईवे', 'राजमार्ग', 'ब्रेकडाउन'],
    priority: 2,
  },
  {
    id: 'en-railway',
    nameEn: 'Railway Emergency / Accident',
    nameHi: 'रेलवे आपातकाल / दुर्घटना',
    number: '139',
    category: 'railway',
    descriptionEn: 'Rail Madad helpline — accidents, medical, security on trains.',
    descriptionHi: 'रेल मदद हेल्पलाइन — ट्रेन में दुर्घटना, चिकित्सा, सुरक्षा।',
    availableAllDay: true,
    tags: ['railway', 'train', 'rail accident', 'railway crime', 'रेल', 'ट्रेन', 'रेलवे', 'दुर्घटना'],
    priority: 1,
  },
  {
    id: 'en-aviation',
    nameEn: 'Aviation Emergency (DGCA)',
    nameHi: 'विमानन आपातकाल (DGCA)',
    number: '1800-110-3333',
    category: 'aviation',
    descriptionEn: 'DGCA helpline for aviation emergencies, air crash, airport incidents.',
    descriptionHi: 'विमान दुर्घटना, हवाई अड्डे की घटनाओं के लिए DGCA हेल्पलाइन।',
    availableAllDay: true,
    tags: ['aviation', 'airplane', 'flight', 'airport', 'air crash', 'विमान', 'हवाई जहाज', 'उड़ान', 'हवाई अड्डा'],
    priority: 2,
  },
  {
    id: 'en-coast',
    nameEn: 'Coast Guard (Maritime)',
    nameHi: 'तटरक्षक (समुद्री)',
    number: '1554',
    category: 'coast_guard',
    descriptionEn: 'Indian Coast Guard — sea distress, drowning, maritime accidents.',
    descriptionHi: 'भारतीय तटरक्षक — समुद्री संकट, डूबना, समुद्री दुर्घटनाएं।',
    availableAllDay: true,
    tags: ['coast', 'sea', 'ocean', 'drowning', 'boat', 'maritime', 'समुद्र', 'डूबना', 'नाव', 'तटरक्षक'],
    priority: 2,
  },

  // ─── UTILITIES / INFRASTRUCTURE ──────────────────────────────────────────
  {
    id: 'en-gas',
    nameEn: 'Gas Leak Emergency',
    nameHi: 'गैस रिसाव आपातकाल',
    number: '1906',
    category: 'gas_leak',
    descriptionEn: 'Report LPG or PNG gas leaks — immediate dispatch and safety response.',
    descriptionHi: 'LPG या PNG गैस रिसाव की रिपोर्ट करें — तत्काल प्रतिक्रिया।',
    availableAllDay: true,
    tags: ['gas', 'gas leak', 'lpg', 'png', 'cylinder', 'smell gas', 'गैस', 'गैस रिसाव', 'सिलिंडर', 'गैस की बदबू'],
    priority: 1,
  },
  {
    id: 'en-electricity',
    nameEn: 'Electricity Emergency',
    nameHi: 'बिजली आपातकाल',
    number: '1912',
    category: 'electricity',
    descriptionEn: 'Electrical fire, live wire, electrocution — emergency response.',
    descriptionHi: 'बिजली आग, जीवित तार, बिजली का झटका — आपातकालीन प्रतिक्रिया।',
    availableAllDay: true,
    tags: ['electricity', 'electric', 'electrocution', 'live wire', 'power line', 'बिजली', 'करंट', 'बिजली का तार', 'शॉक'],
    priority: 1,
  },
  {
    id: 'en-water',
    nameEn: 'Water Emergency / Flooding',
    nameHi: 'जल आपातकाल / बाढ़',
    number: '1916',
    category: 'water',
    descriptionEn: 'Water supply emergency, dam breach, sewer overflow, urban flooding.',
    descriptionHi: 'जल आपूर्ति संकट, बाँध टूटना, सीवर ओवरफ्लो, शहरी बाढ़।',
    availableAllDay: true,
    tags: ['flood', 'dam', 'water', 'sewer', 'urban flood', 'बाढ़', 'बाँध', 'पानी', 'सीवर'],
    priority: 2,
  },

  // ─── POISON & HEALTH ─────────────────────────────────────────────────────
  {
    id: 'en-poison',
    nameEn: 'Poison Control (AIIMS)',
    nameHi: 'विष नियंत्रण (AIIMS)',
    number: '1800-116-117',
    category: 'poison',
    descriptionEn: 'Poisoning, overdose, toxic substance ingestion — AIIMS helpline.',
    descriptionHi: 'विषाक्तता, अधिक खुराक, जहरीले पदार्थ के सेवन के लिए AIIMS हेल्पलाइन।',
    availableAllDay: true,
    tags: ['poison', 'overdose', 'toxic', 'swallowed', 'pesticide', 'chemical ingestion', 'जहर', 'विष', 'ओवरडोज़', 'कीटनाशक', 'निगल'],
    priority: 1,
  },
  {
    id: 'en-blood',
    nameEn: 'Blood Bank (E-Raktkosh)',
    nameHi: 'ब्लड बैंक (ई-रक्तकोश)',
    number: '104',
    category: 'blood_bank',
    descriptionEn: 'Blood bank availability and emergency blood donation network.',
    descriptionHi: 'ब्लड बैंक उपलब्धता और आपातकालीन रक्तदान नेटवर्क।',
    availableAllDay: true,
    tags: ['blood', 'blood bank', 'donation', 'transfusion', 'रक्त', 'ब्लड', 'ब्लड बैंक', 'रक्तदान'],
    priority: 2,
  },

  // ─── LEGAL & ANTI-CORRUPTION ─────────────────────────────────────────────
  {
    id: 'en-legal',
    nameEn: 'Legal Aid / NALSA',
    nameHi: 'कानूनी सहायता / NALSA',
    number: '15100',
    category: 'legal',
    descriptionEn: 'Free legal aid for poor and marginalized — arrest, property, rights.',
    descriptionHi: 'गरीब और हाशिए पर रहने वाले लोगों के लिए मुफ्त कानूनी सहायता — गिरफ्तारी, संपत्ति, अधिकार।',
    availableAllDay: false,
    tags: ['legal', 'lawyer', 'court', 'rights', 'arrested', 'property dispute', 'कानूनी', 'वकील', 'अदालत', 'गिरफ्तार', 'संपत्ति'],
    priority: 2,
  },
  {
    id: 'en-anticorrupt',
    nameEn: 'Anti-Corruption (CVC)',
    nameHi: 'भ्रष्टाचार विरोधी (CVC)',
    number: '1800-11-0180',
    category: 'anti_corruption',
    descriptionEn: 'Report bribery, corruption, government officer misconduct.',
    descriptionHi: 'रिश्वतखोरी, भ्रष्टाचार, सरकारी अधिकारी के दुर्व्यवहार की रिपोर्ट करें।',
    availableAllDay: false,
    tags: ['corruption', 'bribery', 'bribe', 'government', 'misconduct', 'भ्रष्टाचार', 'रिश्वत', 'सरकारी', 'दुर्व्यवहार'],
    priority: 2,
  },

  // ─── WILDLIFE / FOREST ───────────────────────────────────────────────────
  {
    id: 'en-forest',
    nameEn: 'Forest / Wildlife Emergency',
    nameHi: 'वन / वन्यजीव आपातकाल',
    number: '1926',
    category: 'forest',
    descriptionEn: 'Forest fires, poaching, wildlife attacks, illegal logging.',
    descriptionHi: 'वन अग्नि, शिकार, जंगली जानवरों का हमला, अवैध कटाई।',
    availableAllDay: true,
    tags: ['forest', 'wildlife', 'poaching', 'animal attack', 'forest fire', 'जंगल', 'वन्यजीव', 'शिकार', 'जानवर', 'वन अग्नि'],
    priority: 2,
  },
  {
    id: 'en-animal',
    nameEn: 'Animal Helpline (PFA)',
    nameHi: 'पशु हेल्पलाइन (PFA)',
    number: '1962',
    category: 'animal',
    descriptionEn: 'Injured animals, stray animal attacks, cruelty to animals.',
    descriptionHi: 'घायल जानवर, आवारा जानवर के हमले, पशु क्रूरता।',
    availableAllDay: true,
    tags: ['animal', 'dog bite', 'snake bite', 'stray dog', 'animal cruelty', 'जानवर', 'कुत्ता काटना', 'सांप काटना', 'आवारा कुत्ता', 'पशु क्रूरता'],
    priority: 2,
  },

  // ─── MISSING PERSONS ─────────────────────────────────────────────────────
  {
    id: 'en-missing',
    nameEn: 'Missing Persons (NCMEC India)',
    nameHi: 'लापता व्यक्ति',
    number: '1800-180-4456',
    category: 'missing_persons',
    descriptionEn: 'Report missing children or adults to national tracking network.',
    descriptionHi: 'लापता बच्चों या वयस्कों की रिपोर्ट राष्ट्रीय ट्रैकिंग नेटवर्क पर करें।',
    availableAllDay: true,
    tags: ['missing', 'lost', 'kidnap', 'abduction', 'disappeared', 'लापता', 'खो गया', 'अपहरण', 'गायब'],
    priority: 2,
  },

  // ─── COVID / HEALTH CRISIS ───────────────────────────────────────────────
  {
    id: 'en-health-crisis',
    nameEn: 'Health Helpline (COVID / Epidemic)',
    nameHi: 'स्वास्थ्य हेल्पलाइन (COVID / महामारी)',
    number: '1075',
    category: 'medical',
    descriptionEn: 'Ministry of Health national helpline for epidemics, COVID, outbreak reporting.',
    descriptionHi: 'महामारी, COVID, प्रकोप की रिपोर्टिंग के लिए स्वास्थ्य मंत्रालय हेल्पलाइन।',
    availableAllDay: true,
    tags: ['covid', 'epidemic', 'virus', 'outbreak', 'infection', 'corona', 'COVID', 'महामारी', 'वायरस', 'संक्रमण', 'कोरोना'],
    priority: 2,
  },
];

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

/**
 * Get all numbers for a given category, sorted by priority.
 */
export function getByCategory(category: EmergencyCategory): EmergencyNumber[] {
  return EMERGENCY_NUMBERS
    .filter(n => n.category === category)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Keyword-based triage: returns top-N matching numbers for a situation description.
 * Scoring: each matched tag = +2, each matched word in name = +1, priority bonus.
 */
export function triageNumbers(
  situationText: string,
  topN = 3
): EmergencyNumber[] {
  const lower = situationText.toLowerCase();
  const words = lower.split(/\s+/);

  const scored = EMERGENCY_NUMBERS.map(num => {
    let score = 0;

    // Tag match (highest weight)
    for (const tag of num.tags) {
      if (lower.includes(tag)) score += 3;
    }

    // Word match against name
    const nameLower = num.nameEn.toLowerCase();
    for (const word of words) {
      if (word.length > 3 && nameLower.includes(word)) score += 1;
    }

    // Priority bonus
    score += (4 - num.priority); // priority 1 → +3, priority 2 → +2, priority 3 → +1

    return { num, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(s => s.num);
}

export default EMERGENCY_NUMBERS;