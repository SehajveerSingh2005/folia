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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type View =
  | 'Overview'
  | 'Flow'
  | 'Loom'
  | 'Garden'
  | 'Journal'
  | 'Horizon'
  | 'Archive';

const navItems = [
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
  onNavigate: (view: View) => void;
  onLogout: () => void;
  firstName: string;
}

const Sidebar = ({
  activeView,
  onNavigate,
  onLogout,
  firstName,
}: SidebarProps) => {
  return (
    <aside className="w-64 flex flex-col bg-secondary/40 p-4 border-r">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-medium">Folia</h1>
        <p className="text-sm text-foreground/60">Welcome, {firstName}</p>
      </div>
      <nav className="flex-grow">
        <ul>
          {navItems.map((item) => (
            <li key={item.id}>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start text-md font-normal px-3 py-6',
                  activeView === item.id &&
                    'bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary',
                )}
                onClick={() => onNavigate(item.id as View)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            </li>
          ))}
        </ul>
      </nav>
      <div>
        <Button
          variant="ghost"
          className="w-full justify-start text-md font-normal px-3 py-6"
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