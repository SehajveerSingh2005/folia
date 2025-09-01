import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Book } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { showError, showSuccess } from '@/utils/toast';
import { format } from 'date-fns';

type ChronicleEntry = {
  id?: string;
  entry_date: string;
  entry: string;
  mood: string;
};

const moodOptions = ['Excellent', 'Good', 'Neutral', 'Low', 'Bad'];

const Journal = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [entry, setEntry] = useState<Partial<ChronicleEntry> | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  const fetchEntry = async (date: string) => {
    setLoading(true);
    setEntry(null);
    const { data, error } = await supabase
      .from('chronicle_entries')
      .select('*')
      .eq('entry_date', date)
      .single();

    if (error && error.code !== 'PGRST116') {
      showError('Could not fetch journal entry.');
      console.error(error);
    } else if (data) {
      setEntry(data);
    } else {
      setEntry({
        entry: '',
        mood: 'Neutral',
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
      entry: entry.entry || '',
      mood: entry.mood || 'Neutral',
    };

    const { error } = await supabase
      .from('chronicle_entries')
      .upsert(entryData, {
        onConflict: 'user_id, entry_date',
      });

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Journal entry saved.');
      setIsDirty(false);
    }
  };

  const handleInputChange = (
    field: keyof ChronicleEntry,
    value: string,
  ) => {
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
            <div className="flex justify-between items-center">
              <CardTitle className="font-sans font-medium text-2xl">
                {selectedDate
                  ? format(selectedDate, 'MMMM d, yyyy')
                  : 'Select a date'}
              </CardTitle>
              {entry && (
                <div className="w-40">
                  <Select
                    value={entry.mood || 'Neutral'}
                    onValueChange={(value) => handleInputChange('mood', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mood" />
                    </SelectTrigger>
                    <SelectContent>
                      {moodOptions.map((mood) => (
                        <SelectItem key={mood} value={mood}>
                          {mood}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading entry...</p>
            ) : entry ? (
              <div className="space-y-6 h-full flex flex-col">
                <Textarea
                  value={entry.entry || ''}
                  onChange={(e) => handleInputChange('entry', e.target.value)}
                  placeholder="Let your thoughts flow freely..."
                  className="flex-grow text-base"
                />
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