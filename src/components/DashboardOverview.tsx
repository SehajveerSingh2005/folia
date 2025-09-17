import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { showError, showSuccess } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

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
  user_id: string;
};

interface DashboardOverviewProps {
  firstName: string;
  onNavigate: (space: string) => void;
  isEditable: boolean;
  addWidgetTrigger: { type: string; w: number; h: number; mw: number; mh: number } | null;
  onWidgetAdded: () => void;
  setSaveLayoutRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

const widgetMap: { [key: string]: React.ComponentType<any> } = {
  Welcome: WelcomeWidget,
  Clock: ClockWidget,
  DueToday: DueTodayWidget,
  Inbox: InboxWidget,
  Notes: NotesWidget,
  Journal: JournalWidget,
  Goals: GoalsWidget,
};

const widgetNavigationMap: { [key: string]: string } = {
  DueToday: 'Loom',
  Inbox: 'Loom',
  Notes: 'Garden',
  Journal: 'Journal',
  Goals: 'Horizon',
};

const defaultLayoutPlaceholders = {
  lg: [
    { i: 'welcome', x: 0, y: 0, w: 8, h: 2 },
    { i: 'clock', x: 8, y: 0, w: 4, h: 2 },
    { i: 'duetoday', x: 0, y: 2, w: 6, h: 4 },
    { i: 'inbox', x: 6, y: 2, w: 6, h: 4 },
    { i: 'journal', x: 0, y: 6, w: 6, h: 3 },
    { i: 'goals', x: 6, y: 6, w: 6, h: 3 },
  ],
  xs: [
    { i: 'welcome', x: 0, y: 0, w: 4, h: 2 },
    { i: 'clock', x: 0, y: 2, w: 2, h: 2 },
    { i: 'duetoday', x: 2, y: 2, w: 2, h: 4 },
    { i: 'inbox', x: 0, y: 4, w: 2, h: 4 },
    { i: 'journal', x: 0, y: 8, w: 4, h: 3 },
    { i: 'goals', x: 0, y: 11, w: 4, h: 3 },
  ],
};

const defaultWidgetTypes: { [key: string]: string } = {
  welcome: 'Welcome',
  clock: 'Clock',
  duetoday: 'DueToday',
  inbox: 'Inbox',
  journal: 'Journal',
  goals: 'Goals',
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
  const [layouts, setLayouts] = useState<Layouts>({});
  const [loading, setLoading] = useState(true);
  const layoutsRef = useRef(layouts);
  const hasUnsavedChanges = useRef(false);

  useEffect(() => {
    layoutsRef.current = layouts;
    if (Object.keys(layouts).length > 0) {
      hasUnsavedChanges.current = true;
    }
  }, [layouts]);

  const createDefaultLayout = async (user_id: string) => {
    // Clear any existing widgets to start fresh
    await supabase.from('widgets').delete().eq('user_id', user_id);

    const newWidgets = Object.entries(defaultWidgetTypes).map(([key, type]) => ({
      placeholderId: key,
      id: uuidv4(),
      widget_type: type,
      user_id,
    }));

    const idMap = new Map(newWidgets.map(w => [w.placeholderId, w.id]));

    const finalLayouts: Layouts = {
      lg: defaultLayoutPlaceholders.lg.map(l => ({ ...l, i: idMap.get(l.i)! })),
      xs: defaultLayoutPlaceholders.xs.map(l => ({ ...l, i: idMap.get(l.i)! })),
    };

    const { error: insertWidgetsError } = await supabase.from('widgets').insert(
      newWidgets.map(({ id, user_id, widget_type }) => ({ id, user_id, widget_type }))
    );
    const { error: insertLayoutError } = await supabase.from('user_dashboard_layouts').upsert({ user_id, layouts: finalLayouts });

    if (insertWidgetsError || insertLayoutError) {
      showError('Could not create default layout.');
      return { widgets: [], layouts: {} };
    }
    return { widgets: newWidgets, layouts: finalLayouts };
  };

  const loadLayouts = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: layoutData, error: layoutError } = await supabase
      .from('user_dashboard_layouts')
      .select('layouts')
      .eq('user_id', user.id)
      .single();

    const { data: widgetData, error: widgetError } = await supabase
      .from('widgets')
      .select('id, widget_type, user_id')
      .eq('user_id', user.id);

    if ((layoutError && layoutError.code !== 'PGRST116') || widgetError) {
      showError('Could not load dashboard.');
      setLoading(false);
      return;
    }

    if (layoutData && layoutData.layouts && Object.keys(layoutData.layouts).length > 0) {
      setLayouts(layoutData.layouts as Layouts);
      setWidgets(widgetData || []);
    } else {
      const { widgets, layouts } = await createDefaultLayout(user.id);
      setWidgets(widgets);
      setLayouts(layouts);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLayouts();
  }, []);

  useEffect(() => {
    if (addWidgetTrigger) {
      addNewWidget(addWidgetTrigger.type, addWidgetTrigger.w, addWidgetTrigger.h, addWidgetTrigger.mw, addWidgetTrigger.mh);
      onWidgetAdded();
    }
  }, [addWidgetTrigger]);

  const addNewWidget = async (widgetType: string, w: number, h: number, mw: number, mh: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newWidget = { id: uuidv4(), user_id: user.id, widget_type: widgetType };
    const { error } = await supabase.from('widgets').insert(newWidget);

    if (error) {
      showError('Failed to add widget.');
    } else {
      setWidgets([...widgets, newWidget]);
      const newLayouts = { ...layouts };
      for (const breakpoint in newLayouts) {
        let maxY = 0;
        if (newLayouts[breakpoint].length > 0) {
          maxY = Math.max(...newLayouts[breakpoint].map(item => item.y + item.h));
        }
        const isMobile = breakpoint === 'xs';
        newLayouts[breakpoint].push({
          i: newWidget.id,
          x: 0,
          y: maxY,
          w: isMobile ? mw : w,
          h: isMobile ? mh : h,
        });
      }
      setLayouts(newLayouts);
      showSuccess('Widget added!');
    }
  };

  const handleRemoveWidget = useCallback(async (widgetId: string) => {
    const { error } = await supabase.from('widgets').delete().eq('id', widgetId);
    if (error) {
      showError('Failed to remove widget.');
    } else {
      setWidgets(widgets.filter(w => w.id !== widgetId));
      const newLayouts = { ...layouts };
      for (const breakpoint in newLayouts) {
        newLayouts[breakpoint] = newLayouts[breakpoint].filter(l => l.i !== widgetId);
      }
      setLayouts(newLayouts);
      showSuccess('Widget removed.');
    }
  }, [widgets, layouts]);

  const handleLayoutChange = useCallback((_layout: Layout[], newLayouts: Layouts) => {
    setLayouts(newLayouts);
  }, []);

  const saveLayoutToDatabase = useCallback(async () => {
    if (!hasUnsavedChanges.current || Object.keys(layoutsRef.current).length === 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('user_dashboard_layouts').upsert({ user_id: user.id, layouts: layoutsRef.current });
    if (!error) {
      hasUnsavedChanges.current = false;
    } else {
      showError('Could not save layout changes.');
    }
  }, []);

  const saveCurrentLayout = useCallback(async () => {
    await saveLayoutToDatabase();
  }, [saveLayoutToDatabase]);

  useEffect(() => {
    if (setSaveLayoutRef) setSaveLayoutRef.current = saveCurrentLayout;
  }, [saveCurrentLayout, setSaveLayoutRef]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges.current) saveLayoutToDatabase();
    }, 5000);

    if (!isEditable && hasUnsavedChanges.current) saveLayoutToDatabase();

    return () => {
      clearInterval(interval);
      if (hasUnsavedChanges.current) saveLayoutToDatabase();
    };
  }, [isEditable, saveLayoutToDatabase]);

  const handleWidgetClick = (e: React.MouseEvent, widgetId: string) => {
    if (isEditable) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, label, [role="checkbox"]')) return;
    const widgetType = widgets.find(w => w.id === widgetId)?.widget_type;
    if (widgetType) {
      const space = widgetNavigationMap[widgetType];
      if (space) onNavigate(space);
    }
  };

  if (loading) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  const widgetTypeMap = new Map(widgets.map(w => [w.id, w.widget_type]));
  const allWidgetIds = new Set(Object.values(layouts).flat().map(l => l.i));
  const widgetsToRender = Array.from(allWidgetIds);

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
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
      {widgetsToRender.map(widgetId => {
        const widgetType = widgetTypeMap.get(widgetId);
        const WidgetComponent = widgetType ? widgetMap[widgetType] : null;
        return (
          <div 
            key={widgetId} 
            className="relative group bg-card rounded-lg border border-border"
            onClick={(e) => handleWidgetClick(e, widgetId)}
          >
            {isEditable && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 z-10 h-6 w-6"
                onClick={(e) => { e.stopPropagation(); handleRemoveWidget(widgetId); }}
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