import {
  FolderKanban,
  Sparkles,
  Book,
  Telescope,
  Settings,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Space = 'Flow' | 'Garden' | 'Journal' | 'Horizon';

const navItems = [
  { id: 'Flow', icon: FolderKanban, label: 'Flow' },
  { id: 'Garden', icon: Sparkles, label: 'Garden' },
  { id: 'Journal', icon: Book, label: 'Journal' },
  { id: 'Horizon', icon: Telescope, label: 'Horizon' },
];

interface SidebarProps {
  activeSpace: Space;
  onNavigate: (space: Space) => void;
  onLogout: () => void;
  firstName: string;
}

const Sidebar = ({
  activeSpace,
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
                  activeSpace === item.id &&
                    'bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary',
                )}
                onClick={() => onNavigate(item.id as Space)}
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