import React from 'react';

const AlertCounter = ({ count }) => {
    if (count <= 0) return null;

    return (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {count > 9 ? '9+' : count}
        </div>
    );
};

export default AlertCounter;