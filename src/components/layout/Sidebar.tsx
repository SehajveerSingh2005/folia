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
  PlusCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  onOpenCreateDialog: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSettings: () => void;
}

const Sidebar = ({
  activeView,
  onLogout,
  firstName,
  onSearch,
  onOpenCreateDialog,
  isCollapsed,
  onToggleCollapse,
  onOpenSettings,
}: SidebarProps) => {
  const router = useRouter();

  const SidebarItem = ({ item }: { item: typeof navItems[0] }) => {
    const content = (
      <Button
        asChild
        variant="ghost"
        className={cn(
          'w-full text-md font-normal py-6 justify-start transition-all duration-300',
          isCollapsed ? 'px-0 justify-center' : 'px-3',
          activeView === item.id &&
          'bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary'
        )}
      >
        <Link href={item.path}>
          <item.icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span>{item.label}</span>}
        </Link>
      </Button>
    );

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-secondary/40 border-r transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className={cn("flex flex-col h-full", isCollapsed ? "p-2" : "p-4")}>
          <div className={cn("mb-8 transition-all duration-300", isCollapsed ? "px-0 flex justify-center" : "px-3")}>
            <div className="flex items-center gap-3 h-[44px]">
              <img src="/logo.png" alt="Folia Logo" className="h-8 w-auto flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <h1 className="text-2xl font-serif font-medium truncate leading-none">
                    Folia
                  </h1>
                  <p className="text-sm text-foreground/60 truncate leading-none pt-1">Welcome, {firstName}</p>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-grow space-y-2">
            <TooltipProvider>
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="w-full text-md font-normal p-0 h-12 flex justify-center mb-2"
                      onClick={onOpenCreateDialog}
                    >
                      <PlusCircle className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Create</TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  className="w-full text-md font-normal px-3 mb-2 justify-start"
                  onClick={onOpenCreateDialog}
                >
                  <PlusCircle className="h-5 w-5 mr-3" />
                  <span>Create</span>
                </Button>
              )}

              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full text-md font-normal p-0 h-12 flex justify-center mb-4 text-muted-foreground"
                      onClick={onSearch}
                    >
                      <Search className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Search (⌘K)</TooltipContent>
                </Tooltip>
              ) : (
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
              )}
            </TooltipProvider>

            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.id}>
                  <SidebarItem item={item} />
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-1 mt-auto pt-4 border-t border-border/40">
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full text-md font-normal p-0 h-12 flex justify-center"
                    onClick={onOpenSettings}
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Settings</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                className="w-full text-md font-normal px-3 py-6 justify-start"
                onClick={onOpenSettings}
              >
                <Settings className="h-5 w-5 mr-3" />
                Settings
              </Button>
            )}

            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full text-md font-normal p-0 h-12 flex justify-center"
                    onClick={onLogout}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Log Out</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                className="w-full text-md font-normal px-3 py-6 justify-start"
                onClick={onLogout}
              >
                <LogOut className="h-5 w-5 mr-3" />
                Log Out
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "w-full h-10 mt-2 hover:bg-transparent text-muted-foreground hover:text-foreground transition-all duration-300",
                isCollapsed ? "flex justify-center" : "justify-end pr-3"
              )}
              onClick={onToggleCollapse}
            >
              {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              {!isCollapsed && <span className="text-xs ml-2">Collapse</span>}
            </Button>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;