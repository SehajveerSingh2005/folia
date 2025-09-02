import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { showError, showSuccess } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

// Import all widgets
import WelcomeWidget from './dashboard/widgets/WelcomeWidget';
import ClockWidget from './dashboard/widgets/ClockWidget';
import TasksWidget from './dashboard/widgets/TasksWidget';
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
  Tasks: TasksWidget,
  Notes: NotesWidget,
  Journal: JournalWidget,
  Goals: GoalsWidget,
};

const widgetNavigationMap: { [key: string]: string } = {
  Tasks: 'Flow',
  Notes: 'Garden',
  Journal: 'Journal',
  Goals: 'Horizon',
};

const defaultLayout: Omit<Widget, 'id' | 'user_id'>[] = [
  { widget_type: 'Welcome', x: 0, y: 0, w: 4, h: 2 },
  { widget_type: 'Clock', x: 4, y: 0, w: 3, h: 2 },
  { widget_type: 'Notes', x: 7, y: 0, w: 3, h: 3 },
  { widget_type: 'Tasks', x: 0, y: 2, w: 3, h: 4 },
  { widget_type: 'Journal', x: 3, y: 2, w: 4, h: 4 },
  { widget_type: 'Goals', x: 7, y: 3, w: 3, h: 3 },
];

// Default sizes for new widgets
const defaultWidgetSizes: { [key: string]: { w: number, h: number } } = {
  Welcome: { w: 8, h: 2 },
  Clock: { w: 4, h: 2 },
  Tasks: { w: 6, h: 4 },
  Notes: { w: 6, h: 4 },
  Journal: { w: 6, h: 4 },
  Goals: { w: 6, h: 4 },
};

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
  const layoutRef = useRef(layout);
  const hasUnsavedChanges = useRef(false);

  // Update ref when layout changes
  useEffect(() => {
    layoutRef.current = layout;
    if (layout.length > 0) {
      hasUnsavedChanges.current = true;
    }
  }, [layout]);

  // Load widgets from localStorage or database
  const loadWidgets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // First try to load from localStorage
      const savedWidgets = localStorage.getItem(`dashboardWidgets_${user.id}`);
      if (savedWidgets) {
        const parsedWidgets = JSON.parse(savedWidgets);
        setWidgets(parsedWidgets);
        const formattedLayout = parsedWidgets.map((w: Widget) => ({ 
          i: w.id, 
          x: w.x, 
          y: w.y, 
          w: w.w, 
          h: w.h 
        }));
        setLayout(formattedLayout);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn('Could not load widgets from localStorage', e);
    }

    // If no localStorage data, load from database
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
      // Save to localStorage for faster loading next time
      localStorage.setItem(`dashboardWidgets_${user.id}`, JSON.stringify(data));
    } else {
      // Create default widgets
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
        // Save to localStorage
        localStorage.setItem(`dashboardWidgets_${user.id}`, JSON.stringify(insertedWidgets));
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

    // Use default sizes if not provided
    const widgetWidth = w || defaultWidgetSizes[widgetType]?.w || 4;
    const widgetHeight = h || defaultWidgetSizes[widgetType]?.h || 4;

    // Find the best position for the new widget
    let maxY = 0;
    if (layout.length > 0) {
      maxY = Math.max(...layout.map(item => item.y + item.h));
    }

    const newWidget = {
      user_id: user.id,
      widget_type: widgetType,
      x: 0,
      y: maxY,
      w: widgetWidth,
      h: widgetHeight,
    };

    const { data, error } = await supabase
      .from('widgets')
      .insert(newWidget)
      .select()
      .single();

    if (error) {
      showError('Failed to add widget.');
      console.error(error);
    } else if (data) {
      const updatedWidgets = [...widgets, data];
      setWidgets(updatedWidgets);
      const formattedLayout = updatedWidgets.map(w => ({ i: w.id, x: w.x, y: w.y, w: w.w, h: w.h }));
      setLayout(formattedLayout);
      // Update localStorage
      localStorage.setItem(`dashboardWidgets_${user.id}`, JSON.stringify(updatedWidgets));
      showSuccess('Widget added!');
    }
  };

  const handleRemoveWidget = useCallback(async (widgetId: string) => {
    const { error } = await supabase.from('widgets').delete().eq('id', widgetId);
    if (error) {
      showError('Failed to remove widget.');
    } else {
      const updatedWidgets = widgets.filter(w => w.id !== widgetId);
      setWidgets(updatedWidgets);
      const formattedLayout = updatedWidgets.map(w => ({ i: w.id, x: w.x, y: w.y, w: w.w, h: w.h }));
      setLayout(formattedLayout);
      // Update localStorage
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        localStorage.setItem(`dashboardWidgets_${user.id}`, JSON.stringify(updatedWidgets));
      }
      showSuccess('Widget removed.');
    }
  }, [widgets]);

  const handleLayoutChange = useCallback(async (newLayout: Layout[]) => {
    setLayout(newLayout);
    
    // Update widgets in state immediately for UI responsiveness
    const updatedWidgets = widgets.map(widget => {
      const layoutItem = newLayout.find(item => item.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h
        };
      }
      return widget;
    });
    setWidgets(updatedWidgets);
    
    // Update localStorage immediately
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      localStorage.setItem(`dashboardWidgets_${user.id}`, JSON.stringify(updatedWidgets));
    }
  }, [widgets]);

  // Save layout to database
  const saveLayoutToDatabase = useCallback(async () => {
    if (!hasUnsavedChanges.current || layoutRef.current.length === 0) {
      return;
    }

    const updates = layoutRef.current.map(item => {
      return supabase
        .from('widgets')
        .update({ x: item.x, y: item.y, w: item.w, h: item.h })
        .eq('id', item.i);
    });

    try {
      await Promise.all(updates);
      hasUnsavedChanges.current = false;
    } catch (error) {
      console.error('Failed to save layout to database', error);
    }
  }, []);

  // Create a function that can be called externally to save the current layout
  const saveCurrentLayout = useCallback(async () => {
    await saveLayoutToDatabase();
  }, [saveLayoutToDatabase]);

  // Set the ref so parent can call saveCurrentLayout
  useEffect(() => {
    if (setSaveLayoutRef) {
      setSaveLayoutRef.current = saveCurrentLayout;
    }
  }, [saveCurrentLayout, setSaveLayoutRef]);

  // Save to database periodically and when component unmounts
  useEffect(() => {
    // Save to database every 5 seconds if there are changes
    const interval = setInterval(() => {
      if (hasUnsavedChanges.current) {
        saveLayoutToDatabase();
      }
    }, 5000);

    // Save when isEditable changes to false (editing is done)
    if (!isEditable && hasUnsavedChanges.current) {
      saveLayoutToDatabase();
    }

    return () => {
      clearInterval(interval);
      // Save on unmount
      if (hasUnsavedChanges.current) {
        saveLayoutToDatabase();
      }
    };
  }, [isEditable, saveLayoutToDatabase]);

  const handleWidgetClick = (e: React.MouseEvent, widgetType: string) => {
    if (isEditable) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, label, [role="checkbox"]')) {
      return;
    }

    const space = widgetNavigationMap[widgetType];
    if (space) {
      onNavigate(space);
    }
  };

  if (loading) {
    return <Skeleton className="h-[500px] w-full" />;
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveWidget(widget.id);
                }}
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