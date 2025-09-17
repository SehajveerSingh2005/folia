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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate, Link } from 'react-router-dom';

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

  return (
    <aside
      className="flex-shrink-0 flex flex-col bg-secondary/40 p-4 border-r w-64"
    >
      <div className="px-3 mb-8">
        <div className="flex items-center gap-3 h-[44px]">
          <img src="/logo.png" alt="Folia Logo" className="h-8 w-auto" />
          <div className="flex flex-col">
            <h1 className="text-2xl font-serif font-medium truncate leading-none">
              Folia
            </h1>
            <p className="text-sm text-foreground/60 truncate leading-none pt-1">Welcome, {firstName}</p>
          </div>
        </div>
      </div>
      <nav className="flex-grow">
        <Button
          variant="outline"
          className="w-full text-md font-normal px-3 mb-4 justify-start text-muted-foreground"
          onClick={onSearch}
        >
          <Search className="h-5 w-5 mr-3" />
          <span>Search...</span>
          <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        <ul>
          {navItems.map((item) => (
            <li key={item.id}>
              <Button
                asChild
                variant="ghost"
                className={cn(
                  'w-full text-md font-normal px-3 py-6 justify-start',
                  activeView === item.id &&
                    'bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary'
                )}
              >
                <Link to={item.path}>
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </nav>
      <div>
        <Button
          variant="ghost"
          className="w-full text-md font-normal px-3 py-6 justify-start"
          onClick={() => navigate('/settings')}
        >
          <Settings className="h-5 w-5 mr-3" />
          Settings
        </Button>
        <Button
          variant="ghost"
          className="w-full text-md font-normal px-3 py-6 justify-start"
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Log Out
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;