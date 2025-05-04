import React from 'react';

const SummaryCard = ({ title, value, color }) => {
    const colorClasses = {
        orange: 'text-amber-500',
        blue: 'text-vw-green',
        green: 'text-green-600',
        dark: 'text-vw-dark',
    };

    return (
        <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="text-xs font-semibold text-gray-500">{title}</h3>
            <p className={`text-2xl font-bold ${colorClasses[color] || 'text-vw-dark'}`}>{value}</p>
        </div>
    );
};

export default SummaryCard;