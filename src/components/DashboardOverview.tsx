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

type LayoutItem = Layout & { widget_type: string };
type CustomLayouts = { [breakpoint: string]: LayoutItem[] };

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

const defaultLayouts: CustomLayouts = {
  lg: [
    { i: uuidv4(), widget_type: 'Welcome', x: 0, y: 0, w: 8, h: 2 },
    { i: uuidv4(), widget_type: 'Clock', x: 8, y: 0, w: 4, h: 2 },
    { i: uuidv4(), widget_type: 'DueToday', x: 0, y: 2, w: 6, h: 4 },
    { i: uuidv4(), widget_type: 'Inbox', x: 6, y: 2, w: 6, h: 4 },
    { i: uuidv4(), widget_type: 'Journal', x: 0, y: 6, w: 6, h: 3 },
    { i: uuidv4(), widget_type: 'Goals', x: 6, y: 6, w: 6, h: 3 },
  ],
  xs: [
    { i: uuidv4(), widget_type: 'Welcome', x: 0, y: 0, w: 4, h: 2 },
    { i: uuidv4(), widget_type: 'Clock', x: 0, y: 2, w: 2, h: 2 },
    { i: uuidv4(), widget_type: 'DueToday', x: 2, y: 2, w: 2, h: 4 },
    { i: uuidv4(), widget_type: 'Inbox', x: 0, y: 4, w: 2, h: 4 },
    { i: uuidv4(), widget_type: 'Journal', x: 0, y: 8, w: 4, h: 3 },
    { i: uuidv4(), widget_type: 'Goals', x: 0, y: 11, w: 4, h: 3 },
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
  const [layouts, setLayouts] = useState<CustomLayouts>({});
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
    const { error } = await supabase.from('user_dashboard_layouts').upsert({ user_id, layouts: defaultLayouts });
    if (error) {
      showError('Could not create default layout.');
      return {};
    }
    return defaultLayouts;
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

    if (layoutError && layoutError.code !== 'PGRST116') {
      showError('Could not load dashboard.');
      setLoading(false);
      return;
    }

    const isLayoutValid = layoutData && layoutData.layouts && (layoutData.layouts as CustomLayouts).lg?.every(item => item.widget_type);

    if (isLayoutValid) {
      setLayouts(layoutData.layouts as CustomLayouts);
    } else {
      const newLayouts = await createDefaultLayout(user.id);
      setLayouts(newLayouts);
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

  const addNewWidget = (widgetType: string, w: number, h: number, mw: number, mh: number) => {
    const newWidgetId = uuidv4();
    const newLayouts = { ...layouts };
    
    for (const breakpoint in newLayouts) {
      let maxY = 0;
      if (newLayouts[breakpoint].length > 0) {
        maxY = Math.max(...newLayouts[breakpoint].map(item => item.y + item.h));
      }
      const isMobile = breakpoint === 'xs';
      newLayouts[breakpoint].push({
        i: newWidgetId,
        widget_type: widgetType,
        x: 0,
        y: maxY,
        w: isMobile ? mw : w,
        h: isMobile ? mh : h,
      });
    }
    setLayouts(newLayouts);
    showSuccess('Widget added!');
  };

  const handleRemoveWidget = useCallback((widgetId: string) => {
    const newLayouts = { ...layouts };
    for (const breakpoint in newLayouts) {
      newLayouts[breakpoint] = newLayouts[breakpoint].filter(l => l.i !== widgetId);
    }
    setLayouts(newLayouts);
    showSuccess('Widget removed.');
  }, [layouts]);

  const handleLayoutChange = useCallback((_layout: Layout[], newLayouts: Layouts) => {
    // The library doesn't preserve extra properties, so we need to merge them back in.
    const updatedLayouts: CustomLayouts = {};
    for (const breakpoint in newLayouts) {
      updatedLayouts[breakpoint] = newLayouts[breakpoint].map(newItem => {
        const oldItem = Object.values(layouts).flat().find(item => item.i === newItem.i);
        return { ...newItem, widget_type: oldItem?.widget_type || '' };
      });
    }
    setLayouts(updatedLayouts);
  }, [layouts]);

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

  const allLayoutItems = Object.values(layouts).flat();
  const uniqueLayoutItems = Array.from(new Map(allLayoutItems.map(item => [item.i, item])).values());

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
      {uniqueLayoutItems.map(item => {
        const WidgetComponent = item.widget_type ? widgetMap[item.widget_type] : null;
        return (
          <div 
            key={item.i} 
            className="relative group bg-card rounded-lg border border-border"
            onClick={(e) => handleWidgetClick(e, item.widget_type)}
          >
            {isEditable && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 z-10 h-6 w-6"
                onClick={(e) => { e.stopPropagation(); handleRemoveWidget(item.i); }}
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