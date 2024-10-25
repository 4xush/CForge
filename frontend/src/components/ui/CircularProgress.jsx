// src/components/CircularProgress.jsx
import React from 'react';

const CircularProgress = ({ solved, total }) => {
    const radius = 30;
    const strokeWidth = 4;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (solved / total) * circumference;

    return (
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
            <circle
                stroke="#4a5568"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
            />
            <circle
                stroke="#48bb78"
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset }}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
            />
            <text
                x="50%"
                y="50%"
                dy=".3em"
                textAnchor="middle"
                className="text-xl font-bold fill-current"
                transform={`rotate(90 ${radius} ${radius})`}
            >
                {solved}
            </text>
        </svg>
    );
};

export default CircularProgress;
