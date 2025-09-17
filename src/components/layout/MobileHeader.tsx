import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Menu,
  Settings,
  LogOut,
  Archive,
  User,
  Book,
  Telescope,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface MobileHeaderProps {
  firstName: string;
  onLogout: () => void;
}

const MobileHeader = ({ firstName, onLogout }: MobileHeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between h-16 px-4 bg-background/80 backdrop-blur-sm border-b">
      <Link to="/dashboard" className="flex items-center gap-2">
        <img src="/logo.png" alt="Folia Logo" className="h-7 w-auto" />
        <h1 className="text-xl font-serif font-medium">Folia</h1>
      </Link>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <div className="flex items-center gap-3 pb-4 border-b">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="font-medium">{firstName}</span>
            </div>
          </SheetHeader>
          <nav className="mt-6 space-y-2">
            <Button asChild variant="ghost" className="w-full justify-start text-md" onClick={() => setIsOpen(false)}>
              <Link to="/journal">
                <Book className="mr-3 h-5 w-5" />
                Journal
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start text-md" onClick={() => setIsOpen(false)}>
              <Link to="/horizon">
                <Telescope className="mr-3 h-5 w-5" />
                Horizon
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start text-md" onClick={() => setIsOpen(false)}>
              <Link to="/archive">
                <Archive className="mr-3 h-5 w-5" />
                Archive
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start text-md" onClick={() => setIsOpen(false)}>
              <Link to="/settings">
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start text-md" onClick={onLogout}>
              <LogOut className="mr-3 h-5 w-5" />
              Log Out
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default MobileHeader;