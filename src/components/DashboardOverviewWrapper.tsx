import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import DashboardOverview from '@/components/DashboardOverview';
import { Button } from '@/components/ui/button';
import { Plus, Pencil } from 'lucide-react';
import AddWidgetSheet from '@/components/dashboard/AddWidgetSheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const DashboardOverviewWrapper = () => {
  const { firstName } = useOutletContext<{ firstName: string }>();
  const navigate = useNavigate();
  const [isEditable, setIsEditable] = useState(false);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [addWidgetTrigger, setAddWidgetTrigger] = useState<any>(null);
  const saveLayoutRef = useRef<(() => Promise<void>) | null>(null);
  const isMobile = useIsMobile();

  const handleAddWidget = (widgetType: string, w: number, h: number) => {
    setAddWidgetTrigger({ type: widgetType, w, h, id: Date.now() });
  };

  const onWidgetAdded = () => {
    setAddWidgetTrigger(null);
  };

  const handleNavigate = (view: string) => {
    if (saveLayoutRef.current) {
      saveLayoutRef.current();
    }
    navigate(`/${view.toLowerCase()}`);
  };

  return (
    <>
      <div className={cn(
        "flex justify-end items-center mb-4 gap-2",
        isMobile && "px-4" // Add horizontal padding on mobile
      )}>
        <Button variant="outline" onClick={() => setIsAddSheetOpen(true)}>
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
      <div className="flex-grow">
        <DashboardOverview
          firstName={firstName}
          onNavigate={handleNavigate}
          isEditable={isEditable}
          addWidgetTrigger={addWidgetTrigger}
          onWidgetAdded={onWidgetAdded}
          setSaveLayoutRef={saveLayoutRef}
        />
      </div>
      <AddWidgetSheet
        isOpen={isAddSheetOpen}
        onOpenChange={setIsAddSheetOpen}
        onAddWidget={handleAddWidget}
      />
    </>
  );
};

export default DashboardOverviewWrapper;