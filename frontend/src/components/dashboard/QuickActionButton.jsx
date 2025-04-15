import React from 'react';
import { Link } from 'react-router-dom';

const QuickActionButton = ({ icon, label, to }) => {
    return (
        <Link to={to} className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-medium py-2 px-4 rounded-md text-sm">
            <div className="flex flex-col items-center">
                {icon}
                {label}
            </div>
        </Link>
    );
};

export default QuickActionButton;