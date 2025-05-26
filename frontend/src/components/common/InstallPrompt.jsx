import React, { useState, useEffect } from 'react';

const InstallPrompt = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isAndroid, setIsAndroid] = useState(false);

    useEffect(() => {
        // Detect Android
        const userAgent = navigator.userAgent.toLowerCase();
        setIsAndroid(userAgent.includes('android'));

        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // Show prompt with delay on Android for better UX
            if (userAgent.includes('android')) {
                setTimeout(() => setShowPrompt(true), 2000);
            } else {
                setShowPrompt(true);
            }
        });

        window.addEventListener('appinstalled', () => {
            setShowPrompt(false);
            console.log('PWA was installed');
        });
    }, []);

    const handleInstallClick = () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            setDeferredPrompt(null);
            setShowPrompt(false);
        });
    };

    if (!showPrompt) return null;

    return (
        <div className={`fixed ${isAndroid ? 'bottom-20' : 'bottom-16'} left-0 right-0 z-50 p-4 bg-white shadow-lg rounded-t-lg border-t`}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">Install App</h3>
                    <p className="text-xs text-gray-500">
                        {isAndroid
                            ? "Add to home screen for the best experience"
                            : "Install this app for easy access"
                        }
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowPrompt(false)}
                        className="text-gray-400 hover:text-gray-500 text-sm px-2 py-1"
                    >
                        Later
                    </button>
                    <button
                        onClick={handleInstallClick}
                        className="bg-green-600 text-white py-2 px-4 text-sm rounded-md hover:bg-green-700 transition-colors"
                    >
                        Install
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;