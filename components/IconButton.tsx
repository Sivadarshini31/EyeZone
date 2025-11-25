
import React from 'react';
import { speakText } from '../utils/helpers';
import { Language } from '../types';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: React.ReactNode;
  language: Language;
}

const IconButton: React.FC<IconButtonProps> = ({ label, icon, language, ...props }) => {
  return (
    <button
      {...props}
      aria-label={label}
      onFocus={() => speakText(label, language)}
      className="flex flex-col items-center justify-center p-6 space-y-3 rounded-2xl bg-[var(--accent-color)] text-white shadow-lg transform hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50 focus:ring-[var(--accent-color)]"
    >
      <div className="w-16 h-16">{icon}</div>
      <span className="text-xl font-bold tracking-wider uppercase">{label}</span>
    </button>
  );
};

export default IconButton;
