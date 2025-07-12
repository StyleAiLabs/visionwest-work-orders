import React, { useState } from 'react';
import { exportService } from '../../services/exportService';

const CompactExportButton = ({ workOrderId, className = '' }) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!workOrderId) return;

        setIsExporting(true);
        try {
            await exportService.exportWorkOrderPDF(workOrderId);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className={`
        inline-flex items-center justify-center p-2 text-gray-500 hover:text-blue-600 
        hover:bg-blue-50 rounded-lg transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
            title="Export as PDF"
        >
            {isExporting ? (
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
            ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
            )}
        </button>
    );
};

export default CompactExportButton;
