import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();

    // Redirect authenticated users to dashboard
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, isLoading, navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* App Header */}
            <div className="bg-indigo-600 text-white p-4 text-center">
                <h2 className="text-xl font-bold">VisionWest</h2>
                <p className="text-sm">Work Order Management</p>
            </div>

            {/* Login Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-6">
                <LoginForm />
            </div>
        </div>
    );
};

export default LoginPage;