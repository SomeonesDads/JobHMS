import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ deadline, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0, hours: 0, minutes: 0, seconds: 0
    });
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!deadline) return;

        const calculateTimeLeft = () => {
            const difference = +new Date(deadline) - +new Date();
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            } else {
                setIsExpired(true);
                if (onExpire) onExpire();
            }
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft(); // Initial call

        return () => clearInterval(timer);
    }, [deadline, onExpire]);

    if (!deadline) return null;

    if (isExpired) {
        return (
            <div className="bg-red-600 text-white p-4 text-center font-bold rounded-lg mb-6">
                VOTING DEADLINE HAS PASSED
            </div>
        );
    }

    return (
        <div className="bg-red-600 text-white p-4 rounded-lg mb-6 shadow-md text-center">
            <h3 className="text-sm font-semibold uppercase opacity-75 mb-1">Time Remaining</h3>
            <div className="text-3xl font-bold font-mono">
                {String(timeLeft.days).padStart(2, '0')}:{String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </div>
        </div>
    );
};

export default CountdownTimer;
