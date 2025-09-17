import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { showError, showSuccess } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// Import all widgets
import WelcomeWidget from './dashboard/widgets/WelcomeWidget';
import ClockWidget from './dashboard/widgets/ClockWidget';
import DueTodayWidget from './dashboard/widgets/DueTodayWidget';
import InboxWidget from './dashboard/widgets/InboxWidget';
import NotesWidget from './dashboard/widgets/NotesWidget';
import JournalWidget from './dashboard/widgets/JournalWidget';
import GoalsWidget from './dashboard/widgets/GoalsWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

type Widget = {
  id: string;
  widget_type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  user_id?: string;
};

interface DashboardOverviewProps {
  firstName: string;
  onNavigate: (space: string) => void;
  isEditable: boolean;
  addWidgetTrigger: { type: string; w: number; h: number } | null;
  onWidgetAdded: () => void;
  setSaveLayoutRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

const widgetMap: { [key: string]: React.ComponentType<any> } = {
  Welcome: WelcomeWidget,
  Clock: ClockWidget,
  Tasks: DueTodayWidget, // For backwards compatibility
  DueToday: DueTodayWidget,
  Inbox: InboxWidget,
  Notes: NotesWidget,
  Journal: JournalWidget,
  Goals: GoalsWidget,
};

const widgetNavigationMap: { [key: string]: string } = {
  Tasks: 'Loom',
  DueToday: 'Loom',
  Inbox: 'Loom',
  Notes: 'Garden',
  Journal: 'Journal',
  Goals: 'Horizon',
};

const defaultLayout: Omit<Widget, 'id' | 'user_id'>[] = [
  { widget_type: 'Welcome', x: 0, y: 0, w: 8, h: 2 },
  { widget_type: 'Clock', x: 8, y: 0, w: 4, h: 2 },
  { widget_type: 'DueToday', x: 0, y: 2, w: 6, h: 4 },
  { widget_type: 'Inbox', x: 6, y: 2, w: 6, h: 4 },
  { widget_type: 'Journal', x: 0, y: 6, w: 6, h: 3 },
  { widget_type: 'Goals', x: 6, y: 6, w: 6, h: 3 },
];

const DashboardOverview = ({
  firstName,
  onNavigate,
  isEditable,
  addWidgetTrigger,
  onWidgetAdded,
  setSaveLayoutRef,
}: DashboardOverviewProps) => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [layout, setLayout] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const layoutRef = useRef(layout);
  const hasUnsavedChanges = useRef(false);

  useEffect(() => {
    layoutRef.current = layout;
    if (layout.length > 0) {
      hasUnsavedChanges.current = true;
    }
  }, [layout]);

  const loadWidgets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('widgets')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      showError('Could not load your dashboard layout.');
      console.error(error);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      setWidgets(data);
      const formattedLayout = data.map(w => ({ i: w.id, x: w.x, y: w.y, w: w.w, h: w.h }));
      setLayout(formattedLayout);
    } else {
      const newWidgets = defaultLayout.map((item) => ({ 
        ...item, 
        user_id: user.id 
      }));
      
      const { data: insertedWidgets, error: insertError } = await supabase
        .from('widgets')
        .insert(newWidgets)
        .select();
      
      if (insertError) {
        showError('Could not create a default layout.');
      } else if (insertedWidgets) {
        setWidgets(insertedWidgets);
        const formattedLayout = insertedWidgets.map(w => ({ i: w.id, x: w.x, y: w.y, w: w.w, h: w.h }));
        setLayout(formattedLayout);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadWidgets();
  }, []);

  useEffect(() => {
    if (addWidgetTrigger) {
      addNewWidget(addWidgetTrigger.type, addWidgetTrigger.w, addWidgetTrigger.h);
      onWidgetAdded();
    }
  }, [addWidgetTrigger]);

  const addNewWidget = async (widgetType: string, w: number, h: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let maxY = 0;
    if (layout.length > 0) {
      maxY = Math.max(...layout.map(item => item.y + item.h));
    }

    const newWidgetData = {
      user_id: user.id,
      widget_type: widgetType,
      x: 0,
      y: maxY,
      w: w || 6,
      h: h || 4,
    };

    const { data, error } = await supabase
      .from('widgets')
      .insert(newWidgetData)
      .select()
      .single();

    if (error) {
      showError('Failed to add widget.');
    } else if (data) {
      setWidgets([...widgets, data]);
      setLayout([...layout, { i: data.id, x: data.x, y: data.y, w: data.w, h: data.h }]);
      showSuccess('Widget added!');
    }
  };

  const handleRemoveWidget = useCallback(async (widgetId: string) => {
    const { error } = await supabase.from('widgets').delete().eq('id', widgetId);
    if (error) {
      showError('Failed to remove widget.');
    } else {
      setWidgets(widgets.filter(w => w.id !== widgetId));
      setLayout(layout.filter(l => l.i !== widgetId));
      showSuccess('Widget removed.');
    }
  }, [widgets, layout]);

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    setLayout(newLayout);
  }, []);

  const saveLayoutToDatabase = useCallback(async () => {
    if (!hasUnsavedChanges.current || layoutRef.current.length === 0) {
      return;
    }

    const updates = layoutRef.current.map(item => 
      supabase
        .from('widgets')
        .update({ x: item.x, y: item.y, w: item.w, h: item.h })
        .eq('id', item.i)
    );

    const results = await Promise.all(updates);
    const hasError = results.some(res => res.error);

    if (!hasError) {
      hasUnsavedChanges.current = false;
    } else {
      console.error('Failed to save layout to database');
      showError('Could not save layout changes.');
    }
  }, []);

  const saveCurrentLayout = useCallback(async () => {
    await saveLayoutToDatabase();
  }, [saveLayoutToDatabase]);

  useEffect(() => {
    if (setSaveLayoutRef) {
      setSaveLayoutRef.current = saveCurrentLayout;
    }
  }, [saveCurrentLayout, setSaveLayoutRef]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges.current) {
        saveLayoutToDatabase();
      }
    }, 5000);

    if (!isEditable && hasUnsavedChanges.current) {
      saveLayoutToDatabase();
    }

    return () => {
      clearInterval(interval);
      if (hasUnsavedChanges.current) {
        saveLayoutToDatabase();
      }
    };
  }, [isEditable, saveLayoutToDatabase]);

  const handleWidgetClick = (e: React.MouseEvent, widgetType: string) => {
    if (isEditable) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, label, [role="checkbox"]')) return;
    const space = widgetNavigationMap[widgetType];
    if (space) onNavigate(space);
  };

  if (loading) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  if (isMobile) {
    return (
      <div className="space-y-4 px-4">
        {widgets.map(widget => {
          const WidgetComponent = widgetMap[widget.widget_type];
          return (
            <div key={widget.id} className="relative group bg-card rounded-lg border border-border h-[300px]">
              {isEditable && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 z-10 h-6 w-6"
                  onClick={(e) => { e.stopPropagation(); handleRemoveWidget(widget.id); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {WidgetComponent ? <WidgetComponent firstName={firstName} onNavigate={onNavigate} /> : <div>Unknown Widget</div>}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: layout }}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={100}
      onLayoutChange={handleLayoutChange}
      isDraggable={isEditable}
      isResizable={isEditable}
      compactType="vertical"
      preventCollision={false}
      isBounded={true}
    >
      {widgets.map(widget => {
        const WidgetComponent = widgetMap[widget.widget_type];
        return (
          <div 
            key={widget.id} 
            className="relative group bg-card rounded-lg border border-border"
            onClick={(e) => handleWidgetClick(e, widget.widget_type)}
          >
            {isEditable && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 z-10 h-6 w-6"
                onClick={(e) => { e.stopPropagation(); handleRemoveWidget(widget.id); }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {WidgetComponent ? <WidgetComponent firstName={firstName} onNavigate={onNavigate} /> : <div>Unknown Widget</div>}
          </div>
        );
      })}
    </ResponsiveGridLayout>
  );
};

export default DashboardOverview;