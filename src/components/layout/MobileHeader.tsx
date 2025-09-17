import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import Sidebar, { View } from './Sidebar';

interface MobileHeaderProps {
  firstName: string;
  onLogout: () => void;
  activeView: View;
  onSearch: () => void;
}

const MobileHeader = ({
  firstName,
  onLogout,
  activeView,
  onSearch,
}: MobileHeaderProps) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar
            activeView={activeView}
            onLogout={onLogout}
            firstName={firstName}
            onSearch={onSearch}
            isMobile={true}
            onNavigate={() => setIsSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
      <h1 className="text-xl font-serif font-medium sm:hidden">{activeView}</h1>
    </header>
  );
};

export default MobileHeader;