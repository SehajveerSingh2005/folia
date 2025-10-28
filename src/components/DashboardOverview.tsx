import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { showError } from '@/utils/toast';
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
import FlowWidget from './dashboard/widgets/FlowWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

type LayoutItem = Layout & { widget_type: string };
type CustomLayouts = { [breakpoint: string]: LayoutItem[] };

interface DashboardOverviewProps {
  firstName: string;
  onNavigate: (space: string) => void;
  isEditable: boolean;
  addWidgetTrigger: { type: string; w: number; h: number; minW: number; minH: number; mw: number; mh: number; } | null;
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
  Flow: FlowWidget,
};

const widgetNavigationMap: { [key: string]: string } = {
  DueToday: 'Loom',
  Inbox: 'Loom',
  Notes: 'Garden',
  Journal: 'Journal',
  Goals: 'Horizon',
  Flow: 'Flow',
};

const generateDefaultLayouts = (): CustomLayouts => {
  const welcomeId = uuidv4();
  const clockId = uuidv4();
  const dueTodayId = uuidv4();
  const inboxId = uuidv4();
  const journalId = uuidv4();
  const flowId = uuidv4();

  return {
    lg: [
      { i: welcomeId, widget_type: 'Welcome', x: 0, y: 0, w: 8, h: 2, minW: 6, minH: 2 },
      { i: clockId, widget_type: 'Clock', x: 8, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
      { i: dueTodayId, widget_type: 'DueToday', x: 0, y: 2, w: 6, h: 6, minW: 4, minH: 4 },
      { i: inboxId, widget_type: 'Inbox', x: 6, y: 2, w: 6, h: 6, minW: 4, minH: 4 },
      { i: journalId, widget_type: 'Journal', x: 0, y: 8, w: 6, h: 5, minW: 4, minH: 4 },
      { i: flowId, widget_type: 'Flow', x: 6, y: 8, w: 6, h: 5, minW: 4, minH: 4 },
    ],
    xs: [
      { i: welcomeId, widget_type: 'Welcome', x: 0, y: 0, w: 4, h: 2, minW: 4, minH: 2 },
      { i: clockId, widget_type: 'Clock', x: 0, y: 2, w: 4, h: 2, minW: 4, minH: 2 },
      { i: dueTodayId, widget_type: 'DueToday', x: 0, y: 4, w: 4, h: 6, minW: 2, minH: 5 },
      { i: inboxId, widget_type: 'Inbox', x: 0, y: 10, w: 4, h: 6, minW: 2, minH: 5 },
      { i: journalId, widget_type: 'Journal', x: 0, y: 16, w: 4, h: 5, minW: 4, minH: 4 },
      { i: flowId, widget_type: 'Flow', x: 0, y: 21, w: 4, h: 5, minW: 4, minH: 4 },
    ],
  };
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

  useEffect(() => {
    layoutsRef.current = layouts;
  }, [layouts]);

  const createDefaultLayout = async (user_id: string) => {
    const newDefaultLayouts = generateDefaultLayouts();
    const { error } = await supabase.from('user_dashboard_layouts').upsert({ user_id, layouts: newDefaultLayouts });
    if (error) {
      showError('Could not create default layout.');
      return {};
    }
    return newDefaultLayouts;
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

    const isLayoutValid = layoutData &&
      typeof layoutData.layouts === 'object' &&
      layoutData.layouts !== null &&
      Object.values(layoutData.layouts as CustomLayouts).length > 0 &&
      Object.values(layoutData.layouts as CustomLayouts).every(bp =>
        Array.isArray(bp) && bp.every(item => item.widget_type && typeof item.widget_type === 'string')
      );

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
      addNewWidget(addWidgetTrigger);
      onWidgetAdded();
    }
  }, [addWidgetTrigger]);

  const addNewWidget = (widget: NonNullable<DashboardOverviewProps['addWidgetTrigger']>) => {
    const newWidgetId = uuidv4();
    const newLayouts = JSON.parse(JSON.stringify(layouts));
    
    for (const breakpoint in newLayouts) {
      const isMobile = breakpoint === 'xs';
      newLayouts[breakpoint].push({
        i: newWidgetId,
        widget_type: widget.type,
        x: 0,
        y: Infinity, // Let the grid library place it at the bottom
        w: isMobile ? widget.mw : widget.w,
        h: isMobile ? widget.mh : widget.h,
        minW: isMobile ? widget.mw : widget.minW,
        minH: isMobile ? widget.mh : widget.minH,
      });
    }
    setLayouts(newLayouts);
  };

  const handleRemoveWidget = useCallback((widgetId: string) => {
    const newLayouts = { ...layouts };
    for (const breakpoint in newLayouts) {
      newLayouts[breakpoint] = newLayouts[breakpoint].filter(l => l.i !== widgetId);
    }
    setLayouts(newLayouts);
  }, [layouts]);

  const handleLayoutChange = useCallback((_layout: Layout[], newLayouts: { [breakpoint: string]: Layout[] }) => {
    const currentLayoutItems = Object.values(layouts).flat();
    const itemsMap = new Map(currentLayoutItems.map(item => [item.i, item]));

    const updatedLayouts: CustomLayouts = {};
    for (const breakpoint in newLayouts) {
      updatedLayouts[breakpoint] = newLayouts[breakpoint].map(newItem => {
        const oldItem = itemsMap.get(newItem.i);
        return { ...newItem, widget_type: oldItem?.widget_type || '' };
      });
    }
    setLayouts(updatedLayouts);
  }, [layouts]);

  const saveLayoutToDatabase = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('user_dashboard_layouts').upsert({ user_id: user.id, layouts: layoutsRef.current });
    if (error) {
      showError('Could not save layout changes.');
      throw new Error(error.message);
    }
  }, []);

  useEffect(() => {
    if (setSaveLayoutRef) {
      setSaveLayoutRef.current = saveLayoutToDatabase;
    }
  }, [saveLayoutToDatabase, setSaveLayoutRef]);

  const handleWidgetClick = (e: React.MouseEvent, widgetType: string) => {
    if (isEditable) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, label, [role="checkbox"], a')) return;
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
      rowHeight={30}
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