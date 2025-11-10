
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ContrastMode, ReadingRate, AppFile, ProcessedData, Language, Command } from './types';
import MainScreen from './components/MainScreen';
import SettingsModal from './components/SettingsModal';
import ViewerScreen from './components/ViewerScreen';
import Spinner from './components/Spinner';
import { extractTextFromFile } from './services/geminiService';
import { useVoiceCommands } from './hooks/useVoiceCommands';
import { speakText } from './utils/helpers';
import AiChatModal from './components/AiChatModal';

const App: React.FC = () => {
  const [view, setView] = useState<'main' | 'viewer'>('main');
  const [loading, setLoading] = useState<{ active: boolean; message: string | string[] }>({ active: false, message: '' });
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [contrast, setContrast] = useState<ContrastMode>(ContrastMode.Dark);
  const [magnification, setMagnification] = useState(1);
  const [readingRate, setReadingRate] = useState<ReadingRate>(ReadingRate.Normal);
  
  // Voice Command State
  const [speakCommands, setSpeakCommands] = useState(true);
  const [voiceCommandFeedback, setVoiceCommandFeedback] = useState(true);
  const [appLanguage, setAppLanguage] = useState<Language>(Language.English);
  const [voiceAction, setVoiceAction] = useState<string | null>(null);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  
  const handleBack = useCallback(() => {
    setView('main');
    setProcessedData(null);
  }, []);
  
  const increaseMagnification = useCallback(() => {
    setMagnification(prev => Math.min(Math.round((prev + 0.2) * 10) / 10, 3));
  }, []);

  const decreaseMagnification = useCallback(() => {
    setMagnification(prev => Math.max(Math.round((prev - 0.2) * 10) / 10, 1));
  }, []);
  
  const increaseReadingRate = useCallback(() => {
    setReadingRate(prev => {
        if (prev === ReadingRate.Slow) return ReadingRate.Normal;
        if (prev === ReadingRate.Normal) return ReadingRate.Fast;
        return ReadingRate.Fast;
    });
  }, []);

  const decreaseReadingRate = useCallback(() => {
    setReadingRate(prev => {
        if (prev === ReadingRate.Fast) return ReadingRate.Normal;
        if (prev === ReadingRate.Normal) return ReadingRate.Slow;
        return ReadingRate.Slow;
    });
  }, []);

  const commands = useMemo(() => {
    const commandSet: Record<Language, Record<string, Command>> = {
      [Language.English]: {
        // Main screen
        main_gallery: { keywords: ['gallery', 'open gallery'], callback: () => galleryInputRef.current?.click(), feedback: 'Opening gallery' },
        main_camera: { keywords: ['camera', 'open camera'], callback: () => cameraInputRef.current?.click(), feedback: 'Opening camera' },
        main_pdf: { keywords: ['pdf', 'open pdf'], callback: () => pdfInputRef.current?.click(), feedback: 'Opening PDF selector' },
        // Viewer screen
        viewer_describe_image: { keywords: ['describe image', 'what is this', 'analyze picture'], callback: () => setVoiceAction('describe-image-english'), feedback: 'Analyzing the image' },
        viewer_read_en: { keywords: ['read', 'read english'], callback: () => setVoiceAction('read-english'), feedback: 'Reading in English' },
        viewer_read_ta: { keywords: ['read tamil'], callback: () => setVoiceAction('read-tamil'), feedback: 'Reading in Tamil' },
        viewer_pause: { keywords: ['pause'], callback: () => setVoiceAction('pause'), feedback: 'Pausing' },
        viewer_resume: { keywords: ['resume', 'continue', 'play'], callback: () => setVoiceAction('resume'), feedback: 'Resuming' },
        viewer_stop: { keywords: ['stop'], callback: () => setVoiceAction('stop'), feedback: 'Stopping' },
        viewer_back: { keywords: ['back', 'go back'], callback: handleBack, feedback: 'Going back' },
        viewer_mag_increase: { keywords: ['increase magnification', 'zoom in'], callback: increaseMagnification, feedback: 'Zooming in' },
        viewer_mag_decrease: { keywords: ['decrease magnification', 'zoom out'], callback: decreaseMagnification, feedback: 'Zooming out' },
        viewer_rate_increase: { keywords: ['read faster', 'increase speed'], callback: increaseReadingRate, feedback: 'Increasing speed' },
        viewer_rate_decrease: { keywords: ['read slower', 'decrease speed'], callback: decreaseReadingRate, feedback: 'Decreasing speed' },
        // Settings screen
        settings_close: { keywords: ['close settings', 'exit settings'], callback: () => setIsSettingsOpen(false), feedback: 'Closing settings' },
        settings_voice_on: { keywords: ['turn on voice', 'enable voice'], callback: () => setSpeakCommands(true), feedback: 'Voice commands enabled' },
        settings_voice_off: { keywords: ['turn off voice', 'disable voice'], callback: () => setSpeakCommands(false), feedback: '' },
        settings_feedback_on: { keywords: ['turn on feedback', 'enable feedback'], callback: () => setVoiceCommandFeedback(true), feedback: 'Voice feedback enabled' },
        settings_feedback_off: { keywords: ['turn off feedback', 'disable feedback'], callback: () => setVoiceCommandFeedback(false), feedback: 'Voice feedback disabled' },
        settings_lang_en: { keywords: ['switch to english', 'use english'], callback: () => setAppLanguage(Language.English), feedback: 'Language set to English' },
        settings_lang_ta: { keywords: ['switch to tamil', 'use tamil'], callback: () => setAppLanguage(Language.Tamil), feedback: 'Language set to Tamil' },
        settings_rate_slow: { keywords: ['slow rate', 'slow reading'], callback: () => setReadingRate(ReadingRate.Slow), feedback: 'Reading rate set to slow' },
        settings_rate_normal: { keywords: ['normal rate', 'normal reading'], callback: () => setReadingRate(ReadingRate.Normal), feedback: 'Reading rate set to normal' },
        settings_rate_fast: { keywords: ['fast rate', 'fast reading'], callback: () => setReadingRate(ReadingRate.Fast), feedback: 'Reading rate set to fast' },
        // Common
        common_settings: { keywords: ['settings', 'open settings', 'application settings'], callback: () => setIsSettingsOpen(true), feedback: 'Opening settings' },
        common_ask_ai: { keywords: ['ask ai', 'hey assistant', 'ask a question'], callback: () => setIsAiChatOpen(true), feedback: 'How can I help you?' },
        common_contrast_light: { keywords: ['light mode', 'white mode'], callback: () => setContrast(ContrastMode.Light), feedback: 'Light mode activated' },
        common_contrast_dark: { keywords: ['dark mode', 'black mode'], callback: () => setContrast(ContrastMode.Dark), feedback: 'Dark mode activated' },
        common_contrast_yellow: { keywords: ['yellow mode'], callback: () => setContrast(ContrastMode.YellowDark), feedback: 'Yellow on black mode activated' },
        common_contrast_blue: { keywords: ['blue mode'], callback: () => setContrast(ContrastMode.BlueDark), feedback: 'Blue on black mode activated' },
      },
      [Language.Tamil]: {
        // Main screen
        main_gallery: { keywords: ['கேலரி'], callback: () => galleryInputRef.current?.click(), feedback: 'கேலரி திறக்கப்படுகிறது' },
        main_camera: { keywords: ['கேமரா'], callback: () => cameraInputRef.current?.click(), feedback: 'கேமரா திறக்கப்படுகிறது' },
        main_pdf: { keywords: ['பிடிஎஃப்'], callback: () => pdfInputRef.current?.click(), feedback: 'PDF திறக்கப்படுகிறது' },
        // Viewer screen
        viewer_describe_image: { keywords: ['படத்தை விவரி', 'இது என்ன'], callback: () => setVoiceAction('describe-image-tamil'), feedback: 'படம் பகுப்பாய்வு செய்யப்படுகிறது' },
        viewer_read_en: { keywords: ['ஆங்கிலத்தில் படி'], callback: () => setVoiceAction('read-english'), feedback: 'ஆங்கிலத்தில் படிக்கிறது' },
        viewer_read_ta: { keywords: ['தமிழில் படி'], callback: () => setVoiceAction('read-tamil'), feedback: 'தமிழில் படிக்கிறது' },
        viewer_pause: { keywords: ['இடைநிறுத்தம்'], callback: () => setVoiceAction('pause'), feedback: 'இடைநிறுத்தப்படுகிறது' },
        viewer_resume: { keywords: ['தொடரவும்', 'மீண்டும் இயக்கு'], callback: () => setVoiceAction('resume'), feedback: 'மீண்டும் தொடங்குகிறது' },
        viewer_stop: { keywords: ['நிறுத்து'], callback: () => setVoiceAction('stop'), feedback: 'நிறுத்தப்படுகிறது' },
        viewer_back: { keywords: ['பின்னால்', 'திரும்பிச் செல்'], callback: handleBack, feedback: 'பின்னால் செல்கிறது' },
        viewer_mag_increase: { keywords: ['உருப்பெருக்கத்தை அதிகரி', 'பெரிதாக்கு'], callback: increaseMagnification, feedback: 'பெரிதாக்குகிறது' },
        viewer_mag_decrease: { keywords: ['உருப்பெருக்கத்தைக் குறை', 'சிறிதாக்கு'], callback: decreaseMagnification, feedback: 'சிறிதாக்குகிறது' },
        viewer_rate_increase: { keywords: ['வேகமாகப் படி'], callback: increaseReadingRate, feedback: 'வேகம் அதிகரிக்கிறது' },
        viewer_rate_decrease: { keywords: ['மெதுவாகப் படி'], callback: decreaseReadingRate, feedback: 'வேகம் குறைகிறது' },
        // Settings screen
        settings_close: { keywords: ['அமைப்புகளை மூடு', 'மூடு'], callback: () => setIsSettingsOpen(false), feedback: 'அமைப்புகள் மூடப்படுகிறது' },
        settings_voice_on: { keywords: ['குரல் கட்டளைகளை இயக்கு'], callback: () => setSpeakCommands(true), feedback: 'குரல் கட்டளைகள் இயக்கப்பட்டது' },
        settings_voice_off: { keywords: ['குரல் கட்டளைகளை முடக்கு'], callback: () => setSpeakCommands(false), feedback: '' },
        settings_feedback_on: { keywords: ['பின்னூட்டத்தை இயக்கு'], callback: () => setVoiceCommandFeedback(true), feedback: 'குரல் பின்னூட்டம் இயக்கப்பட்டது' },
        settings_feedback_off: { keywords: ['பின்னூட்டத்தை முடக்கு'], callback: () => setVoiceCommandFeedback(false), feedback: 'குரல் பின்னூட்டம் முடக்கப்பட்டது' },
        settings_lang_en: { keywords: ['ஆங்கிலத்திற்கு மாற்று'], callback: () => setAppLanguage(Language.English), feedback: 'மொழி ஆங்கிலத்திற்கு மாற்றப்பட்டது' },
        settings_lang_ta: { keywords: ['தமிழுக்கு மாற்று'], callback: () => setAppLanguage(Language.Tamil), feedback: 'மொழி தமிழுக்கு மாற்றப்பட்டது' },
        settings_rate_slow: { keywords: ['மெதுவான வேகம்'], callback: () => setReadingRate(ReadingRate.Slow), feedback: 'வாசிப்பு வேகம் மெதுவாக அமைக்கப்பட்டது' },
        settings_rate_normal: { keywords: ['சாதாரண வேகம்'], callback: () => setReadingRate(ReadingRate.Normal), feedback: 'வாசிப்பு வேகம் சாதாரணமாக அமைக்கப்பட்டது' },
        settings_rate_fast: { keywords: ['வேகமான வேகம்'], callback: () => setReadingRate(ReadingRate.Fast), feedback: 'வாசிப்பு வேகம் வேகமாக அமைக்கப்பட்டது' },
        // Common
        common_settings: { keywords: ['அமைப்புகள்', 'செட்டிங்ஸ்'], callback: () => setIsSettingsOpen(true), feedback: 'அமைப்புகள் திறக்கப்படுகிறது' },
        common_ask_ai: { keywords: ['ai இடம் கேள்', 'உதவியாளரே கேளுங்கள்'], callback: () => setIsAiChatOpen(true), feedback: 'நான் எப்படி உதவ முடியும்?' },
        common_contrast_light: { keywords: ['லைட் மோட்'], callback: () => setContrast(ContrastMode.Light), feedback: 'லைட் மோட் இயக்கப்பட்டது' },
        common_contrast_dark: { keywords: ['டார்க் மோட்'], callback: () => setContrast(ContrastMode.Dark), feedback: 'டார்க் மோட் இயக்கப்பட்டது' },
        common_contrast_yellow: { keywords: ['மஞ்சள் மோட்'], callback: () => setContrast(ContrastMode.YellowDark), feedback: 'மஞ்சள் மோட் இயக்கப்பட்டது' },
        common_contrast_blue: { keywords: ['நீல மோட்'], callback: () => setContrast(ContrastMode.BlueDark), feedback: 'நீல மோட் இயக்கப்பட்டது' },
      }
    };

    const activeLangCommands = commandSet[appLanguage];
    
    const filterCommands = (prefix: string) => 
      Object.entries(activeLangCommands)
        .filter(([key]) => key.startsWith(prefix))
        .map(([, command]) => command);

    const common = filterCommands('common_');

    if (isSettingsOpen) {
      return [...common, ...filterCommands('settings_')];
    }
    if (view === 'main') {
      return [...common, ...filterCommands('main_')];
    }
    if (view === 'viewer') {
      return [...common, ...filterCommands('viewer_')];
    }
    return common;
  }, [appLanguage, view, handleBack, isSettingsOpen, increaseMagnification, decreaseMagnification, increaseReadingRate, decreaseReadingRate]);

  const { isListening } = useVoiceCommands({
    commands,
    enabled: speakCommands && !isAiChatOpen,
    language: appLanguage,
    feedbackEnabled: voiceCommandFeedback,
  });

  useEffect(() => {
    document.documentElement.className = contrast;
  }, [contrast]);

  const handleFileSelect = async (file: AppFile) => {
    const messages = [
        'Preparing your file...',
        'Sending to our AI assistant...',
        'Analyzing the content...',
        'Almost there, extracting text...',
    ];
    setLoading({ active: true, message: messages });
    try {
      const text = await extractTextFromFile(file);
      setProcessedData({ file, extractedText: text });
      setView('viewer');
    } catch (error) {
      console.error("Error extracting text:", error);
      alert("Failed to analyze the file. Please try again.");
    } finally {
      setLoading({ active: false, message: '' });
    }
  };

  const setLoadingWithMessage = (isLoading: boolean, message: string | string[]) => {
    setLoading({ active: isLoading, message });
  };
  
  const handleVoiceActionConsumed = () => {
    setVoiceAction(null);
  };

  return (
    <div className="bg-[var(--bg-color)] text-[var(--text-color)] min-h-screen flex flex-col font-sans transition-colors duration-300">
      <header className="flex justify-between items-center p-4 shadow-md bg-[var(--bg-color)] sticky top-0 z-10 border-b border-gray-500/20">
        <h1 className="text-4xl font-extrabold tracking-tight text-[var(--accent-color)]">EyeZone</h1>
        <div className="flex items-center gap-4">
          {isListening && (
            <div className="text-red-500 animate-pulse" title="Voice assistant is listening" aria-label="Voice assistant is listening">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
          )}
          <button
            onClick={() => setIsAiChatOpen(true)}
            onFocus={() => speakText('Open AI Assistant', appLanguage)}
            aria-label="Open AI Assistant"
            className="p-2 rounded-full hover:bg-gray-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.553L16.5 21.75l-.398-1.197a3.375 3.375 0 00-2.456-2.456L12.5 17.25l1.197-.398a3.375 3.375 0 002.456-2.456L16.5 13.5l.398 1.197a3.375 3.375 0 002.456 2.456L20.5 17.25l-1.197.398a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            onFocus={() => speakText('Open settings', appLanguage)}
            aria-label="Open settings"
            className="p-2 rounded-full hover:bg-gray-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h7.5M7.5 11h7.5M7.5 7h7.5M3 21h18a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0021 3H3a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 003 21z" />
            </svg>
          </button>
        </div>
      </header>

      {loading.active ? (
          <div className="flex-grow flex items-center justify-center"><Spinner message={loading.message} /></div>
      ) : (
        view === 'main' ? <MainScreen onFileSelect={handleFileSelect} setLoading={setLoadingWithMessage} galleryInputRef={galleryInputRef} cameraInputRef={cameraInputRef} pdfInputRef={pdfInputRef} /> :
        processedData && <ViewerScreen data={processedData} onBack={handleBack} magnification={magnification} readingRate={readingRate} voiceAction={voiceAction} onVoiceActionConsumed={handleVoiceActionConsumed} increaseMagnification={increaseMagnification} decreaseMagnification={decreaseMagnification} />
      )}

      <AiChatModal
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        language={appLanguage}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        contrast={contrast}
        setContrast={setContrast}
        magnification={magnification}
        setMagnification={setMagnification}
        readingRate={readingRate}
        setReadingRate={setReadingRate}
        speakCommands={speakCommands}
        setSpeakCommands={setSpeakCommands}
        voiceCommandFeedback={voiceCommandFeedback}
        setVoiceCommandFeedback={setVoiceCommandFeedback}
        appLanguage={appLanguage}
        setAppLanguage={setAppLanguage}
      />
    </div>
  );
};

export default App;
