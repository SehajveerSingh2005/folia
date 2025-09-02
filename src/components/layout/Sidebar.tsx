import { useState } from 'react';
import {
  FolderKanban,
  Sparkles,
  Book,
  Telescope,
  Settings,
  LogOut,
  LayoutGrid,
  Archive,
  ClipboardList,
  Search,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate, Link } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type View =
  | 'Overview'
  | 'Flow'
  | 'Loom'
  | 'Garden'
  | 'Journal'
  | 'Horizon'
  | 'Archive';

const navItems: { id: View; icon: React.ElementType; label: string; path: string }[] = [
  { id: 'Overview', icon: LayoutGrid, label: 'Home', path: '/dashboard' },
  { id: 'Loom', icon: ClipboardList, label: 'Loom', path: '/loom' },
  { id: 'Flow', icon: FolderKanban, label: 'Flow', path: '/flow' },
  { id: 'Garden', icon: Sparkles, label: 'Garden', path: '/garden' },
  { id: 'Journal', icon: Book, label: 'Journal', path: '/journal' },
  { id: 'Horizon', icon: Telescope, label: 'Horizon', path: '/horizon' },
  { id: 'Archive', icon: Archive, label: 'Archive', path: '/archive' },
];

interface SidebarProps {
  activeView: View;
  onLogout: () => void;
  firstName: string;
  onSearch: () => void;
}

const Sidebar = ({
  activeView,
  onLogout,
  firstName,
  onSearch,
}: SidebarProps) => {
  const navigate = useNavigate();
  const [isCompact, setIsCompact] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex-shrink-0 flex flex-col bg-secondary/40 p-4 border-r transition-all duration-300',
          isCompact ? 'w-20' : 'w-64'
        )}
      >
        <div className="mb-8 px-3">
          <h1 className="text-2xl font-serif font-medium truncate">
            {isCompact ? 'F' : 'Folia'}
          </h1>
          {!isCompact && (
            <p className="text-sm text-foreground/60 truncate">Welcome, {firstName}</p>
          )}
        </div>
        <nav className="flex-grow">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full text-md font-normal px-3 mb-4 text-muted-foreground',
                  isCompact ? 'justify-center' : 'justify-start'
                )}
                onClick={onSearch}
              >
                <Search className={cn('h-5 w-5', !isCompact && 'mr-3')} />
                {!isCompact && <span>Search...</span>}
                {!isCompact && (
                  <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                )}
              </Button>
            </TooltipTrigger>
            {isCompact && (
              <TooltipContent side="right">
                <p>Search (⌘K)</p>
              </TooltipContent>
            )}
          </Tooltip>

          <ul>
            {navItems.map((item) => (
              <li key={item.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      variant="ghost"
                      className={cn(
                        'w-full text-md font-normal px-3 py-6',
                        isCompact ? 'justify-center' : 'justify-start',
                        activeView === item.id &&
                          'bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary'
                      )}
                    >
                      <Link to={item.path}>
                        <item.icon className={cn('h-5 w-5', !isCompact && 'mr-3')} />
                        {!isCompact && item.label}
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  {isCompact && (
                    <TooltipContent side="right">
                      <p>{item.label}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full text-md font-normal px-3 py-6',
                  isCompact ? 'justify-center' : 'justify-start'
                )}
                onClick={() => navigate('/settings')}
              >
                <Settings className={cn('h-5 w-5', !isCompact && 'mr-3')} />
                {!isCompact && 'Settings'}
              </Button>
            </TooltipTrigger>
            {isCompact && (
              <TooltipContent side="right">
                <p>Settings</p>
              </TooltipContent>
            )}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full text-md font-normal px-3 py-6',
                  isCompact ? 'justify-center' : 'justify-start'
                )}
                onClick={onLogout}
              >
                <LogOut className={cn('h-5 w-5', !isCompact && 'mr-3')} />
                {!isCompact && 'Log Out'}
              </Button>
            </TooltipTrigger>
            {isCompact && (
              <TooltipContent side="right">
                <p>Log Out</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
        <div className="border-t mt-2 pt-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full text-md font-normal px-3 py-6',
                  isCompact ? 'justify-center' : 'justify-start'
                )}
                onClick={() => setIsCompact(!isCompact)}
              >
                {isCompact ? (
                  <ChevronsRight className="h-5 w-5" />
                ) : (
                  <>
                    <ChevronsLeft className="mr-3 h-5 w-5" />
                    <span>Collapse</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            {isCompact && (
              <TooltipContent side="right">
                <p>Expand</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;