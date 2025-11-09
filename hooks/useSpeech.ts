
import { useState, useCallback, useRef, useEffect } from 'react';
import { decode, decodeAudioData } from '../utils/helpers';
import { Language, ReadingRate, HighlightInfo } from '../types';

let audioContext: AudioContext | null = null;
if (typeof window !== 'undefined') {
  audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
}

export const useSpeech = (rate: ReadingRate) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [highlightInfo, setHighlightInfo] = useState<HighlightInfo>({ startIndex: -1, endIndex: -1 });
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const fullTextRef = useRef<string>(''); // To access full text in boundary events

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    if (audioSourceRef.current) {
        // If context is suspended (i.e., paused), resume it briefly to allow stop() to work.
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        try {
            audioSourceRef.current.stop();
        } catch (e) {
            // Ignore error if source is already stopped
        }
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setHighlightInfo({ startIndex: -1, endIndex: -1 }); // Reset highlight
    utteranceRef.current = null;
  }, []);

  const speak = useCallback(async (text: string, lang: Language, geminiAudioBase64?: string) => {
    if (!text) return;

    stop(); // Ensure everything is reset before starting new speech
    
    fullTextRef.current = text;
    setIsPaused(false);
    setIsPlaying(true);
    
    if (lang === Language.English && geminiAudioBase64 && audioContext) {
        // Ensure context is running, especially on first playback
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        setHighlightInfo({ startIndex: 0, endIndex: text.length }); // Highlight all for Gemini
        
        try {
            const audioData = decode(geminiAudioBase64);
            const audioBuffer = await decodeAudioData(audioData, audioContext, 24000, 1);
            
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start(0);
            
            source.onended = () => {
                // onended can be called by stop(), so we check if the source is still the current one.
                if (audioSourceRef.current === source) {
                     setIsPlaying(false);
                     setIsPaused(false); // Ensure not paused on natural end
                     setHighlightInfo({ startIndex: -1, endIndex: -1 });
                     audioSourceRef.current = null;
                }
            };
            audioSourceRef.current = source;
        } catch (error) {
            console.error("Failed to decode or play Gemini audio:", error);
            setIsPlaying(false);
        }

    } else { // Fallback to browser TTS for Tamil or if Gemini fails
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rate;
        
        utterance.onboundary = (event) => {
            const currentText = fullTextRef.current;
            if (event.name === 'word') {
                const startIndex = event.charIndex;
                let endIndex = currentText.indexOf(' ', startIndex);
                if (endIndex === -1) {
                    endIndex = currentText.length;
                }
                setHighlightInfo({ startIndex, endIndex });
            }
        };
        
        utterance.onend = () => {
            setIsPlaying(false);
            setIsPaused(false);
            setHighlightInfo({ startIndex: -1, endIndex: -1 });
            utteranceRef.current = null;
        };
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }
  }, [rate, stop]);

  const pause = useCallback(async () => {
    if (!isPlaying || isPaused) return;

    if (audioSourceRef.current && audioContext) {
        await audioContext.suspend();
        setIsPaused(true);
        setIsPlaying(false);
    } else if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        setIsPaused(true);
        setIsPlaying(false);
    }
  }, [isPlaying, isPaused]);

  const resume = useCallback(async () => {
    if (!isPaused) return;

    if (audioSourceRef.current && audioContext) {
        await audioContext.resume();
        setIsPaused(false);
        setIsPlaying(true);
        setHighlightInfo({ startIndex: 0, endIndex: fullTextRef.current.length });
    } else if (window.speechSynthesis.paused) { // FIX: Check browser state directly for more reliability
        window.speechSynthesis.resume();
        setIsPaused(false);
        setIsPlaying(true);
    }
  }, [isPaused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { speak, pause, resume, stop, isPlaying, isPaused, highlightInfo };
};
