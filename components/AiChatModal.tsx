

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAiChatResponse } from '../services/geminiService';
import { Language } from '../types';
import { speakText } from '../utils/helpers';
import Spinner from './Spinner';

interface AiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

type Status = 'listening' | 'thinking' | 'speaking' | 'idle' | 'error';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const AiChatModal: React.FC<AiChatModalProps> = ({ isOpen, onClose, language }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [responseText, setResponseText] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const recognitionRef = useRef<any>(null);
  const isComponentOpen = useRef(isOpen);
  isComponentOpen.current = isOpen;


  const startListening = useCallback(() => {
    if (!isComponentOpen.current || !SpeechRecognition) {
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.stop();
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;
    
    setStatus('listening');
    setResponseText('');
    setUserPrompt('');
    
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserPrompt(transcript);
      setStatus('thinking');
      
      const aiResponse = await getAiChatResponse(transcript);
      setResponseText(aiResponse);
      setStatus('speaking');
      
      speakText(aiResponse, language, () => {
        // After speaking, listen for the next command if modal is still open
        if (isComponentOpen.current) {
            startListening();
        }
      });
    };

    recognition.onerror = (event: any) => {
      console.error('AI Chat recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setStatus('error');
        setResponseText("Microphone access was denied. Please check your browser settings to enable it for this site.");
        recognitionRef.current?.stop();
      } else if (event.error === 'no-speech') {
        if (isComponentOpen.current) {
            startListening();
        }
      }
      // For 'aborted' errors, we now do nothing here. This prevents the restart loop.
      // The `onend` handler will manage natural timeouts.
    };
    
    recognition.onend = () => {
      // If recognition ends naturally (e.g., timeout) while listening, restart.
      if (isComponentOpen.current && status === 'listening') {
        console.log("AI chat listening timed out, restarting.");
        startListening();
      }
    };

    recognition.start();
  }, [language, status]); // status is needed to get latest value in onend
  
  // This effect manages the lifecycle of the speech recognition
  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null; // Prevent restart on cleanup
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      window.speechSynthesis.cancel();
      setStatus('idle');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      window.speechSynthesis.cancel();
    };
  }, [isOpen, startListening]);
  
  const handleClose = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }
    window.speechSynthesis.cancel();
    onClose();
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'listening': return { icon: MicIcon, text: "Listening..." };
      case 'thinking': return { icon: null, text: "Thinking..." };
      case 'speaking': return { icon: SpeakerIcon, text: "AI Assistant:" };
      case 'error': return { icon: ErrorIcon, text: "An error occurred." };
      case 'idle':
      default:
        return { icon: MicIcon, text: "AI assistant is starting..." };
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
          <h2 className="text-3xl font-bold">AI Assistant</h2>
          <button onClick={handleClose} onFocus={() => speakText('Close AI Assistant', language)} aria-label="Close AI Assistant" className="p-2 rounded-full hover:bg-gray-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center p-6 border-b-2 border-gray-500/20">
            {status === 'thinking' ? (
                <Spinner message="Thinking..." />
            ) : (
                IconComponent && <IconComponent className="w-16 h-16 text-[var(--accent-color)] mb-3 animate-pulse" />
            )}
            <p className="text-xl font-semibold">{statusText}</p>
            {userPrompt && status !== 'listening' && (
                <p className="text-lg italic text-gray-500/80 mt-2">You said: "{userPrompt}"</p>
            )}
        </div>

        <div className="flex-grow overflow-y-auto p-4 mt-4">
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