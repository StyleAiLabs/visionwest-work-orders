import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import TextField from '../components/common/TextField';
import Button from '../components/common/Button';
import nextgenLogo from '../assets/nextgen-logo.png';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Get the redirect path from location state, default to dashboard
    const from = location.state?.from?.pathname || '/dashboard';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await login(email, password);

            // Check if password change is required
            if (response.requirePasswordChange) {
                navigate('/change-password', { replace: true });
            } else {
                navigate(from, { replace: true });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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
                        Streamline your property maintenance operations with our comprehensive work order management platform.
                    </p>
                </div>
            </div>

            {/* Right side - Login form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center py-8 px-4 sm:px-6 lg:px-8 bg-pure-white min-h-screen relative">

                <div className="w-full max-w-md space-y-8">
                    <div className="lg:mt-0">
                        <h2 className="text-center text-2xl lg:text-3xl font-bold text-rich-black">
                            Sign in to your account
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Access NextGen WOM
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <TextField
                                id="email"
                                name="email"
                                type="email"
                                label="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Enter your email"
                            />

                            <TextField
                                id="password"
                                name="password"
                                type="password"
                                label="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Enter your password"
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
                                {isLoading ? 'Signing in...' : 'Sign in'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;