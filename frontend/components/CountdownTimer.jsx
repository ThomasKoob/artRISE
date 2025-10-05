import { useState, useEffect } from "react";

const CountdownTimer = ({ endDate, onExpired }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const difference = end - now;

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    }

    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      // Check if auction has ended
      if (
        newTimeLeft.days === 0 &&
        newTimeLeft.hours === 0 &&
        newTimeLeft.minutes === 0 &&
        newTimeLeft.seconds === 0
      ) {
        if (onExpired) onExpired();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate, onExpired]);

  // If auction has ended
  if (
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0
  ) {
    return (
      <div className="text-lightRedButton/80 font-semibold text-sm">
        🔴 Auction Ended
      </div>
    );
  }

  return (
    <div className="flex gap-1 text-sm">
      <div className="flex items-center gap-1">
        <span className="countdown-timer text-blue-500">
          {timeLeft.days > 0 && (
            <span className="text-xs">{timeLeft.days}d </span>
          )}
          <span className="font-mono text-xs">
            {String(timeLeft.hours).padStart(2, "0")}:
            {String(timeLeft.minutes).padStart(2, "0")}:
            {String(timeLeft.seconds).padStart(2, "0")}
          </span>
        </span>
        <span className="text-xs">⏰</span>
      </div>
    </div>
  );
};

export default CountdownTimer;
