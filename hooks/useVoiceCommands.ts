

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
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
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
    
    // Reset stop flag when enabling.
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
      // Only restart if not intentionally stopped. A brief delay can prevent frantic 
      // restart loops on some browsers that could lead to an 'aborted' error.
      if (!stopInProgress.current) {
        setTimeout(() => {
          // Check again inside the timeout, as 'enabled' could have changed,
          // triggering a cleanup that sets stopInProgress to true.
          if (!stopInProgress.current) {
            try {
              recognition.start();
            } catch (e) {
              console.warn("Could not restart recognition, it may have been stopped.", e);
            }
          }
        }, 250); // Using a slightly longer delay for stability.
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        console.error("Microphone permission denied. Voice commands will be disabled.");
        setPermissionDenied(true);
        // stopInProgress will be set in the cleanup, which will run because `permissionDenied` state changes
      }
      // For 'aborted' or other errors, the onend handler will attempt a restart.
      // We don't need special logic here; `onend` is the robust recovery mechanism.
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      console.log('Voice transcript:', transcript);

      for (const command of commandsRef.current) {
        for (const keyword of command.keywords) {
          if (transcript.includes(keyword.toLowerCase())) {
            console.log(`Executing command for keyword: "${keyword}"`);
            if (command.feedback && feedbackEnabledRef.current) {
                speakFeedback(command.feedback, language);
            }
            command.callback();
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
      recognition.onend = null; // Prevent restart on intentional stop
      recognition.onerror = null; // Prevent error handling on intentional stop
      recognition.stop();
      setIsListening(false);
    };
  }, [enabled, language, permissionDenied]);

  return { isListening, isSpeechRecognitionSupported };
};
