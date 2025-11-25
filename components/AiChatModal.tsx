
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getAiChatResponse } from '../services/geminiService';
import { Language } from '../types';
import { speakText } from '../utils/helpers';
import Spinner from './Spinner';
import { translations } from '../utils/translations';

interface AiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

type Status = 'listening' | 'thinking' | 'speaking' | 'idle' | 'error';

const AiChatModal: React.FC<AiChatModalProps> = ({ isOpen, onClose, language }) => {
  const [status, setStatus] = useState<Status>('idle');
  // Use a ref to track status synchronously for use inside event callbacks
  const statusRef = useRef<Status>('idle');
  const [responseText, setResponseText] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [thinkingMode, setThinkingMode] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isComponentOpen = useRef(isOpen);
  isComponentOpen.current = isOpen;
  
  const t = translations[language];

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const SpeechRecognition = useMemo(() => {
      if (typeof window !== 'undefined') {
          return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      }
      return null;
  }, []);

  const startListening = useCallback(() => {
    if (!isComponentOpen.current || !SpeechRecognition) {
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      try {
        recognitionRef.current.stop();
      } catch (e) {
          // ignore
      }
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;
    
    setStatus('listening');
    setResponseText('');
    setUserPrompt('');
    setVideoId(null); // Clear previous video when starting new listen session
    
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserPrompt(transcript);
      setStatus('thinking');
      
      const aiResponse = await getAiChatResponse(transcript, thinkingMode);
      
      // Check for YouTube links in the response
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
      const match = aiResponse.match(youtubeRegex);
      
      let textToSpeak = aiResponse;
      let detectedVideoId = null;

      if (match && match[1]) {
          detectedVideoId = match[1];
          setVideoId(detectedVideoId);
          // Remove the URL from the text to be spoken so it sounds natural
          textToSpeak = aiResponse.replace(/https?:\/\/\S+/g, '').replace('  ', ' ');
          if (textToSpeak.trim().length < 5) {
              textToSpeak = "Okay, playing that for you.";
          }
      } else {
          setVideoId(null);
      }

      setResponseText(aiResponse);
      setStatus('speaking');
      
      // Determine language of response for TTS
      // Simple heuristic: if the app is in Tamil mode OR the response contains Tamil characters, use Tamil TTS
      const isTamilResponse = /[\u0B80-\u0BFF]/.test(aiResponse) || language === Language.Tamil;
      const ttsLang = isTamilResponse ? Language.Tamil : Language.English;
      
      speakText(textToSpeak, ttsLang, () => {
        // After speaking, listen for the next command if modal is still open.
        // HOWEVER, if a video is playing, do NOT restart listening automatically
        // to prevent the microphone from picking up the song and creating a loop.
        if (isComponentOpen.current && !detectedVideoId) {
            startListening();
        }
      });
    };

    recognition.onerror = (event: any) => {
      // Ignore 'no-speech' (silence), 'aborted' (user stopped/interrupted), and 'network' (temporary connection issue).
      if (event.error === 'no-speech' || event.error === 'aborted' || event.error === 'network') {
         return;
      }

      console.error('AI Chat recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        setStatus('error');
        setResponseText(t.microphoneDenied);
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch(e) {}
        }
      }
    };
    
    recognition.onend = () => {
      // Use ref to check status to avoid stale closure issues
      // Only restart if we were expecting to listen and no video is active (handled by onresult logic mainly, but safety here)
      if (isComponentOpen.current && statusRef.current === 'listening') {
        console.log("AI chat listening ended (likely silence or network glitch), restarting.");
        // Short delay to allow network to recover if that was the cause
        setTimeout(() => startListening(), 250);
      }
    };

    try {
        recognition.start();
    } catch (e) {
        console.error("Error starting AI chat recognition", e);
    }
  }, [language, thinkingMode, SpeechRecognition, t]); 
  
  // This effect manages the lifecycle of the speech recognition
  useEffect(() => {
    let timeoutId: any;
    if (isOpen) {
        // Add a small delay to allow previous speech recognition instance (from main app) to fully stop
        timeoutId = setTimeout(() => {
             startListening();
        }, 300);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null; 
        recognitionRef.current.onerror = null;
        try {
            recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setStatus('idle');
      setVideoId(null);
    }

    return () => {
      clearTimeout(timeoutId);
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        try {
            recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen, startListening]);
  
  const handleClose = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    setVideoId(null);
    onClose();
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'listening': return { icon: MicIcon, text: t.listening };
      case 'thinking': return { icon: null, text: t.thinking };
      case 'speaking': return { icon: SpeakerIcon, text: `${t.aiAssistant}:` };
      case 'error': return { icon: ErrorIcon, text: t.error };
      case 'idle':
      default:
        return { icon: MicIcon, text: t.aiStarting };
    }
  };

  if (!isOpen) return null;

  const { icon: IconComponent, text: statusText } = getStatusInfo();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div 
        className="bg-[var(--bg-color)] text-[var(--text-color)] rounded-2xl shadow-2xl p-6 w-full max-w-2xl h-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold">{t.aiAssistant}</h2>
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2" title="Use a more powerful model for complex questions, which may be slower.">
                  <span className="font-semibold text-lg hidden sm:inline">{t.thinkingMode}</span>
                  <button
                      role="switch"
                      aria-checked={thinkingMode}
                      aria-label={`${t.thinkingMode}, ${thinkingMode ? t.on : t.off}`}
                      onClick={() => setThinkingMode(!thinkingMode)}
                      onFocus={() => speakText(`${t.thinkingMode}. ${thinkingMode ? t.on : t.off}.`, language)}
                      className={`${
                          thinkingMode ? 'bg-[var(--accent-color)]' : 'bg-gray-500/50'
                      } relative inline-flex h-8 w-14 items-center rounded-full transition-colors`}
                  >
                      <span
                          className={`${
                              thinkingMode ? 'translate-x-7' : 'translate-x-1'
                          } inline-block h-6 w-6 transform rounded-full bg-white transition-transform`}
                      />
                  </button>
              </div>
            <button onClick={handleClose} onFocus={() => speakText(t.closeAi, language)} aria-label={t.closeAi} className="p-2 rounded-full hover:bg-gray-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-6 border-b-2 border-gray-500/20">
            {status === 'thinking' ? (
                <Spinner message={t.thinking} />
            ) : (
                IconComponent && <IconComponent className={`w-16 h-16 text-[var(--accent-color)] mb-3 ${status === 'listening' || status === 'speaking' ? 'animate-pulse' : ''}`} />
            )}
            
            {/* Listening indicator/button to manually restart if stopped due to video */}
            {!videoId && status !== 'listening' && status !== 'thinking' && (
                <button 
                    onClick={startListening}
                    className="mt-2 px-4 py-2 bg-gray-700 text-white rounded-full text-sm hover:bg-gray-600 transition-colors"
                >
                    {t.tapToSpeak}
                </button>
            )}

            <p className="text-xl font-semibold mt-2">{statusText}</p>
            {userPrompt && status !== 'listening' && (
                <p className="text-lg italic text-gray-500/80 mt-2">{t.youSaid}: "{userPrompt}"</p>
            )}
        </div>

        <div className="flex-grow overflow-y-auto p-4 mt-4">
            {videoId ? (
                <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg mb-4 bg-black">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`} 
                        title="YouTube video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                    ></iframe>
                </div>
            ) : null}
            <p className="text-2xl whitespace-pre-wrap">{responseText}</p>
        </div>
      </div>
    </div>
  );
};

const MicIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
  </svg>
);

const SpeakerIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);

const ErrorIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
  </svg>
);

export default AiChatModal;
