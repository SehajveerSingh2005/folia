import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';

type Note = {
  id: string;
  content: string;
};

interface GardenWidgetProps {
  notes: Note[];
  onNavigate: () => void;
}

const GardenWidget = ({ notes, onNavigate }: GardenWidgetProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-primary" />
          <CardTitle className="font-sans text-xl font-medium">
            From the Garden
          </CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={onNavigate}>
          View All <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {notes.length > 0 ? (
          <ul className="space-y-2 pt-4">
            {notes.slice(0, 3).map((note) => (
              <li
                key={note.id}
                className="p-3 rounded-md bg-secondary/50 text-sm truncate"
              >
                {note.content}
              </li>
            ))}
          </ul>
        ) : (
          <p className="pt-4 text-foreground/70">
            No notes yet. Plant a seed of an idea!
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default GardenWidget;