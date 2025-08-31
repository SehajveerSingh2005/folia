import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { User } from '@supabase/supabase-js';

type Profile = {
  first_name: string | null;
  last_name: string | null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();

        if (userProfile && userProfile.first_name) {
          setProfile(userProfile);
        } else {
          navigate('/onboarding');
          return;
        }
      } else {
        navigate('/login');
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-serif font-medium">Folia</h1>
        <Button onClick={handleLogout}>Log Out</Button>
      </header>
      <main>
        <h2 className="text-3xl font-sans">
          Welcome back, {profile?.first_name}.
        </h2>
        <p className="text-foreground/70 mt-2">
          This is your personal dashboard. What will you create today?
        </p>
      </main>
    </div>
  );
};

export default Dashboard;