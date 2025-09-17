import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';

type Profile = {
  first_name: string | null;
};

const DashboardLayoutPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loomRefetch, setLoomRefetch] = useState<(() => void) | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        navigate('/login');
        return;
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
        navigate('/login');
        return;
      }

      if (userProfile && userProfile.first_name) {
        setProfile(userProfile);
      } else {
        navigate('/onboarding');
        return;
      }

      setLoading(false);
    };

    fetchData();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          navigate('/');
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleTaskAdded = () => {
    if (loomRefetch) {
      loomRefetch();
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <DashboardLayout
      firstName={profile.first_name || 'User'}
      onLogout={handleLogout}
      onTaskAdded={handleTaskAdded}
    >
      <Outlet context={{ firstName: profile.first_name || 'User', setLoomRefetch }} />
    </DashboardLayout>
  );
};

export default DashboardLayoutPage;