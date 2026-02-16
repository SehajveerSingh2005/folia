import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  PlusCircle,
  Archive,
  MoreVertical,
  Trash2,
  FolderKanban,
  Pencil,
  List,
  LayoutGrid,
  Link as LinkIcon,
  ArrowDownUp,
  ListCollapse,
  StickyNote,
} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import ProjectCard from './flow/ProjectCard'; // Import ProjectCard
import ProjectDetailSheet from './flow/ProjectDetailSheet'; // Import ProjectDetailSheet
import EditLoomItemDialog from './flow/EditLoomItemDialog';
import EditTaskDialog from './loom/EditTaskDialog';
import { cn } from '@/lib/utils';
import FlowSkeleton from '../skeletons/FlowSkeleton';

// Types
type LedgerItem = {
  id: string;
  content: string;
  is_done: boolean;
  priority: string | null;
  due_date: string | null;
  loom_item_id: string | null;
  notes: string | null;
};

type LoomItem = {
  id: string;
  name: string;
  type: string | null;
  status: string | null;
  notes: string | null;
  link: string | null;
  start_date: string | null;
  deadline_date: string | null;
  created_at: string;
  tasks: LedgerItem[];
};

type ViewMode = 'list' | 'compact' | 'grid';
type SortMode = 'newest' | 'oldest' | 'deadline' | 'name';

// Data Fetching
const fetchFlowData = async (): Promise<LoomItem[]> => {
  // Fetch projects from API
  const projectsResponse = await fetch('/api/projects');
  if (!projectsResponse.ok) throw new Error('Could not fetch projects.');
  const projectsData = await projectsResponse.json();
  const loomData = projectsData.data || projectsData; // Handle both { data: [] } and [] formats

  // Filter out completed projects
  const activeProjects = loomData.filter((item: LoomItem) => item.status !== 'Completed');

  // Fetch all tasks from API
  const tasksResponse = await fetch('/api/tasks');
  if (!tasksResponse.ok) throw new Error('Could not fetch tasks.');
  const tasksData = await tasksResponse.json();
  const ledgerData = tasksData.data || tasksData; // Handle both { data: [] } and [] formats

  return activeProjects.map((item: LoomItem) => ({
    ...item,
    tasks: ledgerData?.filter((task: LedgerItem) => task.loom_item_id === item.id) || [],
  }));
};

// Component
const Flow = () => {
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LoomItem | null>(null);
  const [isTaskEditDialogOpen, setIsTaskEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<LedgerItem | null>(null);
  const [newTaskContent, setNewTaskContent] = useState<{ [key: string]: string }>({});

  const [viewMode, setViewMode] = useState<ViewMode>(() => (localStorage.getItem('flowViewMode') as ViewMode) || 'list');
  const [sortMode, setSortMode] = useState<SortMode>(() => (localStorage.getItem('flowSortMode') as SortMode) || 'newest');

  useEffect(() => { localStorage.setItem('flowViewMode', viewMode); }, [viewMode]);
  useEffect(() => { localStorage.setItem('flowSortMode', sortMode); }, [sortMode]);

  const { data: activeItems, isLoading, error } = useQuery<LoomItem[]>({
    queryKey: ['flow_data'],
    queryFn: fetchFlowData,
  });

  const sortedItems = useMemo(() => {
    if (!activeItems) return [];
    const itemsToSort = [...activeItems];
    itemsToSort.sort((a, b) => {
      switch (sortMode) {
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'deadline':
          if (!a.deadline_date) return 1;
          if (!b.deadline_date) return -1;
          return new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime();
        case 'name': return a.name.localeCompare(b.name);
        case 'newest': default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return itemsToSort;
  }, [activeItems, sortMode]);

  const mutationOptions = {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flow_data'] }),
    onError: (err: Error) => showError(err.message),
  };

  const addTaskMutation = useMutation({
    mutationFn: async ({ loomId, content }: { loomId: string, content: string }) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, loom_item_id: loomId, type: 'Task' }),
      });
      if (!response.ok) throw new Error('Failed to create task');
    },
    ...mutationOptions,
    onSuccess: (_, vars) => {
      setNewTaskContent({ ...newTaskContent, [vars.loomId]: '' });
      queryClient.invalidateQueries({ queryKey: ['flow_data'] });
    }
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, isDone }: { taskId: string, isDone: boolean }) => {
      const newStatus = !isDone;
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          is_done: newStatus,
          completed_at: newStatus ? new Date().toISOString() : null
        }),
      });
      if (!response.ok) throw new Error('Failed to update task');
    },
    ...mutationOptions
  });

  const archiveLoomItemMutation = useMutation({
    mutationFn: async (loomId: string) => {
      const response = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: loomId, status: 'Completed' }),
      });
      if (!response.ok) throw new Error('Failed to archive project');
    },
    ...mutationOptions,
    onSuccess: () => {
      showSuccess('Item moved to Archive.');
      queryClient.invalidateQueries({ queryKey: ['flow_data'] });
      queryClient.invalidateQueries({ queryKey: ['archived_items'] });
    }
  });

  const deleteLoomItemMutation = useMutation({
    mutationFn: async (loomId: string) => {
      const response = await fetch(`/api/projects?id=${loomId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete project');
    },
    ...mutationOptions,
    onSuccess: () => {
      showSuccess('Item deleted.');
      queryClient.invalidateQueries({ queryKey: ['flow_data'] });
    }
  });

  if (error) showError(error.message);

  const openEditDialog = (item: LoomItem) => { setSelectedItem(item); setIsEditDialogOpen(true); };
  const openTaskEditDialog = (task: LedgerItem) => { setSelectedTask(task); setIsTaskEditDialogOpen(true); };

  const viewIcons: Record<ViewMode, React.ElementType> = { list: List, compact: ListCollapse, grid: LayoutGrid };
  const CurrentViewIcon = viewIcons[viewMode];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <FolderKanban className="h-10 w-10 text-primary flex-shrink-0" />
          <div>
            <h2 className="text-3xl sm:text-4xl font-serif">Flow</h2>
            <p className="text-foreground/70">Manage active projects, courses, and tasks.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline"><ArrowDownUp className="mr-2 h-4 w-4" />Sort</Button></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                <DropdownMenuRadioItem value="newest">Newest First</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="oldest">Oldest First</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="deadline">By Deadline</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="name">By Name (A-Z)</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline"><CurrentViewIcon className="mr-2 h-4 w-4" />View</Button></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <DropdownMenuRadioItem value="list">List</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="compact">Compact List</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="grid">Grid</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isLoading ? <FlowSkeleton /> : sortedItems.length === 0 ? (
        <div className="text-center py-12"><p className="text-lg text-foreground/70">Your flow is clear!</p><p className="text-sm text-foreground/50">Create a new item to get started.</p></div>
      ) : (
        <div className={cn(
          viewMode === 'list' ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
        )}>
          {sortedItems.map((item) => {
            // Calculate progress
            const totalTasks = item.tasks.length;
            const completedTasks = item.tasks.filter(t => t.is_done);
            const completedCount = item.tasks.filter(t => t.is_done).length;
            const progress = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

            // Map tasks to ProjectCard format
            const cardTasks = item.tasks.map(t => ({
              id: t.id,
              content: t.content,
              completed: t.is_done,
              due_date: t.due_date ? new Date(t.due_date) : undefined
            }));

            return (
              <ProjectCard
                key={item.id}
                project={{
                  id: item.id,
                  name: item.name,
                  status: (item.status as any) || 'Active', // Cast or ensure type
                  progress: progress,
                  due_date: item.deadline_date || undefined,
                  tasks: cardTasks
                }}
                onClick={() => { setSelectedItem(item); setIsEditDialogOpen(true); }} // Reusing state for now, but better name would be setIsDetailOpen
                onEdit={() => { setSelectedItem(item); setIsEditDialogOpen(true); }}
                onDelete={() => deleteLoomItemMutation.mutate(item.id)}
              />
            );
          })}
        </div>
      )}

      {/* Detail Sheet replaces old Edit Dialog for "viewing" */}
      {selectedItem && (
        <ProjectDetailSheet
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          project={selectedItem}
          onProjectUpdated={() => queryClient.invalidateQueries({ queryKey: ['flow_data'] })}
        />
      )}
    </div>
  );
};

export default Flow;