import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@/lib/navigation';
import DashboardOverview from '@/components/DashboardOverview';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Pencil } from 'lucide-react';
import AddWidgetSheet, { availableWidgets } from '@/components/dashboard/AddWidgetSheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { showSuccess } from '@/utils/toast';

const DashboardOverviewWrapper = () => {
  const [firstName, setFirstName] = useState('User');
  const navigate = useNavigate();
  const [isEditable, setIsEditable] = useState(false);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [addWidgetTrigger, setAddWidgetTrigger] = useState<any>(null);
  const saveLayoutRef = useRef<(() => Promise<void>) | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', user.id)
          .single();

        if (profile?.first_name) {
          setFirstName(profile.first_name);
        }
      }
    };
    fetchProfile();
  }, []);

  const handleAddWidget = (widget: typeof availableWidgets[0]) => {
    setAddWidgetTrigger({ ...widget, id: Date.now() });
  };

  const onWidgetAdded = () => {
    setAddWidgetTrigger(null);
  };

  const handleToggleEdit = async () => {
    if (isEditable) {
      if (saveLayoutRef.current) {
        try {
          await saveLayoutRef.current();
          showSuccess("Layout saved successfully!");
          setIsEditable(false);
        } catch (error) {
          console.error("Failed to save layout:", error);
        }
      } else {
        setIsEditable(false);
      }
    } else {
      setIsEditable(true);
    }
  };

  const handleNavigate = (view: string) => {
    if (isEditable && saveLayoutRef.current) {
      saveLayoutRef.current();
    }
    navigate(`/${view.toLowerCase()}`);
  };

  return (
    <>
      <div className={cn(
        "flex justify-end items-center mb-4 gap-2",
        isMobile && "px-4"
      )}>
        {isEditable && (
          <Button variant="outline" onClick={() => setIsAddSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Widget
          </Button>
        )}
        <Button
          variant={isEditable ? 'default' : 'outline'}
          onClick={handleToggleEdit}
        >
          <Pencil className="mr-2 h-4 w-4" />
          {isEditable ? 'Save Layout' : 'Edit Layout'}
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