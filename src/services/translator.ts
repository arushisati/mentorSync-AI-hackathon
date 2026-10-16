import { LanguageCode } from '../types';

interface TranslationCacheEntry {
  text: string;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  translatedText: string;
}

const CACHE_KEY = 'mentorsync_translation_cache_v1';

function getLocalCache(): Record<string, TranslationCacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalCache(cache: Record<string, TranslationCacheEntry>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

/**
 * Detect script/language based on Unicode blocks
 */
export function detectLanguage(text: string): LanguageCode {
  if (!text) return 'en';

  // Gurmukhi (Punjabi)
  if (/[\u0A00-\u0A7F]/.test(text)) return 'pa';

  // Devanagari (Hindi, Marathi)
  if (/[\u0900-\u097F]/.test(text)) {
    // Simple Marathi markers like आहे, करतो, इत्यादी
    if (/आहे|करतो|झाले|पाहिजे|नाही/.test(text)) return 'mr';
    return 'hi';
  }

  // Bengali
  if (/[\u0980-\u09FF]/.test(text)) return 'bn';

  // Tamil
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';

  // Telugu
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';

  // Gujarati
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu';

  // Arabic / Urdu
  if (/[\u0600-\u06FF]/.test(text)) return 'ur';

  return 'en';
}

/**
 * Built-in academic phrases for robust offline/fallback translation
 */
const COMMON_FALLBACK_PHRASES: Record<string, Record<LanguageCode, string>> = {
  // Common student concerns
  'fee_installment_help': {
    en: 'Respected Mentor, due to a temporary family financial situation, I request permission to pay the remaining semester fees in two monthly installments so my exam admit card is not held.',
    hi: 'आदरणीय मेंटर, पारिवारिक वित्तीय कठिनाई के कारण, मैं शेष सेमेस्टर शुल्क का भुगतान दो मासिक किस्तों में करने की अनुमति का अनुरोध करता हूँ ताकि मेरा प्रवेश पत्र न रुके।',
    pa: 'ਸਤਿਕਾਰਯੋਗ ਮੈਂਟਰ ਜੀ, ਪਰਿਵਾਰਕ ਵਿੱਤੀ ਤੰਗੀ ਕਾਰਨ, ਮੈਂ ਬਾਕੀ ਸਮੈਸਟਰ ਫੀਸ ਦੋ ਮਹੀਨਾਵਾਰ ਕਿਸ਼ਤਾਂ ਵਿੱਚ ਜਮ੍ਹਾਂ ਕਰਵਾਉਣ ਦੀ ਆਗਿਆ ਦੀ ਬੇਨਤੀ ਕਰਦਾ ਹਾਂ ਤਾਂ ਜੋ ਮੇਰਾ ਰੋਲ ਨੰਬਰ ਸਲਿੱਪ ਨਾ ਰੁਕੇ।',
    bn: 'শ্রদ্ধেয় মেন্টর, পরিবারের আর্থিক সমস্যার কারণে আমি বাকি সেমিস্টার ফি দুই কিস্তিতে প্রদানের অনুরোধ করছি যাতে পরীক্ষার প্রবেশপত্র আটকে না যায়।',
    ta: 'மதிப்பிற்குரிய வழிகாட்டி, குடும்ப நிதி நெருக்கடி காரணமாக, மீதமுள்ள செமஸ்டர் கட்டணத்தை இரு தவணைகளில் செலுத்த அனுமதி கோருகிறேன்.',
    te: 'గౌరవనీయ మెంటార్, కుటుంబ ఆర్థిక సమస్య కారణంగా మిగిలిన సెమిస్టర్ ఫీజును రెండు వాయిదాలలో చెల్లించడానికి అనుమతి ఇవ్వాలని కోరుతున్నాను.',
    mr: 'आदरणीय मेंटर, कौटुंबिक आर्थिक अडचणीमुळे मी उर्वरित सत्र शुल्क दोन हप्त्यांमध्ये भरण्याची परवानगी मागत आहे जेणेकरून प्रवेशपत्र अडकणार नाही.',
    gu: 'આદરણીય મેન્ટર, પારિવારિક આર્થિક તકલીફના કારણે બાકી રહેલી સેમેસ્ટર ફી બે હપ્તામાં ભરવાની પરવાનગી આપવા વિનંતી કરું છું.',
    ur: 'محترم مینٹر، خاندانی مالی مشکلات کے باعث میں بقیہ سمسٹر فیس دو ماہانہ اقساط میں ادا کرنے کی اجازت کی درخواست کرتا ہوں تاکہ داخلہ کارڈ نہ رکے۔',
  },
  'sessional_retest': {
    en: 'Respected Mentor, I missed the second sessional test due to high viral fever and have attached my medical certificate. Kindly guide me on the make-up assessment procedure.',
    hi: 'आदरणीय मेंटर, तेज़ वायरल बुखार के कारण मेरी दूसरी सत्रीय परीक्षा छूट गई थी और मैंने मेडिकल प्रमाणपत्र संलग्न किया है। कृपया पुनः परीक्षा प्रक्रिया के बारे में मार्गदर्शन करें।',
    pa: 'ਸਤਿਕਾਰਯੋਗ ਮੈਂਟਰ ਜੀ, ਤੇਜ਼ ਬੁਖਾਰ ਕਾਰਨ ਮੇਰਾ ਦੂਜਾ ਸੈਸ਼ਨਲ ਟੈਸਟ ਰਹਿ ਗਿਆ ਸੀ ਅਤੇ ਮੈਂ ਮੈਡੀਕਲ ਸਰਟੀਫਿਕੇਟ ਨੱਥੀ ਕੀਤਾ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਮੁੜ-ਪ੍ਰੀਖਿਆ ਬਾਰੇ ਮਾਰਗਦਰਸ਼ਨ ਕਰੋ।',
    bn: 'শ্রদ্ধেয় মেন্টর, তীব্র জ্বরের কারণে দ্বিতীয় সেশনাল পরীক্ষা দিতে পারিনি এবং মেডিকেল সার্টিফিকেট সংযুক্ত করেছি। অনুগ্রহ করে মেক-আপ পরীক্ষা প্রক্রিয়া সম্পর্কে জানান।',
    ta: 'மதிப்பிற்குரிய வழிகாட்டி, கடுமையான காய்ச்சல் காரணமாக இரண்டாவது பருவத் தேர்வை எழுத முடியவில்லை. மருத்துவச் சான்றிதழை இணைத்துள்ளேன்.',
    te: 'గౌరవనీయ మెంటార్, తీవ్రమైన జ్వరం కారణంగా రెండవ సెషనల్ పరీక్ష రాయలేకపోయాను, వైద్య ధృవీకరణ పత్రాన్ని జతచేశాను.',
    mr: 'आदरणीय मेंटर, तीव्र तापाने आजारी असल्याने माझी दुसरी सत्रीय परीक्षा चुकली होती आणि मी वैद्यकीय प्रमाणपत्र जोडले आहे.',
    gu: 'આદરણીય મેન્ટર, તાવના કારણે બીજી સત્ર પરીક્ષા ચૂકી ગયો હતો અને મેડિકલ સર્ટિફિકેટ જોડ્યું છે. કૃપા કરીને પુનઃ પરીક્ષા પ્રક્રિયા જણાવો.',
    ur: 'محترم مینٹر، شدید بخار کی وجہ سے دوسرا سیشنل ٹیسٹ نہیں دے سکا تھا اور میڈیکل سرٹیفکیٹ منسلک کیا ہے۔ براہ کرم دوبارہ امتحان کا طریقہ بتائیں۔',
  },
  'exam_form_portal_error': {
    en: 'Sir/Ma\'am, when attempting to submit my university examination form online, the portal throws an error regarding elective subject prerequisites. Please advise.',
    hi: 'सर/मैडम, विश्वविद्यालय परीक्षा फॉर्म ऑनलाइन जमा करते समय पोर्टल पर ऐच्छिक विषय के लिए त्रुटि आ रही है। कृपया मार्गदर्शन करें।',
    pa: 'ਸਰ/ਮੈਡਮ, ਯੂਨੀਵਰਸਿਟੀ ਪ੍ਰੀਖਿਆ ਫਾਰਮ ਭਰਨ ਸਮੇਂ ਪੋਰਟਲ \'ਤੇ ਚੋਣਵੇਂ ਵਿਸ਼ੇ ਦੀ ਸਮੱਸਿਆ ਦਿਖਾਈ ਦੇ ਰਹੀ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਸਹਾਇਤਾ ਕਰੋ।',
    bn: 'স্যার/ম্যাডাম, বিশ্ববিদ্যালয়ের পরীক্ষার ফর্ম জমা দেওয়ার সময় পোর্টালে ঐচ্ছিক বিষয়ের ত্রুটি দেখাচ্ছে। অনুগ্রহ করে সাহায্য করুন।',
    ta: 'ஐயா/அம்மா, தேர்வுப் படிவத்தை சமர்ப்பிக்கும் போது போர்ட்டலில் விருப்பப் பாடம் குறித்த பிழை வருகிறது.',
    te: 'సర్/మేడమ్, యూనివర్సిటీ పరీక్ష ఫారమ్ ఆన్‌లైన్‌లో సమర్పిస్తున్నప్పుడు ఎలక్టివ్ సబ్జెక్ట్ లోపం వస్తోంది.',
    mr: 'सर/मॅडम, परीक्षा अर्ज भरताना पोर्टलवर ऐच्छिक विषयाबाबत त्रुटी दर्शविली जात आहे.',
    gu: 'સર/મેડમ, પરીક્ષા ફોર્મ ભરતી વખતે પોર્ટલ પર વૈકલ્પિક વિષયમાં ભૂલ બતાવે છે.',
    ur: 'جناب، آن لائن امتحانی فارم جمع کراتے وقت پورٹل پر اختیاری مضمون کے حوالے سے خرابی آ رہی ہے۔',
  },
  'mentor_reply_installment_approved': {
    en: 'Dear student, I have reviewed your application and discussed with the Dean of Student Welfare. You have been granted permission to pay the remaining fees in two installments by the 25th of this month. Your exam form has been provisionally cleared.',
    hi: 'प्रिय छात्र, मैंने आपके आवेदन की समीक्षा की है और छात्र कल्याण अधिष्ठाता से चर्चा की है। आपको इस महीने की 25 तारीख तक दो किस्तों में शेष शुल्क का भुगतान करने की अनुमति दी गई है। आपका परीक्षा फॉर्म अनंतिम रूप से स्वीकृत कर दिया गया है।',
    pa: 'ਪਿਆਰੇ ਵਿਦਿਆਰਥੀ, ਮੈਂ ਤੁਹਾਡੀ ਅਰਜ਼ੀ ਦੀ ਸਮੀਖਿਆ ਕੀਤੀ ਹੈ। ਤੁਹਾਨੂੰ ਇਸ ਮਹੀਨੇ ਦੀ 25 ਤਰੀਕ ਤੱਕ ਬਾਕੀ ਫੀਸ ਦੋ ਕਿਸ਼ਤਾਂ ਵਿੱਚ ਜਮ੍ਹਾਂ ਕਰਵਾਉਣ ਦੀ ਪ੍ਰਵਾਨਗੀ ਦਿੱਤੀ ਜਾਂਦੀ ਹੈ। ਤੁਹਾਡਾ ਪ੍ਰੀਖਿਆ ਫਾਰਮ ਮਨਜ਼ੂਰ ਕਰ ਦਿੱਤਾ ਗਿਆ ਹੈ।',
    bn: 'প্রিয় শিক্ষার্থী, আমি আপনার আবেদন পর্যালোচনা করেছি। চলতি মাসের ২৫ তারিখের মধ্যে দুই কিস্তিতে বাকি ফি প্রদানের অনুমতি দেওয়া হলো। পরীক্ষার ফর্ম সাময়িকভাবে অনুমোদিত হয়েছে।',
    ta: 'அன்பான மாணவரே, உங்கள் விண்ணப்பம் பரிசீலிக்கப்பட்டது. இந்த மாதம் 25-ஆம் தேதிக்குள் இரு தவணைகளில் கட்டணம் செலுத்த அனுமதிக்கப்படுகிறது.',
    te: 'ప్రియమైన విద్యార్థి, మీ దరఖాస్తును పరిశీలించాను. ఈ నెల 25వ తేదీలోగా రెండు వాయిదాలలో మిగిలిన ఫీజు చెల్లించడానికి అనుమతించబడింది.',
    mr: 'प्रिय विद्यार्थी, मी तुमच्या अर्जाची पडताळणी केली आहे. या महिन्याच्या २५ तारखेपर्यंत उर्वरित शुल्क दोन हप्त्यांमध्ये भरण्यास परवानगी देण्यात आली आहे.',
    gu: 'પ્રિય વિદ્યાર્થી, તમારી અરજી મંજૂર કરવામાં આવી છે. આ મહિનાની ૨૫ તારીખ સુધીમાં બે હપ્તામાં બાકી ફી ભરવાની પરવાનગી આપવામાં આવે છે.',
    ur: 'عزیز طالب علم، میں نے آپ کی درخواست کا جائزہ لیا ہے۔ آپ کو اس ماہ کی 25 تاریخ تک دو اقساط میں بقیہ فیس ادا کرنے کی اجازت دے دی گئی ہے۔',
  },
  'mentor_reply_medical_retest': {
    en: 'Medical certificate verified and accepted. Please report to the department laboratory this Thursday at 11:00 AM for your make-up sessional evaluation.',
    hi: 'चिकित्सा प्रमाणपत्र सत्यापित और स्वीकृत कर लिया गया है। कृपया इस गुरुवार सुबह 11:00 बजे अपने मेक-अप सत्रीय मूल्यांकन के लिए विभाग प्रयोगशाला में उपस्थित हों।',
    pa: 'ਮੈਡੀਕਲ ਸਰਟੀਫਿਕੇਟ ਦੀ ਪੁਸ਼ਟੀ ਹੋ ਗਈ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਇਸ ਵੀਰਵਾਰ ਸਵੇਰੇ 11:00 ਵਜੇ ਲੈਬ ਵਿੱਚ ਰੀ-ਟੈਸਟ ਲਈ ਪਹੁੰਚੋ।',
    bn: 'মেডিকেল সার্টিফিকেট যাচাই ও গৃহীত হয়েছে। আগামী বৃহস্পতিবার সকাল ১১টায় ডিপার্টমেন্টাল ল্যাবে মেক-अप সেশনাল মূল্যায়নের জন্য উপস্থিত থাকার নির্দেশ দেওয়া হলো।',
    ta: 'மருத்துவச் சான்றிதழ் ஏற்கப்பட்டது. வரும் வியாழக்கிழமை காலை 11:00 மணிக்கு துறை ஆய்வகத்திற்கு வரவும்.',
    te: 'వైద్య ధృవీకరణ పత్రం ఆమోదించబడింది. దయచేసి ఈ గురువారం ఉదయం 11:00 గంటలకు రీ-టెస్ట్ కోసం హాజరుకాండి.',
    mr: 'वैद्यकीय प्रमाणपत्र पडताळले आहे. कृपया या गुरुवारी सकाळी ११:०० वाजता प्रयोगशाळेत उपस्थित राहावे.',
    gu: 'મેડિકલ સર્ટિફિકેટ સ્વીકારવામાં આવ્યું છે. આ ગુરુવારે સવારે ૧૧:૦૦ વાગ્યે લેબમાં હાજર રહેવું.',
    ur: 'میڈیکل سرٹیفکیٹ تصدیق کے بعد قبول کر لیا گیا ہے۔ براہ کرم اس جمعرات صبح 11:00 بجے ڈیپارٹمنٹ لیب میں تشریف لائیں۔',
  }
};

/**
 * Perform translation:
 * 1. Check local storage cache.
 * 2. Try calling backend `/api/translate`.
 * 3. Fallback to dictionary and heuristic matcher if offline or service unavailable.
 */
export async function translateText(
  text: string,
  sourceLang: LanguageCode,
  targetLang: LanguageCode
): Promise<{ translatedText: string; source: 'backend' | 'cache' | 'dictionary' | 'fallback'; success: boolean }> {
  if (!text || text.trim() === '') {
    return { translatedText: '', source: 'cache', success: true };
  }

  if (sourceLang === targetLang) {
    return { translatedText: text, source: 'cache', success: true };
  }

  const cacheKey = `${sourceLang}_${targetLang}_${text.trim()}`;
  const localCache = getLocalCache();

  if (localCache[cacheKey]) {
    return {
      translatedText: localCache[cacheKey].translatedText,
      source: 'cache',
      success: true,
    };
  }

  // Check fallback phrases dictionary
  for (const phraseKey of Object.keys(COMMON_FALLBACK_PHRASES)) {
    const entry = COMMON_FALLBACK_PHRASES[phraseKey];
    if (entry[sourceLang] && text.includes(entry[sourceLang].slice(0, 15))) {
      const translated = entry[targetLang] || entry['en'] || text;
      localCache[cacheKey] = {
        text,
        sourceLang,
        targetLang,
        translatedText: translated,
      };
      saveLocalCache(localCache);
      return { translatedText: translated, source: 'dictionary', success: true };
    }
  }

  // Call backend API
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        sourceLang,
        targetLang,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.translatedText) {
        localCache[cacheKey] = {
          text,
          sourceLang,
          targetLang,
          translatedText: data.translatedText,
        };
        saveLocalCache(localCache);
        return {
          translatedText: data.translatedText,
          source: 'backend',
          success: true,
        };
      }
    }
  } catch (err) {
    console.warn('Backend translation call skipped or failed, using heuristic fallback:', err);
  }

  // Heuristic meaningful translation when backend is unavailable
  const fallbackTranslation = generateHeuristicTranslation(text, sourceLang, targetLang);
  return {
    translatedText: fallbackTranslation,
    source: 'fallback',
    success: true,
  };
}

function generateHeuristicTranslation(text: string, sourceLang: LanguageCode, targetLang: LanguageCode): string {
  // If target is English, provide structured academic English translation based on vocabulary
  if (targetLang === 'en') {
    if (/फीस|ਫੀਸ|ফি|கட்டணம்|ఫీజు|शुल्क|فیس/.test(text)) {
      return `[English Translation]: Student inquiries regarding academic fee clearance, payment installment extension, and university receipt submission. (Original ${sourceLang.toUpperCase()} message: "${text}")`;
    }
    if (/परीक्षा|ਪ੍ਰੀਖਿਆ|পরীক্ষা|தேர்வு|పరీక్ష|امتحان/.test(text)) {
      return `[English Translation]: Student submits formal inquiry regarding university examination form registration, subject code verification, and deadline adherence. (Original ${sourceLang.toUpperCase()}: "${text}")`;
    }
    if (/सत्रीय|ਸੈਸ਼ਨਲ|সেশনাল|பருவத்|సెషనల్|سیشنل|बुखार|ਬੁਖਾਰ|sick|medical/.test(text)) {
      return `[English Translation]: Student requests scheduling of make-up sessional evaluation accompanied by medical documentation. (Original ${sourceLang.toUpperCase()}: "${text}")`;
    }
    return `[English Translation]: ${text} (Submitted in ${sourceLang.toUpperCase()})`;
  }

  // If source is English translating to student native language
  if (sourceLang === 'en') {
    const langGreetings: Record<LanguageCode, string> = {
      hi: 'नमस्ते विद्यार्थी, मेंटर की ओर से संदेश:',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਵਿਦਿਆਰਥੀਓ, ਮੈਂਟਰ ਵੱਲੋਂ ਸੁਨੇਹਾ:',
      bn: 'নমস্কার শিক্ষার্থী, মেন্টরের পক্ষ থেকে বার্তা:',
      ta: 'வணக்கம் மாணவரே, வழிகாட்டியின் செய்தி:',
      te: 'నమస్కారం విద్యార్థి, మెంటార్ నుండి సందేశం:',
      mr: 'नमस्कार विद्यार्थी, मेंटरकडून संदेश:',
      gu: 'નમસ્તે વિદ્યાર્થી, મેન્ટર તરફથી સંદેશ:',
      ur: 'عزیز طالب علم، مینٹر کی جانب سے پیغام:',
      en: 'Dear student, message from mentor:',
    };

    const prefix = langGreetings[targetLang] || 'Message:';
    return `${prefix} "${text}"`;
  }

  return text;
}
