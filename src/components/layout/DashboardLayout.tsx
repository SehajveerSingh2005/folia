import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar, { View } from './Sidebar';
import GlobalSearch from '@/components/GlobalSearch';

interface DashboardLayoutProps {
  firstName: string;
  onLogout: () => void;
  children: React.ReactNode;
}

const capitalize = (s: string) => {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const DashboardLayout = ({ firstName, onLogout, children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getViewFromPath = (): View => {
    const path = location.pathname.split('/').pop() || '';
    if (path === 'dashboard') return 'Overview';
    return capitalize(path) as View;
  };

  const [activeView, setActiveView] = useState<View>(getViewFromPath());
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    setActiveView(getViewFromPath());
  }, [location.pathname]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        activeView={activeView}
        onLogout={onLogout}
        firstName={firstName}
        onSearch={() => setIsSearchOpen(true)}
      />
      <main className="flex-grow p-8 sm:p-12 overflow-auto flex flex-col">
        {children}
      </main>
      <GlobalSearch
        isOpen={isSearchOpen}
        onOpenChange={setIsSearchOpen}
      />
    </div>
  );
};

export default DashboardLayout;