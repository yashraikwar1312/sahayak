import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const _filename = typeof import.meta !== "undefined" && import.meta.url ? fileURLToPath(import.meta.url) : (typeof __filename !== "undefined" ? __filename : "");
const _dirname = typeof import.meta !== "undefined" && import.meta.url ? path.dirname(_filename) : (typeof __dirname !== "undefined" ? __dirname : "");

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
const key = process.env.GEMINI_API_KEY;

if (key && key !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini AI Client initialized successfully for Sahayak.");
  } catch (error) {
    console.error("Failed to initialize Gemini Client:", error);
  }
} else {
  console.log("No valid GEMINI_API_KEY found. Utilizing high-fidelity integrated fallback responses.");
}

// Interactive helper templates for emergency fallbacks
const FALLBACK_ADVICE: Record<string, { en: string; hi: string }> = {
  general: {
    en: "I am ready to help you with any issue. Please tell me what's happening or select one of the emergency categories like Cyber Crime, Medical, Women Safety, or Police.",
    hi: "मैं आपकी मदद करने के लिए तैयार हूं। कृपया मुझे बताएं कि क्या समस्या है या साइबर अपराध, चिकित्सा, महिला सुरक्षा, या पुलिस जैसी आपातकालीन श्रेणियों में से किसी एक को चुनें।"
  },
  cyber: {
    en: "🚨 **IMMEDIATE CYBER CRIME STEPS**:\n1. **Call 1930 Helpline immediately** (especially for financial fraud within 24 hours of incident).\n2. **Freeze accounts**: Immediately contact your bank to freeze credit cards and bank portals linked to compromised credentials.\n3. **Preserve Evidence**: Take screenshots of transaction IDs, threat messages, email headers, or chat logs.\n4. **Official Complaint**: File an official grievance online at **cybercrime.gov.in**.",
    hi: "🚨 **साइबर अपराध के लिए तत्काल कदम**:\n1. **तुरंत 1930 हेल्पलाइन पर कॉल करें** (विशेष रूप से घटना के 24 घंटे के भीतर वित्तीय धोखाधड़ी के लिए)।\n2. **खाते फ्रीज करें**: बैंक से तुरंत संपर्क कर क्रेडिट/डेबिट कार्ड और नेट बैंकिंग ब्लाक कराएं।\n3. **साक्ष्य सुरक्षित रखें**: ट्रांजैक्शन आईडी, धमकी भरे संदेशों या चैट स्क्रीनशॉट को संभाल कर रखें।\n4. **आधिकारिक शिकायत**: भारत सरकार के पोर्टल **cybercrime.gov.in** पर शिकायत दर्ज करें।"
  },
  medical: {
    en: "🚑 **IMMEDIATE MEDICAL EMERGENCY STEPS**:\n1. **Call Ambulance (102 or 112)**. If cardiac event or critical injury, request an ALS (Advanced Life Support) response.\n2. **Check responsiveness**: Ensure airway is clear. If unresponsive and not breathing, initiate CPR (push hard and fast in the center of the chest).\n3. **Control Bleeding**: Apply firm, continuous pressure directly on wounds using clean cloths.\n4. **Keep Warm & Calm**: Reassure the victim. Do not move someone with suspected neck/spine injuries unless in immediate hazard.",
    hi: "🚑 **तत्काल चिकित्सा आपातकालीन कदम**:\n1. **एंबुलेंस (102 या 112) को कॉल करें**।\n2. **बेहोशी की जांच करें**: सांस की जांच करें। यदि सांस नहीं चल रही, तो तुरंत सीपीआर (छाती के बीच में जोर से और तेजी से दबाएं) शुरू करें।\n3. **रक्तस्राव नियंत्रित करें**: साफ कपड़े से सीधे घाव पर लगातार जोर से दबाएं।\n4. **स्थिर रखें**: गर्दन या रीढ़ की हड्डी में चोट की आशंका होने पर व्यक्ति को तब तक न हिलाएं जब तक बहुत जरूरी न हो।"
  },
  women: {
    en: "🌸 **WOMEN SAFETY EMERGENCY ACTIONS**:\n1. **Call Women Helpline (1091)** or the Integrated Helpline (112) instantly.\n2. **Share Location**: Press the SOS Broadcast button to share coordinates with pre-saved trusted contacts.\n3. **Target Secure Space**: Head to nearest well-lit public space, metro station entrance, shopping zone, or active police kiosk.\n4. **Continuous Transit**: Keep family updated over virtual tracking link, or contact local PCR (Police Patrol Railing).",
    hi: "🌸 **महिला सुरक्षा आपातकालीन कार्रवाइयां**:\n1. **तुरत महिला हेल्पलाइन (1091)** या सामान्य आपातकालीन (112) पर कॉल करें।\n2. **स्थान साझा करें**: पूर्व-सहेजे गए संपर्कों के साथ जीपीएस लोकेशन साझा करने के लिए एसओएस (SOS) दबाएं।\n3. **सुरक्षित स्थान खोजें**: नजदीकी चालू रोशनी वाले सार्वजनिक स्थल, मेट्रो स्टेशन या पुलिस चौंकी की तरफ बढ़ें।\n4. **सतर्क रहें**: ऐप के माध्यम से आवाज की रेकॉर्डिंग या पुलिस सहायता को सक्रिय रखें।"
  },
  police: {
    en: "👮 **POLICE INTERVENTION PROTOCOLS**:\n1. **Dial 100 or 112** for active security assistance and dispatching patrol unit.\n2. **Assess Danger**: If pursued, don't head home. Drive or run to the nearest police station or crowded place.\n3. **Memorize traits**: Make mental notes of offender features, license plate numbers, vehicle models, or unique patterns.\n4. **De-escalate**: Remain vocal, sound horns, scream 'HELP' to attract general crowd support.",
    hi: "👮 **पुलिस आपातकालीन प्रोटोकॉल**:\n1. **तुरंत 100 या 112 डायल करें** ताकि पुलिस पिकेट या पेट्रोल वाहन घटना स्थल पर पहुंच सके।\n2. **खतरे का आकलन**: यदि कोई पीछा कर रहा है, तो घर जाने की बजाय सीधे नजदीकी थाने या भीड़भाड़ वाली जगह पर जाएं।\n3. **निशानियां याद रखें**: अपराधी और उसकी गाड़ी का नंबर, रंग, ब्रांड और कपड़ों की पहचान याद रखें।\n4. **भीड़ का ध्यान खींचें**: हॉर्न बजाएं, अलार्म चालू करें और बचाव के लिए जोर से आवाज लगाएं।"
  },
  lost: {
    en: "📁 **LOST DOCUMENTS / ITEMS PROTOCOL**:\n1. **Register NCR (Non-Cognizable Report)**: Essential for replacing government documents (PAN, Aadhaar, Passport) online via local state police digital portals.\n2. **Block Cards & SIM**: Freeze credit cards immediately and call telecom operator to suspend missing SIM card to prevent OTP frauds.\n3. **Track Devices**: Use Google Find My Device or iCloud Find My to remotely locate, lock, or erase lost smartphones.\n4. **Embassy Contacts**: If passport is lost abroad, locate the nearest Indian Consulate/Embassy to issue an Emergency Certificate.",
    hi: "📁 **खोए हुए सामान/दस्तावेज़ की रिपोर्ट**:\n1. **गैर-संज्ञेय रिपोर्ट (NCR) दर्ज करें**: पैन, आधार या पासपोर्ट जैसे मुख्य दस्तावेज खो जाने पर नजदीकी पुलिस पोर्टल पर ऑनलाइन एनसीआर दर्ज कराएं।\n2. **सिम और कार्ड बंद कराएं**: ओटीपी धोखाधड़ी से बचने के लिए तुरंत बैंक कार्ड ब्लॉक कराएं और मोबाइल सिम बंद करने की रिक्वेस्ट दें।\n3. **डिवाइस ट्रैक करें**: गूगल 'Find My Device' का उपयोग कर खोए फोन की लोकेशन जानें या डेटा रीसेट करें।\n4. **दूतावास से संपर्क**: विदेश में पासपोर्ट खोने पर तुरंत स्थानीय भारतीय दूतावास से आपातकालीन प्रमाणपत्र के लिए संपर्क करें।"
  },
  fire: {
    en: "🔥 **FIRE OUTBREAK PROTOCOLS**:\n1. **Call Fire Brigade (101)** immediately. Inform them of building height and trapped people.\n2. **Stay Low & Crawl**: Smoke rises and contains lethal gases. Stay close to the clean air on the floor.\n3. **Test Doors**: Before opening any closed doors, touch them with the back of your hand. If hot, DO NOT open. Find alternate exit.\n4. **Stop, Drop, & Roll**: If clothes catch fire, do not run. Stop, drop to the ground, cover face with hands, and roll back and forth.",
    hi: "🔥 **अग्निकांड आपातकालीन प्रोटोकॉल**:\n1. **तुरंत फायर ब्रिगेड (101) पर कॉल करें**। इमारत की ऊंचाई और फंसे लोगों की सटीक जानकारी दें।\n2. **नीचे झुकें और रेंगें**: जहरीला धुआं हमेशा ऊपर की ओर उठता है; फर्श के निकट साफ हवा बनी रहती है।\n3. **दरवाजा छूकर जांचें**: किसी भी दरवाजे को खोलने से पहले उसे हाथ के पिछले हिस्से से छुएं। गर्म होने पर उसे न खोलें।\n4. **रुकें, झुकें, लेटें**: कपड़ों में आग लगने पर भागें नहीं; जमीन पर लेटकर गोल-गोल घूमें जब तक आग पूरी तरह बुझ न जाए।"
  },
  disaster: {
    en: "🌧️ **DISASTER EMERGENCY GUIDE**:\n1. **Call NDMA (1078) / Air-Sea Rescue (112)**. Keep battery in power-saving mode.\n2. **Earthquake**: Drop, Cover, and Hold on under a sturdy table. Stay away from windows and power lines.\n3. **Floods**: Move immediately to high ground. Avoid passing through flowing water or wet electric poles.\n4. **Official Alerts**: Monitor radio broadcasts, Google Crisis Alerts, and NDMA advisory bulletins continuously.",
    hi: "🌧️ **आपदा प्रबंधन आपातकालीन निर्देश**:\n1. **NDMA (1078) या राज्य आपदा सेल पर संपर्क करें**। फोन को पावर-सेव मोड पर रखें।\n2. **भूकंप**: किसी मजबूत मेज के नीचे घुटनों के बल बैठें और उसे पकड़ कर रखें। खिड़की और बिजली के तारों से दूर रहें।\n3. **बाढ़ / चक्रवात**: तत्काल ऊंचे स्थानों की ओर बढ़ें। बहते पानी या बिजली के खंभों के पास बिल्कुल न जाएं।\n4. **आधिकारिक सलाह**: आपातकालीन सरकारी बुलेटिन और मौसम विभाग (IMD) के निर्देशों को लगातार सुनते रहें।"
  },
  legal: {
    en: "⚖️ **FREE LEGAL AID / ADVISORY**:\n1. **NALSA toll-free Advice (15100)**: Every weaker section, woman, and child in India has the constitutional right to free legal representation and consultations.\n2. **Know Your Rights**: Police cannot detain women after sunset (6 PM) and before sunrise (6 AM) without an explicit judicial magistrate warrant and a female officer present.\n3. **FIR Right**: Access Section 154 CrPC. Police are legally bound to register an FIR for cognizable crimes without jurisdiction excuses (Zero FIR).\n4. **Immediate counsel**: Request Legal Aid counsel support when appearing at any police station enquiry.",
    hi: "⚖️ **मुफ्त कानूनी सलाह और अधिकार**:\n1. **NALSA हेल्पलाइन (15100) डायल करें**: महिलाओं, बच्चों और समाज के कमजोर वर्गों को कानूनी प्रतिनिधित्व और मुफ्त वकील प्राप्त करने का संवैधानिक अधिकार है।\n2. **अधिकारों को जानें**: किसी भी महिला को सूर्यास्त के बाद (शाम 6 बजे) और सूर्योदय से पहले (सुबह 6 बजे) बिना न्यायिक मजिस्ट्रेट के विशेष आदेश और महिला पुलिसकर्मी की उपस्थिति के गिरफ्तार नहीं किया जा सकता।\n3. **जीरो एफआईआर (Zero FIR)**: घटना किसी भी जांच क्षेत्र में हुई हो, पुलिस बिना अधिकार क्षेत्र के बहाने शिकायत दर्ज करने के लिए कानूनी रूप से बाध्य है।\n4. **कानूनी मदद**: किसी भी थाने में पूछताछ के दौरान राज्य विधिक सेवा प्राधिकरण से वकील की मांग करें।"
  }
};

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", gemini_connected: ai !== null });
});

// Primary Chat GPT/Gemini Triage Endpoint
app.post("/api/chat", async (req, res) => {
  const { messages, category, language, medicalProfile, locationName } = req.body;

  // Formulate context instructions
  const currentLang = language || "en";
  const activeCategory = category || "general";
  const currentCategoryLabel = activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);
  const locationContext = locationName || "Rajpath, New Delhi, India";

  const medicalText = medicalProfile
    ? `Patient details:\n- Name: ${medicalProfile.fullName || "Unknown"}\n- Blood Type: ${medicalProfile.bloodType || "Not Specified"}\n- Allergies: ${medicalProfile.allergies || "None declared"}\n- Current Medications: ${medicalProfile.medications || "None"}\n- Vital Info notes: ${medicalProfile.emergencyNotes || "None"}`
    : "No medical ID declared yet.";

  const systemInstruction = `You are Sahayak (सहायक), an ultra-reliable, calming, and high-efficiency emergency AI companion for India.
  Your focus is on providing rapid triage, specific instructions, and action-oriented crisis support to users under high cognitive load.

  Guidelines:
  1. STICK strictly to the requested category: [${currentCategoryLabel}]. Current Location Context is: [${locationContext}].
  2. Maintain a highly professional, supportive, objective, and urgent yet reassuring tone.
  3. Start with 3 or 4 immediate, chronological, bold numbered steps to ensure user safety first.
  4. State the main phone helpline numbers for this category (e.g. Cyber Crime: 1930, Medical: 102/112, Police: 100/112, Women: 1091, Fire: 101, Disaster: 1078, Legal: 15100). Keep numbers written clearly as flat numeric text (e.g. "112", "1930", "102") so they can be parsed by our UI.
  5. Reply and converse in the exact language or style the user utilized to query. For instance, if they ask in Hindi/Hinglish, reply in Hindi/Hinglish. If they query in Marathi, Tamil, Telugu, Bengali, Gujarati, Punjabi, or any other regional language, read their input very carefully, analyze their problem, and respond in that direct language so they feel fully understood.
  6. If medical emergency state is active and the user provided medical info, utilize this content securely to tailor your instructions: [${medicalText}].
  7. Keep replies scannable, spacious, and compact. Max 250 words. Do not use verbose introductions or unnecessary disclosures.`;

  // Try calling Gemini first
  if (ai) {
    try {
      // Build standard contents array
      const apiContents: string[] = [];
      
      // We can pass the history
      if (Array.isArray(messages)) {
        // Prepare conversations
        messages.forEach((msg: any) => {
          const role = msg.sender === "user" ? "user" : "model";
          const suffix = msg.sender === "user" ? `\n(Active category: ${activeCategory})` : "";
          apiContents.push(`${role === "user" ? "User" : "Assistant"}: ${msg.text}${suffix}`);
        });
      }

      const prompt = apiContents.join("\n\n") || `Provide first-line advice for ${currentCategoryLabel} category right now. Use preferred language: ${currentLang}.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.35,
          topP: 0.9,
        },
      });

      const replyText = response.text || "I am processing. Please stay safe.";
      return res.json({ text: replyText });
    } catch (error: any) {
      console.error("Gemini API Error, switching to offline fallback:", error);
      // Fallback
      const fallback = FALLBACK_ADVICE[activeCategory] || FALLBACK_ADVICE["general"];
      const replyText = currentLang === "hi" ? fallback.hi : fallback.en;
      return res.json({ text: replyText, error: error.message });
    }
  } else {
    // Utilize Offline Fallback
    const fallback = FALLBACK_ADVICE[activeCategory] || FALLBACK_ADVICE["general"];
    const replyText = currentLang === "hi" ? fallback.hi : fallback.en;
    return res.json({ text: replyText, isOffline: true });
  }
});

// Voice Input Translation Endpoint (Speeds up response time for transcription fallback)
app.post("/api/voice-input", async (req, res) => {
  const { voiceText, activeLanguage } = req.body;
  
  if (!voiceText) {
    return res.status(400).json({ error: "No voice text provided" });
  }

  const currentLang = activeLanguage || "en";

  if (ai) {
    try {
      const prompt = `Translate or normalize this emergency voice clip text to clear, compact query. User said: "${voiceText}". Respond ONLY with the classified intent and a brief suggestion in preferred language "${currentLang}" on the safest thing to do. Keep it strictly under 3 sentences.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an extreme-triage audio responder for Sahayak Emergency AI.",
          temperature: 0.2,
        }
      });

      return res.json({ text: response.text });
    } catch (error) {
      return res.json({ text: `Understood alert: "${voiceText}"` });
    }
  } else {
    return res.json({ text: `Understood voice directive: "${voiceText}". Please see options below.` });
  }
});

// Interactive AI-powered Complaint Analyzer Route
app.post("/api/analyze-complaint", async (req, res) => {
  const { description, associatedNumber, title, files, language } = req.body;

  if (!description) {
    return res.status(400).json({ error: "No complaint details provided." });
  }

  const prompt = `Analyze the following official citizen emergency report very carefully containing narrative, involved suspicious contact numbers, and uploaded media attachments and classify it into correct department routing:
  Incident Title: ${title || "Citizen Emergency Feed"}
  Associated Number: ${associatedNumber || "None reported"}
  Narrative Report: ${description}
  Evidence Attachments: ${files || "None uploaded"}

  Your response must be a strictly formed valid JSON block containing:
  - classification: One of 'cyber', 'medical', 'women', 'police', 'lost', 'fire', 'disaster', 'legal'
  - confidence: number representing confidence level (e.g. 96)
  - helpline: string - the primary numeric emergency phone number (e.g. "1930" for cyber, "112" for general police or lost, "1091" for women, "102" for medical, "101" for fire, "1078" for disaster)
  - helplineNameEn: string - matching department office name in English (e.g., "National Cyber Crime Helpline" or "Emergency Response Support System")
  - helplineNameHi: string - matching department office name in Hindi (e.g., "राष्ट्रीय साइबर अपराध हेल्पलाईन" or "राष्ट्रीय आपातकालीन सहायता")
  - summaryEn: string - brief 2-3 sentence overview describing why you classified it under this domain, what immediate safety threat exists, and matching regulations or helpful background context.
  - summaryHi: string - brief 2-3 sentence Hindi version of summaryEn
  - remediesEn: string[] - 3 immediate, chronological legal or safety steps/actions the reporter should take.
  - remediesHi: string[] - 3 immediate safety remedies in Devanagari Hindi.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert Indian Government dispatch officer, legal triaging assistant and emergency response classification system for Sahayak AI.",
          temperature: 0.15,
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      return res.json(parsed);
    } catch (error: any) {
      console.warn("Gemini analyzer error, using integrated safety router:", error);
    }
  }

  // Fallback integrated safety routing classification
  const descLower = description.toLowerCase() + " " + (title || "").toLowerCase();
  let classification = "police";
  let helpline = "112";
  let helplineNameEn = "Emergency Response Support";
  let helplineNameHi = "राष्ट्रीय आपातकालीन आपात सहायता (112)";
  
  if (descLower.includes("money") || descLower.includes("financial") || descLower.includes("scam") || descLower.includes("fraud") || descLower.includes("bank") || descLower.includes("cyber") || descLower.includes("hacked") || descLower.includes("atm")) {
    classification = "cyber";
    helpline = "1930";
    helplineNameEn = "National Cyber Crime Helpline";
    helplineNameHi = "राष्ट्रीय साइबर अपराध हेल्पलाइन (1930)";
  } else if (descLower.includes("heart") || descLower.includes("chest") || descLower.includes("blood") || descLower.includes("fracture") || descLower.includes("accident") || descLower.includes("hospital") || descLower.includes("medical") || descLower.includes("doctor")) {
    classification = "medical";
    helpline = "102";
    helplineNameEn = "Emergency Ambulance Response";
    helplineNameHi = "सरकारी एम्बुलेंस सेवा (102)";
  } else if (descLower.includes("women") || descLower.includes("harassment") || descLower.includes("girl") || descLower.includes("teasing") || descLower.includes("stalking") || descLower.includes("domestic")) {
    classification = "women";
    helpline = "1091";
    helplineNameEn = "Women Safety Helpline";
    helplineNameHi = "महिला सुरक्षा हेल्पलाइन (1091)";
  } else if (descLower.includes("fire") || descLower.includes("smoke") || descLower.includes("cylinder") || descLower.includes("blast")) {
    classification = "fire";
    helpline = "101";
    helplineNameEn = "Fire Control Incident Support";
    helplineNameHi = "फायर कंट्रोल केंद्र (101)";
  } else if (descLower.includes("flood") || descLower.includes("earthquake") || descLower.includes("cyclone") || descLower.includes("disaster") || descLower.includes("landslide")) {
    classification = "disaster";
    helpline = "1078";
    helplineNameEn = "NDMA National Disaster Control";
    helplineNameHi = "एनडीएमए आपदा नियंत्रण (1078)";
  } else if (descLower.includes("aadhaar") || descLower.includes("passport") || descLower.includes("pan") || descLower.includes("wallet") || descLower.includes("lost") || descLower.includes("documents")) {
    classification = "lost";
    helpline = "112";
    helplineNameEn = "ERSS Lost Documents Desk";
    helplineNameHi = "गैर-संज्ञेय खोया सामान डेस्क (112)";
  }

  return res.json({
    classification,
    confidence: 85,
    helpline,
    helplineNameEn,
    helplineNameHi,
    summaryEn: `Sahayak offline guard classified this crisis report into "${classification.toUpperCase()}" with localized rescue priorities. Immediate response recommended.`,
    summaryHi: `सहायक ऑफलाइन सुरक्षा गार्ड ने इस संकट रिपोर्ट को स्थानीय प्राथमिकताओं के साथ "${classification.toUpperCase()}" में वर्गीकृत किया है।`,
    remediesEn: [
      `Contact the designated helpline ${helpline} for immediate dispatch or counseling support.`,
      "Synthesize all transaction records, suspect calls, or location information for official logs.",
      "Stay in a safe zone, keep coordinates visible to legal family files."
    ],
    remediesHi: [
      `तत्काल समाधान के लिए निर्धारित हेल्पलाइन नंबर ${helpline} पर संपर्क करें।`,
      "सभी डिजिटल ट्रांजैक्सन्स, संदिग्ध वार्तालाप और मीडिया साक्ष्यों को ऑफलाइन सुरक्षित रखें।",
      "सत्यापित सुरक्षित स्थान पर चले जाएं और सहेजे गए सुरक्षा संपर्कों के साथ जीपीएस साझा रखें।"
    ]
  });
});

// In-memory secure OTP storage mapping email address -> verification code and expiry time
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Real Email OTP dispatcher
app.post("/api/send-otp", async (req, res) => {
  const { email, language } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  // Generate a cryptographically random-looking 6 digit pin
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Load SMTP config
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const sender = process.env.SMTP_SENDER_EMAIL || user || "no-reply@sahayak-security.org";

  const isConfigured = user.trim().length > 0 && pass.trim().length > 0;

  if (isConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass
        }
      });

      const subject = language === "hi" 
        ? `सहायक सुरक्षा डेस्क - नागरिक सत्यापन ओटीपी: ${otp}` 
        : `Sahayak Official Security Desk - Citizen Verification OTP: ${otp}`;

      const textOutput = language === "hi" 
        ? `प्रिय नागरिक, आपकी आपातकालीन शिकायत आधिकारिक रूप से दर्ज करने के लिए आपका सुरक्षा सत्यापन कोड: ${otp} है।`
        : `Dear Citizen, your secure verification code for logging official incidents via Sahayak is: ${otp}`;

      const htmlOutput = `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 2px;">SAHAYAK AI 🇮🇳</span>
            <div style="margin-top: 8px; font-size: 14px; color: #cbd5e1; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Official Citizen Dispatch Core</div>
          </div>
          
          <div style="padding: 32px 24px; color: #1e293b;">
            <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #0f172a;">Legal Identity Verification</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">You are registering an official incident report or query in the Sahayak secure emergency database. Please utilize this One-Time Password (OTP) to authenticate your access:</p>
            
            <div style="text-align: center; margin: 36px 0; background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px 0;">
              <span style="font-family: 'JetBrains Mono', Courier, monospace; font-size: 36px; font-weight: 800; color: #4338ca; letter-spacing: 6px;">${otp}</span>
            </div>
            
            <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-bottom: 0;">This security key expires in 10 minutes. <strong>Never share this OTP with anyone, including emergency responders.</strong></p>
          </div>
          
          <div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: 500;">
            Government Emergency Response Support System Proxy Client
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"Sahayak Verification Desk" <${sender}>`,
        to: email,
        subject,
        text: textOutput,
        html: htmlOutput
      });

      // Save OTP to secure in-memory server cache
      otpStore.set(email.toLowerCase(), {
        otp,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes validity
      });

      console.log(`[SMTP OTP] Securely saved and dispatched Email OTP to ${email}`);
      return res.json({ success: true });

    } catch (smtpErr: any) {
      console.error("[SMTP OTP Failure] Outbound envelope failed.", smtpErr);
      return res.status(500).json({
        success: false,
        error: language === 'hi' 
          ? `ईमेल भेजने में असमर्थ: ${smtpErr.message || "त्रुटि"}। कृपया जांचें कि आपने पासवर्ड के बजाय १६-अक्षर का गूगल ऐप पासवर्ड (App Password) सेट किया है।`
          : `Outbound SMTP sending failed: ${smtpErr.message || "Unknown SMTP Error"}. Gmail often blocks standard passwords. Please make sure to create and specify a 16-character 'App Password' (Security -> 2-Step Verification -> App Passwords) for SMTP_PASS inside AI Studio Secrets.`
      });
    }
  } else {
    console.log(`[SMTP Settings Empty] Cannot dispatch email to ${email} as SMTP credentials are unset.`);
    return res.status(400).json({
      success: false,
      error: language === 'hi'
        ? `जीमेल एसएमटीपी (SMTP) क्रेडेंशियल खाली हैं! कृपया असली ईमेल ओटीपी प्राप्त करने के लिए एआई स्टूडियो सेटिंग्स (Settings -> Secrets) में 'SMTP_USER' (अपना जीमेल पता) और 'SMTP_PASS' (गूगल ऐप पासवर्ड) प्रविष्ट करें।`
        : `Email credentials are not configured! Please click 'Settings' -> 'Secrets' in the AI Studio panel and supply your 'SMTP_USER' (your Gmail address) and 'SMTP_PASS' (a 16-character Google App Password) to allow sending verification codes to your real email.`
    });
  }
});

// Real Email OTP Verifier
app.post("/api/verify-otp", (req, res) => {
  const { email, otp, language } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, error: "Email and OTP are required." });
  }

  const record = otpStore.get(email.toLowerCase());
  if (!record) {
    return res.status(400).json({
      success: false,
      error: language === "hi"
        ? "इस ईमेल के लिए कोई सक्रिय ओटीपी अनुरोध नहीं मिला या कोड की समय सीमा समाप्त हो गई है।"
        : "No active verification request found for this email address or the code has expired."
    });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return res.status(400).json({
      success: false,
      error: language === "hi"
        ? "ओटीपी कोड की समय सीमा समाप्त हो गई है। कृपया पुनः नया ओटीपी भेजें।"
        : "Your verification code has expired. Please request a new OTP."
    });
  }

  if (record.otp === otp.trim()) {
    otpStore.delete(email.toLowerCase());
    return res.json({ success: true });
  } else {
    return res.status(400).json({
      success: false,
      error: language === "hi"
        ? "अमान्य सत्यापन कोड! कृपया अपने जीमेल पर प्राप्त सही ६-अंकीय कोड दर्ज करें।"
        : "Invalid code entered. Please check your Gmail box for the correct 6-digit OTP."
    });
  }
});

// Configure Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware mounted successfully.");
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production static elements from:", distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sahayak backend server running on http://localhost:${PORT}`);
  });
}

startServer();
