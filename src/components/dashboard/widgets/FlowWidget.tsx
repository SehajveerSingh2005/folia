import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FolderKanban } from 'lucide-react';

type Task = { is_done: boolean };
type FlowItem = { id: string; name: string; tasks: Task[] };

const FlowWidget = () => {
  const [items, setItems] = useState<FlowItem[]>([]);

  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('loom_items')
        .select('id, name, ledger_items(is_done)')
        .neq('status', 'Completed')
        .limit(3)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching flow items:', error);
      } else if (data) {
        const formattedData = data.map(item => ({
          id: item.id,
          name: item.name,
          tasks: item.ledger_items as Task[],
        }));
        setItems(formattedData);
      }
    };
    fetchItems();
  }, []);

  const calculateProgress = (tasks: Task[]) => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.is_done).length;
    return (completed / tasks.length) * 100;
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-sans font-medium">Active in Flow</CardTitle>
        <CardDescription>A snapshot of your current projects.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id}>
              <div className="flex justify-between items-center mb-1">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{Math.round(calculateProgress(item.tasks))}%</p>
              </div>
              <Progress value={calculateProgress(item.tasks)} />
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground">No active items in your flow.</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export default FlowWidget;