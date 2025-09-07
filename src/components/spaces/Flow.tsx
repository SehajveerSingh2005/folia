import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import EditLoomItemDialog from './flow/EditLoomItemDialog';
import EditTaskDialog from './loom/EditTaskDialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

type LedgerItem = {
  id: string;
  content: string;
  is_done: boolean;
  priority: string | null;
  due_date: string | null;
  loom_item_id: string | null;
};

type LoomItem = {
  id: string;
  name: string;
  type: string | null;
  status: string | null;
  notes: string | null;
  start_date: string | null;
  deadline_date: string | null;
  created_at: string;
  tasks: LedgerItem[];
};

const loomItemTypes = [
  'Project',
  'Book',
  'Course',
  'Writing',
  'Open Source',
  'Habit',
  'Misc',
];

const Flow = () => {
  const [activeItems, setActiveItems] = useState<LoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LoomItem | null>(null);
  const [isTaskEditDialogOpen, setIsTaskEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<LedgerItem | null>(null);
  const [newItem, setNewItem] = useState({ name: '', type: '' });
  const [newTaskContent, setNewTaskContent] = useState<{
    [key: string]: string;
  }>({});
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const fetchFlowData = async () => {
    setLoading(true);
    const { data: loomData, error: loomError } = await supabase
      .from('loom_items')
      .select('*')
      .neq('status', 'Completed')
      .order('created_at', { ascending: false });

    if (loomError) {
      showError('Could not fetch projects.');
      console.error(loomError);
      setLoading(false);
      return;
    }

    const { data: ledgerData, error: ledgerError } = await supabase
      .from('ledger_items')
      .select('*')
      .order('created_at', { ascending: true });

    if (ledgerError) showError('Could not fetch tasks.');

    const itemsWithTasks = loomData.map((item) => ({
      ...item,
      tasks:
        ledgerData?.filter((task) => task.loom_item_id === item.id) || [],
    }));

    setActiveItems(itemsWithTasks);
    setLoading(false);
  };

  useEffect(() => {
    fetchFlowData();
  }, []);

  const handleAddLoomItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.name.trim() === '') return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('loom_items').insert({
      name: newItem.name,
      type: newItem.type || null,
      user_id: user.id,
      start_date: new Date().toISOString().split('T')[0],
    });

    if (error) showError(error.message);
    else {
      showSuccess('New item created!');
      setNewItem({ name: '', type: '' });
      setIsAddDialogOpen(false);
      fetchFlowData();
    }
  };

  const handleAddTask = async (e: React.FormEvent, loomId: string) => {
    e.preventDefault();
    const content = newTaskContent[loomId];
    if (!content || content.trim() === '') return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('ledger_items').insert({
      content,
      loom_item_id: loomId,
      user_id: user.id,
      type: 'Task',
    });

    if (error) showError(error.message);
    else {
      setNewTaskContent({ ...newTaskContent, [loomId]: '' });
      fetchFlowData();
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
    else fetchFlowData();
  };

  const handleArchiveLoomItem = async (loomId: string) => {
    const { error } = await supabase
      .from('loom_items')
      .update({ status: 'Completed' })
      .eq('id', loomId);
    if (error) showError(error.message);
    else {
      showSuccess('Item moved to Archive.');
      fetchFlowData();
    }
  };

  const handleDeleteLoomItem = async (loomId: string) => {
    const { error } = await supabase.from('loom_items').delete().eq('id', loomId);
    if (error) showError(error.message);
    else {
      showSuccess('Item deleted.');
      fetchFlowData();
    }
  };

  const openEditDialog = (item: LoomItem) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const openTaskEditDialog = (task: LedgerItem) => {
    setSelectedTask(task);
    setIsTaskEditDialogOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <FolderKanban className="h-10 w-10 text-primary" />
          <div>
            <h2 className="text-4xl font-serif">Flow</h2>
            <p className="text-foreground/70">
              Manage active projects, courses, and tasks.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value) setViewMode(value as 'list' | 'grid');
            }}
          >
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Item</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddLoomItem} className="space-y-4">
                <Input
                  placeholder="Name (e.g., Launch new website)"
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem({ ...newItem, name: e.target.value })
                  }
                  required
                />
                <Select
                  onValueChange={(value) =>
                    setNewItem({ ...newItem, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {loomItemTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" className="w-full">
                  Create
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : activeItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-foreground/70">Your flow is clear!</p>
          <p className="text-sm text-foreground/50">
            Create a new item to get started.
          </p>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === 'list'
              ? 'space-y-6'
              : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6',
          )}
        >
          {activeItems.map((item) => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-sans font-medium">
                      {item.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span>{item.type}</span>
                      {item.status && (
                        <>
                          •<Badge variant="outline">{item.status}</Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => openEditDialog(item)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleArchiveLoomItem(item.id)}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-500"
                        onClick={() => handleDeleteLoomItem(item.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="text-xs text-muted-foreground flex gap-4 pt-2">
                  <span>
                    Started:{' '}
                    {item.start_date
                      ? format(new Date(item.start_date), 'MMM d, yyyy')
                      : 'Not set'}
                  </span>
                  <span>
                    Deadline:{' '}
                    {item.deadline_date
                      ? format(new Date(item.deadline_date), 'MMM d, yyyy')
                      : 'Not set'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="notes">
                    <AccordionTrigger>Notes</AccordionTrigger>
                    <AccordionContent className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                      {item.notes || 'No notes yet.'}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="tasks">
                    <AccordionTrigger>
                      Tasks ({item.tasks.filter((t) => t.is_done).length}/
                      {item.tasks.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {item.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-3 group p-1 rounded-md hover:bg-secondary/50"
                          >
                            <Checkbox
                              id={`flow-task-${task.id}`}
                              checked={task.is_done}
                              onCheckedChange={() =>
                                handleToggleTask(task.id, task.is_done)
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                            <label
                              htmlFor={`flow-task-${task.id}`}
                              className={`flex-grow cursor-pointer ${
                                task.is_done
                                  ? 'line-through text-foreground/50'
                                  : ''
                              }`}
                              onClick={() => openTaskEditDialog(task)}
                            >
                              {task.content}
                            </label>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                openTaskEditDialog(task);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
              <CardFooter>
                <form
                  onSubmit={(e) => handleAddTask(e, item.id)}
                  className="flex gap-2 w-full"
                >
                  <Input
                    placeholder="Add a task..."
                    value={newTaskContent[item.id] || ''}
                    onChange={(e) =>
                      setNewTaskContent({
                        ...newTaskContent,
                        [item.id]: e.target.value,
                      })
                    }
                  />
                  <Button type="submit" variant="ghost" size="icon">
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      {selectedItem && (
        <EditLoomItemDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          item={selectedItem}
          onItemUpdated={fetchFlowData}
        />
      )}
      {selectedTask && (
        <EditTaskDialog
          isOpen={isTaskEditDialogOpen}
          onOpenChange={setIsTaskEditDialogOpen}
          task={selectedTask}
          onTaskUpdated={fetchFlowData}
        />
      )}
    </div>
  );
};

export default Flow;