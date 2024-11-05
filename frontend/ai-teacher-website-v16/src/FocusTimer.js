import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const FocusTimer = () => {
  const [time, setTime] = useState(50 * 60); // 50 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [isLearning, setIsLearning] = useState(true);

  useEffect(() => {
    let interval = null;
    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime(time => time - 1);
      }, 1000);
    } else if (time === 0) {
      setIsActive(false);
      if (isLearning) {
        setTime(10 * 60); // Set to 10 minutes break
        setIsLearning(false);
      } else {
        setTime(50 * 60); // Set back to 50 minutes learning
        setIsLearning(true);
      }
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, time, isLearning]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTime(50 * 60);
    setIsLearning(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateProgress = () => {
    const totalTime = isLearning ? 50 * 60 : 10 * 60;
    return ((totalTime - time) / totalTime) * 100;
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-64">
      <h3 className="text-xl font-semibold text-gray-200 mb-4 text-center">
        {isLearning ? 'Focus Time' : 'Break Time'}
      </h3>
      <div className="relative w-48 h-48 mx-auto mb-4">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            className="text-gray-700 stroke-current"
            strokeWidth="10"
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
          />
          <circle
            className="text-blue-500 stroke-current"
            strokeWidth="10"
            strokeLinecap="round"
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 - (251.2 * calculateProgress()) / 100}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold text-gray-200">{formatTime(time)}</span>
        </div>
      </div>
      <div className="flex justify-center space-x-4">
        <button
          onClick={toggleTimer}
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          {isActive ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button
          onClick={resetTimer}
          className="p-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          <RotateCcw size={24} />
        </button>
      </div>
    </div>
  );
};

export default FocusTimer;