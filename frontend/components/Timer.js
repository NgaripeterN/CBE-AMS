import { useState, useEffect } from 'react';

const Timer = ({ duration, startTime, onTimeUp, isStarted }) => {
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    if (!isStarted || !startTime) {
      setRemainingTime(duration * 60);
      return;
    }

    const endTime = startTime + (duration * 60 * 1000);

    const updateRemainingTime = () => {
      const now = Date.now();
      const newRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setRemainingTime(newRemaining);

      if (newRemaining === 0) {
        onTimeUp();
      }
    };
    
    updateRemainingTime(); // Initial update
    const timer = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(timer);
  }, [isStarted, startTime, duration, onTimeUp]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isStarted) {
    return null; // The parent component will handle the start button
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