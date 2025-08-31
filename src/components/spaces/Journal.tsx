import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Book } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { showError, showSuccess } from '@/utils/toast';
import { format } from 'date-fns';

type JournalEntry = {
  id?: string;
  entry_date: string;
  gratitude: string;
  thoughts: string;
  free_write: string;
};

const Journal = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [entry, setEntry] = useState<Partial<JournalEntry> | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  const fetchEntry = async (date: string) => {
    setLoading(true);
    setEntry(null);
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('entry_date', date)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116: No rows found
      showError('Could not fetch journal entry.');
      console.error(error);
    } else if (data) {
      setEntry(data);
    } else {
      setEntry({
        gratitude: '',
        thoughts: '',
        free_write: '',
      });
    }
    setLoading(false);
    setIsDirty(false);
  };

  useEffect(() => {
    if (selectedDate) {
      fetchEntry(formattedDate);
    }
  }, [selectedDate]);

  const handleSaveEntry = async () => {
    if (!selectedDate || !entry) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const entryData = {
      user_id: user.id,
      entry_date: formattedDate,
      gratitude: entry?.gratitude || '',
      thoughts: entry?.thoughts || '',
      free_write: entry?.free_write || '',
    };

    const { error } = await supabase.from('journal_entries').upsert(entryData, {
      onConflict: 'user_id, entry_date',
    });

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Journal entry saved.');
      setIsDirty(false);
    }
  };

  const handleInputChange = (field: keyof JournalEntry, value: string) => {
    setEntry((prev) => ({ ...prev, [field]: value }));
    if (!isDirty) setIsDirty(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      <div className="lg:col-span-1">
        <div className="flex items-center gap-4 mb-6">
          <Book className="h-10 w-10 text-primary" />
          <div>
            <h2 className="text-4xl font-serif">Journal</h2>
            <p className="text-foreground/70">
              Reflect daily on gratitude, thoughts, and more.
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="w-full"
              disabled={(date) =>
                date > new Date() || date < new Date('1900-01-01')
              }
            />
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="font-sans font-medium text-2xl">
              {selectedDate
                ? format(selectedDate, 'MMMM d, yyyy')
                : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading entry...</p>
            ) : entry ? (
              <div className="space-y-6">
                <div>
                  <label className="text-lg font-medium font-serif">
                    What are you grateful for today?
                  </label>
                  <Textarea
                    value={entry.gratitude || ''}
                    onChange={(e) =>
                      handleInputChange('gratitude', e.target.value)
                    }
                    placeholder="1. ...&#10;2. ...&#10;3. ..."
                    rows={4}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-lg font-medium font-serif">
                    What's on your mind?
                  </label>
                  <Textarea
                    value={entry.thoughts || ''}
                    onChange={(e) =>
                      handleInputChange('thoughts', e.target.value)
                    }
                    placeholder="A thought, a feeling, an observation..."
                    rows={4}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-lg font-medium font-serif">
                    Free Write
                  </label>
                  <Textarea
                    value={entry.free_write || ''}
                    onChange={(e) =>
                      handleInputChange('free_write', e.target.value)
                    }
                    placeholder="Let your thoughts flow freely..."
                    rows={8}
                    className="mt-2"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveEntry} disabled={!isDirty}>
                    {isDirty ? 'Save Entry' : 'Saved'}
                  </Button>
                </div>
              </div>
            ) : (
              <p>Select a date to view or create an entry.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Journal;