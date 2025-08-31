import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { User } from '@supabase/supabase-js';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      } else {
        navigate('/login');
      }
      setLoading(false);
    };

    fetchUser();

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
        <h1 className="text-2xl font-serif font-medium">Folia Dashboard</h1>
        <Button onClick={handleLogout}>Log Out</Button>
      </header>
      <main>
        <h2 className="text-xl font-sans">Welcome, {user?.email}</h2>
        <p className="text-foreground/70 mt-2">
          This is your personal dashboard. More features coming soon!
        </p>
      </main>
    </div>
  );
};

export default Dashboard;