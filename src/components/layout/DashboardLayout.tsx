import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar, { View } from './Sidebar';
import GlobalSearch from '@/components/GlobalSearch';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileHeader from './MobileHeader';
import BottomNavBar from './BottomNavBar';
import CreateDialog from '@/components/CreateDialog';
import { cn } from '@/lib/utils';

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
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const getViewFromPath = (): View => {
    const path = (pathname || '').split('/').pop() || '';
    if (path === 'dashboard') return 'Overview';
    return capitalize(path) as View;
  };

  const [activeView, setActiveView] = useState<View>(getViewFromPath());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      setIsSidebarCollapsed(saved === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarCollapsed', String(newState));
      return newState;
    });
  };

  useEffect(() => {
    setActiveView(getViewFromPath());
  }, [pathname]);

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
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebar}
          />
          <div className={cn(
            "flex-grow transition-all duration-300",
            isSidebarCollapsed ? "ml-20" : "ml-64"
          )}>
            <main className="w-full max-w-[1600px] mx-auto p-8 sm:p-12 overflow-auto flex flex-col h-full">
              {children}
            </main>
          </div>
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
