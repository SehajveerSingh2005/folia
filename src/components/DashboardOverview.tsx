import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Skeleton } from '@/components/ui/skeleton';
import WelcomeWidget from './dashboard/widgets/WelcomeWidget';
import ClockWidget from './dashboard/widgets/ClockWidget';
import { showError } from '@/utils/toast';

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
}

const widgetMap: { [key: string]: React.ComponentType<any> } = {
  Welcome: WelcomeWidget,
  Clock: ClockWidget,
};

const defaultLayout: Omit<Widget, 'id'>[] = [
  { widget_type: 'Welcome', x: 0, y: 0, w: 8, h: 2 },
  { widget_type: 'Clock', x: 8, y: 0, w: 4, h: 2 },
];

const DashboardOverview = ({ firstName }: DashboardOverviewProps) => {
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
      const formattedLayout = data.map(w => ({ i: w.id, x: w.x, y: w.y, w: w.w, h: w.h }));
      setLayout(formattedLayout);
    } else {
      // Create default layout for new users
      const newWidgets = defaultLayout.map(item => ({ ...item, user_id: user.id }));
      const { data: insertedWidgets, error: insertError } = await supabase
        .from('widgets')
        .insert(newWidgets)
        .select();
      
      if (insertError) {
        showError('Could not create a default layout.');
        console.error(insertError);
      } else if (insertedWidgets) {
        setWidgets(insertedWidgets);
        const formattedLayout = insertedWidgets.map(w => ({ i: w.id, x: w.x, y: w.y, w: w.w, h: w.h }));
        setLayout(formattedLayout);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWidgets();
  }, []);

  const handleLayoutChange = async (newLayout: Layout[]) => {
    setLayout(newLayout);
    
    const updates = newLayout.map(item => {
      const widget = widgets.find(w => w.id === item.i);
      if (!widget) return null;
      return supabase
        .from('widgets')
        .update({ x: item.x, y: item.y, w: item.w, h: item.h })
        .eq('id', item.i);
    }).filter(Boolean);

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
    >
      {widgets.map(widget => {
        const WidgetComponent = widgetMap[widget.widget_type];
        return (
          <div key={widget.id} data-grid={{ x: widget.x, y: widget.y, w: widget.w, h: widget.h }}>
            {WidgetComponent ? <WidgetComponent firstName={firstName} /> : <div>Unknown Widget</div>}
          </div>
        );
      })}
    </ResponsiveGridLayout>
  );
};

export default DashboardOverview;