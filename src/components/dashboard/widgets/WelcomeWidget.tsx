import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

interface WelcomeWidgetProps {
  firstName: string;
}

const WelcomeWidget = ({ firstName }: WelcomeWidgetProps) => {
  const today = new Date();
  const isMobile = useIsMobile();

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const dateFormat = isMobile ? 'EEE, MMM d' : 'EEEE, MMMM d';

  return (
    <Card className="w-full h-full">
      <CardContent className="p-6 flex flex-col justify-center h-full">
        <h2 className="text-xl sm:text-3xl font-serif">
          {getGreeting()}, {firstName}.
        </h2>
        <p className="text-sm sm:text-lg text-foreground/70">
          {format(today, dateFormat)}
        </p>
      </CardContent>
    </Card>
  );
};

export default WelcomeWidget;