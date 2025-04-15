import React from 'react';

const DetailItem = ({ label, value }) => {
    return (
        <div className="flex justify-between">
            <span className="text-gray-500">{label}:</span>
            <span className="font-medium">{value || 'N/A'}</span>
        </div>
    );
};

export default DetailItem;