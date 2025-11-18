
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
    const source = audioSourceRef.current;
    if (source) {
        // Clear the ref first to prevent onended from firing with side-effects
        audioSourceRef.current = null;
        source.onended = null;
        
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        try {
            source.stop();
        } catch (e) {
            // Ignore error if source is already stopped
        }
        source.disconnect();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setHighlightInfo({ startIndex: -1, endIndex: -1 });
    utteranceRef.current = null;
  }, []);

  const speak = useCallback(async (text: string, lang: Language, geminiAudioBase64?: string) => {
    if (!text) return;

    stop(); // Ensure everything is reset before starting new speech
    
    fullTextRef.current = text;
    setIsPaused(false);
    setIsPlaying(true);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utteranceRef.current = utterance;
    
    utterance.onboundary = (event) => {
        const currentText = fullTextRef.current;
        if (event.name === 'word') {
            const startIndex = event.charIndex;
            let endIndex = currentText.indexOf(' ', startIndex);
            if (endIndex === -1) {
                endIndex = currentText.length;
            }
            if (startIndex !== endIndex) { // Prevent highlighting empty space
                 setHighlightInfo({ startIndex, endIndex });
            }
        }
    };
    
    if (geminiAudioBase64 && audioContext) {
        // For Gemini audio, the audio has a fixed rate. We must slow down the
        // muted utterance to ensure it provides boundary events for the entire duration.
        // We ignore the user's preferred `rate` here as it would de-sync highlighting.
        utterance.rate = 0.7; // A slower, consistent rate for the timing utterance.
        utterance.volume = 0;

        // The muted utterance's onend should NOT stop our main audio.
        utterance.onend = () => {
            console.log("Muted utterance for timing has finished.");
        };

        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        try {
            const audioData = decode(geminiAudioBase64);
            const audioBuffer = await decodeAudioData(audioData, audioContext, 24000, 1);
            
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            
            audioSourceRef.current = source; // Set ref BEFORE attaching onended

            // The AudioBufferSourceNode's onended event is the TRUE source of completion.
            source.onended = () => {
                // Check if the ref still points to this source. If null, stop() was called manually.
                if (audioSourceRef.current === source) {
                    setIsPlaying(false);
                    setIsPaused(false);
                    setHighlightInfo({ startIndex: -1, endIndex: -1 });
                    utteranceRef.current = null;
                    audioSourceRef.current = null;
                    window.speechSynthesis.cancel(); // Also stop the muted utterance if it's still going.
                }
            };

            window.speechSynthesis.speak(utterance);
            source.start(0);
        } catch (error) {
            console.error("Failed to decode/play Gemini audio, falling back to browser TTS:", error);
            utterance.volume = 1; // Ensure volume is 1 for fallback
            utterance.rate = rate; // Use user rate for fallback
            utterance.onend = () => {
                setIsPlaying(false);
                setIsPaused(false);
                setHighlightInfo({ startIndex: -1, endIndex: -1 });
                utteranceRef.current = null;
            };
            window.speechSynthesis.speak(utterance);
        }
    } else { // Fallback to browser TTS if Gemini audio is not available
        console.warn(`No Gemini audio provided for lang ${lang}, or audio context not available. Falling back to browser TTS.`);
        // For browser-native TTS, the user's rate preference is applied directly.
        utterance.rate = rate;
        utterance.onend = () => {
            setIsPlaying(false);
            setIsPaused(false);
            setHighlightInfo({ startIndex: -1, endIndex: -1 });
            utteranceRef.current = null;
        };
        window.speechSynthesis.speak(utterance);
    }
  }, [rate, stop]);

  const pause = useCallback(async () => {
    if (isPaused || !isPlaying) return;

    try {
      if (audioSourceRef.current && audioContext && audioContext.state === 'running') {
        await audioContext.suspend();
      }
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
      }
    } catch (error) {
      console.error("Error during pause:", error);
    }
    setIsPaused(true);
    setIsPlaying(false);
  }, [isPlaying, isPaused]);

  const resume = useCallback(async () => {
    if (!isPaused || !isPlaying) return;

    try {
      if (audioSourceRef.current && audioContext && audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (error) {
      console.error("Error during resume:", error);
    }
    setIsPaused(false);
    setIsPlaying(true);
  }, [isPaused, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { speak, pause, resume, stop, isPlaying, isPaused, highlightInfo };
};
