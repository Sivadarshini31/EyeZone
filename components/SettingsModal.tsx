
import React from 'react';
import { ContrastMode, Language, ReadingRate } from '../types';
import { speakText } from '../utils/helpers';
import { translations } from '../utils/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contrast: ContrastMode;
  setContrast: (mode: ContrastMode) => void;
  magnification: number;
  setMagnification: (level: number) => void;
  readingRate: ReadingRate;
  setReadingRate: (rate: ReadingRate) => void;
  speakCommands: boolean;
  setSpeakCommands: (enabled: boolean) => void;
  voiceCommandFeedback: boolean;
  setVoiceCommandFeedback: (enabled: boolean) => void;
  appLanguage: Language;
  setAppLanguage: (lang: Language) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, contrast, setContrast, magnification, setMagnification, readingRate, setReadingRate, speakCommands, setSpeakCommands, voiceCommandFeedback, setVoiceCommandFeedback, appLanguage, setAppLanguage
}) => {
  if (!isOpen) return null;

  const t = translations[appLanguage];

  const contrastOptions = [
    { id: ContrastMode.Light, label: t.light, classes: 'bg-white text-black' },
    { id: ContrastMode.Dark, label: t.dark, classes: 'bg-black text-white' },
    { id: ContrastMode.YellowDark, label: t.yellow, classes: 'bg-black text-yellow-400' },
    { id: ContrastMode.BlueDark, label: t.blue, classes: 'bg-black text-blue-300' },
  ];

  const readingRateOptions = [
    { id: ReadingRate.Slow, label: '0.75x' },
    { id: ReadingRate.Normal, label: '1x' },
    { id: ReadingRate.Fast, label: '1.5x' },
  ];
  
  const appLanguageOptions = [
    { id: Language.English, label: 'English' },
    { id: Language.Tamil, label: 'தமிழ் (Tamil)' },
  ];

  const handleVoiceCommandToggle = () => {
    const turningOn = !speakCommands;
    setSpeakCommands(turningOn);
    if (turningOn) {
        speakText('Voice commands enabled', appLanguage);
    } else {
        window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[var(--bg-color)] text-[var(--text-color)] rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">{t.settingsTitle}</h2>
          <button onClick={onClose} onFocus={() => speakText(t.closeSettings, appLanguage)} aria-label={t.closeSettings} className="p-2 rounded-full hover:bg-gray-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Language Setting */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">{t.appLanguage}</h3>
          <div className="flex justify-around bg-gray-500/20 rounded-lg p-1">
            {appLanguageOptions.map(option => (
              <button key={option.id} onClick={() => setAppLanguage(option.id)} onFocus={() => speakText(`Set language to ${option.label}`, appLanguage)} className={`px-4 py-2 rounded-md font-semibold text-lg flex-1 transition-colors ${appLanguage === option.id ? 'bg-[var(--accent-color)] text-white' : ''}`}>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Command Setting */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">{t.voiceCommands}</h3>
            <button
              role="switch"
              aria-checked={speakCommands}
              onClick={handleVoiceCommandToggle}
              onFocus={() => speakText(`${t.voiceCommands}. ${speakCommands ? t.on : t.off}.`, appLanguage)}
              className={`${
                speakCommands ? 'bg-[var(--accent-color)]' : 'bg-gray-500/50'
              } relative inline-flex h-8 w-14 items-center rounded-full transition-colors`}
            >
              <span
                className={`${
                  speakCommands ? 'translate-x-7' : 'translate-x-1'
                } inline-block h-6 w-6 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>
        </div>

        {/* Voice Command Feedback Setting */}
        <div className={`mb-6 pl-6 transition-opacity ${!speakCommands ? 'opacity-50' : 'opacity-100'}`}>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{t.commandFeedback}</h3>
            <button
              role="switch"
              aria-checked={voiceCommandFeedback}
              onClick={() => setVoiceCommandFeedback(!voiceCommandFeedback)}
              onFocus={() => speakText(`${t.commandFeedback}. ${voiceCommandFeedback ? t.on : t.off}.`, appLanguage)}
              disabled={!speakCommands}
              className={`${
                voiceCommandFeedback ? 'bg-[var(--accent-color)]' : 'bg-gray-500/50'
              } relative inline-flex h-8 w-14 items-center rounded-full transition-colors disabled:cursor-not-allowed`}
            >
              <span
                className={`${
                  voiceCommandFeedback ? 'translate-x-7' : 'translate-x-1'
                } inline-block h-6 w-6 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>
        </div>
        
        {/* Contrast Setting */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">{t.contrastMode}</h3>
          <div className="grid grid-cols-2 gap-3">
            {contrastOptions.map(option => (
              <button key={option.id} onClick={() => setContrast(option.id)} onFocus={() => speakText(`${t.contrastMode}: ${option.label}`, appLanguage)} className={`p-3 rounded-lg text-center font-semibold border-2 ${option.classes} ${contrast === option.id ? 'border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]' : 'border-gray-500/50'}`}>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Magnification Setting */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">{t.magnification}</h3>
          <div className="flex items-center space-x-4">
            <span className="text-lg">1x</span>
            <input 
              type="range" 
              min="1" 
              max="3" 
              step="0.1" 
              value={magnification}
              onChange={(e) => setMagnification(Number(e.target.value))}
              onFocus={() => speakText(`${t.magnification}. ${magnification.toFixed(1)}x.`, appLanguage)}
              className="w-full h-3 bg-gray-500/30 rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]"
            />
            <span className="text-lg">3x</span>
          </div>
        </div>

        {/* Reading Rate Setting */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">{t.readingRate}</h3>
          <div className="flex justify-around bg-gray-500/20 rounded-lg p-1">
            {readingRateOptions.map(option => (
              <button key={option.id} onClick={() => setReadingRate(option.id)} onFocus={() => speakText(`${t.readingRate}: ${option.label}`, appLanguage)} className={`px-4 py-2 rounded-md font-semibold text-lg flex-1 transition-colors ${readingRate === option.id ? 'bg-[var(--accent-color)] text-white' : ''}`}>
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default SettingsModal;
