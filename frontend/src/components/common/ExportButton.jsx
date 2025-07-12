import React, { useState } from 'react';
import { exportService } from '../../services/exportService';

const ExportButton = ({ workOrderId, size = 'default', variant = 'primary', className = '' }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState(null);

    const handleExport = async () => {
        if (!workOrderId) {
            setExportStatus({ type: 'error', message: 'Work order ID is required' });
            return;
        }

        setIsExporting(true);
        setExportStatus(null);

        try {
            const result = await exportService.exportWorkOrderPDF(workOrderId);
            setExportStatus({
                type: 'success',
                message: `PDF exported successfully: ${result.filename}`
            });

            // Clear success message after 3 seconds
            setTimeout(() => setExportStatus(null), 3000);
        } catch (error) {
            setExportStatus({
                type: 'error',
                message: error.message
            });

            // Clear error message after 5 seconds
            setTimeout(() => setExportStatus(null), 5000);
        } finally {
            setIsExporting(false);
        }
    };

    const getSizeClasses = () => {
        switch (size) {
            case 'small':
                return 'px-3 py-1.5 text-sm';
            case 'large':
                return 'px-6 py-3 text-lg';
            default:
                return 'px-4 py-2 text-base';
        }
    };

    const getVariantClasses = () => {
        switch (variant) {
            case 'secondary':
                return 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200';
            case 'outline':
                return 'bg-transparent text-blue-600 border border-blue-600 hover:bg-blue-50';
            default:
                return 'bg-blue-600 text-white hover:bg-blue-700';
        }
    };

    return (
        <div className="relative">
            <button
                onClick={handleExport}
                disabled={isExporting}
                className={`
          inline-flex items-center justify-center gap-2 font-medium rounded-lg
          transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${getSizeClasses()}
          ${getVariantClasses()}
          ${className}
        `}
                title="Export work order as PDF"
            >
                {isExporting ? (
                    <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <span>Exporting...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <span>Export PDF</span>
                    </>
                )}
            </button>

            {/* Status Messages */}
            {exportStatus && (
                <div className={`
          absolute top-full left-0 mt-2 p-3 rounded-lg shadow-lg z-50 min-w-[250px]
          ${exportStatus.type === 'success'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }
        `}>
                    <div className="flex items-start gap-2">
                        {exportStatus.type === 'success' ? (
                            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        )}
                        <p className="text-sm font-medium">{exportStatus.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExportButton;
