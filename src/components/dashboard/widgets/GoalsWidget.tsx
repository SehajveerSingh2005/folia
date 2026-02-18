import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Telescope } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type HorizonItem = {
  id: string;
  title: string;
  priority: string | null;
};

const GoalsWidget = () => {
  const [items, setItems] = useState<HorizonItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('horizon_items')
        .select('id, title, priority')
        .limit(3)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching horizon items:', error);
      } else if (data) {
        setItems(data);
      }
      setIsLoading(false);
    };
    fetchItems();
  }, []);

  return (
    <Card className="w-full h-full flex flex-col border-none shadow-none">
      <CardHeader>
        <CardTitle className="font-sans font-medium">Horizon Items</CardTitle>
        <CardDescription>
          Your future goals and ideas.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-3">
          {isLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-5 w-5 mt-0.5 rounded-full opacity-50" />
                <div className="space-y-1 w-full">
                  <Skeleton className="h-4 w-3/4 opacity-50" />
                  <Skeleton className="h-3 w-1/3 opacity-30" />
                </div>
              </div>
            ))
          ) : (
            items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-start gap-3 animate-in slide-in-from-top-2 fade-in duration-300 fill-mode-both"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Telescope className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  {item.priority && <p className="text-xs text-muted-foreground">{item.priority} Priority</p>}
                </div>
              </div>
            ))
          )}
          {items.length === 0 && <p className="text-sm text-muted-foreground">No items in your horizon yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalsWidget;