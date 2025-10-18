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
            version: '2.6.0',
            date: 'October 18, 2025',
            title: 'Manual Work Order Entry Enhancements',
            features: [
                {
                    category: 'New Features',
                    items: [
                        'Photo upload functionality - Users can now upload multiple "before" photos when creating work orders',
                        'Camera integration - Direct camera capture on mobile devices and desktops with webcam',
                        'Gallery upload - Select multiple photos from device gallery',
                        'Auto-fill supplier details - Automatically sets supplier to "Williams Property Service"',
                        'Auto-fill authorization - Populates authorized by fields from logged-in user profile',
                        'Photo validation - Automatic validation for file type (images only) and size (max 5MB per photo)'
                    ]
                },
                {
                    category: 'Improvements',
                    items: [
                        'Enhanced validation - Property address and phone are now required fields',
                        'Hidden supplier fields - Supplier input removed from UI (auto-filled on backend)',
                        'Photo preview grid - Visual preview with ability to remove selected photos',
                        'Editable authorization fields - Auto-filled fields remain editable for flexibility',
                        'User-friendly error messages - Clear, descriptive error messages for validation failures',
                        'Duplicate prevention - Prevents creation of work orders with duplicate job numbers'
                    ]
                },
                {
                    category: 'Technical',
                    items: [
                        'React Hook Form integration for efficient form state management',
                        'Two-step workflow - Creates work order first, then uploads photos separately',
                        'Default value enforcement - Backend always enforces Williams Property Service as supplier',
                        'Improved validation logic - Updated validation to require property_address and property_phone',
                        'Memory management - Proper cleanup of object URLs to prevent memory leaks',
                        'Automated test script with 4 test cases and comprehensive manual testing guide'
                    ]
                },
                {
                    category: 'Bug Fixes',
                    items: [
                        'Fixed database column name reference (phone_number instead of phone)',
                        'Ensured Williams Property Service is always set, regardless of manual input',
                        'Improved JWT token validation and error messages',
                        'Fixed proper error messages for missing required fields'
                    ]
                }
            ]
        },
        {
            version: '2.5.0',
            date: 'October 18, 2025',
            title: 'Multi-Client Platform Support',
            features: [
                {
                    category: 'New Features',
                    items: [
                        'Multi-tenant platform: System now supports multiple independent client organizations',
                        'Admin Panel for client management (accessible from Settings for admin users)',
                        'Client organization CRUD operations (Create, Read, Update, Delete)',
                        'Client context switching for administrators to view data across organizations',
                        'Search and filter clients by name, code, or status',
                        'Mobile-responsive admin interface with card-based layout'
                    ]
                },
                {
                    category: 'Security',
                    items: [
                        'Client data isolation - users can only access their organization\'s work orders',
                        'Enhanced JWT authentication with client context (clientId, clientCode)',
                        'Automatic client assignment for new work orders and users',
                        'Foreign key constraints ensure data referential integrity',
                        'Middleware-based client scoping for all API endpoints'
                    ]
                },
                {
                    category: 'Improvements',
                    items: [
                        'Enhanced login/registration with client validation',
                        'Improved navigation between Dashboard, Admin Panel, and Settings',
                        'Database performance optimizations with composite indexes',
                        'Better error handling for cross-client access attempts',
                        'All existing Visionwest data seamlessly migrated to multi-client structure'
                    ]
                },
                {
                    category: 'Technical',
                    items: [
                        'New clients table with organization information',
                        'Client relationships added to users and work_orders tables',
                        'Sequelize models extended with client associations',
                        'Client scoping middleware for automatic data filtering',
                        'Composite indexes for optimized multi-client queries',
                        'n8n webhook integration preserved and working with Visionwest client'
                    ]
                }
            ]
        },
        {
            version: '2.4.1',
            date: 'July 13, 2025',
            title: 'Pagination Improvements',
            features: [
                {
                    category: 'Bug Fixes',
                    items: [
                        'Fixed pagination displaying too many page numbers - now shows appropriate pages based on records',
                        'Improved work orders list pagination to show 5 records per page instead of 2',
                        'Better pagination calculation that matches user expectations',
                        'More intuitive navigation through work orders with cleaner page number display'
                    ]
                },
                {
                    category: 'User Experience',
                    items: [
                        'Optimal balance between page load performance and content visibility',
                        'Cleaner pagination interface with fewer unnecessary page buttons',
                        'Easier browsing through work orders list',
                        'Consistent pagination behavior across different data sizes'
                    ]
                },
                {
                    category: 'Technical',
                    items: [
                        'Updated frontend pagination limit from 2 to 5 records per page',
                        'Maintained compatibility with existing backend pagination logic',
                        'Improved pagination calculation: Math.ceil(totalRecords / 5)',
                        'Version bump for minor release (2.4.0 → 2.4.1)'
                    ]
                }
            ]
        },
        {
            version: '2.4.0',
            date: 'July 13, 2025',
            title: 'Photo Management & Navigation Enhancements',
            features: [
                {
                    category: 'New Features',
                    items: [
                        'Photo count indicators on all work order cards - shows number of uploaded photos at a glance',
                        'PO Number display on work order cards instead of supplier name for better tracking',
                        'Enhanced navigation with back buttons from work orders list to dashboard',
                        'Streamlined photo count display - clean camera icon with count, no borders or backgrounds'
                    ]
                },
                {
                    category: 'Improvements',
                    items: [
                        'Fixed photo count discrepancy between card view and detail view',
                        'Improved API response to include accurate photo counts in work order lists',
                        'Better visual hierarchy with darker text for photo counts when photos are available',
                        'Enhanced user experience with consistent navigation patterns'
                    ]
                },
                {
                    category: 'Technical',
                    items: [
                        'Optimized database queries to include photo associations in work order list endpoint',
                        'Added debugging capabilities for photo count troubleshooting',
                        'Improved data consistency between frontend and backend photo counting',
                        'Enhanced work order card component with better field name compatibility'
                    ]
                }
            ]
        },
        {
            version: '2.3.0',
            date: 'July 09, 2025',
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
            date: 'July 02, 2025',
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
            date: 'June 26, 2025',
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
