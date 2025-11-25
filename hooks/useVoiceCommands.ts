
import { useEffect, useMemo, useRef, useState } from 'react';
import { Language, Command } from '../types';
import { speakText } from '../utils/helpers';

interface VoiceCommandsProps {
  commands: Command[];
  enabled: boolean;
  language: Language;
  feedbackEnabled: boolean;
}

export const useVoiceCommands = ({ commands, enabled, language, feedbackEnabled }: VoiceCommandsProps) => {
  const [isListening, setIsListening] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const stopInProgress = useRef(false);

  // Defer access to SpeechRecognition until the hook is actually used, and memoize it.
  const SpeechRecognition = useMemo(() => {
    if (typeof window !== 'undefined') {
        return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    }
    return null;
  }, []);

  const isSpeechRecognitionSupported = useMemo(() => !!SpeechRecognition, [SpeechRecognition]);

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
      // Ignore common non-critical errors.
      // 'no-speech': No sound detected.
      // 'network': Network connection failed (common on mobile/unstable wifi).
      if (event.error === 'no-speech' || event.error === 'network') {
          return;
      }

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
                speakText(command.feedback, language);
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
      if (recognition) {
        recognition.onend = null; // Important: prevent restart on intentional stop
        try {
            recognition.stop();
        } catch (e) {
            // ignore if already stopped
        }
      }
      setIsListening(false);
    };
  }, [enabled, language, permissionDenied, SpeechRecognition, isSpeechRecognitionSupported]);

  return { isListening, isSpeechRecognitionSupported };
};
