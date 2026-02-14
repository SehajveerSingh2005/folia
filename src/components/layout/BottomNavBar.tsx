import {
  LayoutGrid,
  ClipboardList,
  FolderKanban,
  Sparkles,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { View } from './Sidebar';

const navItems: { id: View; label: string; icon: React.ElementType; path: string }[] = [
  { id: 'Overview', label: 'Home', icon: LayoutGrid, path: '/dashboard' },
  { id: 'Loom', label: 'Loom', icon: ClipboardList, path: '/loom' },
  { id: 'Flow', label: 'Flow', icon: FolderKanban, path: '/flow' },
  { id: 'Garden', label: 'Garden', icon: Sparkles, path: '/garden' },
];

interface BottomNavBarProps {
  activeView: View;
  onOpenCreateDialog: () => void;
}

const BottomNavBar = ({ activeView, onOpenCreateDialog }: BottomNavBarProps) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm border-t">
      <div className="grid grid-cols-5 h-16 items-center">
        {navItems.slice(0, 2).map((item) => (
          <Button
            key={item.id}
            asChild
            variant="ghost"
            className={cn(
              'h-full w-full rounded-none flex-col gap-1 text-xs',
              activeView === item.id ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Link href={item.path}>
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          </Button>
        ))}

        <div className="flex justify-center items-center">
          <Button
            size="icon"
            className="w-14 h-14 rounded-full -translate-y-4 shadow-lg"
            onClick={onOpenCreateDialog}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        {navItems.slice(2, 4).map((item) => (
          <Button
            key={item.id}
            asChild
            variant="ghost"
            className={cn(
              'h-full w-full rounded-none flex-col gap-1 text-xs',
              activeView === item.id ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Link href={item.path}>
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          </Button>
        ))}
      </div>
    </footer>
  );
};

export default BottomNavBar;
