
import React, { useState, useEffect, useCallback } from 'react';
import { ProcessedData, Language, ReadingRate, HighlightInfo } from '../types';
import { generateSpeech, translateText, describeImage } from '../services/geminiService';
import { useSpeech } from '../hooks/useSpeech';
import Spinner from './Spinner';
import PlaybackControls from './PlaybackControls';

interface ViewerScreenProps {
  data: ProcessedData;
  onBack: () => void;
  magnification: number;
  readingRate: ReadingRate;
  voiceAction: string | null;
  onVoiceActionConsumed: () => void;
  increaseMagnification: () => void;
  decreaseMagnification: () => void;
}

const ViewerScreen: React.FC<ViewerScreenProps> = ({ data, onBack, magnification, readingRate, voiceAction, onVoiceActionConsumed, increaseMagnification, decreaseMagnification }) => {
  const [loading, setLoading] = useState<{ active: boolean; message: string | string[] }>({ active: false, message: '' });
  const [activeText, setActiveText] = useState(data.extractedText);
  const [activeLang, setActiveLang] = useState<Language>(Language.English);
  const [geminiAudio, setGeminiAudio] = useState<string | undefined>(undefined);
  // We only store Tamil audio if we decide to use Gemini for it in the future, 
  // currently we force native TTS for Tamil.
  const [translatedTamilText, setTranslatedTamilText] = useState<string | null>(null);
  
  // State for image description feature
  const [imageDescription, setImageDescription] = useState<string | null>(null);
  const [imageDescriptionTamil, setImageDescriptionTamil] = useState<string | null>(null);
  const [geminiAudioDescription, setGeminiAudioDescription] = useState<string | undefined>(undefined);
  const [currentView, setCurrentView] = useState<'ocr' | 'description'>('ocr');


  const { speak, pause, resume, stop, isPlaying, isPaused, highlightInfo } = useSpeech(readingRate);

  const handleDescribeImage = useCallback(async (lang: Language) => {
    if (data.file.type !== 'image') return;
    stop();
    setCurrentView('description');

    const cachedDescription = lang === Language.English ? imageDescription : imageDescriptionTamil;
    
    if (cachedDescription) {
        setActiveText(cachedDescription);
        setActiveLang(lang);
        
        if (lang === Language.English) {
             if (geminiAudioDescription) {
                 speak(cachedDescription, lang, geminiAudioDescription);
             } else {
                 setLoading({ active: true, message: 'Generating audio...' });
                 const audio = await generateSpeech(cachedDescription);
                 setGeminiAudioDescription(audio);
                 setLoading({ active: false, message: '' });
                 speak(cachedDescription, lang, audio);
             }
        } else {
            // For Tamil, use native TTS
            speak(cachedDescription, lang, undefined);
        }
        return;
    }

    setLoading({ active: true, message: 'Analyzing image...' });
    setActiveText(''); 
    try {
        const description = await describeImage(data.file.content, lang === Language.English ? 'English' : 'Tamil');
        
        if (lang === Language.English) {
            setImageDescription(description);
            const audio = await generateSpeech(description);
            setGeminiAudioDescription(audio);
            setActiveText(description);
            setActiveLang(lang);
            speak(description, lang, audio);
        } else {
            setImageDescriptionTamil(description);
            // Skip Gemini audio generation for Tamil to ensure better pronunciation via native TTS
            setActiveText(description);
            setActiveLang(lang);
            speak(description, lang, undefined);
        }
    } catch (error) {
        console.error(`Image description failed for ${lang}:`, error);
        const errorMsg = "Sorry, I couldn't describe the image.";
        setActiveText(errorMsg);
        speak(errorMsg, Language.English);
    } finally {
        setLoading({ active: false, message: '' });
    }
  }, [data.file, speak, imageDescription, imageDescriptionTamil, geminiAudioDescription, stop]);

  const handleRead = useCallback(async (lang: Language) => {
    stop();

    if (currentView === 'description') {
        handleDescribeImage(lang);
        return;
    }

    setLoading({ active: true, message: 'Preparing text...' });
    try {
        let textToRead: string = '';
        let audioForSpeech: string | undefined;

        if (lang === Language.English) {
            textToRead = data.extractedText;
            audioForSpeech = geminiAudio;
            if (!audioForSpeech && textToRead) {
                setLoading({ active: true, message: ['Generating high-quality audio...', 'This may take a moment.'] });
                const newAudio = await generateSpeech(textToRead);
                setGeminiAudio(newAudio);
                audioForSpeech = newAudio;
            }
        } else { // Tamil
            const isAlreadyTamil = /[\u0B80-\u0BFF]/.test(data.extractedText);
            let tamilText = translatedTamilText;
            
            if (isAlreadyTamil && !tamilText) {
                tamilText = data.extractedText;
                setTranslatedTamilText(tamilText); // Cache it
            }
            
            if (!tamilText) {
                setLoading({ active: true, message: 'Translating to Tamil...' });
                const newTamilText = await translateText(data.extractedText, 'Tamil');
                setTranslatedTamilText(newTamilText);
                tamilText = newTamilText;
            }
            
            textToRead = tamilText || '';
            // For Tamil, we force native browser TTS by passing undefined for audio.
            // This usually provides better pronunciation for Tamil than the current Gemini preview model.
            audioForSpeech = undefined;
        }
        
        if (!textToRead) {
            throw new Error("Text content is empty or translation failed.");
        }

        setActiveText(textToRead);
        setActiveLang(lang);
        speak(textToRead, lang, audioForSpeech);
        
    } catch (error) {
        console.error(`Error during read process for ${lang}:`, error);
        const errorMsg = "Sorry, I couldn't process the text for reading.";
        setActiveText(errorMsg);
        speak(errorMsg, Language.English);
    } finally {
        setLoading({ active: false, message: ''});
    }
  }, [data.extractedText, geminiAudio, translatedTamilText, currentView, stop, speak, handleDescribeImage]);

  // Effect to handle incoming voice commands
  useEffect(() => {
    if (!voiceAction) return;

    switch (voiceAction) {
      case 'read-english':
        handleRead(Language.English);
        break;
      case 'read-tamil':
        handleRead(Language.Tamil);
        break;
      case 'pause':
        pause();
        break;
      case 'resume':
        if(isPaused) resume();
        break;
      case 'stop':
        stop();
        break;
      case 'describe-image-english':
        handleDescribeImage(Language.English);
        break;
      case 'describe-image-tamil':
        handleDescribeImage(Language.Tamil);
        break;
    }
    
    onVoiceActionConsumed();
  }, [voiceAction, onVoiceActionConsumed, handleRead, pause, resume, stop, isPaused, handleDescribeImage]);

  useEffect(() => {
      // Stop speech when component unmounts
      return () => {
          stop();
      };
  }, [stop]);
  
  const renderHighlightedText = (text: string, highlight: HighlightInfo) => {
    if (highlight.startIndex === -1 || highlight.endIndex === -1 || !text) {
      return text;
    }
    const pre = text.substring(0, highlight.startIndex);
    const highlighted = text.substring(highlight.startIndex, highlight.endIndex);
    const post = text.substring(highlight.endIndex);

    return (
      <>
        {pre}
        <span className="bg-yellow-400 text-black px-1 rounded">
          {highlighted}
        </span>
        {post}
      </>
    );
  };
  
  const showOcrText = () => {
      setCurrentView('ocr');
      // Show original or translated text based on last active language
      setActiveText(activeLang === Language.Tamil && translatedTamilText ? translatedTamilText : data.extractedText);
      stop();
  };

  return (
    <div className="p-4 flex flex-col h-full overflow-hidden">
      <button onClick={() => { stop(); onBack(); }} className="self-start p-2 mb-4 rounded-full hover:bg-gray-500/20 text-[var(--text-color)] flex items-center font-semibold text-lg">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow overflow-hidden">
        {/* Image/File Preview */}
        <div className="relative bg-gray-500/10 rounded-lg p-2 flex items-center justify-center overflow-auto">
          {data.file.type === 'image' && (
             <img src={data.file.content} alt={data.file.name} className="max-w-full max-h-full object-contain transition-transform duration-300" style={{ transform: `scale(${magnification})` }} />
          )}
          {data.file.type === 'pdf' && (
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24 mx-auto text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="mt-4 text-xl font-semibold">{data.file.name}</p>
            </div>
          )}
           <div className="absolute bottom-4 right-4 flex items-center bg-black/60 rounded-full p-1 gap-2 text-white shadow-lg">
                <button
                    onClick={decreaseMagnification}
                    aria-label="Decrease magnification"
                    className="w-10 h-10 rounded-full bg-gray-700/80 hover:bg-gray-600/80 flex items-center justify-center text-3xl font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                >
                    -
                </button>
                <span className="text-lg font-semibold w-12 text-center select-none" aria-live="polite">
                    {magnification.toFixed(1)}x
                </span>
                <button
                    onClick={increaseMagnification}
                    aria-label="Increase magnification"
                    className="w-10 h-10 rounded-full bg-gray-700/80 hover:bg-gray-600/80 flex items-center justify-center text-3xl font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                >
                    +
                </button>
            </div>
        </div>

        {/* Extracted Text and Controls */}
        <div className="flex flex-col bg-gray-500/10 rounded-lg overflow-hidden">
          <div className="p-4 flex-grow overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-2xl font-bold">
                {currentView === 'ocr'
                  ? (activeLang === Language.English ? 'Extracted Text' : 'மொழிபெயர்க்கப்பட்ட உரை')
                  : (activeLang === Language.English ? 'Image Description' : 'பட விளக்கம்')
                }
              </h3>
              {data.file.type === 'image' && (
                currentView === 'ocr' ? (
                  <button onClick={() => handleDescribeImage(Language.English)} className="px-3 py-2 bg-purple-600 text-white font-semibold rounded-lg text-base shadow-md hover:bg-purple-700 transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.553L16.5 21.75l-.398-1.197a3.375 3.375 0 00-2.456-2.456L12.5 17.25l1.197-.398a3.375 3.375 0 002.456-2.456L16.5 13.5l.398 1.197a3.375 3.375 0 002.456 2.456L20.5 17.25l-1.197.398a3.375 3.375 0 00-2.456 2.456z" /></svg>
                    Describe Image
                  </button>
                ) : (
                  <button onClick={showOcrText} className="px-3 py-2 bg-gray-600 text-white font-semibold rounded-lg text-base shadow-md hover:bg-gray-700 transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    Show Extracted Text
                  </button>
                )
              )}
            </div>
            {loading.active ? <Spinner message={loading.message} /> : (
                <p className="text-xl whitespace-pre-wrap">
                    {renderHighlightedText(activeText, highlightInfo)}
                </p>
            )}
          </div>
          <PlaybackControls
            onReadEnglish={() => handleRead(Language.English)}
            onReadTamil={() => handleRead(Language.Tamil)}
            onPause={pause}
            onResume={resume}
            onStop={stop}
            isPlaying={isPlaying}
            isPaused={isPaused}
            isDescriptionActive={currentView === 'description'}
          />
        </div>
      </div>
    </div>
  );
};

export default ViewerScreen;
