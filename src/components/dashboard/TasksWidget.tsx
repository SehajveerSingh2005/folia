import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { CheckSquare } from 'lucide-react';

export type Task = {
  id: string;
  content: string;
  is_completed: boolean;
};

interface TasksWidgetProps {
  tasks: Task[];
  onTaskUpdate: () => void;
}

const TasksWidget = ({ tasks, onTaskUpdate }: TasksWidgetProps) => {
  const incompleteTasks = tasks.filter((task) => !task.is_completed);

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: !isCompleted })
      .eq('id', taskId);

    if (error) {
      showError(error.message);
    } else {
      onTaskUpdate();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <CheckSquare className="h-6 w-6 text-primary" />
          <CardTitle className="font-sans text-xl font-medium">
            Inbox
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 pt-4">
          {incompleteTasks.length > 0 ? (
            incompleteTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center gap-3">
                <Checkbox
                  id={`widget-task-${task.id}`}
                  checked={task.is_completed}
                  onCheckedChange={() =>
                    handleToggleTask(task.id, task.is_completed)
                  }
                />
                <label htmlFor={`widget-task-${task.id}`} className="flex-grow">
                  {task.content}
                </label>
              </div>
            ))
          ) : (
            <p className="text-foreground/70">
              All tasks completed. Great job!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TasksWidget;