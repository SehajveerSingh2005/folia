import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@/lib/navigation';
import DashboardOverview from '@/components/DashboardOverview';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Check } from 'lucide-react';
import AddWidgetSheet, { availableWidgets } from '@/components/dashboard/AddWidgetSheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { showSuccess } from '@/utils/toast';

import { useToast } from "@/hooks/use-toast";

const DashboardOverviewWrapper = () => {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_first_name') || 'User';
    }
    return 'User';
  });
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
          localStorage.setItem('user_first_name', profile.first_name);
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
          toast({
            description: "Layout saved successfully!",
          });
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
        "fixed bottom-6 right-6 z-50 transition-all duration-300",
        isMobile && "bottom-20 right-4"
      )}>
        <div className="flex flex-col gap-2 items-end">
          {isEditable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddSheetOpen(true)}
              className="gap-2 shadow-lg bg-background/80 rounded-full backdrop-blur-sm animate-in slide-in-from-bottom-2"
            >
              <Plus className="h-4 w-4" />
              Add Widget
            </Button>
          )}
          <Button
            variant={isEditable ? 'default' : 'secondary'}
            size={isEditable ? 'default' : 'icon'}
            onClick={handleToggleEdit}
            className={cn(
              "shadow-lg transition-all rounded-full h-12 w-12",
              isEditable && "w-auto px-4 h-10 rounded-full"
            )}
            title={isEditable ? 'Save Layout' : 'Edit Layout'}
          >
            {isEditable ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Done
              </>
            ) : (
              <Pencil className="h-5 w-5" />
            )}
          </Button>
        </div>
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