import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import TextField from '../components/common/TextField';
import Button from '../components/common/Button';
import nextgenLogo from '../assets/nextgen-logo.png';

const ChangePasswordPage = () => {
    const navigate = useNavigate();
    const { changePassword, requirePasswordChange } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: '' });

    // Calculate password strength
    const calculatePasswordStrength = (password) => {
        if (!password) {
            return { score: 0, message: '', color: '' };
        }

        let score = 0;
        let message = '';
        let color = '';

        // Length check
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;

        // Character variety checks
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^a-zA-Z0-9]/.test(password)) score += 1;

        // Determine strength message and color
        if (score < 3) {
            message = 'Weak';
            color = 'text-red-600';
        } else if (score < 5) {
            message = 'Medium';
            color = 'text-yellow-600';
        } else {
            message = 'Strong';
            color = 'text-green-600';
        }

        return { score, message, color };
    };

    const handleNewPasswordChange = (e) => {
        const value = e.target.value;
        setNewPassword(value);
        setPasswordStrength(calculatePasswordStrength(value));
    };

    const validateForm = () => {
        // Check all fields are filled
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('Please fill in all fields');
            return false;
        }

        // Check minimum length
        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters long');
            return false;
        }

        // Check passwords match
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return false;
        }

        // Check new password is different from current
        if (newPassword === currentPassword) {
            setError('New password must be different from current password');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            await changePassword(currentPassword, newPassword);
            // Redirect to dashboard after successful password change
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left side - Brand section (Desktop only) */}
            <div className="hidden lg:flex lg:w-1/2 bg-deep-navy text-pure-white flex-col justify-center items-center p-12">
                <div className="max-w-md w-full text-center">
                    <img
                        src={nextgenLogo}
                        alt="NextGen WOM"
                        className="h-20 mx-auto mb-8 object-contain"
                    />
                    <h1 className="text-4xl font-bold mb-4">NextGen WOM</h1>
                    <p className="text-xl text-pure-white/80 mb-8">
                        Work Order Management System
                    </p>
                    <p className="text-pure-white/60">
                        {requirePasswordChange
                            ? 'For security reasons, you must change your temporary password before accessing the system.'
                            : 'Update your password to keep your account secure.'}
                    </p>
                </div>
            </div>

            {/* Right side - Change Password form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center py-8 px-4 sm:px-6 lg:px-8 bg-pure-white min-h-screen relative">
                <div className="w-full max-w-md space-y-8">
                    <div className="lg:mt-0">
                        <h2 className="text-center text-2xl lg:text-3xl font-bold text-rich-black">
                            Change Your Password
                        </h2>
                        {requirePasswordChange && (
                            <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-yellow-700">
                                            You must change your temporary password to continue.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <TextField
                                id="currentPassword"
                                name="currentPassword"
                                type="password"
                                label="Current Password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                placeholder="Enter your current password"
                            />

                            <div>
                                <TextField
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    label="New Password"
                                    value={newPassword}
                                    onChange={handleNewPasswordChange}
                                    required
                                    placeholder="Enter your new password"
                                />
                                {newPassword && (
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Password strength:</span>
                                            <span className={`text-sm font-medium ${passwordStrength.color}`}>
                                                {passwordStrength.message}
                                            </span>
                                        </div>
                                        <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${
                                                    passwordStrength.score < 3
                                                        ? 'bg-red-500'
                                                        : passwordStrength.score < 5
                                                        ? 'bg-yellow-500'
                                                        : 'bg-green-500'
                                                }`}
                                                style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500">
                                            Use at least 8 characters with a mix of uppercase, lowercase, numbers, and symbols.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <TextField
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                label="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Confirm your new password"
                            />

                            {error && (
                                <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm text-center border border-red-200">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                fullWidth
                                disabled={isLoading}
                            >
                                {isLoading ? 'Changing Password...' : 'Change Password'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordPage;
