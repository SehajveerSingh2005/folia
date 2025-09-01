import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

const ClockWidget = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <Card className="w-full h-full">
      <CardContent className="p-6 flex items-center justify-center h-full">
        <div className="text-5xl font-mono font-medium text-center">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClockWidget;