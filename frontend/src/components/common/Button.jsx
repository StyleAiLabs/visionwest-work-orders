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
        primary: "bg-nextgen-green hover:bg-nextgen-green-dark text-pure-white focus:ring-nextgen-green",
        secondary: "bg-pure-white hover:bg-gray-50 text-rich-black border border-gray-300 focus:ring-nextgen-green",
        dark: "bg-deep-navy hover:bg-deep-navy-light text-pure-white focus:ring-deep-navy",
        danger: "bg-red-600 hover:bg-red-700 text-pure-white focus:ring-red-500",
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