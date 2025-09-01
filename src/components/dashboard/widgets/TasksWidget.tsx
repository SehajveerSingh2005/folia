import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { showError } from '@/utils/toast';

type LedgerItem = {
  id: string;
  content: string;
  is_done: boolean;
};

const TasksWidget = () => {
  const [tasks, setTasks] = useState<LedgerItem[]>([]);
  const [newTaskContent, setNewTaskContent] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('ledger_items')
      .select('id, content, is_done')
      .is('loom_item_id', null)
      .eq('is_done', false)
      .limit(10)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
    } else if (data) {
      setTasks(data);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const checkOverflow = () => {
      const current = scrollContainerRef.current;
      if (current) {
        setIsOverflowing(current.scrollHeight > current.clientHeight);
      }
    };
    const timeoutId = setTimeout(checkOverflow, 100);
    return () => clearTimeout(timeoutId);
  }, [tasks]);


  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskContent.trim() === '') return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('ledger_items')
      .insert({ content: newTaskContent, user_id: user.id, type: 'Task' });

    if (error) {
      showError(error.message);
    } else {
      setNewTaskContent('');
      fetchTasks();
    }
  };

  const handleToggleTask = async (taskId: string, isDone: boolean) => {
    const { error } = await supabase
      .from('ledger_items')
      .update({ is_done: !isDone })
      .eq('id', taskId);

    if (error) {
      showError(error.message);
    } else {
      fetchTasks();
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-sans font-medium">Inbox</CardTitle>
        <CardDescription>
          Quick tasks from your Flow.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col overflow-hidden">
        <div className="relative flex-grow overflow-hidden">
          <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto pr-2 space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.is_done}
                  onCheckedChange={() => handleToggleTask(task.id, task.is_done)}
                />
                <label htmlFor={`task-${task.id}`} className="text-sm">
                  {task.content}
                </label>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-sm text-muted-foreground">Inbox is clear!</p>}
          </div>
          {isOverflowing && (
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent pointer-events-none" />
          )}
        </div>
        <form onSubmit={handleAddTask} className="flex-shrink-0 flex gap-2 mt-4 pt-2 border-t">
          <Input
            placeholder="Add a task..."
            value={newTaskContent}
            onChange={(e) => setNewTaskContent(e.target.value)}
            className="h-8"
          />
          <Button type="submit" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TasksWidget;