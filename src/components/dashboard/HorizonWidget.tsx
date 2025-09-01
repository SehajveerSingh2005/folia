import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Telescope, ArrowRight } from 'lucide-react';

type Goal = {
  id: string;
  title: string;
  status: string;
};

interface HorizonWidgetProps {
  goals: Goal[];
  onNavigate: () => void;
}

const HorizonWidget = ({ goals, onNavigate }: HorizonWidgetProps) => {
  const activeGoals = goals.filter((goal) => goal.status !== 'Completed');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <Telescope className="h-6 w-6 text-primary" />
          <CardTitle className="font-sans text-xl font-medium">
            On the Horizon
          </CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={onNavigate}>
          View All <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {activeGoals.length > 0 ? (
          <ul className="space-y-2 pt-4">
            {activeGoals.slice(0, 3).map((goal) => (
              <li
                key={goal.id}
                className="p-3 rounded-md hover:bg-secondary transition-colors flex justify-between items-center"
              >
                <span>{goal.title}</span>
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                  {goal.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="pt-4 text-foreground/70">
            No active goals yet. Set your sights on something new!
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default HorizonWidget;