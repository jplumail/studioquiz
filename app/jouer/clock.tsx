import React, { useEffect, useState } from 'react';
import './clock.css';
import { DateMilliseconds } from '@/shared/declarations';

export default function Clock({ startDate, endDate }: { startDate: DateMilliseconds, endDate: DateMilliseconds }) {
    const [currentDate, setCurrentDate] = useState(Date.now());
    const refreshRate = 30;

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentDate(Date.now());
        }, 1000/refreshRate);

        return () => clearInterval(interval);
    }, []);
    const percentage = Math.floor(((currentDate - startDate) / (endDate - startDate)) * 1000) / 10;

    return (
        percentage < 100 ?
        (<div className="clock">
            <div
                className="clock-sector"
                style={{ backgroundImage: `conic-gradient(orange ${percentage.toString()}%, transparent ${percentage.toString()}%)` }}
            />
        </div>) : null
    );
}