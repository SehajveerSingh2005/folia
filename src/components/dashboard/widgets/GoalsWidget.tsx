import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Telescope } from 'lucide-react';

type Goal = {
  id: string;
  title: string;
  status: string;
};

const GoalsWidget = () => {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    const fetchGoals = async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('id, title, status')
        .neq('status', 'Completed')
        .limit(3)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching goals:', error);
      } else if (data) {
        setGoals(data);
      }
    };
    fetchGoals();
  }, []);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-sans font-medium">Horizon Goals</CardTitle>
        <CardDescription>
          Your current long-term objectives.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-3">
          {goals.map((goal) => (
            <div key={goal.id} className="flex items-start gap-3">
              <Telescope className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <p className="font-medium text-sm">{goal.title}</p>
                <p className="text-xs text-muted-foreground">{goal.status}</p>
              </div>
            </div>
          ))}
          {goals.length === 0 && <p className="text-sm text-muted-foreground">No active goals. Time to set some!</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalsWidget;