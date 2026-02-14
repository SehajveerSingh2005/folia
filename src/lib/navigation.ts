'use client';

import { useRouter } from 'next/navigation';

// Navigation helper to maintain compatibility with react-router-dom syntax
export function useNavigate() {
    const router = useRouter();

    return (path: string, options?: { replace?: boolean }) => {
        if (options?.replace) {
            router.replace(path);
        } else {
            router.push(path);
        }
    };
}