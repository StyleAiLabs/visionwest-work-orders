import React, { useState, useEffect, useRef } from 'react';
import { useClientContext } from '../../context/ClientContext';
import { getAllClients } from '../../services/clientService';

/**
 * ClientSwitcher Component
 * Dropdown/bottom sheet for admin context switching
 * Shows visual indicator when context is switched
 */
const ClientSwitcher = () => {
    const {
        selectedClient,
        isContextSwitched,
        switchClientContext,
        clearClientContext,
        isAdmin
    } = useClientContext();

    const [isOpen, setIsOpen] = useState(false);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    // Don't render if not admin
    if (!isAdmin) {
        return null;
    }

    useEffect(() => {
        if (isOpen) {
            loadClients();
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const loadClients = async () => {
        try {
            setLoading(true);
            const response = await getAllClients({ status: 'active', limit: 100 });
            setClients(response.data || []);
        } catch (error) {
            console.error('Error loading clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClientSelect = (client) => {
        switchClientContext(client);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClearContext = () => {
        clearClientContext();
        setIsOpen(false);
        setSearchTerm('');
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isContextSwitched
                        ? 'bg-amber-100 text-amber-900 border-2 border-amber-400 hover:bg-amber-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
                {/* Icon */}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>

                {/* Label */}
                <span className="hidden sm:inline">
                    {isContextSwitched && selectedClient
                        ? `Viewing: ${selectedClient.name}`
                        : 'Switch Client'}
                </span>

                {/* Mobile Label */}
                <span className="sm:hidden">
                    {isContextSwitched ? 'Switched' : 'Client'}
                </span>

                {/* Warning indicator */}
                {isContextSwitched && (
                    <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                )}

                {/* Chevron */}
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-2">Switch Client Context</h3>
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Clear Context Button */}
                    {isContextSwitched && (
                        <button
                            onClick={handleClearContext}
                            className="flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-200 text-blue-600 font-medium"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Return to My Client
                        </button>
                    )}

                    {/* Client List */}
                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                No clients found
                            </div>
                        ) : (
                            filteredClients.map((client) => (
                                <button
                                    key={client.id}
                                    onClick={() => handleClientSelect(client)}
                                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                                        selectedClient?.id === client.id ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{client.name}</p>
                                            <p className="text-xs text-gray-500 font-mono">{client.code}</p>
                                        </div>
                                        {selectedClient?.id === client.id && (
                                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientSwitcher;
