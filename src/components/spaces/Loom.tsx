import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { PlusCircle, ClipboardList, Calendar, AlertCircle, Flag } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import EditTaskDialog from './loom/EditTaskDialog';
import { cn } from '@/lib/utils';

type LedgerItem = {
  id: string;
  content: string;
  is_done: boolean;
  loom_item_id: string | null;
  completed_at: string | null;
  due_date: string | null;
  priority: string | null;
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
  const [dueTodayTasks, setDueTodayTasks] = useState<LedgerItem[]>([]);
  const [projectTasks, setProjectTasks] = useState<ProjectTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<LedgerItem | null>(null);

  const fetchTasks = async () => {
    setLoading(true);

    const { data: tasks, error: tasksError } = await supabase
      .from('ledger_items')
      .select('*')
      .order('created_at', { ascending: true });

    if (tasksError) {
      showError('Could not fetch tasks.');
      setLoading(false);
      return;
    }

    const { data: projects, error: projectsError } = await supabase
      .from('loom_items')
      .select('id, name')
      .neq('status', 'Completed');

    if (projectsError) showError('Could not fetch projects.');

    const incompleteTasks = tasks.filter(task => !task.is_done);
    
    const today = new Date();
    const todayString = format(today, 'yyyy-MM-dd');

    setDueTodayTasks(incompleteTasks.filter(task => task.due_date === todayString));
    setInboxTasks(incompleteTasks.filter((task) => !task.loom_item_id && task.due_date !== todayString));

    if (projects) {
      const groupedByProject = projects.map((project) => ({
        projectId: project.id,
        projectName: project.name,
        tasks: incompleteTasks.filter((task) => task.loom_item_id === project.id),
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
    const newStatus = !isDone;
    const { error } = await supabase
      .from('ledger_items')
      .update({
        is_done: newStatus,
        completed_at: newStatus ? new Date().toISOString() : null,
      })
      .eq('id', taskId);
    if (error) showError(error.message);
    else fetchTasks();
  };

  const openEditDialog = (task: LedgerItem) => {
    setSelectedTask(task);
    setIsEditDialogOpen(true);
  };

  const getPriorityBadge = (priority: string | null) => {
    if (!priority) return null;
    const variant = priority === 'High' ? 'destructive' : priority === 'Medium' ? 'default' : 'secondary';
    return <Badge variant={variant}><Flag className="h-3 w-3 mr-1" /> {priority}</Badge>;
  };

  const renderTaskList = (tasks: LedgerItem[]) => (
    <div className="space-y-1">
      {tasks.map((task) => {
        const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date));
        return (
          <div
            key={task.id}
            className="flex items-center gap-3 group p-2 rounded-md hover:bg-secondary/50 cursor-pointer"
            onClick={() => openEditDialog(task)}
          >
            <Checkbox
              id={task.id}
              checked={task.is_done}
              onCheckedChange={(e) => {
                e.stopPropagation();
                handleToggleTask(task.id, task.is_done);
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="flex-grow">{task.content}</span>
            <div className="flex items-center gap-2">
              {getPriorityBadge(task.priority)}
              {task.due_date && (
                <div className={cn("flex items-center text-xs", isOverdue ? "text-red-500" : "text-muted-foreground")}>
                  {isOverdue && <AlertCircle className="h-3 w-3 mr-1" />}
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(parseISO(task.due_date), 'MMM d')}
                </div>
              )}
            </div>
          </div>
        );
      })}
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
              <CardTitle className="font-sans font-medium">Due Today</CardTitle>
            </CardHeader>
            <CardContent>
              {dueTodayTasks.length > 0 ? renderTaskList(dueTodayTasks) : <p className="text-sm text-muted-foreground">Nothing due today. Enjoy your day!</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-sans font-medium">Inbox</CardTitle>
              <CardDescription>Tasks that are not assigned to a project.</CardDescription>
            </CardHeader>
            <CardContent>
              {inboxTasks.length > 0 ? renderTaskList(inboxTasks) : <p className="text-sm text-muted-foreground">Inbox is empty.</p>}
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
                {project.tasks.length > 0 ? renderTaskList(project.tasks) : <p className="text-sm text-muted-foreground">No tasks for this project.</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {selectedTask && (
        <EditTaskDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          task={selectedTask}
          onTaskUpdated={fetchTasks}
        />
      )}
    </div>
  );
};

export default Loom;