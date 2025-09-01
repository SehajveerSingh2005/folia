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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PlusCircle,
  FolderKanban,
  Archive,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type LedgerItem = {
  id: string;
  content: string;
  is_done: boolean;
};

type LoomItem = {
  id: string;
  name: string;
  type: string | null;
  status: string | null;
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
  const [loomItems, setLoomItems] = useState<LoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', type: '' });
  const [newTaskContent, setNewTaskContent] = useState<{
    [key: string]: string;
  }>({});

  const fetchFlowData = async () => {
    setLoading(true);
    const { data: loomData, error: loomError } = await supabase
      .from('loom_items')
      .select('id, name, type, status')
      .order('created_at', { ascending: false });

    if (loomError) {
      showError('Could not fetch projects.');
      console.error(loomError);
      setLoading(false);
      return;
    }

    const { data: ledgerData, error: ledgerError } = await supabase
      .from('ledger_items')
      .select('id, content, is_done, loom_item_id')
      .order('created_at', { ascending: true });

    if (ledgerError) {
      showError('Could not fetch tasks.');
      console.error(ledgerError);
    }

    const itemsWithTasks = loomData.map((item) => ({
      ...item,
      tasks:
        ledgerData?.filter((task) => task.loom_item_id === item.id) || [],
    }));

    setLoomItems(itemsWithTasks);
    setLoading(false);
  };

  useEffect(() => {
    fetchFlowData();
  }, []);

  const handleAddLoomItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.name.trim() === '') return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('loom_items').insert({
      name: newItem.name,
      type: newItem.type || null,
      user_id: user.id,
    });

    if (error) {
      showError(error.message);
    } else {
      showSuccess('New item created!');
      setNewItem({ name: '', type: '' });
      setIsDialogOpen(false);
      fetchFlowData();
    }
  };

  const handleAddTask = async (e: React.FormEvent, loomId: string) => {
    e.preventDefault();
    const content = newTaskContent[loomId];
    if (!content || content.trim() === '') return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('ledger_items').insert({
      content,
      loom_item_id: loomId,
      user_id: user.id,
      type: 'Task',
    });

    if (error) {
      showError(error.message);
    } else {
      setNewTaskContent({ ...newTaskContent, [loomId]: '' });
      fetchFlowData();
    }
  };

  const handleToggleTask = async (taskId: string, isDone: boolean) => {
    const { error } = await supabase
      .from('ledger_items')
      .update({ is_done: !isDone })
      .eq('id', taskId);

    if (error) {
      showError(error.message);
    } else {
      fetchFlowData();
    }
  };

  const handleUpdateLoomStatus = async (loomId: string, status: string) => {
    const { error } = await supabase
      .from('loom_items')
      .update({ status })
      .eq('id', loomId);
    if (error) showError(error.message);
    else {
      showSuccess(`Item moved to ${status === 'Completed' ? 'Archive' : 'Active'}.`);
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

  const activeItems = loomItems.filter((item) => item.status !== 'Completed');
  const completedItems = loomItems.filter((item) => item.status === 'Completed');

  const renderLoomList = (items: LoomItem[]) => (
    <div className="space-y-6">
      {items.map((item) => (
        <Card key={item.id}>
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="font-sans font-medium">
                {item.name}
              </CardTitle>
              <CardDescription>{item.type}</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {item.status !== 'Completed' ? (
                  <DropdownMenuItem
                    onClick={() => handleUpdateLoomStatus(item.id, 'Completed')}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => handleUpdateLoomStatus(item.id, 'Active')}
                  >
                    <FolderKanban className="mr-2 h-4 w-4" />
                    Move to Active
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={() => handleDeleteLoomItem(item.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {item.tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3">
                  <Checkbox
                    id={task.id}
                    checked={task.is_done}
                    onCheckedChange={() =>
                      handleToggleTask(task.id, task.is_done)
                    }
                  />
                  <label
                    htmlFor={task.id}
                    className={`flex-grow ${
                      task.is_done ? 'line-through text-foreground/50' : ''
                    }`}
                  >
                    {task.content}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
          {item.status !== 'Completed' && (
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
          )}
        </Card>
      ))}
    </div>
  );

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Archive</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="pt-6">
          {loading ? <p>Loading...</p> : renderLoomList(activeItems)}
        </TabsContent>
        <TabsContent value="completed" className="pt-6">
          {loading ? <p>Loading...</p> : renderLoomList(completedItems)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Flow;