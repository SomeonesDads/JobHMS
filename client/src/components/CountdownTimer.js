import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ startDate, endDate }) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0, hours: 0, minutes: 0, seconds: 0
    });
    const [status, setStatus] = useState("LOADING"); // LOADING, PRE_START, ACTIVE, ENDED

    useEffect(() => {
        if (!startDate || !endDate) return;

        const calculateTimeLeft = () => {
            const now = new Date();
            const start = new Date(startDate);
            const end = new Date(endDate);
            let target = null;

            if (now < start) {
                setStatus("PRE_START");
                target = start;
            } else if (now < end) {
                setStatus("ACTIVE");
                target = end;
            } else {
                setStatus("ENDED");
                return;
            }

            const difference = +target - +now;
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            } else {
                // Re-evaluate on next tick
            }
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft(); // Initial call

        return () => clearInterval(timer);
    }, [startDate, endDate]);

    if (!startDate || !endDate) return null;

    if (status === "ENDED") {
        return (
            <div className="bg-slate-800 text-white p-4 text-center font-bold rounded-lg mb-6 shadow-md">
                DEADLINE TO VOTE IS DONE
            </div>
        );
    }

    const title = status === "PRE_START" ? "REGISTERS ARE OPEN UNTIL" : "VOTING IS OPENED UNTIL";
    const bgClass = status === "ACTIVE" ? "bg-emerald-600" : "bg-blue-600";

    return (
        <div className={`${bgClass} text-white p-4 rounded-lg mb-6 shadow-md text-center transition-colors duration-500`}>
            <h3 className="text-sm font-semibold uppercase opacity-90 mb-1 tracking-wider">{title}</h3>
            <div className="text-3xl font-bold font-mono">
                {String(timeLeft.days).padStart(2, '0')}:{String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </div>
        </div>
    );
};

export default CountdownTimer;
