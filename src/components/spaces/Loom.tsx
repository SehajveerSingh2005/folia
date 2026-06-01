import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ClipboardList, Calendar, AlertCircle, Flag, Pencil, StickyNote, FolderKanban, Plus } from 'lucide-react';
import { showError } from '@/utils/toast';
import { format, isToday, isPast, parseISO, startOfToday, isFuture } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import EditTaskDialog from './loom/EditTaskDialog';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LoomSkeleton from '../skeletons/LoomSkeleton';

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

const fetchTasks = async () => {
  const { data: dbTasks, error } = await supabase
    .from('ledger_items')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);

  let merged = dbTasks || [];

  const token = localStorage.getItem('folia_github_token');
  if (token) {
    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${token}` },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        const login = userData.login;

        const issuesRes = await fetch(`https://api.github.com/search/issues?q=is:issue+state:open+assignee:${login}`, {
          headers: { Authorization: `token ${token}` },
        });
        if (issuesRes.ok) {
          const issuesData = await issuesRes.json();
          const githubTasks = (issuesData.items || []).map((issue: any) => {
            const repoName = issue.repository_url.split('/repos/')[1] || 'repo';
            return {
              id: `github-${issue.number}`,
              content: issue.title,
              is_done: false,
              loom_item_id: null,
              completed_at: null,
              due_date: null,
              priority: 'Medium',
              notes: `GitHub Issue #${issue.number}`,
              isGitHub: true,
              githubUrl: issue.html_url,
              githubNumber: issue.number,
              githubRepo: repoName,
            };
          });
          merged = [...merged, ...githubTasks];
        }
      }
    } catch (ghErr) {
      console.error('Error fetching GitHub issues for Loom:', ghErr);
    }
  }

  return merged.filter(task =>
    !task.is_done ||
    (task.is_done && task.completed_at && isToday(parseISO(task.completed_at)))
  );
};

const fetchProjects = async () => {
  const { data, error } = await supabase
    .from('loom_items')
    .select('id, name')
    .neq('status', 'Completed');
  if (error) throw new Error(error.message);
  return data;
};

const Loom = () => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<LedgerItem | null>(null);
  const [quickCapture, setQuickCapture] = useState('');
  const [quickPriority, setQuickPriority] = useState<string | null>(null);
  const quickInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: allTasks, isLoading: isLoadingTasks, error: tasksError } = useQuery<LedgerItem[]>({
    queryKey: ['loom_tasks'],
    queryFn: fetchTasks,
  });

  const { data: projects, isLoading: isLoadingProjects, error: projectsError } = useQuery<Project[]>({
    queryKey: ['loom_projects'],
    queryFn: fetchProjects,
  });

  useEffect(() => {
    if (tasksError) showError('Could not fetch tasks.');
    if (projectsError) showError('Could not fetch projects.');
  }, [tasksError, projectsError]);

  const createTaskMutation = useMutation({
    mutationFn: async ({ content, priority }: { content: string; priority: string | null }) => {
      const { error } = await supabase.from('ledger_items').insert({
        content,
        priority,
        is_done: false,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loom_tasks'] });
      setQuickCapture('');
      setQuickPriority(null);
      quickInputRef.current?.focus();
    },
    onError: (err: Error) => showError(err.message),
  });

  const handleQuickCapture = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && quickCapture.trim()) {
      createTaskMutation.mutate({ content: quickCapture.trim(), priority: quickPriority });
    }
  };

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ task }: { task: LedgerItem }) => {
      const newStatus = !task.is_done;
      if (task.id.startsWith('github-') || (task as any).isGitHub) {
        const token = localStorage.getItem('folia_github_token');
        if (!token) throw new Error("GitHub token not found.");
        const githubRepo = (task as any).githubRepo;
        const githubNumber = (task as any).githubNumber;
        if (!githubRepo || !githubNumber) throw new Error("Invalid GitHub issue metadata.");
        
        const [owner, repo] = githubRepo.split('/');
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${githubNumber}`, {
          method: 'PATCH',
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ state: 'closed' }),
        });
        if (!res.ok) throw new Error(`GitHub API error: ${res.statusText}`);
      } else {
        const completed_at = newStatus ? new Date().toISOString() : null;
        const { error } = await supabase
          .from('ledger_items')
          .update({ is_done: newStatus, completed_at })
          .eq('id', task.id);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loom_tasks'] });
    },
    onError: (error) => {
      showError(error.message);
    },
  });

  const projectsMap = useMemo(() =>
    new Map((projects || []).map(p => [p.id, p.name])),
    [projects]);

  const taskGroups = useMemo(() => {
    const groups: { [key: string]: LedgerItem[] } = {
      overdue: [],
      today: [],
      upcoming: [],
      inbox: [],
    };
    if (!allTasks) return groups;

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

  const openEditDialog = (task: LedgerItem) => {
    setSelectedTask(task);
    setIsEditDialogOpen(true);
  };

  const getPriorityBadge = (priority: string | null) => {
    if (!priority) return null;
    const variant = priority === 'High' ? 'destructive' : priority === 'Medium' ? 'default' : 'secondary';
    return <Badge variant={variant} className="hidden sm:inline-flex"><Flag className="h-3 w-3 mr-1" /> {priority}</Badge>;
  };

  const renderTaskItem = (task: LedgerItem, index: number) => {
    const isOverdue = !task.is_done && task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date));
    const projectName = task.loom_item_id ? projectsMap.get(task.loom_item_id) : null;

    return (
      <div
        key={task.id}
        className="flex items-center gap-3 group p-2 -mx-2 rounded-md hover:bg-secondary/50 cursor-pointer animate-in slide-in-from-top-2 fade-in duration-300 fill-mode-both"
        style={{ animationDelay: `${index * 50}ms` }}
        onClick={() => openEditDialog(task)}
      >
        <Checkbox
          id={task.id}
          checked={task.is_done}
          onCheckedChange={() => toggleTaskMutation.mutate({ task })}
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
            {tasks.map((task, index) => renderTaskItem(task, index))}
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
            <h2 className="text-3xl sm:text-4xl font-serif">Tasks</h2>
            <p className="text-foreground/70">
              A unified view of all your tasks.
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick Capture Bar ── */}
      <div className="mb-8 rounded-xl border border-border/60 bg-card px-4 py-3 flex items-center gap-3 shadow-sm focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] transition-all">
        <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          ref={quickInputRef}
          value={quickCapture}
          onChange={(e) => setQuickCapture(e.target.value)}
          onKeyDown={handleQuickCapture}
          placeholder="Capture a task… press Enter to save"
          className="border-none shadow-none focus-visible:ring-0 bg-transparent p-0 h-auto text-base placeholder:text-muted-foreground/50"
        />
        <div className="flex gap-1.5 shrink-0">
          {(['High', 'Med', 'Low'] as const).map((p) => {
            const priority = p === 'Med' ? 'Medium' : p;
            const isActive = quickPriority === priority;
            return (
              <button
                key={p}
                onClick={() => setQuickPriority(isActive ? null : priority)}
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full border transition-all',
                  isActive
                    ? p === 'High'
                      ? 'bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400'
                      : p === 'Med'
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                        : 'bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-400'
                    : 'border-border/40 text-muted-foreground hover:border-border'
                )}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {isLoadingTasks || isLoadingProjects ? (
        <LoomSkeleton />
      ) : (
        <div className="space-y-6">
          {renderTaskGroup('Overdue', taskGroups.overdue, true)}
          {renderTaskGroup('Due Today', taskGroups.today)}
          {renderTaskGroup('Upcoming', taskGroups.upcoming)}
          {renderTaskGroup('Inbox', taskGroups.inbox, true)}
          {allTasks && allTasks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-foreground/70">All clear!</p>
              <p className="text-sm text-foreground/50">
                Type above to capture your first task.
              </p>
            </div>
          )}
        </div>
      )}


      {selectedTask && (
        <EditTaskDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          task={selectedTask}
          onTaskUpdated={() => queryClient.invalidateQueries({ queryKey: ['loom_tasks'] })}
        />
      )}
    </div>
  );
};

export default Loom;