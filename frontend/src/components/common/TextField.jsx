import React from 'react';

const TextField = ({
    label,
    type = 'text',
    id,
    name,
    placeholder,
    value,
    onChange,
    onBlur,
    error,
    required = false,
    ...props
}) => {
    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <input
                type={type}
                id={id}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                required={required}
                className={`appearance-none rounded-md relative block w-full px-3 py-3 border ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                    } placeholder-gray-500 text-gray-900 focus:outline-none focus:z-10 sm:text-sm`}
                {...props}
            />

            {error && (
                <p className="mt-1 text-xs text-red-600">{error}</p>
            )}
        </div>
    );
};

export default TextField;