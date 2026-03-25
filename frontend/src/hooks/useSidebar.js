import { useContext } from 'react';
import { SidebarContext } from '../context/SidebarContext';

export const useSidebar = () => {
    const context = useContext(SidebarContext);

    if (!context) {
        // Return safe defaults when used outside SidebarProvider (e.g. login page)
        return { isOpen: false, toggle: () => {}, open: () => {}, close: () => {} };
    }

    return context;
};
