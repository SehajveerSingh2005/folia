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

const navItems: { id: View; icon: React.ElementType; label: string }[] = [
  { id: 'Overview', icon: LayoutGrid, label: 'Home' },
  { id: 'Loom', icon: ClipboardList, label: 'Loom' },
  { id: 'Flow', icon: FolderKanban, label: 'Flow' },
  { id: 'Garden', icon: Sparkles, label: 'Garden' },
  { id: 'Journal', icon: Book, label: 'Journal' },
  { id: 'Horizon', icon: Telescope, label: 'Horizon' },
  { id: 'Archive', icon: Archive, label: 'Archive' },
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
    <aside className="w-64 flex flex-col bg-secondary/40 p-4 border-r">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-medium">Folia</h1>
        <p className="text-sm text-foreground/60">Welcome, {firstName}</p>
      </div>
      <nav className="flex-grow">
        <Button
          variant="outline"
          className="w-full justify-start text-md font-normal px-3 mb-4 text-muted-foreground"
          onClick={onSearch}
        >
          <Search className="mr-3 h-5 w-5" />
          Search...
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
                  'w-full justify-start text-md font-normal px-3 py-6',
                  activeView === item.id &&
                    'bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary',
                )}
              >
                <Link to={item.id === 'Overview' ? '/dashboard' : `/dashboard#${item.id.toLowerCase()}`}>
                  <item.icon className="mr-3 h-5 w-5" />
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
          className="w-full justify-start text-md font-normal px-3 py-6"
          onClick={() => navigate('/settings')}
        >
          <Settings className="mr-3 h-5 w-5" />
          Settings
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-md font-normal px-3 py-6"
          onClick={onLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Log Out
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;