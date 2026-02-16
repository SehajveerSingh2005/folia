import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

type JournalEntry = {
  mood: string | null;
  entry: string | null;
};

const JournalWidget = ({ onNavigate }: { onNavigate: (view: string) => void }) => {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const todayString = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const fetchEntry = async () => {
      const { data, error } = await supabase
        .from('chronicle_entries')
        .select('mood, entry')
        .eq('entry_date', todayString)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching today\'s journal entry:', error);
      } else {
        setEntry(data);
      }
    };
    fetchEntry();
  }, [todayString]);

  const getMoodEmoji = (mood: string | null) => {
    switch (mood) {
      case 'Excellent': return '😄';
      case 'Good': return '😊';
      case 'Neutral': return '😐';
      case 'Low': return '😕';
      case 'Bad': return '😞';
      default: return '📝';
    }
  };

  return (
    <Card className="w-full h-full flex flex-col border-none shadow-none">
      <CardHeader>
        <CardTitle className="font-sans font-medium">Today's Journal</CardTitle>
        <CardDescription>
          {format(new Date(), 'MMMM d, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center text-center">
        {entry ? (
          <>
            <p className="text-5xl mb-2">{getMoodEmoji(entry.mood)}</p>
            <p className="text-sm text-muted-foreground line-clamp-3 italic">
              {entry.entry ? `"${entry.entry}"` : "No text in today's entry."}
            </p>
          </>
        ) : (
          <>
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No entry for today yet.</p>
          </>
        )}
        <Button onClick={() => onNavigate('Journal')} className="mt-4">
          {entry ? 'View Entry' : 'Write Today\'s Entry'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default JournalWidget;