

import { useEffect, useRef, useState } from 'react';
import { Language, Command } from '../types';

interface VoiceCommandsProps {
  commands: Command[];
  enabled: boolean;
  language: Language;
  feedbackEnabled: boolean;
}

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognition;

const speakFeedback = (text: string, lang: Language) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
};

export const useVoiceCommands = ({ commands, enabled, language, feedbackEnabled }: VoiceCommandsProps) => {
  const [isListening, setIsListening] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const stopInProgress = useRef(false);

  const commandsRef = useRef(commands);
  commandsRef.current = commands;
  const feedbackEnabledRef = useRef(feedbackEnabled);
  feedbackEnabledRef.current = feedbackEnabled;

  useEffect(() => {
    if (!enabled || !isSpeechRecognitionSupported || permissionDenied) {
      return;
    }
    
    stopInProgress.current = false;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Only restart if not intentionally stopped and still enabled.
      if (!stopInProgress.current && !permissionDenied) {
        console.log('Voice recognition ended, will restart.');
        // A brief delay can prevent frantic restart loops on some browsers
        setTimeout(() => recognition.start(), 100);
      } else {
        console.log('Voice recognition ended intentionally.');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        console.error("Microphone permission denied. Voice commands will be disabled.");
        setPermissionDenied(true);
      }
      // For 'aborted' or other errors, the onend handler will attempt a restart,
      // which is a reasonable recovery strategy.
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      console.log('Voice transcript:', transcript);

      for (const command of commandsRef.current) {
        for (const keyword of command.keywords) {
          if (transcript.includes(keyword.toLowerCase())) {
            console.log(`Executing command for keyword: "${keyword}"`);
            command.callback();
            if (command.feedback && feedbackEnabledRef.current) {
                speakFeedback(command.feedback, language);
            }
            return; // Execute only the first matched command
          }
        }
      }
    };
    
    try {
      recognition.start();
    } catch (e) {
      console.error("Error initially starting recognition:", e);
    }

    // Cleanup function: runs when `enabled` or `language` changes, or on unmount
    return () => {
      console.log('Cleaning up voice recognition.');
      stopInProgress.current = true;
      recognition.onend = null; // Important: prevent restart on intentional stop
      recognition.stop();
      setIsListening(false);
    };
  }, [enabled, language, permissionDenied]);

  return { isListening, isSpeechRecognitionSupported };
};