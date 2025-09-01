import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const JournalWidget = ({ onNavigate }: { onNavigate: (view: string) => void }) => {
  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-sans font-medium">Daily Journal</CardTitle>
        <CardDescription>
          Take a moment to reflect on your day.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center text-center">
        <p className="text-lg font-serif mb-4">"The unexamined life is not worth living."</p>
        <Button onClick={() => onNavigate('Journal')}>
          Write Today's Entry
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default JournalWidget;