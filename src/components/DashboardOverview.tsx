import { useEffect, useState } from 'react';
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
};

interface DashboardOverviewProps {
  firstName: string;
  onNavigate: (space: string) => void;
  isEditable: boolean;
  addWidgetTrigger: { type: string; w: number; h: number } | null;
}

const widgetMap: { [key: string]: React.ComponentType<any> } = {
  Welcome: WelcomeWidget,
  Clock: ClockWidget,
  Tasks: TasksWidget,
  Notes: NotesWidget,
  Journal: JournalWidget,
  Goals: GoalsWidget,
};

const defaultLayout: Omit<Widget, 'id' | 'user_id'>[] = [
  { widget_type: 'Welcome', x: 0, y: 0, w: 8, h: 2 },
  { widget_type: 'Clock', x: 8, y: 0, w: 4, h: 2 },
  { widget_type: 'Tasks', x: 0, y: 2, w: 6, h: 4 },
  { widget_type: 'Notes', x: 6, y: 2, w: 6, h: 4 },
];

const DashboardOverview = ({
  firstName,
  onNavigate,
  isEditable,
  addWidgetTrigger,
}: DashboardOverviewProps) => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [layout, setLayout] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWidgets = async () => {
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
    } else {
      const newWidgets = defaultLayout.map(item => ({ ...item, user_id: user.id }));
      const { data: insertedWidgets, error: insertError } = await supabase
        .from('widgets')
        .insert(newWidgets)
        .select();
      
      if (insertError) {
        showError('Could not create a default layout.');
      } else if (insertedWidgets) {
        setWidgets(insertedWidgets);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWidgets();
  }, []);

  useEffect(() => {
    const formattedLayout = widgets.map(w => ({ i: w.id, x: w.x, y: w.y, w: w.w, h: w.h }));
    setLayout(formattedLayout);
  }, [widgets]);

  useEffect(() => {
    if (addWidgetTrigger) {
      addNewWidget(addWidgetTrigger.type, addWidgetTrigger.w, addWidgetTrigger.h);
    }
  }, [addWidgetTrigger]);

  const addNewWidget = async (widgetType: string, w: number, h: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newWidget = {
      user_id: user.id,
      widget_type: widgetType,
      x: 0,
      y: Infinity, // This will place it at the bottom
      w,
      h,
    };

    const { data, error } = await supabase
      .from('widgets')
      .insert(newWidget)
      .select()
      .single();

    if (error) {
      showError('Failed to add widget.');
    } else if (data) {
      setWidgets(prevWidgets => [...prevWidgets, data]);
      showSuccess('Widget added!');
    }
  };

  const handleRemoveWidget = async (widgetId: string) => {
    const { error } = await supabase.from('widgets').delete().eq('id', widgetId);
    if (error) {
      showError('Failed to remove widget.');
    } else {
      setWidgets(prevWidgets => prevWidgets.filter(w => w.id !== widgetId));
      showSuccess('Widget removed.');
    }
  };

  const handleLayoutChange = async (newLayout: Layout[]) => {
    setLayout(newLayout);
    const updates = newLayout.map(item => {
      return supabase
        .from('widgets')
        .update({ x: item.x, y: item.y, w: item.w, h: item.h })
        .eq('id', item.i);
    });

    await Promise.all(updates);
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
    >
      {widgets.map(widget => {
        const WidgetComponent = widgetMap[widget.widget_type];
        return (
          <div key={widget.id} className="relative group bg-card rounded-lg">
            {isEditable && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 z-10 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveWidget(widget.id)}
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