import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

interface WelcomeWidgetProps {
  firstName: string;
}

const WelcomeWidget = ({ firstName }: WelcomeWidgetProps) => {
  const today = new Date();
  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Card className="w-full h-full">
      <CardContent className="p-6 flex flex-col justify-center h-full">
        <h2 className="text-3xl font-serif">
          {getGreeting()}, {firstName}.
        </h2>
        <p className="text-lg text-foreground/70">
          {format(today, 'EEEE, MMMM d')}
        </p>
      </CardContent>
    </Card>
  );
};

export default WelcomeWidget;