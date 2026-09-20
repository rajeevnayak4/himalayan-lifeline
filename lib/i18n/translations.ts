export type Language = "en" | "ne" | "hi";

export interface TranslationDict {
  appTitle: string;
  tagline: string;
  roleTrekker: string;
  roleGuide: string;
  roleLodge: string;
  roleVillager: string;
  roleRescue: string;
  
  // Emergency Trigger
  sosButton: string;
  sosSubtext: string;
  cancelPrompt: string;
  cancelButton: string;
  triggeredTitle: string;
  searchingResponders: string;
  respondersEnRoute: string;
  etaLabel: string;
  
  // Offline & Mesh
  offlineWarning: string;
  offlineQueued: string;
  meshBroadcasting: string;
  meshRelayDesc: string;
  viewMeshPath: string;
  
  // Injury Types
  injuryFall: string;
  injuryAltitude: string;
  injuryHypothermia: string;
  injuryAvalanche: string;
  injuryOther: string;
  
  // Responder Actions
  newAlertHeader: string;
  iCanHelp: string;
  enRoute: string;
  haveArrived: string;
  notifyRescueTeam: string;
  listenAlert: string;
  stopAudio: string;
  
  // Form / Info
  voiceNotePrompt: string;
  recordVoice: string;
  stopRecording: string;
  voiceRecorded: string;
  elevation: string;
  distanceKm: string;
  battery: string;
  route: string;
  statusActive: string;
  statusResponding: string;
  statusResolved: string;
}

export const translations: Record<Language, TranslationDict> = {
  en: {
    appTitle: "Himalayan Lifeline",
    tagline: "Off-Grid Mountain Emergency SOS & Mesh Rescue Network",
    roleTrekker: "Trekker / Climber",
    roleGuide: "Local Guide (Sherpa)",
    roleLodge: "Lodge Owner",
    roleVillager: "Local Villager",
    roleRescue: "Rescue Coordinator (HQ)",

    sosButton: "HOLD TO SEND SOS",
    sosSubtext: "Transmits GPS coordinates, altitude, injury details & voice note immediately",
    cancelPrompt: "Cancelling distress call in",
    cancelButton: "CANCEL FALSE ALARM",
    triggeredTitle: "DISTRESS BEACON BROADCASTING",
    searchingResponders: "Pinging registered responders within 10km radius...",
    respondersEnRoute: "Local responders are actively moving toward your coordinates",
    etaLabel: "Estimated Arrival",

    offlineWarning: "NO CELLULAR / SATELLITE CONNECTION",
    offlineQueued: "Saved to Offline Memory. Relaying via Peer-to-Peer Bluetooth Mesh...",
    meshBroadcasting: "Broadcasting packet via nearby trail nodes...",
    meshRelayDesc: "Your SOS packet is hopping between nearby trekkers and solar mountain repeaters until it reaches an internet gateway.",
    viewMeshPath: "Inspect Mesh Relay Telemetry",

    injuryFall: "Fall / Fracture",
    injuryAltitude: "Severe Altitude Sickness (HAPE/HACE)",
    injuryHypothermia: "Hypothermia / Frostbite",
    injuryAvalanche: "Lost / Avalanche",
    injuryOther: "General Medical Distress",

    newAlertHeader: "EMERGENCY DISTRESS NEARBY",
    iCanHelp: "I CAN HELP (ACKNOWLEDGE)",
    enRoute: "I AM EN ROUTE",
    haveArrived: "I HAVE ARRIVED AT VICTIM",
    notifyRescueTeam: "NOTIFY ARMY / HELICOPTER",
    listenAlert: "🔊 Listen Alert (Voice)",
    stopAudio: "Stop Audio",

    voiceNotePrompt: "Record 10s Voice Distress Note (Optional)",
    recordVoice: "Tap to Record Voice",
    stopRecording: "Stop Recording",
    voiceRecorded: "Voice note recorded and attached to payload",
    elevation: "Altitude",
    distanceKm: "Distance",
    battery: "Device Battery",
    route: "Trek Route",
    statusActive: "Active Distress",
    statusResponding: "Responders En Route",
    statusResolved: "Safely Resolved",
  },
  ne: {
    appTitle: "हिमालयन लाइफलाइन",
    tagline: "नेटवर्क नहुँदा पनि चल्ने आपतकालीन उद्धार तथा मेस नेटवर्क",
    roleTrekker: "यात्री / पदयात्री (Trekker)",
    roleGuide: "स्थानीय गाइड (शेर्पा)",
    roleLodge: "लज / होटल सञ्चालक",
    roleVillager: "स्थानीय बासिन्दा",
    roleRescue: "उद्धार समन्वय केन्द्र (HQ)",

    sosButton: "आपतकालीन SOS थिच्नुहोस्",
    sosSubtext: "GPS स्थान, उचाइ, चोटपटक र आवाज तुरुन्तै पठाउँछ",
    cancelPrompt: "अलार्म रद्द गर्न बाँकी समय:",
    cancelButton: "रद्द गर्नुहोस् (झूटो अलार्म)",
    triggeredTitle: "उद्धार सन्देश प्रसारण हुँदैछ",
    searchingResponders: "१० कि.मी. भित्रका उद्धारकर्ताहरूलाई सन्देश पठाउँदैछ...",
    respondersEnRoute: "स्थानीय उद्धारकर्ताहरू तपाईंतर्फ आउँदैछन्",
    etaLabel: "आइपुग्ने अनुमानित समय",

    offlineWarning: "मोबाइल नेटवर्क छैन (अफलाइन)",
    offlineQueued: "अफलाइन भण्डारण गरियो। नजिकका फोनहरू मार्फत सन्देश पठाउँदै...",
    meshBroadcasting: "ब्लुटुथ मेस मार्फत नजिकका साथीहरूलाई पठाउँदै...",
    meshRelayDesc: "तपाईंको सन्देश इन्टरनेट भएको ठाउँमा नपुगुन्जेल नजिकका डिभाइसहरूबाट सर्दै जान्छ।",
    viewMeshPath: "मेस रिले विवरण हेर्नुहोस्",

    injuryFall: "लडेको / हड्डी भाँचिएको",
    injuryAltitude: "लेक लागेको (HAPE / HACE)",
    injuryHypothermia: "अत्यधिक चिसो / कठ्याङ्ग्रिएको",
    injuryAvalanche: "हराएको / हिमपहिरो",
    injuryOther: "अन्य आपतकालीन समस्या",

    newAlertHeader: "नजिकै आपतकालीन उद्धार चाहिएको छ!",
    iCanHelp: "म सहयोग गर्न सक्छु (स्वीकार)",
    enRoute: "म बाटोमा आउँदैछु",
    haveArrived: "म बिरामी भएको ठाउँमा पुगेँ",
    notifyRescueTeam: "सेना / हेलिकप्टरलाई खबर गर्नुहोस्",
    listenAlert: "🔊 आवाजमा सुन्नुहोस्",
    stopAudio: "आवाज बन्द गर्नुहोस्",

    voiceNotePrompt: "१० सेकेन्डको आवाज रेकर्ड गर्नुहोस्",
    recordVoice: "आवाज रेकर्ड गर्न थिच्नुहोस्",
    stopRecording: "रेकर्ड बन्द गर्नुहोस्",
    voiceRecorded: "आवाज रेकर्ड भयो",
    elevation: "उचाइ",
    distanceKm: "दूरी",
    battery: "ब्याट्री",
    route: "पदयात्रा मार्ग",
    statusActive: "आपतकालीन अवस्था",
    statusResponding: "उद्धारकर्ता बाटोमा",
    statusResolved: "उद्धार सम्पन्न भयो",
  },
  hi: {
    appTitle: "हिमालयन लाइफलाइन",
    tagline: "ऑफ-ग्रिड पर्वतीय आपातकालीन एसओएस और मेश बचाव नेटवर्क",
    roleTrekker: "यात्री / पर्वतारोही",
    roleGuide: "स्थानीय गाइड (शेरपा)",
    roleLodge: "लॉज / होटल मालिक",
    roleVillager: "स्थानीय निवासी",
    roleRescue: "बचाव समन्वय केंद्र",

    sosButton: "एसओएस (SOS) भेजें",
    sosSubtext: "जीपीएस स्थान, ऊंचाई और आवाज तुरंत नजदीकी लोगों को भेजता है",
    cancelPrompt: "अलार्म रद्द करने के लिए समय:",
    cancelButton: "रद्द करें (गलत अलार्म)",
    triggeredTitle: "संकट संकेत प्रसारित हो रहा है",
    searchingResponders: "10 किमी के भीतर मददगारों को खोजा जा रहा है...",
    respondersEnRoute: "स्थानीय बचावकर्ता आपकी ओर आ रहे हैं",
    etaLabel: "अनुमानित समय",

    offlineWarning: "नेटवर्क उपलब्ध नहीं है (ऑफलाइन)",
    offlineQueued: "ऑफलाइन सुरक्षित। ब्लूटूथ मेश से भेजा जा रहा है...",
    meshBroadcasting: "पास के उपकरणों के माध्यम से प्रसारित किया जा रहा है...",
    meshRelayDesc: "आपका संदेश तब तक अन्य फोनों से होकर गुजरेगा जब तक नेटवर्क नहीं मिल जाता।",
    viewMeshPath: "मेश रिले पथ देखें",

    injuryFall: "गिरना / हड्डी टूटना",
    injuryAltitude: "ऊंचाई की बीमारी (HAPE/HACE)",
    injuryHypothermia: "अत्यधिक ठंड / हाइपोथर्मिया",
    injuryAvalanche: "खो जाना / हिमस्खलन",
    injuryOther: "अन्य आपातकालीन स्थिति",

    newAlertHeader: "पास में आपातकालीन सहायता की आवश्यकता है!",
    iCanHelp: "मैं मदद कर सकता हूँ",
    enRoute: "मैं रास्ते में हूँ",
    haveArrived: "मैं पीड़ित के पास पहुँच गया हूँ",
    notifyRescueTeam: "सेना / हेलीकॉप्टर को सूचित करें",
    listenAlert: "🔊 आवाज में सुनें",
    stopAudio: "ध्वनि बंद करें",

    voiceNotePrompt: "10 सेकंड का वॉइस नोट रिकॉर्ड करें",
    recordVoice: "रिकॉर्ड करने के लिए दबाएं",
    stopRecording: "रिकॉर्डिंग बंद करें",
    voiceRecorded: "आवाज सफलतापूर्वक रिकॉर्ड हो गई",
    elevation: "ऊंचाई",
    distanceKm: "दूरी",
    battery: "बैटरी",
    route: "ट्रेक मार्ग",
    statusActive: "सक्रिय संकट",
    statusResponding: "बचावकर्ता रास्ते में",
    statusResolved: "सुरक्षित रूप से सुलझाया गया",
  },
};
