import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Book, ClipboardCheck, Check, Loader2, Sparkles, X } from 'lucide-react';
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
import { format, isToday } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AutoGrowTextarea } from '@/components/ui/auto-grow-textarea';
import JournalSkeleton from '../skeletons/JournalSkeleton';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WinsBoard from './journal/WinsBoard';
import WeeklyReviewDialog from './journal/WeeklyReviewDialog';

// Types
type ChronicleEntry = { id?: string; entry_date: string; entry: string; mood: string; };
type CompletedTask = { id: string; content: string; notes: string | null; loom_items: { name: string } | null; };
const moodOptions = ['Excellent', 'Good', 'Neutral', 'Low', 'Bad'];

// Data Fetching
const fetchEntry = async (date: string): Promise<Partial<ChronicleEntry>> => {
  try {
    const response = await fetch(`/api/journal?date=${date}`);
    if (!response.ok) {
      if (response.status === 404) return { entry: '', mood: 'Neutral', entry_date: date };
      throw new Error('Failed to fetch journal entry');
    }
    const data = await response.json();
    return data.entry || { entry: '', mood: 'Neutral', entry_date: date };
  } catch {
    return { entry: '', mood: 'Neutral', entry_date: date };
  }
};

const fetchCompletedTasks = async (date: string): Promise<CompletedTask[]> => {
  try {
    const response = await fetch(`/api/journal?date=${date}`);
    if (!response.ok) throw new Error('Failed to fetch completed tasks');
    const data = await response.json();
    return data.completedTasks || [];
  } catch {
    return [];
  }
};

// ─── Save Status Indicator ──────────────────────────────────────────────────
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const SaveIndicator = ({ status }: { status: SaveStatus }) => {
  if (status === 'idle') return null;
  return (
    <div className={cn(
      'flex items-center gap-1.5 text-xs transition-opacity',
      status === 'saved' ? 'text-emerald-600 dark:text-emerald-400' :
      status === 'saving' ? 'text-muted-foreground' :
      status === 'error' ? 'text-red-500' : ''
    )}>
      {status === 'saving' && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === 'saved' && <Check className="h-3 w-3" />}
      <span>{status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Error saving'}</span>
    </div>
  );
};

// Component
const Journal = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [editableEntry, setEditableEntry] = useState<Partial<ChronicleEntry> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [showNudge, setShowNudge] = useState(false);

  useEffect(() => {
    const today = new Date();
    const isSunday = today.getDay() === 0;
    if (isSunday) {
      const currentWeekKey = `weekly_review_nudge_dismissed_${format(today, 'yyyy-w')}`;
      const isDismissed = localStorage.getItem(currentWeekKey) === 'true';
      if (!isDismissed) {
        setShowNudge(true);
      }
    }
  }, []);

  const handleDismissNudge = () => {
    const today = new Date();
    const currentWeekKey = `weekly_review_nudge_dismissed_${format(today, 'yyyy-w')}`;
    localStorage.setItem(currentWeekKey, 'true');
    setShowNudge(false);
  };

  const isSelectedDateToday = selectedDate ? isToday(selectedDate) : false;
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

  // When entry loads or date changes: sync local state and determine edit mode
  useEffect(() => {
    if (entry) {
      setEditableEntry(entry);
      // Auto-open in edit mode for today's entry
      setIsEditing(isSelectedDateToday || !entry.id);
      setSaveStatus('idle');
    }
  }, [entry, isSelectedDateToday]);

  if (entryError) showError('Could not fetch journal entry.');
  if (tasksError) showError('Could not fetch completed tasks.');

  const saveMutation = useMutation({
    mutationFn: async (entryData: Partial<ChronicleEntry>) => {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...entryData, entry_date: formattedDate }),
      });
      if (!response.ok) throw new Error('Failed to save journal entry');
    },
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      setSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['journal_entry', formattedDate] });
      // Reset status to idle after 2s
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: () => {
      setSaveStatus('error');
      showError('Could not save entry.');
    },
  });

  // Debounced auto-save: fires 1.5s after last keystroke
  const triggerAutoSave = useCallback((data: Partial<ChronicleEntry>) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setSaveStatus('saving');
    autoSaveTimerRef.current = setTimeout(() => {
      saveMutation.mutate(data);
    }, 1500);
  }, [saveMutation]);

  const handleEntryChange = (text: string) => {
    const updated = { ...editableEntry, entry: text };
    setEditableEntry(updated);
    if (isEditing) triggerAutoSave(updated);
  };

  const handleMoodChange = (mood: string) => {
    const updated = { ...editableEntry, mood };
    setEditableEntry(updated);
    if (isEditing) triggerAutoSave(updated);
  };

  const handleAppendTasks = () => {
    if (!completedTasks) return;
    const tasksToAppend = completedTasks.filter(task => selectedTasks.includes(task.id));
    if (tasksToAppend.length === 0) return;
    const tasksSummary = tasksToAppend.map(task =>
      `- ${task.content}${task.loom_items ? ` [*${task.loom_items.name}*]` : ''}${task.notes ? `\n  - *Notes: ${task.notes}*` : ''}`
    ).join('\n');
    const newEntryText = (editableEntry?.entry || '') + `\n\n**Completed Today:**\n${tasksSummary}`;
    const updated = { ...editableEntry, entry: newEntryText };
    setEditableEntry(updated);
    setSelectedTasks([]);
    showSuccess(`${tasksToAppend.length} tasks added to your entry.`);
    if (isEditing) triggerAutoSave(updated);
  };

  if (isLoadingEntry) return <JournalSkeleton />;

  return (
    <div className="space-y-0">
      {/* Space header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Book className="h-10 w-10 text-primary flex-shrink-0" />
          <div>
            <h2 className="text-3xl sm:text-4xl font-serif">Journal</h2>
            <p className="text-foreground/70">Reflect daily. Track your wins.</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsReviewOpen(true)}
          className="self-start sm:self-center gap-1.5"
        >
          <Sparkles className="h-4 w-4 text-amber-500" />
          Weekly Review
        </Button>
      </div>

      {/* Sunday Nudge Banner */}
      {showNudge && (
        <div className="flex items-center justify-between p-4 mb-6 rounded-2xl border bg-amber-500/10 text-amber-950 dark:text-amber-100 border-amber-500/20 backdrop-blur">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-medium">Ready for your Weekly Review?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Reflect on your achievements and set your priorities for the upcoming week.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setIsReviewOpen(true)} className="h-8 text-xs font-medium">
              Start Review
            </Button>
            <Button size="icon" variant="ghost" onClick={handleDismissNudge} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="journal" className="w-full">
        <TabsList className="mb-6 h-auto p-0 bg-transparent border-b rounded-none w-full justify-start space-x-6">
          <TabsTrigger
            value="journal"
            className="rounded-none border-b-2 border-transparent px-2 py-2 text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Journal
          </TabsTrigger>
          <TabsTrigger
            value="wins"
            className="rounded-none border-b-2 border-transparent px-2 py-2 text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Wins 🏆
          </TabsTrigger>
        </TabsList>

        <TabsContent value="journal" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-full">
        <Card>
          <CardContent className="p-2 flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setSaveStatus('idle');
              }}
              className="w-auto"
              disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
            />
          </CardContent>
        </Card>
      </div>

      {/* ── Right: Entry ── */}
      <div className="lg:col-span-3">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <CardTitle className="font-sans font-medium text-2xl">
                  {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
                </CardTitle>
                {isSelectedDateToday && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Today</span>
                )}
              </div>
              <div className="flex items-center gap-3 self-end sm:self-center">
                <SaveIndicator status={saveStatus} />
                {/* Mood selector — always visible when editing */}
                {editableEntry && (
                  <div className="w-36">
                    <Select
                      value={editableEntry.mood || 'Neutral'}
                      onValueChange={handleMoodChange}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="h-8 text-xs">
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
                {/* Past dates: show Edit button to switch to edit mode */}
                {!isEditing && !isSelectedDateToday && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-grow">
            {isEditing ? (
              <AutoGrowTextarea
                value={editableEntry?.entry || ''}
                onChange={(e) => handleEntryChange(e.target.value)}
                placeholder={isSelectedDateToday
                  ? "How's your day going? Write anything…"
                  : "Edit this entry…"}
                className="flex-grow text-base w-full p-2 h-full"
                autoFocus={isSelectedDateToday}
              />
            ) : (
              <div
                className="prose prose-sm sm:prose-base max-w-none dark:prose-invert cursor-text min-h-[200px]"
                onClick={() => setIsEditing(true)}
                title="Click to edit"
              >
                {entry?.entry
                  ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.entry}</ReactMarkdown>
                  : <p className="text-muted-foreground">No entry for this day. Click to start writing.</p>
                }
              </div>
            )}
          </CardContent>

          {/* Footer: import tasks (only visible in edit mode) */}
          {isEditing && (
            <CardFooter className="border-t pt-4 flex justify-between items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Import Tasks
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h4 className="font-medium leading-none">Completed Today</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {completedTasks && completedTasks.length > 0
                        ? completedTasks.map(task => (
                          <div key={task.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={task.id}
                              checked={selectedTasks.includes(task.id)}
                              onCheckedChange={(checked) =>
                                setSelectedTasks(prev =>
                                  checked ? [...prev, task.id] : prev.filter(id => id !== task.id)
                                )
                              }
                            />
                            <label htmlFor={task.id} className="text-sm font-medium leading-none">
                              {task.content}
                            </label>
                          </div>
                        ))
                        : <p className="text-sm text-muted-foreground">No tasks completed on this day.</p>
                      }
                    </div>
                    <Button onClick={handleAppendTasks} className="w-full" disabled={selectedTasks.length === 0}>
                      Add Selected
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Past date editing: show explicit Save button */}
              {!isSelectedDateToday && (
                <Button
                  size="sm"
                  onClick={() => editableEntry && saveMutation.mutate(editableEntry)}
                  disabled={saveMutation.isPending}
                >
                  Save Entry
                </Button>
              )}
            </CardFooter>
          )}
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="wins" className="mt-0">
          <WinsBoard />
        </TabsContent>
      </Tabs>

      <WeeklyReviewDialog
        isOpen={isReviewOpen}
        onOpenChange={setIsReviewOpen}
        onSaveSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['journal_entry', formattedDate] });
        }}
      />
    </div>
  );
};

export default Journal;