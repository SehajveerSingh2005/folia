import { useState, useEffect, useRef } from 'react';
import Sidebar, { View } from './Sidebar';
import Flow from '@/components/spaces/Flow';
import Garden from '@/components/spaces/Garden';
import Journal from '@/components/spaces/Journal';
import Horizon from '@/components/spaces/Horizon';
import DashboardOverview from '@/components/DashboardOverview';
import { Button } from '@/components/ui/button';
import { Plus, Pencil } from 'lucide-react';
import AddWidgetSheet from '@/components/dashboard/AddWidgetSheet';

interface DashboardLayoutProps {
  firstName: string;
  onLogout: () => void;
};

const DashboardLayout = ({ firstName, onLogout }: DashboardLayoutProps) => {
  const [activeView, setActiveView] = useState<View>('Overview');
  const [isEditable, setIsEditable] = useState(false);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [addWidgetTrigger, setAddWidgetTrigger] = useState<any>(null);
  
  // Create a ref to hold a function that can save the current layout
  const saveLayoutRef = useRef<(() => Promise<void>) | null>(null);

  const handleAddWidget = (widgetType: string, w: number, h: number) => {
    setAddWidgetTrigger({ type: widgetType, w, h, id: Date.now() });
  };

  const onWidgetAdded = () => {
    setAddWidgetTrigger(null);
  };

  const handleViewChange = (view: View) => {
    // If we're leaving the Overview view, save the layout first
    if (activeView === 'Overview' && view !== 'Overview' && saveLayoutRef.current) {
      saveLayoutRef.current();
    }
    setActiveView(view);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'Overview':
        return (
          <DashboardOverview
            firstName={firstName}
            onNavigate={handleViewChange}
            isEditable={isEditable}
            addWidgetTrigger={addWidgetTrigger}
            onWidgetAdded={onWidgetAdded}
            setSaveLayoutRef={saveLayoutRef}
          />
        );
      case 'Flow':
        return <Flow />;
      case 'Garden':
        return <Garden />;
      case 'Journal':
        return <Journal />;
      case 'Horizon':
        return <Horizon />;
      default:
        return (
          <DashboardOverview
            firstName={firstName}
            onNavigate={handleViewChange}
            isEditable={isEditable}
            addWidgetTrigger={addWidgetTrigger}
            onWidgetAdded={onWidgetAdded}
            setSaveLayoutRef={saveLayoutRef}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        activeView={activeView}
        onNavigate={handleViewChange}
        onLogout={onLogout}
        firstName={firstName}
      />
      <main className="flex-grow p-8 sm:p-12 overflow-auto flex flex-col">
        {activeView === 'Overview' && (
          <div className="flex justify-end items-center mb-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAddSheetOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Widget
            </Button>
            <Button
              variant={isEditable ? 'default' : 'outline'}
              onClick={() => setIsEditable(!isEditable)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              {isEditable ? 'Done Editing' : 'Edit Layout'}
            </Button>
          </div>
        )}
        <div className="flex-grow">{renderContent()}</div>
      </main>
      <AddWidgetSheet
        isOpen={isAddSheetOpen}
        onOpenChange={setIsAddSheetOpen}
        onAddWidget={handleAddWidget}
      />
    </div>
  );
};

export default DashboardLayout;