'use client'
import React, { useEffect, useState } from 'react';
import './clock.css';

export default function Clock() {
    const [seconds, setSeconds] = useState(new Date().getSeconds());

    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds(new Date().getSeconds());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="clock">
            <div
                className="clock-sector"
                style={{backgroundImage: `conic-gradient(orange ${(seconds / 60) * 100}%, transparent ${(seconds / 60) * 100}%)`}}
            />
        </div>
    );
}