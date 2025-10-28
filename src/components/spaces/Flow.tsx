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
  const { data: loomData, error: loomError } = await supabase
    .from('loom_items')
    .select('*')
    .neq('status', 'Completed')
    .order('created_at', { ascending: false });

  if (loomError) throw new Error('Could not fetch projects.');

  const { data: ledgerData, error: ledgerError } = await supabase
    .from('ledger_items')
    .select('*')
    .order('created_at', { ascending: true });

  if (ledgerError) throw new Error('Could not fetch tasks.');

  return loomData.map((item) => ({
    ...item,
    tasks: ledgerData?.filter((task) => task.loom_item_id === item.id) || [],
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");
      const { error } = await supabase.from('ledger_items').insert({ content, loom_item_id: loomId, user_id: user.id, type: 'Task' });
      if (error) throw error;
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
      const { error } = await supabase.from('ledger_items').update({
        is_done: newStatus, completed_at: newStatus ? new Date().toISOString() : null
      }).eq('id', taskId);
      if (error) throw error;
    },
    ...mutationOptions
  });

  const archiveLoomItemMutation = useMutation({
    mutationFn: (loomId: string) => supabase.from('loom_items').update({ status: 'Completed' }).eq('id', loomId),
    ...mutationOptions,
    onSuccess: () => {
      showSuccess('Item moved to Archive.');
      queryClient.invalidateQueries({ queryKey: ['flow_data'] });
      queryClient.invalidateQueries({ queryKey: ['archived_items'] });
    }
  });

  const deleteLoomItemMutation = useMutation({
    mutationFn: (loomId: string) => supabase.from('loom_items').delete().eq('id', loomId),
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
        <div className={cn(viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4')}>
          {sortedItems.map((item) =>
            viewMode === 'compact' ? (
              <Card key={item.id} className="p-3">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-3 flex-grow overflow-hidden">
                    <div className="flex-grow overflow-hidden">
                      <p className="font-medium truncate">{item.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{item.type}</span>
                        {item.status && <>•<Badge variant="outline">{item.status}</Badge></>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-8 w-8"><LinkIcon className="h-4 w-4" /></Button></a>}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => openEditDialog(item)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => archiveLoomItemMutation.mutate(item.id)}><Archive className="mr-2 h-4 w-4" />Archive</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" onClick={() => deleteLoomItemMutation.mutate(item.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ) : (
              <Card key={item.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-sans font-medium">{item.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span>{item.type}</span>
                        {item.status && <>•<Badge variant="outline">{item.status}</Badge></>}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => openEditDialog(item)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => archiveLoomItemMutation.mutate(item.id)}><Archive className="mr-2 h-4 w-4" />Archive</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" onClick={() => deleteLoomItemMutation.mutate(item.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 pt-2">
                    <span>Started: {item.start_date ? format(new Date(item.start_date), 'MMM d, yyyy') : 'Not set'}</span>
                    <span>Deadline: {item.deadline_date ? format(new Date(item.deadline_date), 'MMM d, yyyy') : 'Not set'}</span>
                    {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}><Button variant="outline" size="xs" className="h-6 px-2"><LinkIcon className="mr-1 h-3 w-3" />Link</Button></a>}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="notes"><AccordionTrigger>Notes</AccordionTrigger><AccordionContent className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">{item.notes || 'No notes yet.'}</AccordionContent></AccordionItem>
                    <AccordionItem value="tasks">
                      <AccordionTrigger>Tasks ({item.tasks.filter((t) => t.is_done).length}/{item.tasks.length})</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {item.tasks.map((task) => (
                            <div key={task.id} className="flex items-center gap-3 group p-1 rounded-md hover:bg-secondary/50">
                              <Checkbox id={`flow-task-${task.id}`} checked={task.is_done} onCheckedChange={() => toggleTaskMutation.mutate({ taskId: task.id, isDone: task.is_done })} onClick={(e) => e.stopPropagation()} />
                              <label htmlFor={`flow-task-${task.id}`} className={`flex-grow cursor-pointer ${task.is_done ? 'line-through text-foreground/50' : ''}`} onClick={() => openTaskEditDialog(task)}>{task.content}</label>
                              <div className="flex items-center gap-2 ml-auto">
                                {task.notes && <StickyNote className="h-3 w-3 text-muted-foreground" />}
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); openTaskEditDialog(task); }}><Pencil className="h-3 w-3" /></Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
                <CardFooter>
                  <form onSubmit={(e) => { e.preventDefault(); addTaskMutation.mutate({ loomId: item.id, content: newTaskContent[item.id] || '' }); }} className="flex gap-2 w-full">
                    <Input placeholder="Add a task..." value={newTaskContent[item.id] || ''} onChange={(e) => setNewTaskContent({ ...newTaskContent, [item.id]: e.target.value })} />
                    <Button type="submit" variant="ghost" size="icon" disabled={addTaskMutation.isPending}><PlusCircle className="h-5 w-5" /></Button>
                  </form>
                </CardFooter>
              </Card>
            )
          )}
        </div>
      )}
      {selectedItem && <EditLoomItemDialog isOpen={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} item={selectedItem} onItemUpdated={() => queryClient.invalidateQueries({ queryKey: ['flow_data'] })} />}
      {selectedTask && <EditTaskDialog isOpen={isTaskEditDialogOpen} onOpenChange={setIsTaskEditDialogOpen} task={selectedTask} onTaskUpdated={() => queryClient.invalidateQueries({ queryKey: ['flow_data'] })} />}
    </div>
  );
};

export default Flow;