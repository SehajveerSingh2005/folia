'use client';

import { QueryClient, QueryClientProvider as TanStackQueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export function QueryClientProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    useEffect(() => {
        const APP_VERSION = "1.3.1";
        const storedVersion = localStorage.getItem('app_version');
        if (storedVersion !== APP_VERSION) {
            // Clear potentially outdated settings
            localStorage.removeItem('flowViewMode');
            localStorage.removeItem('flowSortMode');
            localStorage.removeItem('horizonViewMode');

            // Clear all dashboard widget layouts
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('dashboardWidgets_')) {
                    localStorage.removeItem(key);
                }
            });

            localStorage.setItem('app_version', APP_VERSION);
            console.log(`Upgraded to version ${APP_VERSION} and cleared old settings.`);
        }
    }, []);

    return (
        <TanStackQueryClientProvider client={queryClient}>
            {children}
        </TanStackQueryClientProvider>
    );
}
