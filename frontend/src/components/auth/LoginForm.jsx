import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import TextField from '../common/TextField';
import Button from '../common/Button';
import { useAuth } from '../../hooks/useAuth';

// Form validation schema using Zod
const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const LoginForm = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const { login } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        }
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        setServerError('');

        try {
            await login(data.email, data.password);
            // Successful login is handled by the useAuth hook which will redirect
        } catch (error) {
            setServerError(
                error.response?.data?.message ||
                'Unable to login. Please check your credentials and try again.'
            );
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md space-y-8">
            <div>
                <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">Sign in to your account</h2>
            </div>

            {serverError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p className="text-sm text-red-700">{serverError}</p>
                </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div className="rounded-md shadow-sm space-y-4">
                    <TextField
                        id="email-address"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="Email address"
                        {...register('email')}
                        error={errors.email?.message}
                    />

                    <TextField
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        placeholder="Password"
                        {...register('password')}
                        error={errors.password?.message}
                    />
                </div>

                <div>
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
    );
};

export default LoginForm;