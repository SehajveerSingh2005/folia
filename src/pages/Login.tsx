import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        navigate('/dashboard');
      }
    });

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkSession();

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-12">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-serif font-normal text-foreground">
            Welcome to Folia
          </h1>
          <p className="mt-4 text-lg text-foreground/70 max-w-sm mx-auto">
            Your digital home for thoughts, projects, and days.
          </p>
        </div>
        <Auth
          supabaseClient={supabase}
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
                  inputBorderHover: 'hsl(var(--border))',
                  inputBorderFocus: 'hsl(var(--ring))',
                  inputText: 'hsl(var(--foreground))',
                  inputLabelText: 'hsl(var(--foreground))',
                  inputPlaceholder: 'hsl(var(--muted-foreground))',
                  anchorTextColor: 'hsl(var(--muted-foreground))',
                  anchorTextHoverColor: 'hsl(var(--foreground))',
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
              },
            },
          }}
          providers={[]}
          theme="light"
        />
      </div>
    </div>
  );
};

export default Login;