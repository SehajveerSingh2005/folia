import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, ClipboardList, Calendar, AlertCircle, Flag, Pencil, StickyNote } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import EditTaskDialog from './loom/EditTaskDialog';
import AddTaskDialog from './loom/AddTaskDialog';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type LedgerItem = {
  id: string;
  content: string;
  is_done: boolean;
  loom_item_id: string | null;
  completed_at: string | null;
  due_date: string | null;
  priority: string | null;
  notes: string | null;
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<LedgerItem | null>(null);
  const outletContext = useOutletContext<{ setLoomRefetch: (fn: (() => void) | null) => void }>();
  const setLoomRefetch = outletContext?.setLoomRefetch;

  const fetchTasks = useCallback(async () => {
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

    const visibleTasks = tasks.filter(task => 
      !task.is_done || 
      (task.is_done && task.completed_at && isToday(parseISO(task.completed_at)))
    );
    
    const todayString = format(new Date(), 'yyyy-MM-dd');

    setDueTodayTasks(visibleTasks.filter(task => task.due_date && format(parseISO(task.due_date), 'yyyy-MM-dd') === todayString));
    setInboxTasks(visibleTasks.filter((task) => !task.loom_item_id && (!task.due_date || format(parseISO(task.due_date), 'yyyy-MM-dd') !== todayString)));

    if (projects) {
      const groupedByProject = projects.map((project) => ({
        projectId: project.id,
        projectName: project.name,
        tasks: visibleTasks.filter((task) => task.loom_item_id === project.id),
      })).filter(group => group.tasks.length > 0);
      setProjectTasks(groupedByProject);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (setLoomRefetch) {
      setLoomRefetch(() => fetchTasks);
    }
    return () => {
      if (setLoomRefetch) {
        setLoomRefetch(null);
      }
    };
  }, [fetchTasks, setLoomRefetch]);

  const handleToggleTask = async (taskId: string, isDone: boolean) => {
    const newStatus = !isDone;
    const completed_at = newStatus ? new Date().toISOString() : null;

    const updateTaskInState = (task: LedgerItem) => ({
      ...task,
      is_done: newStatus,
      completed_at,
    });

    const allTaskLists = {
      dueToday: setDueTodayTasks,
      inbox: setInboxTasks,
    };

    for (const listSetter of Object.values(allTaskLists)) {
      listSetter((prev: LedgerItem[]) => prev.map(t => t.id === taskId ? updateTaskInState(t) : t));
    }
    setProjectTasks(prev => prev.map(proj => ({
      ...proj,
      tasks: proj.tasks.map(t => t.id === taskId ? updateTaskInState(t) : t)
    })));

    const { error } = await supabase
      .from('ledger_items')
      .update({ is_done: newStatus, completed_at })
      .eq('id', taskId);

    if (error) {
      showError(error.message);
      fetchTasks(); 
    }
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
              onCheckedChange={() => handleToggleTask(task.id, task.is_done)}
              onClick={(e) => e.stopPropagation()}
            />
            <label
              htmlFor={task.id}
              className={cn("flex-grow", task.is_done && "line-through text-muted-foreground")}
            >
              {task.content}
            </label>
            <div className="flex items-center gap-2 ml-auto">
              {task.notes && <StickyNote className="h-3 w-3 text-muted-foreground" />}
              {getPriorityBadge(task.priority)}
              <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                {task.due_date && (
                  <div className={cn("flex items-center text-xs", isOverdue ? "text-red-500" : "text-muted-foreground")}>
                    {isOverdue && <AlertCircle className="h-3 w-3 mr-1" />}
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(parseISO(task.due_date), 'MMM d')}
                  </div>
                )}
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-8 flex-shrink-0 pr-4">
        <div className="flex items-center gap-4">
          <ClipboardList className="h-10 w-10 text-primary flex-shrink-0" />
          <div>
            <h2 className="text-3xl sm:text-4xl font-serif">Loom</h2>
            <p className="text-foreground/70">
              A unified view of all your tasks.
            </p>
          </div>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <div className="flex-grow overflow-y-auto pr-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-sans font-medium">Due Today</CardTitle>
            </CardHeader>
            <CardContent>
              {dueTodayTasks.length > 0 ? renderTaskList(dueTodayTasks) : <p className="text-sm text-muted-foreground">Nothing due today. Enjoy your day!</p>}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans font-medium">Inbox</CardTitle>
                  <CardDescription>Tasks not assigned to a project.</CardDescription>
                </CardHeader>
                <CardContent>
                  {inboxTasks.length > 0 ? renderTaskList(inboxTasks) : <p className="text-sm text-muted-foreground">Inbox is empty.</p>}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans font-medium">Projects</CardTitle>
                  <CardDescription>Tasks organized by project.</CardDescription>
                </CardHeader>
                <CardContent>
                  {projectTasks.length > 0 ? (
                    <Accordion type="multiple" className="w-full">
                      {projectTasks.map((project) => (
                        <AccordionItem value={project.projectId} key={project.projectId}>
                          <AccordionTrigger>
                            <div className="flex justify-between w-full pr-4">
                              <span>{project.projectName}</span>
                              <Badge variant="secondary">{project.tasks.length}</Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            {project.tasks.length > 0 ? renderTaskList(project.tasks) : <p className="text-sm text-muted-foreground px-4 pb-2">No tasks for this project.</p>}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <p className="text-sm text-muted-foreground">No projects with active tasks.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      <AddTaskDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onTaskAdded={fetchTasks}
      />
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