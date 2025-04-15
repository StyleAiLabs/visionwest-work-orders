import React from 'react';

const Button = ({
    children,
    type = 'button',
    variant = 'primary',
    fullWidth = false,
    disabled = false,
    onClick
}) => {
    const baseStyles = "relative py-3 px-4 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variants = {
        primary: "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500",
        secondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 focus:ring-indigo-500",
        danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
        <button
            type={type}
            className={`${baseStyles} ${variants[variant]} ${widthClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default Button;