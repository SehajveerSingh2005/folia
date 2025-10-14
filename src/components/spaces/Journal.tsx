import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Book, ClipboardCheck, Edit, Save, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AutoGrowTextarea } from '@/components/ui/auto-grow-textarea';
import JournalSkeleton from '../skeletons/JournalSkeleton';

// Types
type ChronicleEntry = { id?: string; entry_date: string; entry: string; mood: string; };
type CompletedTask = { id: string; content: string; notes: string | null; loom_items: { name: string } | null; };
const moodOptions = ['Excellent', 'Good', 'Neutral', 'Low', 'Bad'];

// Data Fetching
const fetchEntry = async (date: string): Promise<Partial<ChronicleEntry>> => {
  const { data, error } = await supabase.from('chronicle_entries').select('*').eq('entry_date', date).single();
  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data || { entry: '', mood: 'Neutral', entry_date: date };
};

const fetchCompletedTasks = async (date: string): Promise<CompletedTask[]> => {
  const { data, error } = await supabase.from('ledger_items').select('id, content, notes, loom_items(name)').eq('is_done', true).gte('completed_at', `${date}T00:00:00.000Z`).lte('completed_at', `${date}T23:59:59.999Z`);
  if (error) throw new Error(error.message);
  return data || [];
};

// Component
const Journal = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [editableEntry, setEditableEntry] = useState<Partial<ChronicleEntry> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  const { data: entry, isLoading: isLoadingEntry, error: entryError } = useQuery({
    queryKey: ['journal_entry', formattedDate],
    queryFn: () => fetchEntry(formattedDate),
    enabled: !!formattedDate,
    staleTime: Infinity,
  });

  const { data: completedTasks, error: tasksError } = useQuery({
    queryKey: ['completed_tasks', formattedDate],
    queryFn: () => fetchCompletedTasks(formattedDate),
    enabled: !!formattedDate,
  });

  useEffect(() => {
    if (entry) {
      setEditableEntry(entry);
      setIsEditing(!entry.id);
    }
  }, [entry]);

  if (entryError) showError('Could not fetch journal entry.');
  if (tasksError) showError('Could not fetch completed tasks.');

  const saveMutation = useMutation({
    mutationFn: async (entryData: Partial<ChronicleEntry>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");
      const dataToSave = { ...entryData, user_id: user.id, entry_date: formattedDate };
      const { error } = await supabase.from('chronicle_entries').upsert(dataToSave, { onConflict: 'user_id, entry_date' });
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Journal entry saved.');
      queryClient.invalidateQueries({ queryKey: ['journal_entry', formattedDate] });
      setIsEditing(false);
    },
    onError: (err: Error) => showError(err.message),
  });

  const handleAppendTasks = () => {
    if (!completedTasks) return;
    const tasksToAppend = completedTasks.filter(task => selectedTasks.includes(task.id));
    if (tasksToAppend.length === 0) return;
    const tasksSummary = tasksToAppend.map(task => `- ${task.content}${task.loom_items ? ` [*${task.loom_items.name}*]` : ''}${task.notes ? `\n  - *Notes: ${task.notes}*` : ''}`).join('\n');
    const newEntryText = (editableEntry?.entry || '') + `\n\n**Completed Today:**\n${tasksSummary}`;
    setEditableEntry(prev => ({ ...prev, entry: newEntryText }));
    setSelectedTasks([]);
    showSuccess(`${tasksToAppend.length} tasks added to your entry.`);
  };

  if (isLoadingEntry) return <JournalSkeleton />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-full">
      <div className="lg:col-span-2">
        <div className="flex items-center gap-4 mb-6">
          <Book className="h-10 w-10 text-primary flex-shrink-0" />
          <div>
            <h2 className="text-3xl sm:text-4xl font-serif">Journal</h2>
            <p className="text-foreground/70">Reflect daily on your thoughts and progress.</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-2 flex justify-center">
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="w-auto" disabled={(date) => date > new Date() || date < new Date('1900-01-01')} />
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-3">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="font-sans font-medium text-2xl">{selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}</CardTitle>
              <div className="flex items-center gap-2 self-end sm:self-center">
                {!isEditing && entry && <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4" /> Edit</Button>}
                {editableEntry && <div className="w-40"><Select value={editableEntry.mood || 'Neutral'} onValueChange={(value) => setEditableEntry(prev => ({ ...prev, mood: value }))} disabled={!isEditing}><SelectTrigger><SelectValue placeholder="Mood" /></SelectTrigger><SelectContent>{moodOptions.map((mood) => <SelectItem key={mood} value={mood}>{mood}</SelectItem>)}</SelectContent></Select></div>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            {isEditing ? (
              <AutoGrowTextarea value={editableEntry?.entry || ''} onChange={(e) => setEditableEntry(prev => ({ ...prev, entry: e.target.value }))} placeholder="Let your thoughts flow freely..." className="flex-grow text-base w-full p-2 h-full" />
            ) : (
              <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">{entry?.entry ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.entry}</ReactMarkdown> : <p className="text-muted-foreground">No entry for this day. Click 'Edit' to start writing.</p>}</div>
            )}
          </CardContent>
          {isEditing && (
            <CardFooter className="border-t pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <Popover><PopoverTrigger asChild><Button variant="outline"><ClipboardCheck className="mr-2 h-4 w-4" /> Import Tasks</Button></PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h4 className="font-medium leading-none">Completed Today</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {completedTasks && completedTasks.length > 0 ? completedTasks.map(task => <div key={task.id} className="flex items-center space-x-2"><Checkbox id={task.id} checked={selectedTasks.includes(task.id)} onCheckedChange={(checked) => setSelectedTasks(prev => checked ? [...prev, task.id] : prev.filter(id => id !== task.id))} /><label htmlFor={task.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{task.content}</label></div>) : <p className="text-sm text-muted-foreground">No tasks completed on this day.</p>}
                    </div>
                    <Button onClick={handleAppendTasks} className="w-full" disabled={selectedTasks.length === 0}>Add Selected</Button>
                  </div>
                </PopoverContent>
              </Popover>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => { setIsEditing(false); setEditableEntry(entry || null); }}><X className="mr-2 h-4 w-4" /> Cancel</Button>
                <Button onClick={() => editableEntry && saveMutation.mutate(editableEntry)} disabled={saveMutation.isPending}><Save className="mr-2 h-4 w-4" /> Save Entry</Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Journal;