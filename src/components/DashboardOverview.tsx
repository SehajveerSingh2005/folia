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
import DueTodayWidget from './dashboard/widgets/DueTodayWidget';
import InboxWidget from './dashboard/widgets/InboxWidget';
import NotesWidget from './dashboard/widgets/NotesWidget';
import JournalWidget from './dashboard/widgets/JournalWidget';
import GoalsWidget from './dashboard/widgets/GoalsWidget';
import { availableWidgets } from './dashboard/AddWidgetSheet';

const ResponsiveGridLayout = WidthProvider(Responsive);

type Widget = {
  id: string;
  widget_type: string;
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

// Default layouts for different breakpoints
const defaultLayouts = {
  lg: [
    { i: 'welcome', x: 0, y: 0, w: 8, h: 2, static: false },
    { i: 'clock', x: 8, y: 0, w: 4, h: 2, static: false },
    { i: 'dueToday', x: 0, y: 2, w: 6, h: 4, static: false },
    { i: 'inbox', x: 6, y: 2, w: 6, h: 4, static: false },
    { i: 'journal', x: 0, y: 6, w: 6, h: 3, static: false },
    { i: 'goals', x: 6, y: 6, w: 6, h: 3, static: false },
  ],
  sm: [
    { i: 'welcome', x: 0, y: 0, w: 4, h: 2, static: false },
    { i: 'clock', x: 0, y: 2, w: 4, h: 2, static: false },
    { i: 'dueToday', x: 0, y: 4, w: 4, h: 4, static: false },
    { i: 'inbox', x: 0, y: 8, w: 4, h: 4, static: false },
    { i: 'journal', x: 0, y: 12, w: 4, h: 3, static: false },
    { i: 'goals', x: 0, y: 15, w: 4, h: 3, static: false },
  ],
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
  const [currentLayouts, setCurrentLayouts] = useState<{ lg: Layout[]; sm: Layout[] }>({ lg: [], sm: [] });
  const [loading, setLoading] = useState(true);
  const layoutRef = useRef(currentLayouts);
  const hasUnsavedChanges = useRef(false);

  // Update ref when layout changes
  useEffect(() => {
    layoutRef.current = currentLayouts;
    if (currentLayouts.lg.length > 0 || currentLayouts.sm.length > 0) {
      hasUnsavedChanges.current = true;
    }
  }, [currentLayouts]);

  // Load widgets and layouts from database
  const loadDashboardData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: userWidgets, error: widgetsError } = await supabase
      .from('widgets')
      .select('id, widget_type');

    if (widgetsError) {
      showError('Could not load your dashboard widgets.');
      console.error(widgetsError);
      setLoading(false);
      return;
    }

    const { data: userLayouts, error: layoutsError } = await supabase
      .from('user_dashboard_layouts')
      .select('layouts')
      .eq('user_id', user.id)
      .single();

    if (layoutsError && layoutsError.code !== 'PGRST116') { // PGRST116 means no rows found
      showError('Could not load your dashboard layout.');
      console.error(layoutsError);
      setLoading(false);
      return;
    }

    let initialWidgets: Widget[] = [];
    let initialLayouts = { lg: [], sm: [] };

    if (userWidgets && userWidgets.length > 0) {
      initialWidgets = userWidgets;
    }

    if (userLayouts && userLayouts.layouts) {
      initialLayouts = userLayouts.layouts as { lg: Layout[]; sm: Layout[] };
    }

    // If no widgets or layouts, create defaults
    if (initialWidgets.length === 0 || initialLayouts.lg.length === 0) {
      const defaultWidgetTypes = defaultLayouts.lg.map(item => item.i);
      const newDefaultWidgets = defaultWidgetTypes.map(type => ({
        widget_type: type,
        user_id: user.id,
      }));

      const { data: insertedWidgets, error: insertWidgetsError } = await supabase
        .from('widgets')
        .insert(newDefaultWidgets)
        .select('id, widget_type');

      if (insertWidgetsError) {
        showError('Could not create default widgets.');
        console.error(insertWidgetsError);
      } else if (insertedWidgets) {
        initialWidgets = insertedWidgets;
        // Map default layouts to new widget IDs
        const mapDefaultLayoutToNewIds = (layout: Layout[], newWidgets: Widget[]) => {
          return layout.map(item => {
            const correspondingWidget = newWidgets.find(w => w.widget_type === item.i);
            return { ...item, i: correspondingWidget ? correspondingWidget.id : item.i };
          });
        };
        initialLayouts.lg = mapDefaultLayoutToNewIds(defaultLayouts.lg, insertedWidgets);
        initialLayouts.sm = mapDefaultLayoutToNewIds(defaultLayouts.sm, insertedWidgets);

        const { error: insertLayoutError } = await supabase
          .from('user_dashboard_layouts')
          .upsert({ user_id: user.id, layouts: initialLayouts }, { onConflict: 'user_id' });

        if (insertLayoutError) {
          showError('Could not save default layout.');
          console.error(insertLayoutError);
        }
      }
    }

    setWidgets(initialWidgets);
    setCurrentLayouts(initialLayouts);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
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

    const { data: newWidget, error: insertWidgetError } = await supabase
      .from('widgets')
      .insert({ widget_type: widgetType, user_id: user.id })
      .select('id, widget_type')
      .single();

    if (insertWidgetError) {
      showError('Failed to add widget.');
      console.error(insertWidgetError);
      return;
    }

    if (newWidget) {
      const updatedWidgets = [...widgets, newWidget];
      setWidgets(updatedWidgets);

      const widgetConfig = availableWidgets.find(aw => aw.type === widgetType);
      const defaultW = widgetConfig?.w || 4;
      const defaultH = widgetConfig?.h || 4;

      // Find the best position for the new widget in both layouts
      const newLayouts = { ...currentLayouts };

      // For LG layout
      let maxY_lg = 0;
      if (newLayouts.lg.length > 0) {
        maxY_lg = Math.max(...newLayouts.lg.map(item => item.y + item.h));
      }
      newLayouts.lg = [...newLayouts.lg, { i: newWidget.id, x: 0, y: maxY_lg, w: defaultW, h: defaultH, static: false }];

      // For SM layout (mobile)
      let maxY_sm = 0;
      if (newLayouts.sm.length > 0) {
        maxY_sm = Math.max(...newLayouts.sm.map(item => item.y + item.h));
      }
      newLayouts.sm = [...newLayouts.sm, { i: newWidget.id, x: 0, y: maxY_sm, w: 4, h: defaultH, static: false }]; // Mobile widgets typically take full width

      setCurrentLayouts(newLayouts);
      showSuccess('Widget added!');
    }
  };

  const handleRemoveWidget = useCallback(async (widgetId: string) => {
    const { error: deleteWidgetError } = await supabase.from('widgets').delete().eq('id', widgetId);
    if (deleteWidgetError) {
      showError('Failed to remove widget.');
      console.error(deleteWidgetError);
      return;
    }

    const updatedWidgets = widgets.filter(w => w.id !== widgetId);
    setWidgets(updatedWidgets);

    const newLayouts = {
      lg: currentLayouts.lg.filter(item => item.i !== widgetId),
      sm: currentLayouts.sm.filter(item => item.i !== widgetId),
    };
    setCurrentLayouts(newLayouts);
    showSuccess('Widget removed.');
  }, [widgets, currentLayouts]);

  const handleLayoutChange = useCallback(async (layout: Layout[], allLayouts: { lg: Layout[]; sm: Layout[] }) => {
    setCurrentLayouts(allLayouts);
    hasUnsavedChanges.current = true;
  }, []);

  // Save layout to database
  const saveLayoutToDatabase = useCallback(async () => {
    if (!hasUnsavedChanges.current || (layoutRef.current.lg.length === 0 && layoutRef.current.sm.length === 0)) {
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_dashboard_layouts')
      .upsert({ user_id: user.id, layouts: layoutRef.current }, { onConflict: 'user_id' });

    if (error) {
      console.error('Failed to save layout to database', error);
    } else {
      hasUnsavedChanges.current = false;
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
      layouts={currentLayouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 4, xs: 4, xxs: 2 }}
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
            data-grid={{ i: widget.id, x: 0, y: Infinity, w: 1, h: 1 }} // Placeholder for new widgets
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