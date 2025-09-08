import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Telescope,
  PlusCircle,
  Trash2,
  Link as LinkIcon,
  MoreVertical,
  FolderKanban,
  Plus,
} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// --- TYPES ---
type LoomItemStub = {
  id: string;
  name: string;
};

type HorizonItem = {
  id: string;
  title: string;
  type: string | null;
  priority: string | null;
  link: string | null;
  parent_id: string | null;
  user_id: string;
  created_at: string;
};

type HorizonItemNode = HorizonItem & {
  children: HorizonItemNode[];
  linked_projects: LoomItemStub[];
};

const itemTypes = [
  'Skill',
  'Field',
  'Book',
  'Course',
  'Hobby',
  'Project Idea',
  'Misc',
];
const priorities = ['High', 'Medium', 'Low'];

// --- HORIZON COMPONENT ---
const Horizon = () => {
  const [items, setItems] = useState<HorizonItemNode[]>([]);
  const [availableProjects, setAvailableProjects] = useState<LoomItemStub[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [itemToLink, setItemToLink] = useState<HorizonItemNode | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // New item state
  const [newItem, setNewItem] = useState({
    title: '',
    type: '',
    priority: '',
    link: '',
    parent_id: null as string | null,
  });

  const fetchItems = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: horizonItems, error: horizonError } = await supabase
      .from('horizon_items')
      .select('*');
    const { data: loomItems, error: loomError } = await supabase
      .from('loom_items')
      .select('id, name')
      .neq('status', 'Completed');
    const { data: links, error: linksError } = await supabase
      .from('horizon_flow_links')
      .select('horizon_item_id, loom_item_id');

    if (horizonError || loomError || linksError) {
      showError('Could not fetch horizon data.');
      setLoading(false);
      return;
    }

    const itemsById = new Map(
      horizonItems.map((item) => [
        item.id,
        { ...item, children: [], linked_projects: [] },
      ]),
    );

    links.forEach((link) => {
      const horizonItem = itemsById.get(link.horizon_item_id);
      const loomItem = loomItems.find((l) => l.id === link.loom_item_id);
      if (horizonItem && loomItem) {
        horizonItem.linked_projects.push({
          id: loomItem.id,
          name: loomItem.name,
        });
      }
    });

    const tree: HorizonItemNode[] = [];
    itemsById.forEach((item) => {
      if (item.parent_id && itemsById.has(item.parent_id)) {
        itemsById.get(item.parent_id)!.children.push(item);
      } else {
        tree.push(item);
      }
    });

    setItems(tree);
    setAvailableProjects(loomItems);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openAddDialog = (parentId: string | null = null) => {
    setNewItem({
      title: '',
      type: '',
      priority: '',
      link: '',
      parent_id: parentId,
    });
    setIsAddDialogOpen(true);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.title.trim() === '') return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('horizon_items').insert({
      title: newItem.title,
      type: newItem.type || null,
      priority: newItem.priority || null,
      link: newItem.link || null,
      parent_id: newItem.parent_id,
      user_id: user.id,
    });

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Item added to Horizon!');
      setIsAddDialogOpen(false);
      fetchItems();
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const { error } = await supabase
      .from('horizon_items')
      .delete()
      .eq('id', itemId);
    if (error) {
      showError(error.message);
    } else {
      showSuccess('Item removed.');
      fetchItems();
    }
  };

  const openLinkDialog = (item: HorizonItemNode) => {
    setItemToLink(item);
    setSelectedProjectId('');
    setIsLinkDialogOpen(true);
  };

  const handleLinkProject = async () => {
    if (!itemToLink || !selectedProjectId) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('horizon_flow_links').insert({
      user_id: user.id,
      horizon_item_id: itemToLink.id,
      loom_item_id: selectedProjectId,
    });

    if (error) {
      showError(error.code === '23505' ? 'This project is already linked.' : error.message);
    } else {
      showSuccess('Project linked successfully.');
      setIsLinkDialogOpen(false);
      fetchItems();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Telescope className="h-10 w-10 text-primary flex-shrink-0" />
          <div>
            <h2 className="text-3xl sm:text-4xl font-serif">Horizon</h2>
            <p className="text-foreground/70">
              Set your sights on the future.
            </p>
          </div>
        </div>
        <Button onClick={() => openAddDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Goal
        </Button>
      </div>

      {loading ? (
        <p>Loading items...</p>
      ) : items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <HorizonGoal
              key={item.id}
              item={item}
              level={0}
              onAddSubGoal={openAddDialog}
              onDelete={handleDeleteItem}
              onLinkProject={openLinkDialog}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-foreground/70">Your horizon is clear.</p>
          <p className="text-sm text-foreground/50">
            Add a long-term goal to get started.
          </p>
        </div>
      )}

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newItem.parent_id ? 'Add Sub-Goal' : 'Add New Goal'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4">
            <Input
              placeholder="Title"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              required
            />
            <Select onValueChange={(value) => setNewItem({ ...newItem, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {itemTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setNewItem({ ...newItem, priority: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a priority" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Link (optional)"
              value={newItem.link}
              onChange={(e) => setNewItem({ ...newItem, link: e.target.value })}
            />
            <Button type="submit" className="w-full">
              Save Item
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Link Project Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Project to "{itemToLink?.title}"</DialogTitle>
            <CardDescription>
              Connect an active project from your Flow to this goal.
            </CardDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project..." />
              </SelectTrigger>
              <SelectContent>
                {availableProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleLinkProject} disabled={!selectedProjectId}>
              Link Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- HORIZON GOAL COMPONENT ---
interface HorizonGoalProps {
  item: HorizonItemNode;
  level: number;
  onAddSubGoal: (parentId: string) => void;
  onDelete: (itemId: string) => void;
  onLinkProject: (item: HorizonItemNode) => void;
}

const HorizonGoal = ({
  item,
  level,
  onAddSubGoal,
  onDelete,
  onLinkProject,
}: HorizonGoalProps) => {
  return (
    <div className={cn(level > 0 && 'pl-6')}>
      <Card className="overflow-hidden">
        <div className="p-4 flex justify-between items-center">
          <div className="flex-grow">
            <p className="font-medium">{item.title}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              {item.type && <Badge variant="secondary">{item.type}</Badge>}
              {item.priority && <Badge>{item.priority}</Badge>}
              {item.link && (
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="xs" className="h-6 px-2">
                    <LinkIcon className="mr-1 h-3 w-3" /> Link
                  </Button>
                </a>
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
              <DropdownMenuItem onClick={() => onAddSubGoal(item.id)}>
                <Plus className="mr-2 h-4 w-4" /> Add Sub-Goal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onLinkProject(item)}>
                <LinkIcon className="mr-2 h-4 w-4" /> Link Project
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-500" onClick={() => onDelete(item.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {(item.linked_projects.length > 0 || item.children.length > 0) && (
          <div className="bg-secondary/30 px-4 py-2 border-t">
            {item.linked_projects.map((proj) => (
              <div key={proj.id} className="flex items-center gap-2 text-sm py-1">
                <FolderKanban className="h-4 w-4 text-primary" />
                <span>{proj.name}</span>
              </div>
            ))}
            {item.children.map((child) => (
              <HorizonGoal
                key={child.id}
                item={child}
                level={level + 1}
                onAddSubGoal={onAddSubGoal}
                onDelete={onDelete}
                onLinkProject={onLinkProject}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Horizon;