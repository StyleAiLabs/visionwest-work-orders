import React, { useState, useEffect } from 'react';

const InstallPrompt = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later
            setDeferredPrompt(e);
            // Show our install button
            setShowPrompt(true);
        });

        // Listen for the appinstalled event
        window.addEventListener('appinstalled', () => {
            // Hide the prompt when installed
            setShowPrompt(false);
            console.log('PWA was installed');
        });
    }, []);

    const handleInstallClick = () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            // Clear the saved prompt since it can't be used again
            setDeferredPrompt(null);
            setShowPrompt(false);
        });
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-16 left-0 right-0 z-50 p-4 bg-white shadow-lg rounded-t-lg">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <h3 className="text-sm font-medium text-vw-dark">Install App</h3>
                    <p className="text-xs text-gray-500">Add this app to your home screen for easy access</p>
                </div>
                <div className="flex items-center">
                    <button
                        onClick={() => setShowPrompt(false)}
                        className="mr-2 text-gray-400 hover:text-gray-500"
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={handleInstallClick}
                        className="bg-vw-green text-white py-1 px-4 text-sm rounded-md"
                    >
                        Install
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;