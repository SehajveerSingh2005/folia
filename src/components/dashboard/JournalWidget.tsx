import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Book, ArrowRight } from 'lucide-react';

interface JournalWidgetProps {
  hasTodayEntry: boolean;
  onNavigate: () => void;
}

const JournalWidget = ({ hasTodayEntry, onNavigate }: JournalWidgetProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <Book className="h-6 w-6 text-primary" />
          <CardTitle className="font-sans text-xl font-medium">
            Daily Journal
          </CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={onNavigate}>
          Open Journal <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="pt-4">
          {hasTodayEntry ? (
            <div>
              <p className="text-foreground/70 mb-4">
                You've already written today's entry. Great job staying
                consistent!
              </p>
            </div>
          ) : (
            <div>
              <p className="text-foreground/70 mb-4">
                Take a moment to reflect. What are you grateful for today?
              </p>
            </div>
          )}
          <Button onClick={onNavigate} className="w-full">
            {hasTodayEntry ? "View Today's Entry" : "Write Today's Entry"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default JournalWidget;