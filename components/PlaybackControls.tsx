
import React from 'react';
import { Language } from '../types';
import { translations } from '../utils/translations';

interface PlaybackControlsProps {
  onReadEnglish: () => void;
  onReadTamil: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  isPlaying: boolean;
  isPaused: boolean;
  isDescriptionActive?: boolean;
  language: Language;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  onReadEnglish,
  onReadTamil,
  onPause,
  onResume,
  onStop,
  isPlaying,
  isPaused,
  isDescriptionActive = false,
  language,
}) => {
  const showPlaybackControls = isPlaying || isPaused;
  const t = translations[language];

  return (
    <div className="p-4 bg-gray-500/20 border-t border-gray-500/30 flex flex-col items-center gap-4">
      {/* Language Selection */}
      <div className="flex flex-wrap gap-3 justify-center w-full">
        <button onClick={onReadEnglish} className="px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg text-lg flex-1 min-w-[150px] shadow-md hover:bg-blue-700 transition-colors">
          {isDescriptionActive ? t.readDescriptionAgain : t.readEnglish}
        </button>
        <button 
          onClick={onReadTamil} 
          className="px-4 py-3 bg-orange-600 text-white font-semibold rounded-lg text-lg flex-1 min-w-[150px] shadow-md hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {t.readTamil}
        </button>
      </div>

      {/* Playback Controls */}
      {showPlaybackControls && (
        <div className="flex flex-wrap gap-3 justify-center w-full">
          {!isPlaying && isPaused ? (
            <button onClick={onResume} className="px-4 py-3 bg-green-600 text-white font-semibold rounded-lg text-lg flex-1 min-w-[120px] shadow-md hover:bg-green-700 transition-colors">{t.resume}</button>
          ) : (
            <button onClick={onPause} disabled={!isPlaying} className="px-4 py-3 bg-yellow-600 text-white font-semibold rounded-lg text-lg flex-1 min-w-[120px] shadow-md hover:bg-yellow-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">{t.pause}</button>
          )}
          <button onClick={onStop} className="px-4 py-3 bg-red-600 text-white font-semibold rounded-lg text-lg flex-1 min-w-[120px] shadow-md hover:bg-red-700 transition-colors">{t.stop}</button>
        </div>
      )}
    </div>
  );
};

export default PlaybackControls;
