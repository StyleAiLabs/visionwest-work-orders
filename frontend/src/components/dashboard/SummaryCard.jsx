import React from 'react';

const SummaryCard = ({ title, value, color }) => {
    const colorClasses = {
        orange: 'text-orange-500',
        blue: 'text-blue-600',
        green: 'text-green-600',
        indigo: 'text-indigo-600',
    };

    return (
        <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="text-xs font-semibold text-gray-500">{title}</h3>
            <p className={`text-2xl font-bold ${colorClasses[color] || 'text-gray-800'}`}>{value}</p>
        </div>
    );
};

export default SummaryCard;