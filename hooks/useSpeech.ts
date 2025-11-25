import { useState, useCallback, useRef, useEffect } from 'react';
import { decode, decodeAudioData } from '../utils/helpers';
import { Language, ReadingRate, HighlightInfo } from '../types';

export const useSpeech = (rate: ReadingRate) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [highlightInfo, setHighlightInfo] = useState<HighlightInfo>({ startIndex: -1, endIndex: -1 });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const fullTextRef = useRef<string>(''); // To access full text in boundary events
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load available system voices
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        setVoices(window.speechSynthesis.getVoices());
      }
    };
    
    updateVoices();
    
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Lazily initialize AudioContext and store it in a ref, scoped to this hook instance.
  const getAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') {
        return null;
    }
    // Initialize if it doesn't exist or if it was closed.
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        } catch (e) {
            console.error("Could not create AudioContext:", e);
            return null;
        }
    }
    return audioContextRef.current;
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    const source = audioSourceRef.current;
    if (source) {
        // Clear the ref first to prevent onended from firing with side-effects
        audioSourceRef.current = null;
        source.onended = null;
        
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(e => console.error("Error resuming AudioContext in stop:", e));
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
  }, [getAudioContext]);

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
            // Search for whitespace (\s matches space, tab, newline, etc.) to determine the end of the word
            // or punctuation or end of string.
            // Improved regex to handle various word boundaries better.
            const relativeEndIndex = currentText.slice(startIndex).search(/[\s.,;!?]/);
            
            let endIndex;
            if (relativeEndIndex === -1) {
                // If no boundary found, we are at the last word
                endIndex = currentText.length;
            } else {
                endIndex = startIndex + relativeEndIndex;
            }
            
            if (startIndex !== endIndex) {
                 setHighlightInfo({ startIndex, endIndex });
            }
        }
    };
    
    const ctx = getAudioContext();
    if (geminiAudioBase64 && ctx) {
        // For Gemini audio, the audio has a fixed rate. We must slow down the
        // muted utterance to ensure it provides boundary events for the entire duration.
        // We ignore the user's preferred `rate` here as it would de-sync highlighting.
        utterance.rate = 0.7; // A slower, consistent rate for the timing utterance.
        utterance.volume = 0;

        // The muted utterance's onend should NOT stop our main audio.
        utterance.onend = () => {
            console.log("Muted utterance for timing has finished.");
        };

        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
        
        try {
            const audioData = decode(geminiAudioBase64);
            const audioBuffer = await decodeAudioData(audioData, ctx, 24000, 1);
            
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            
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
            
            // Try fallback voice selection
            if (voices.length > 0) {
                let voice = voices.find(v => v.lang === lang);
                if (!voice && lang === Language.Tamil) {
                     // Try finding common Tamil voice names if exact lang match failed
                     voice = voices.find(v => v.name.includes('Tamil') || v.lang.includes('ta'));
                }
                if (!voice) {
                     voice = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
                }
                
                if (voice) utterance.voice = voice;
            }

            utterance.onend = () => {
                setIsPlaying(false);
                setIsPaused(false);
                setHighlightInfo({ startIndex: -1, endIndex: -1 });
                utteranceRef.current = null;
            };
            window.speechSynthesis.speak(utterance);
        }
    } else { // Fallback to browser TTS if Gemini audio is not available
        console.log(`Using native browser TTS for lang ${lang}.`);
        // For browser-native TTS, the user's rate preference is applied directly.
        utterance.rate = rate;

        // Attempt to select the best voice for the language
        if (voices.length > 0) {
            let voice = voices.find(v => v.lang === lang);
            
            // Specific fallback logic for Tamil to prefer high-quality voices if available
            if (lang === Language.Tamil) {
                const tamilVoices = voices.filter(v => v.lang.includes('ta') || v.name.toLowerCase().includes('tamil'));
                if (tamilVoices.length > 0) {
                    // Prefer Google Tamil or other known good voices
                    const preferred = tamilVoices.find(v => v.name.includes('Google') || v.name.includes('India'));
                    voice = preferred || tamilVoices[0];
                }
            }

            if (!voice) {
                // Fallback to generic language code match
                voice = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
            }

            if (voice) {
                console.log(`Selected voice: ${voice.name} for ${lang}`);
                utterance.voice = voice;
            } else {
                console.warn(`No specific voice found for ${lang}, relying on browser default for language.`);
                // Explicitly ensuring voice is null/undefined to let browser use default language engine
            }
        }

        utterance.onend = () => {
            setIsPlaying(false);
            setIsPaused(false);
            setHighlightInfo({ startIndex: -1, endIndex: -1 });
            utteranceRef.current = null;
        };
        
        utterance.onerror = (e) => {
            console.error("TTS Error:", e);
            setIsPlaying(false);
        };
        
        window.speechSynthesis.speak(utterance);
    }
  }, [rate, stop, getAudioContext, voices]);

  const pause = useCallback(async () => {
    if (!isPlaying || isPaused) return;

    const ctx = getAudioContext();
    if (audioSourceRef.current && ctx) {
        await ctx.suspend();
    }
    // Always pause the speech synthesis as it controls the timing
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
    }
    setIsPaused(true);
    setIsPlaying(false);
  }, [isPlaying, isPaused, getAudioContext]);

  const resume = useCallback(async () => {
    if (!isPaused) return;

    const ctx = getAudioContext();
    if (audioSourceRef.current && ctx) {
        await ctx.resume();
    }
     // Always resume speech synthesis
    if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
    }
    setIsPaused(false);
    setIsPlaying(true);
  }, [isPaused, getAudioContext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { speak, pause, resume, stop, isPlaying, isPaused, highlightInfo };
};