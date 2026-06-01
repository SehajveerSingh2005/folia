import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { showError, showSuccess } from '@/utils/toast';
import { Sparkles, Calendar, Loader2, CheckSquare } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface WeeklyReviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess: () => void;
}

const WeeklyReviewDialog = ({ isOpen, onOpenChange, onSaveSuccess }: WeeklyReviewDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  
  // Reflection fields
  const [wentWell, setWentWell] = useState('');
  const [nextWeekFocus, setNextWeekFocus] = useState('');
  const [lessonsNotes, setLessonsNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchWeeklyTasks();
    }
  }, [isOpen]);

  const fetchWeeklyTasks = async () => {
    setTasksLoading(true);
    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const res = await response.json();
      const allTasks = res.data || [];
      
      // Filter tasks completed in the last 7 days
      const sevenDaysAgo = subDays(new Date(), 7);
      const weeklyCompleted = allTasks.filter((t: any) => {
        if (!t.is_done) return false;
        const compDate = t.completed_at ? new Date(t.completed_at) : new Date(t.updated_at);
        return compDate >= sevenDaysAgo;
      });

      setCompletedTasks(weeklyCompleted);
    } catch (err) {
      console.error(err);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      
      // Build entry content markdown
      const tasksSection = completedTasks.length > 0
        ? `### Completed This Week\n` + completedTasks.map(t => `- [x] ${t.content}`).join('\n')
        : `*No tasks marked completed this week.*`;

      const markdown = `## Weekly Review — ${format(new Date(), 'MMMM d, yyyy')} #weekly-review

### What went well / proud of:
${wentWell.trim() || 'No entry.'}

### Focus for next week:
${nextWeekFocus.trim() || 'No entry.'}

### Lessons & General notes:
${lessonsNotes.trim() || 'No entry.'}

---
${tasksSection}
`;

      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry: markdown,
          entry_date: todayStr,
          mood: 'Reflective',
        }),
      });

      if (!response.ok) throw new Error('Failed to save journal entry');

      showSuccess('Weekly review saved to today\'s journal! 📓');
      onSaveSuccess();
      onOpenChange(false);
      // Reset form
      setWentWell('');
      setNextWeekFocus('');
      setLessonsNotes('');
    } catch (err: any) {
      showError(err.message || 'Could not save review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 overflow-hidden outline-none">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <DialogTitle className="font-serif text-xl">Weekly Review & Reflection</DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Review your accomplishments from the last 7 days and set clear targets for the upcoming week.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Completed Tasks section */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="h-3.5 w-3.5" />
              Completed Tasks ({completedTasks.length})
            </h4>
            {tasksLoading ? (
              <div className="h-10 bg-muted/40 animate-pulse rounded-md" />
            ) : completedTasks.length > 0 ? (
              <div className="max-h-36 overflow-y-auto border rounded-lg p-3 bg-muted/10 space-y-1.5">
                {completedTasks.map(t => (
                  <div key={t.id} className="flex items-center gap-2 text-xs">
                    <Checkbox checked disabled className="h-3.5 w-3.5" />
                    <span className="line-through text-muted-foreground">{t.content}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No tasks completed in the last 7 days.</p>
            )}
          </div>

          {/* Went Well textarea */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
              1. What went well / What are you proud of this week?
            </label>
            <Textarea
              value={wentWell}
              onChange={(e) => setWentWell(e.target.value)}
              placeholder="Reflect on wins, personal milestones, projects completed..."
              className="min-h-[100px] text-sm resize-none"
            />
          </div>

          {/* Next Week Focus textarea */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
              2. What is your primary focus for next week?
            </label>
            <Textarea
              value={nextWeekFocus}
              onChange={(e) => setNextWeekFocus(e.target.value)}
              placeholder="What are the main goals or priorities you want to tackle?"
              className="min-h-[100px] text-sm resize-none"
            />
          </div>

          {/* Lessons / Notes textarea */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
              3. Any lessons learned or general notes?
            </label>
            <Textarea
              value={lessonsNotes}
              onChange={(e) => setLessonsNotes(e.target.value)}
              placeholder="What could have gone better? What will you do differently?"
              className="min-h-[80px] text-sm resize-none"
            />
          </div>
        </div>

        <div className="p-4 border-t bg-muted/10 shrink-0 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save Weekly Review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WeeklyReviewDialog;
