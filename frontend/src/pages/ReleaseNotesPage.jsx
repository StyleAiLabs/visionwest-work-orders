import React, { useState, useEffect } from 'react';
import AppHeader from '../components/layout/AppHeader';
import MobileNavigation from '../components/layout/MobileNavigation';
import { useNavigate } from 'react-router-dom';
import { appService } from '../services/appService';

const ReleaseNotesPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [releases, setReleases] = useState([
        {
            version: '2.3.0',
            date: 'July 13, 2025',
            title: 'PDF Export & Webhook Enhancements',
            features: [
                {
                    category: 'New Features',
                    items: [
                        'Complete PDF export functionality with work order details, images, notes, and history',
                        'Image thumbnails in PDF exports for visual documentation',
                        'Intelligent webhook duplicate handling - updates existing records instead of failing',
                        'Enhanced mobile navigation with new Quotes section'
                    ]
                },
                {
                    category: 'Improvements',
                    items: [
                        'Icon-based filter system with intuitive color coding',
                        'Improved pagination with smart page number display',
                        'Better mobile responsiveness across all pages',
                        'Enhanced error handling and logging for webhooks'
                    ]
                },
                {
                    category: 'Technical',
                    items: [
                        'Migrated from Puppeteer to PDFKit for better server compatibility',
                        'Added comprehensive audit trails for webhook updates',
                        'Improved data synchronization between n8n workflows and application',
                        'Enhanced notification system for work order updates'
                    ]
                }
            ]
        },
        {
            version: '2.2.0',
            date: 'July 12, 2025',
            title: 'UI/UX Improvements',
            features: [
                {
                    category: 'User Interface',
                    items: [
                        'Redesigned work order cards with better status visibility',
                        'Improved photo gallery with full-screen viewing',
                        'Enhanced status update forms for different user roles',
                        'Better loading states and error messages'
                    ]
                },
                {
                    category: 'Performance',
                    items: [
                        'Faster page load times',
                        'Optimized image loading and caching',
                        'Improved database query performance',
                        'Better memory management for large datasets'
                    ]
                }
            ]
        },
        {
            version: '2.1.0',
            date: 'July 10, 2025',
            title: 'Authentication & Security',
            features: [
                {
                    category: 'Security',
                    items: [
                        'Enhanced authentication system',
                        'Role-based access control improvements',
                        'API key authentication for webhooks',
                        'Improved session management'
                    ]
                },
                {
                    category: 'Bug Fixes',
                    items: [
                        'Fixed navigation issues on mobile devices',
                        'Resolved photo upload problems',
                        'Corrected date formatting inconsistencies',
                        'Fixed status update notifications'
                    ]
                }
            ]
        }
    ]);

    // Optional: Fetch releases from API in the future
    useEffect(() => {
        const fetchReleases = async () => {
            try {
                setIsLoading(true);
                // Uncomment when API is ready to replace static data
                // const response = await appService.getReleaseNotes();
                // setReleases(response.data.releases);
            } catch (error) {
                console.error('Error fetching releases:', error);
                // Keep static releases as fallback
            } finally {
                setIsLoading(false);
            }
        };

        // fetchReleases(); // Uncomment when ready to use API
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <AppHeader
                title="Release Notes"
                showBackButton={true}
                onBackClick={() => navigate('/settings')}
            />

            <div className="pt-16 pb-16 p-4">
                <div className="space-y-6">
                    {releases.map((release, index) => (
                        <div key={release.version} className="bg-white rounded-lg shadow p-4">
                            {/* Release Header */}
                            <div className="border-b border-gray-200 pb-3 mb-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Version {release.version}
                                    </h2>
                                    {index === 0 && (
                                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                                            Latest
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{release.date}</p>
                                <h3 className="text-lg font-semibold text-gray-800 mt-2">
                                    {release.title}
                                </h3>
                            </div>

                            {/* Release Features */}
                            <div className="space-y-4">
                                {release.features.map((category, categoryIndex) => (
                                    <div key={categoryIndex}>
                                        <h4 className="text-md font-semibold text-gray-700 mb-2 flex items-center">
                                            {category.category === 'New Features' && (
                                                <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            {category.category === 'Improvements' && (
                                                <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            {category.category === 'Technical' && (
                                                <svg className="w-4 h-4 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            {category.category === 'User Interface' && (
                                                <svg className="w-4 h-4 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            {category.category === 'Performance' && (
                                                <svg className="w-4 h-4 mr-2 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            {category.category === 'Security' && (
                                                <svg className="w-4 h-4 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            {category.category === 'Bug Fixes' && (
                                                <svg className="w-4 h-4 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            {category.category}
                                        </h4>
                                        <ul className="space-y-1 ml-6">
                                            {category.items.map((item, itemIndex) => (
                                                <li key={itemIndex} className="text-sm text-gray-600 flex items-start">
                                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Info */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h4 className="text-sm font-medium text-blue-800">Stay Updated</h4>
                            <p className="text-sm text-blue-700 mt-1">
                                Release notes are automatically updated when new features are deployed.
                                Check back regularly for the latest improvements and features.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <MobileNavigation />
        </div>
    );
};

export default ReleaseNotesPage;
