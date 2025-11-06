import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AppHeader from '../../components/layout/AppHeader';
import MobileNavigation from '../../components/layout/MobileNavigation';

const QuotesPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50">
            <AppHeader title="Quotes" />

            <main className="pt-16 pb-20 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header with New Quote Button */}
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Quote Requests</h1>
                        {(user?.role === 'client_admin' || user?.role === 'admin') && (
                            <button
                                onClick={() => navigate('/quotes/new')}
                                className="bg-nextgen-green hover:bg-nextgen-green-dark text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                New Quote Request
                            </button>
                        )}
                    </div>

                    {/* Coming Soon Message */}
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <div className="mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-nextgen-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quote Request System</h2>
                        <p className="text-gray-600 mb-4">
                            Request formal quotes for maintenance work requiring cost assessment and pre-approval.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-blue-800">
                                <strong>Phase 3 Complete!</strong> The backend API is ready and functional.
                                <br />
                                Frontend UI coming in the next update.
                            </p>
                        </div>
                        <div className="text-left max-w-md mx-auto">
                            <h3 className="font-semibold text-gray-900 mb-2">Features Ready:</h3>
                            <ul className="space-y-2 text-gray-600">
                                <li className="flex items-start gap-2">
                                    <svg className="h-5 w-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Create and save quote request drafts</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <svg className="h-5 w-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Submit quotes for WPSG review</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <svg className="h-5 w-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Auto-generate unique quote numbers (QTE-YYYY-###)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <svg className="h-5 w-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Automatic notifications to WPSG staff</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <svg className="h-5 w-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Complete validation and access control</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>

            <MobileNavigation />
        </div>
    );
};

export default QuotesPage;
