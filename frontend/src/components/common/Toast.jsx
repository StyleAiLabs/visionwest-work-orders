import React from 'react';

const Toast = ({ message, type = 'error', onClose }) => {
    const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';

    return (
        <div className={`fixed bottom-20 left-4 right-4 ${bgColor} text-white p-4 rounded-lg shadow-lg z-50`}>
            <div className="flex justify-between items-center">
                <p>{message}</p>
                <button onClick={onClose} className="text-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Toast;