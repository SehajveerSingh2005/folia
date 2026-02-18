import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { showError } from '@/utils/toast';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

type Task = {
  id: string;
  content: string;
  is_done: boolean;
};

const DueTodayWidget = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const fetchData = async () => {
    const todayString = format(new Date(), 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('ledger_items')
      .select('id, content, is_done')
      .eq('due_date', todayString)
      .eq('is_done', false)
      .limit(10)
      .order('created_at', { ascending: true });

    if (error) console.error('Error fetching tasks:', error);
    else if (data) setTasks(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const checkOverflow = () => {
      const current = scrollContainerRef.current;
      if (current) setIsOverflowing(current.scrollHeight > current.clientHeight);
    };
    const timeoutId = setTimeout(checkOverflow, 100);
    return () => clearTimeout(timeoutId);
  }, [tasks]);

  const handleToggleTask = async (taskId: string, isDone: boolean) => {
    const newStatus = !isDone;
    setTasks(tasks.filter(t => t.id !== taskId));

    const { error } = await supabase
      .from('ledger_items')
      .update({
        is_done: newStatus,
        completed_at: newStatus ? new Date().toISOString() : null,
      })
      .eq('id', taskId);

    if (error) {
      showError(error.message);
      fetchData();
    }
  };

  return (
    <Card className="w-full h-full flex flex-col border-none shadow-none">
      <CardHeader>
        <CardTitle className="font-sans font-medium text-base sm:text-lg">Due Today</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Your tasks for today.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col overflow-hidden">
        <div className="relative flex-grow overflow-hidden">
          <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto pr-2 space-y-2">
            {isLoading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded opacity-50" />
                  <Skeleton className="h-4 w-3/4 opacity-50" />
                </div>
              ))
            ) : (
              tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 animate-in slide-in-from-top-2 fade-in duration-300 fill-mode-both"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.is_done}
                    onCheckedChange={() => handleToggleTask(task.id, task.is_done)}
                  />
                  <label
                    htmlFor={`task-${task.id}`}
                    className="text-xs sm:text-sm flex-grow"
                  >
                    {task.content}
                  </label>
                </div>
              ))
            )}
            {tasks.length === 0 && <p className="text-sm text-muted-foreground">All clear for today!</p>}
          </div>
          {isOverflowing && (
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent pointer-events-none" />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DueTodayWidget;