import { useState, useEffect } from 'react';

const Timer = ({ duration, onStart, onTimeUp, isStarted, isEligible }) => {
  const [remainingTime, setRemainingTime] = useState(duration * 60);

  useEffect(() => {
    if (!isStarted || remainingTime <= 0) {
      if (isStarted && remainingTime <= 0) {
        onTimeUp();
      }
      return;
    }

    const timer = setInterval(() => {
      setRemainingTime(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, remainingTime, onTimeUp]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isStarted) {
    return (
        <div className="mt-8 text-right">
            {isEligible && (
                <button
                onClick={onStart}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    Start Assessment
                </button>
            )}
      </div>
    );
  }
  
  const isTimeLow = remainingTime <= 300; // 5 minutes
  const timerColorClasses = isTimeLow
    ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
    : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';


  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-colors duration-500 ${timerColorClasses}`}>
      <p className="text-lg font-semibold text-center">Time Remaining</p>
      <p className="text-4xl font-bold text-center">{formatTime(remainingTime)}</p>
    </div>
  );
};

export default Timer;