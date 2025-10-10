import { useEffect, useState, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, ClipboardList, Calendar, AlertCircle, Flag, Pencil, StickyNote, FolderKanban } from 'lucide-react';
import { showError } from '@/utils/toast';
import { format, isToday, isPast, parseISO, startOfToday, isFuture } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import EditTaskDialog from './loom/EditTaskDialog';
import AddTaskDialog from './loom/AddTaskDialog';
import { cn } from '@/lib/utils';

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

type Project = {
  id: string;
  name: string;
};

const Loom = () => {
  const [allTasks, setAllTasks] = useState<LedgerItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<LedgerItem | null>(null);
  const outletContext = useOutletContext<{ setLoomRefetch: (fn: (() => void) | null) => void }>();
  const setLoomRefetch = outletContext?.setLoomRefetch;

  const fetchLoomData = useCallback(async () => {
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

    const { data: projectData, error: projectsError } = await supabase
      .from('loom_items')
      .select('id, name')
      .neq('status', 'Completed');

    if (projectsError) showError('Could not fetch projects.');

    setAllTasks(tasks.filter(task => 
      !task.is_done || 
      (task.is_done && task.completed_at && isToday(parseISO(task.completed_at)))
    ));
    setProjects(projectData || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLoomData();
  }, [fetchLoomData]);

  useEffect(() => {
    if (setLoomRefetch) {
      setLoomRefetch(() => fetchLoomData);
    }
    return () => {
      if (setLoomRefetch) {
        setLoomRefetch(null);
      }
    };
  }, [fetchLoomData, setLoomRefetch]);

  const projectsMap = useMemo(() => 
    new Map(projects.map(p => [p.id, p.name])), 
  [projects]);

  const taskGroups = useMemo(() => {
    const groups: { [key: string]: LedgerItem[] } = {
      overdue: [],
      today: [],
      upcoming: [],
      inbox: [],
    };

    const today = startOfToday();
    allTasks.forEach(task => {
      if (task.due_date) {
        const dueDate = parseISO(task.due_date);
        if (isPast(dueDate) && !isToday(dueDate)) groups.overdue.push(task);
        else if (isToday(dueDate)) groups.today.push(task);
        else if (isFuture(dueDate)) groups.upcoming.push(task);
      } else {
        groups.inbox.push(task);
      }
    });

    groups.upcoming.sort((a, b) => parseISO(a.due_date!).getTime() - parseISO(b.due_date!).getTime());

    return groups;
  }, [allTasks]);

  const handleToggleTask = async (taskId: string, isDone: boolean) => {
    const newStatus = !isDone;
    const completed_at = newStatus ? new Date().toISOString() : null;

    const originalTasks = [...allTasks];
    const updatedTasks = originalTasks.map(task => 
        task.id === taskId 
            ? { ...task, is_done: newStatus, completed_at } 
            : task
    );
    setAllTasks(updatedTasks);

    const { error } = await supabase
      .from('ledger_items')
      .update({
        is_done: newStatus,
        completed_at: completed_at,
      })
      .eq('id', taskId);

    if (error) {
      showError(error.message);
      setAllTasks(originalTasks);
    }
  };

  const openEditDialog = (task: LedgerItem) => {
    setSelectedTask(task);
    setIsEditDialogOpen(true);
  };

  const getPriorityBadge = (priority: string | null) => {
    if (!priority) return null;
    const variant = priority === 'High' ? 'destructive' : priority === 'Medium' ? 'default' : 'secondary';
    return <Badge variant={variant} className="hidden sm:inline-flex"><Flag className="h-3 w-3 mr-1" /> {priority}</Badge>;
  };

  const renderTaskItem = (task: LedgerItem) => {
    const isOverdue = !task.is_done && task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date));
    const projectName = task.loom_item_id ? projectsMap.get(task.loom_item_id) : null;

    return (
      <div
        key={task.id}
        className="flex items-center gap-3 group p-2 -mx-2 rounded-md hover:bg-secondary/50 cursor-pointer"
        onClick={() => openEditDialog(task)}
      >
        <Checkbox
          id={task.id}
          checked={task.is_done}
          onCheckedChange={() => handleToggleTask(task.id, task.is_done)}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-grow flex flex-col">
          <label
            htmlFor={task.id}
            className={cn("flex-grow", task.is_done && "line-through text-muted-foreground")}
          >
            {task.content}
          </label>
          {projectName && (
            <Badge variant="secondary" className="w-fit mt-1">
              <FolderKanban className="h-3 w-3 mr-1" />
              {projectName}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {task.notes && <StickyNote className="h-4 w-4 text-muted-foreground" />}
          {getPriorityBadge(task.priority)}
          {task.due_date && !task.is_done && (
            <div className={cn("hidden sm:flex items-center text-xs", isOverdue ? "text-red-500" : "text-muted-foreground")}>
              {isOverdue && <AlertCircle className="h-3 w-3 mr-1" />}
              <Calendar className="h-3 w-3 mr-1" />
              {format(parseISO(task.due_date), 'MMM d')}
            </div>
          )}
          <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    );
  };

  const renderTaskGroup = (title: string, tasks: LedgerItem[], isScrollable = false) => {
    if (tasks.length === 0) return null;
    return (
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="font-sans font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden relative">
          <div className={cn("space-y-1", isScrollable && "max-h-80 overflow-y-auto pr-2")}>
            {tasks.map(renderTaskItem)}
          </div>
          {isScrollable && tasks.length > 5 && (
             <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent pointer-events-none" />
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <ClipboardList className="h-10 w-10 text-primary flex-shrink-0" />
          <div>
            <h2 className="text-3xl sm:text-4xl font-serif">Loom</h2>
            <p className="text-foreground/70">
              A unified view of all your tasks.
            </p>
          </div>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <div className="space-y-6">
          {renderTaskGroup('Overdue', taskGroups.overdue, true)}
          {renderTaskGroup('Due Today', taskGroups.today)}
          {renderTaskGroup('Upcoming', taskGroups.upcoming)}
          {renderTaskGroup('Inbox', taskGroups.inbox, true)}
          {allTasks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-foreground/70">All clear!</p>
              <p className="text-sm text-foreground/50">
                Create a new task to get started.
              </p>
            </div>
          )}
        </div>
      )}

      <AddTaskDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onTaskAdded={fetchLoomData}
      />
      {selectedTask && (
        <EditTaskDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          task={selectedTask}
          onTaskUpdated={fetchLoomData}
        />
      )}
    </div>
  );
};

export default Loom;