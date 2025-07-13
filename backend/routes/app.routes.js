const express = require('express');
const router = express.Router();
const packageJson = require('../package.json');

// Get app information
router.get('/info', (req, res) => {
    try {
        const appInfo = {
            name: packageJson.name,
            version: packageJson.version,
            description: packageJson.description,
            lastUpdated: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            features: {
                pdfExport: true,
                webhookDuplicateHandling: true,
                mobileOptimized: true,
                realTimeNotifications: true
            }
        };

        res.json({
            success: true,
            data: appInfo
        });
    } catch (error) {
        console.error('Error getting app info:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get app information',
            error: error.message
        });
    }
});

// Get release notes summary
router.get('/releases', (req, res) => {
    try {
        const releases = [
            {
                version: '2.3.0',
                date: '2025-07-13',
                title: 'PDF Export & Webhook Enhancements',
                summary: 'Complete PDF export functionality, intelligent webhook duplicate handling, and enhanced mobile navigation.',
                isCurrent: true
            },
            {
                version: '2.2.0',
                date: '2025-07-12',
                title: 'UI/UX Improvements',
                summary: 'Redesigned work order cards, improved photo gallery, and enhanced performance.',
                isCurrent: false
            },
            {
                version: '2.1.0',
                date: '2025-07-10',
                title: 'Authentication & Security',
                summary: 'Enhanced authentication system, role-based access control, and bug fixes.',
                isCurrent: false
            }
        ];

        res.json({
            success: true,
            data: {
                currentVersion: packageJson.version,
                releases: releases
            }
        });
    } catch (error) {
        console.error('Error getting release notes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get release notes',
            error: error.message
        });
    }
});

module.exports = router;
