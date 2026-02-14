'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardSkeleton from '@/components/layout/DashboardSkeleton';
import { useQueryClient } from '@tanstack/react-query';

type Profile = {
    first_name: string | null;
};

export default function DashboardRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                router.push('/login');
                return;
            }

            const { data: userProfile, error: profileError } = await supabase
                .from('profiles')
                .select('first_name')
                .eq('id', user.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                console.error('Error fetching profile:', profileError);
                router.push('/login');
                return;
            }

            if (userProfile && userProfile.first_name) {
                setProfile(userProfile);
            } else {
                router.push('/onboarding');
                return;
            }

            setLoading(false);
        };

        fetchData();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event) => {
                if (event === 'SIGNED_OUT') {
                    router.push('/');
                }
            },
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleItemCreated = () => {
        queryClient.invalidateQueries({ queryKey: ['loom_tasks'] });
        queryClient.invalidateQueries({ queryKey: ['flow_data'] });
        queryClient.invalidateQueries({ queryKey: ['horizon_data'] });
    };

    if (loading || !profile) {
        return <DashboardSkeleton />;
    }

    return (
        <DashboardLayout
            firstName={profile.first_name || 'User'}
            onLogout={handleLogout}
            onItemCreated={handleItemCreated}
        >
            {children}
        </DashboardLayout>
    );
}
