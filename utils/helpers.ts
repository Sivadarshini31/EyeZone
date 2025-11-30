import { Language } from '../types';

// Base64 encode/decode functions are required for Gemini audio processing
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decode raw PCM audio data from Gemini TTS into an AudioBuffer
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const resizeImage = (base64Str: string, maxWidth = 1024, maxHeight = 1024): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str); // fallback to original if context fails
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8)); // Use JPEG for smaller size and better performance
    };
    img.onerror = () => {
        resolve(base64Str); // fallback to original on error
    };
  });
};

// Global array to store active utterances to prevent garbage collection on mobile browsers
const activeUtterances: SpeechSynthesisUtterance[] = [];

export const speakText = (text: string, lang: Language, onEnd?: () => void) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }
  
  // Stop any previous speech to avoid overlap
  window.speechSynthesis.cancel();
  
  // CRITICAL FIX FOR MOBILE/APK: 
  // We must add a small delay between cancel and speak, otherwise Android WebView
  // often drops the speech command silently. 100ms is safe for most devices.
  setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.volume = 1.0; // Force max volume
      utterance.rate = 1.0;   // Force normal rate for interface feedback
      
      // Mobile browsers often need explicit voice selection to work reliably.
      // We fetch voices INSIDE the timeout because they might be loaded asynchronously.
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
          let voice = voices.find(v => v.lang === lang);
          if (!voice && lang === Language.Tamil) {
              // Fallback search for Tamil by name or strict code
              voice = voices.find(v => v.lang.includes('ta') || v.name.toLowerCase().includes('tamil'));
          }
          if (!voice) {
              // Fallback to language code prefix (e.g., 'en' for 'en-US')
              const shortLang = lang.split('-')[0];
              voice = voices.find(v => v.lang.startsWith(shortLang));
          }
          
          if (voice) {
              utterance.voice = voice;
          }
      }

      utterance.onend = () => {
        if (onEnd) onEnd();
        // Remove from active array to allow GC
        const index = activeUtterances.indexOf(utterance);
        if (index > -1) {
            activeUtterances.splice(index, 1);
        }
      };

      utterance.onerror = (e) => {
          console.error("Speech synthesis error:", e);
          const index = activeUtterances.indexOf(utterance);
          if (index > -1) {
              activeUtterances.splice(index, 1);
          }
      };

      // Add to global array to prevent GC (Android WebView Fix)
      activeUtterances.push(utterance);
      
      window.speechSynthesis.speak(utterance);
  }, 100); // 100ms delay is safer for older Android WebViews
};