
import React, { useState, useEffect } from 'react';

interface SpinnerProps {
  message: string | string[];
  interval?: number;
}

const Spinner: React.FC<SpinnerProps> = ({ message, interval = 3000 }) => {
  const [currentMessage, setCurrentMessage] = useState(Array.isArray(message) ? message[0] : message);

  useEffect(() => {
    if (Array.isArray(message) && message.length > 1) {
      let index = 0;
      const timer = setInterval(() => {
        index = (index + 1) % message.length;
        setCurrentMessage(message[index]);
      }, interval);
      return () => clearInterval(timer);
    } else {
        setCurrentMessage(Array.isArray(message) ? message[0] : message);
    }
  }, [message, interval]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 text-center p-4">
      <div className="w-16 h-16 border-8 border-dashed rounded-full animate-spin border-[var(--accent-color)]"></div>
      <p className="text-lg font-semibold text-[var(--text-color)]">{currentMessage}</p>
    </div>
  );
};

export default Spinner;
