import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar, { View } from './Sidebar';
import GlobalSearch from '@/components/GlobalSearch';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileHeader from './MobileHeader';
import BottomNavBar from './BottomNavBar';
import CreateDialog from '@/components/CreateDialog';

interface DashboardLayoutProps {
  firstName: string;
  onLogout: () => void;
  children: React.ReactNode;
  onItemCreated: () => void;
}

const capitalize = (s: string) => {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const DashboardLayout = ({ firstName, onLogout, children, onItemCreated }: DashboardLayoutProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();

  const getViewFromPath = (): View => {
    const path = location.pathname.split('/').pop() || '';
    if (path === 'dashboard') return 'Overview';
    return capitalize(path) as View;
  };

  const [activeView, setActiveView] = useState<View>(getViewFromPath());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
      {isMobile ? (
        <>
          <MobileHeader 
            firstName={firstName}
            onLogout={onLogout}
          />
          <main className="flex-grow p-4 pt-20 pb-24 overflow-auto flex flex-col">
            {children}
          </main>
          <BottomNavBar 
            activeView={activeView}
            onOpenCreateDialog={() => setIsCreateOpen(true)}
          />
        </>
      ) : (
        <>
          <Sidebar
            activeView={activeView}
            onLogout={onLogout}
            firstName={firstName}
            onSearch={() => setIsSearchOpen(true)}
            onOpenCreateDialog={() => setIsCreateOpen(true)}
          />
          <main className="flex-grow p-8 sm:p-12 overflow-auto flex flex-col">
            {children}
          </main>
        </>
      )}
      <GlobalSearch
        isOpen={isSearchOpen}
        onOpenChange={setIsSearchOpen}
      />
      <CreateDialog
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onItemCreated={onItemCreated}
      />
    </div>
  );
};

export default DashboardLayout;