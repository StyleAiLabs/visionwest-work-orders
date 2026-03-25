import React, { createContext, useState, useEffect, useCallback } from 'react';

export const SidebarContext = createContext();

const STORAGE_KEY = 'wom-sidebar-open';

export const SidebarProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored !== null ? stored === 'true' : true;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, String(isOpen));
    }, [isOpen]);

    const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);

    return (
        <SidebarContext.Provider value={{ isOpen, toggle, open, close }}>
            {children}
        </SidebarContext.Provider>
    );
};
