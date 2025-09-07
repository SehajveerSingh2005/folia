import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Book, ClipboardCheck, Edit, Save, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { showError, showSuccess } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AutoGrowTextarea } from '@/components/ui/auto-grow-textarea';
import { Skeleton } from '@/components/ui/skeleton';

type ChronicleEntry = {
  id?: string;
  entry_date: string;
  entry: string;
  mood: string;
};

type CompletedTask = {
  id: string;
  content: string;
  notes: string | null;
};

const moodOptions = ['Excellent', 'Good', 'Neutral', 'Low', 'Bad'];

const Journal = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [entry, setEntry] = useState<Partial<ChronicleEntry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

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
    } else if (data) {
      setEntry(data);
      setIsEditing(false);
    } else {
      setEntry({ entry: '', mood: 'Neutral' });
      setIsEditing(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedDate) {
      fetchEntry(formattedDate);
    }
  }, [selectedDate]);

  const fetchCompletedTasks = async () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('ledger_items')
      .select('id, content, notes')
      .eq('is_done', true)
      .gte('completed_at', `${dateStr}T00:00:00.000Z`)
      .lte('completed_at', `${dateStr}T23:59:59.999Z`);

    if (error) {
      showError('Could not fetch completed tasks.');
    } else {
      setCompletedTasks(data || []);
    }
  };

  const handleAppendTasks = () => {
    const tasksToAppend = completedTasks.filter(task => selectedTasks.includes(task.id));
    if (tasksToAppend.length === 0) return;

    const tasksSummary = tasksToAppend
      .map(task => {
        let taskString = `- ${task.content}`;
        if (task.notes) {
          taskString += `\n  - *Notes: ${task.notes}*`;
        }
        return taskString;
      })
      .join('\n');

    const newEntryText = (entry?.entry || '') + `\n\n**Completed Today:**\n${tasksSummary}`;
    setEntry(prev => ({ ...prev, entry: newEntryText }));
    setIsEditing(true);
    setSelectedTasks([]);
    showSuccess(`${tasksToAppend.length} tasks added to your entry.`);
  };

  const handleSaveEntry = async () => {
    if (!selectedDate || !entry) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const entryData = {
      user_id: user.id,
      entry_date: formattedDate,
      entry: entry.entry || '',
      mood: entry.mood || 'Neutral',
    };

    const { error } = await supabase
      .from('chronicle_entries')
      .upsert(entryData, { onConflict: 'user_id, entry_date' });

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Journal entry saved.');
      fetchEntry(formattedDate);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      <div className="lg:col-span-1">
        <div className="flex items-center gap-4 mb-6">
          <Book className="h-10 w-10 text-primary" />
          <div>
            <h2 className="text-4xl font-serif">Journal</h2>
            <p className="text-foreground/70">Reflect daily on your thoughts and progress.</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="w-full"
              disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
            />
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-center gap-4">
              <CardTitle className="font-sans font-medium text-2xl">
                {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
              </CardTitle>
              <div className="flex items-center gap-2">
                {!isEditing && entry && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                )}
                {entry && (
                  <div className="w-40">
                    <Select
                      value={entry.mood || 'Neutral'}
                      onValueChange={(value) => setEntry(prev => ({ ...prev, mood: value }))}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Mood" />
                      </SelectTrigger>
                      <SelectContent>
                        {moodOptions.map((mood) => (
                          <SelectItem key={mood} value={mood}>{mood}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : entry ? (
              isEditing ? (
                <div className="space-y-4 h-full flex flex-col">
                  <AutoGrowTextarea
                    value={entry.entry || ''}
                    onChange={(e) => setEntry(prev => ({ ...prev, entry: e.target.value }))}
                    placeholder="Let your thoughts flow freely..."
                    className="flex-grow text-base w-full p-2"
                  />
                </div>
              ) : (
                <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
                  {entry.entry ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.entry}</ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground">No entry for this day. Click 'Edit' to start writing.</p>
                  )}
                </div>
              )
            ) : (
              <p>Select a date to view or create an entry.</p>
            )}
          </CardContent>
          {isEditing && (
            <CardFooter className="border-t pt-4 flex justify-between">
              <Popover onOpenChange={(open) => open && fetchCompletedTasks()}>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <ClipboardCheck className="mr-2 h-4 w-4" /> Import Tasks
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h4 className="font-medium leading-none">Completed Today</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {completedTasks.length > 0 ? completedTasks.map(task => (
                        <div key={task.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={task.id}
                            checked={selectedTasks.includes(task.id)}
                            onCheckedChange={(checked) => {
                              setSelectedTasks(prev => checked ? [...prev, task.id] : prev.filter(id => id !== task.id));
                            }}
                          />
                          <label htmlFor={task.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {task.content}
                          </label>
                        </div>
                      )) : <p className="text-sm text-muted-foreground">No tasks completed on this day.</p>}
                    </div>
                    <Button onClick={handleAppendTasks} className="w-full" disabled={selectedTasks.length === 0}>
                      Add Selected
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => fetchEntry(formattedDate)}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button onClick={handleSaveEntry}>
                  <Save className="mr-2 h-4 w-4" /> Save Entry
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Journal;