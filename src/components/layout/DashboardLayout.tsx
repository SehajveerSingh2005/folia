import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar, { View } from './Sidebar';
import { FloatingDock } from './FloatingDock';
import SettingsDialog, { NavigationMode } from '../SettingsDialog';
import GlobalSearch from '@/components/GlobalSearch';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileHeader from './MobileHeader';
import BottomNavBar from './BottomNavBar';
import CreateDialog from '@/components/CreateDialog';
import { cn } from '@/lib/utils';
import { useNavigate } from '@/lib/navigation'; // Assuming this exists or using useRouter

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
  // const navigate = useNavigate(); // If you need programmatic nav

  const getViewFromPath = (): View => {
    const path = (pathname || '').split('/').pop() || '';
    if (path === 'dashboard') return 'Overview';
    return capitalize(path) as View;
  };

  const [activeView, setActiveView] = useState<View>(getViewFromPath());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Navigation Mode State
  const [navigationMode, setNavigationMode] = useState<NavigationMode>('sidebar');
  const [isLoaded, setIsLoaded] = useState(false); // To prevent flash of default content

  useEffect(() => {
    const savedSidebar = localStorage.getItem('sidebarCollapsed');
    if (savedSidebar !== null) {
      setIsSidebarCollapsed(savedSidebar === 'true');
    }

    const savedNavMode = localStorage.getItem('navigationMode') as NavigationMode;
    if (savedNavMode) {
      setNavigationMode(savedNavMode);
    }
    setIsLoaded(true);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarCollapsed', String(newState));
      return newState;
    });
  };

  const handleNavModeChange = (mode: NavigationMode) => {
    setNavigationMode(mode);
    localStorage.setItem('navigationMode', mode);
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

  if (!isLoaded) return null; // Or a loading spinner

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
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
          {/* Sidebar Mode */}
          {navigationMode === 'sidebar' && (
            <Sidebar
              activeView={activeView}
              onLogout={onLogout}
              firstName={firstName}
              onSearch={() => setIsSearchOpen(true)}
              onOpenCreateDialog={() => setIsCreateOpen(true)}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={toggleSidebar}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}

          {/* Floating Dock Mode */}
          {navigationMode === 'dock' && (
            <>


              <FloatingDock
                activeView={activeView}
                onOpenCreate={() => setIsCreateOpen(true)}
                onSearch={() => setIsSearchOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            </>
          )}

          <div className={cn(
            "flex-grow transition-all duration-300 h-full overflow-hidden",
            // Adjust margin based on mode and collapsed state
            navigationMode === 'sidebar'
              ? (isSidebarCollapsed ? "ml-20" : "ml-64")
              : "ml-0" // No padding, true overlay
          )}>
            <main className={cn(
              "w-full max-w-[1600px] mx-auto p-8 sm:p-12 overflow-auto h-full scrollbar-hide",
              activeView === 'Garden' && "p-0 sm:p-0 max-w-none"
            )}>
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

      <SettingsDialog
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        navigationMode={navigationMode}
        onNavigationModeChange={handleNavModeChange}
      />
    </div>
  );
};

export default DashboardLayout;
