import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { PlusCircle, ClipboardList } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

type LedgerItem = {
  id: string;
  content: string;
  is_done: boolean;
  loom_item_id: string | null;
};

type LoomItem = {
  id: string;
  name: string;
};

type ProjectTasks = {
  projectId: string;
  projectName: string;
  tasks: LedgerItem[];
};

const Loom = () => {
  const [inboxTasks, setInboxTasks] = useState<LedgerItem[]>([]);
  const [projectTasks, setProjectTasks] = useState<ProjectTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskContent, setNewTaskContent] = useState('');

  const fetchTasks = async () => {
    setLoading(true);

    const { data: tasks, error: tasksError } = await supabase
      .from('ledger_items')
      .select('*')
      .eq('is_done', false)
      .order('created_at', { ascending: true });

    if (tasksError) {
      showError('Could not fetch tasks.');
      console.error(tasksError);
      setLoading(false);
      return;
    }

    const { data: projects, error: projectsError } = await supabase
      .from('loom_items')
      .select('id, name')
      .neq('status', 'Completed');

    if (projectsError) {
      showError('Could not fetch projects.');
    }

    setInboxTasks(tasks.filter((task) => !task.loom_item_id));

    if (projects) {
      const groupedByProject = projects.map((project) => ({
        projectId: project.id,
        projectName: project.name,
        tasks: tasks.filter((task) => task.loom_item_id === project.id),
      })).filter(group => group.tasks.length > 0);
      setProjectTasks(groupedByProject);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskContent.trim() === '') return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('ledger_items').insert({
      content: newTaskContent,
      user_id: user.id,
      type: 'Task',
    });

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Task added to Inbox.');
      setNewTaskContent('');
      fetchTasks();
    }
  };

  const handleToggleTask = async (taskId: string, isDone: boolean) => {
    const { error } = await supabase
      .from('ledger_items')
      .update({ is_done: !isDone })
      .eq('id', taskId);
    if (error) showError(error.message);
    else fetchTasks();
  };

  const renderTaskList = (tasks: LedgerItem[]) => (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center gap-3">
          <Checkbox
            id={task.id}
            checked={task.is_done}
            onCheckedChange={() => handleToggleTask(task.id, task.is_done)}
          />
          <label htmlFor={task.id} className="flex-grow">
            {task.content}
          </label>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <ClipboardList className="h-10 w-10 text-primary" />
        <div>
          <h2 className="text-4xl font-serif">Loom</h2>
          <p className="text-foreground/70">
            A unified view of all your tasks.
          </p>
        </div>
      </div>

      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-sans font-medium">Inbox</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTaskList(inboxTasks)}
              <form onSubmit={handleAddTask} className="flex gap-2 mt-4">
                <Input
                  placeholder="Add a task to your inbox..."
                  value={newTaskContent}
                  onChange={(e) => setNewTaskContent(e.target.value)}
                />
                <Button type="submit" variant="ghost" size="icon">
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {projectTasks.map((project) => (
            <Card key={project.projectId}>
              <CardHeader>
                <CardTitle className="font-sans font-medium">{project.projectName}</CardTitle>
              </CardHeader>
              <CardContent>
                {renderTaskList(project.tasks)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Loom;