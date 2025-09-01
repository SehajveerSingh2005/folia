import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { showError } from '@/utils/toast';

type Task = {
  id: string;
  content: string;
  is_completed: boolean;
};

const TasksWidget = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskContent, setNewTaskContent] = useState('');

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, content, is_completed')
      .is('project_id', null)
      .eq('is_completed', false)
      .limit(5)
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

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskContent.trim() === '') return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('tasks')
      .insert({ content: newTaskContent, user_id: user.id });

    if (error) {
      showError(error.message);
    } else {
      setNewTaskContent('');
      fetchTasks();
    }
  };

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: !isCompleted })
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
        <div className="flex-grow space-y-2 overflow-y-auto pr-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3">
              <Checkbox
                id={`task-${task.id}`}
                checked={task.is_completed}
                onCheckedChange={() => handleToggleTask(task.id, task.is_completed)}
              />
              <label htmlFor={`task-${task.id}`} className="text-sm">
                {task.content}
              </label>
            </div>
          ))}
           {tasks.length === 0 && <p className="text-sm text-muted-foreground">Inbox is clear!</p>}
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