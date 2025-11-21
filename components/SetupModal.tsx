import React, { useState } from 'react';

interface SetupModalProps {
  isOpen: boolean;
}

const SetupModal: React.FC<SetupModalProps> = ({ isOpen }) => {
  const [apiKey, setApiKey] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('GEMINI_API_KEY', apiKey);
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-8 rounded-lg max-w-md w-full mx-4 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Setup Required</h2>
        <p className="text-gray-300 mb-6">
          To use EyeZone, you need to configure your Gemini API key. Get one for free from{' '}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Google AI Studio
          </a>
        </p>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Paste your Gemini API key here"
          className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-600 rounded-lg mb-4 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSave}
          disabled={!apiKey.trim()}
          className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          Save and Continue
        </button>
      </div>
    </div>
  );
};

export default SetupModal;
