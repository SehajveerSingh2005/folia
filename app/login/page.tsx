'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { User } from '@supabase/supabase-js';

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        const checkUserProfile = async (user: User) => {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('first_name')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
            }

            if (profile && profile.first_name) {
                router.push('/dashboard');
            } else {
                router.push('/onboarding');
            }
        };

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                await checkUserProfile(session.user);
            }
        });

        const checkSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (session) {
                await checkUserProfile(session.user);
            }
        };
        checkSession();

        return () => subscription.unsubscribe();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <img
                            src="/logo.png"
                            alt="Folia Logo"
                            className="w-12 h-12 object-contain"
                        />
                        <h1 className="text-5xl md:text-6xl font-serif font-normal text-foreground">
                            Folia
                        </h1>
                    </div>
                    <p className="text-lg text-muted-foreground">
                        Your digital garden for thoughts and projects
                    </p>
                </div>

                {/* Auth Card */}
                <div className="bg-card border border-border rounded-xl shadow-xl p-8">
                    <Auth
                        supabaseClient={supabase}
                        redirectTo={typeof window !== 'undefined' ? window.location.origin : ''}
                        appearance={{
                            theme: ThemeSupa,
                            variables: {
                                default: {
                                    colors: {
                                        brand: 'hsl(var(--primary))',
                                        brandAccent: 'hsl(var(--primary))',
                                        brandButtonText: 'hsl(var(--primary-foreground))',
                                        defaultButtonBackground: 'hsl(var(--background))',
                                        defaultButtonBackgroundHover: 'hsl(var(--accent))',
                                        defaultButtonBorder: 'hsl(var(--border))',
                                        defaultButtonText: 'hsl(var(--foreground))',
                                        dividerBackground: 'hsl(var(--border))',
                                        inputBackground: 'hsl(var(--background))',
                                        inputBorder: 'hsl(var(--border))',
                                        inputBorderHover: 'hsl(var(--ring))',
                                        inputBorderFocus: 'hsl(var(--ring))',
                                        inputText: 'hsl(var(--foreground))',
                                        inputLabelText: 'hsl(var(--foreground))',
                                        inputPlaceholder: 'hsl(var(--muted-foreground))',
                                        anchorTextColor: 'hsl(var(--primary))',
                                        anchorTextHoverColor: 'hsl(var(--primary))',
                                    },
                                    fonts: {
                                        bodyFontFamily: 'Inter, sans-serif',
                                        buttonFontFamily: 'Inter, sans-serif',
                                        inputFontFamily: 'Inter, sans-serif',
                                        labelFontFamily: 'Inter, sans-serif',
                                    },
                                    radii: {
                                        borderRadiusButton: '0.5rem',
                                        inputBorderRadius: '0.5rem',
                                    },
                                    space: {
                                        buttonPadding: '0.75rem 1rem',
                                        inputPadding: '0.75rem 1rem',
                                    },
                                },
                            },
                            style: {
                                button: {
                                    fontWeight: '500',
                                },
                                anchor: {
                                    fontWeight: '500',
                                },
                            },
                        }}
                        providers={['github', 'google']}
                        socialLayout="horizontal"
                        theme="light"
                    />
                </div>

                {/* Footer */}
                <p className="mt-8 text-center text-sm text-muted-foreground whitespace-nowrap">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}
