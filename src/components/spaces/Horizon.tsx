import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  List,
  ListCollapse,
  GitBranch,
} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import HorizonTreeView from './horizon/HorizonTreeView';
import HorizonSkeleton from '../skeletons/HorizonSkeleton';

// --- TYPES ---
type LoomItemStub = { id: string; name: string };
type HorizonItem = { id: string; title: string; type: string | null; priority: string | null; link: string | null; parent_id: string | null; user_id: string; created_at: string; status: string | null; target_date: string | null; };
type HorizonItemNode = HorizonItem & { children: HorizonItemNode[]; linked_projects: LoomItemStub[] };
type HorizonData = { tree: HorizonItemNode[]; availableProjects: LoomItemStub[] };
const goalStatuses = ['Not Started', 'In Progress', 'Done'] as const;
type GoalStatus = typeof goalStatuses[number];
const statusColors: Record<GoalStatus, string> = {
  'Not Started': 'bg-zinc-400',
  'In Progress': 'bg-amber-400',
  'Done':        'bg-emerald-500',
};
const priorities = ['High', 'Medium', 'Low'];
type ViewMode = 'list' | 'tree' | 'compact';

// --- DATA FETCHING ---
const fetchHorizonData = async (): Promise<HorizonData> => {
  const response = await fetch('/api/horizon');
  if (!response.ok) throw new Error('Failed to fetch horizon data');
  const { items: horizonItems, links, projects: loomItems } = await response.json();

  const itemsById = new Map<string, HorizonItemNode>(horizonItems.map((item: HorizonItem) => [item.id, { ...item, children: [], linked_projects: [] }]));
  links.forEach((link: any) => {
    const horizonItem = itemsById.get(link.horizon_item_id);
    const loomItem = loomItems.find((l: LoomItemStub) => l.id === link.loom_item_id);
    if (horizonItem && loomItem) horizonItem.linked_projects.push({ id: loomItem.id, name: loomItem.name });
  });

  const tree: HorizonItemNode[] = [];
  itemsById.forEach((item) => {
    if (item.parent_id && itemsById.has(item.parent_id)) itemsById.get(item.parent_id)!.children.push(item);
    else tree.push(item);
  });

  return { tree, availableProjects: loomItems };
};

// --- HORIZON COMPONENT ---
const Horizon = () => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>(() => (localStorage.getItem('horizonViewMode') as ViewMode) || 'list');
  useEffect(() => { localStorage.setItem('horizonViewMode', viewMode); }, [viewMode]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [itemToLink, setItemToLink] = useState<HorizonItemNode | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [newItem, setNewItem] = useState({ title: '', tag: '', priority: '', link: '', target_date: '', parent_id: null as string | null });

  const { data, isLoading, error } = useQuery<HorizonData>({ queryKey: ['horizon_data'], queryFn: fetchHorizonData });
  const items = data?.tree || [];
  const availableProjects = data?.availableProjects || [];

  const mutationOptions = {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['horizon_data'] }),
    onError: (err: Error) => showError(err.message),
  };

  const addItemMutation = useMutation({
    mutationFn: async (itemData: typeof newItem) => {
      const response = await fetch('/api/horizon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...itemData, type: itemData.tag || null }),
      });
      if (!response.ok) throw new Error('Failed to add horizon item');
    },
    ...mutationOptions,
    onSuccess: () => {
      showSuccess('Goal added!');
      setIsAddDialogOpen(false);
      setNewItem({ title: '', tag: '', priority: '', link: '', target_date: '', parent_id: null });
      queryClient.invalidateQueries({ queryKey: ['horizon_data'] });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/horizon?id=${itemId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete horizon item');
    },
    ...mutationOptions,
    onSuccess: () => {
      showSuccess('Item removed.');
      queryClient.invalidateQueries({ queryKey: ['horizon_data'] });
    }
  });

  const linkProjectMutation = useMutation({
    mutationFn: async ({ horizon_item_id, loom_item_id }: { horizon_item_id: string, loom_item_id: string }) => {
      const response = await fetch('/api/horizon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'link', horizon_item_id, loom_item_id }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to link project');
      }
    },
    ...mutationOptions,
    onSuccess: () => {
      showSuccess('Project linked successfully.');
      setIsLinkDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['horizon_data'] });
    },
    onError: (err: any) => showError(err.message.includes('duplicate') || err.message.includes('already') ? 'This project is already linked.' : err.message),
  });

  if (error) showError('Could not fetch horizon data.');

  const openAddDialog = (parentId: string | null = null) => {
    setNewItem({ title: '', tag: '', priority: '', link: '', target_date: '', parent_id: parentId });
    setIsAddDialogOpen(true);
  };
  const openLinkDialog = (item: HorizonItemNode) => { setItemToLink(item); setSelectedProjectId(''); setIsLinkDialogOpen(true); };

  const flattenTree = (nodes: HorizonItemNode[]): HorizonItem[] => {
    const flatList: HorizonItem[] = [];
    const traverse = (node: HorizonItemNode) => { const { children, ...rest } = node; flatList.push(rest); children.forEach(traverse); };
    nodes.forEach(traverse);
    return flatList;
  };
  const flattenedItems = flattenTree(items);

  const viewIcons: Record<ViewMode, React.ElementType> = { list: List, tree: GitBranch, compact: ListCollapse };
  const CurrentViewIcon = viewIcons[viewMode];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Telescope className="h-10 w-10 text-primary flex-shrink-0" />
          <div>
            <h2 className="text-3xl sm:text-4xl font-serif">Goals</h2>
            <p className="text-foreground/70">Set your sights on the future.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline"><CurrentViewIcon className="mr-2 h-4 w-4" />View</Button></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <DropdownMenuRadioItem value="list">Smart List</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="tree">Tree View</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="compact">Compact List</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => openAddDialog()}><PlusCircle className="mr-2 h-4 w-4" />Add Goal</Button>
        </div>
      </div>

      {isLoading ? <HorizonSkeleton /> : items.length === 0 ? (
        <div className="text-center py-12"><p className="text-lg text-foreground/70">Your horizon is clear.</p><p className="text-sm text-foreground/50">Add a long-term goal to get started.</p></div>
      ) : (
        <div>
          {viewMode === 'list' && <div className="space-y-2">{items.map((item) => <HorizonSmartListItem key={item.id} item={item} level={0} onAddSubGoal={openAddDialog} onDelete={(id) => deleteItemMutation.mutate(id)} onLinkProject={openLinkDialog} />)}</div>}
          {viewMode === 'tree' && <HorizonTreeView items={items} />}
          {viewMode === 'compact' && <Card><CardContent className="p-4 space-y-1">{flattenedItems.map((item) => <div key={item.id} className="p-2 rounded-md hover:bg-secondary flex justify-between items-center"><p>{item.title}</p><div className="flex items-center gap-2">{item.type && <Badge variant="secondary">{item.type}</Badge>}{item.priority && <Badge>{item.priority}</Badge>}</div></div>)}</CardContent></Card>}
        </div>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{newItem.parent_id ? 'Add Sub-Goal' : 'Add New Goal'}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); addItemMutation.mutate(newItem); }} className="space-y-4">
            <Input placeholder="What's your goal?" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} required autoFocus />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Tag (optional)" value={newItem.tag} onChange={(e) => setNewItem({ ...newItem, tag: e.target.value })} />
              <Select onValueChange={(value) => setNewItem({ ...newItem, priority: value })}><SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger><SelectContent>{priorities.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" placeholder="Target date" value={newItem.target_date} onChange={(e) => setNewItem({ ...newItem, target_date: e.target.value })} className="text-sm" />
              <Input placeholder="Link (optional)" value={newItem.link} onChange={(e) => setNewItem({ ...newItem, link: e.target.value })} />
            </div>
            <Button type="submit" className="w-full" disabled={addItemMutation.isPending}>Add Goal</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Link Project to "{itemToLink?.title}"</DialogTitle><CardDescription>Connect an active project from your Flow to this goal.</CardDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <Select onValueChange={setSelectedProjectId}><SelectTrigger><SelectValue placeholder="Choose a project..." /></SelectTrigger><SelectContent>{availableProjects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
          </div>
          <DialogFooter><Button onClick={() => itemToLink && linkProjectMutation.mutate({ horizon_item_id: itemToLink.id, loom_item_id: selectedProjectId })} disabled={!selectedProjectId || linkProjectMutation.isPending}>Link Project</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- HORIZON SMART LIST ITEM COMPONENT ---
interface HorizonSmartListItemProps { item: HorizonItemNode; level: number; onAddSubGoal: (parentId: string) => void; onDelete: (itemId: string) => void; onLinkProject: (item: HorizonItemNode) => void; }
const HorizonSmartListItem = ({ item, level, onAddSubGoal, onDelete, onLinkProject }: HorizonSmartListItemProps) => {
  const status = (item.status || 'Not Started') as GoalStatus;
  const dotColor = statusColors[status] || statusColors['Not Started'];

  return (
    <div className={cn(level > 0 && 'pl-6')}>
      <Card className="overflow-hidden">
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-3 flex-grow min-w-0">
            {/* Status dot */}
            <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', dotColor)} title={status} />
            <div className="min-w-0">
              <p className={cn("font-medium", status === 'Done' && "line-through text-muted-foreground")}>{item.title}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
                {item.type && <Badge variant="secondary" className="text-xs">{item.type}</Badge>}
                {item.priority && <Badge className="text-xs">{item.priority}</Badge>}
                {(item as any).target_date && (
                  <span className="text-xs text-muted-foreground">→ {new Date((item as any).target_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                )}
                {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm" className="h-6 px-2"><LinkIcon className="mr-1 h-3 w-3" /> Link</Button></a>}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onAddSubGoal(item.id)}><Plus className="mr-2 h-4 w-4" /> Add Sub-Goal</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onLinkProject(item)}><LinkIcon className="mr-2 h-4 w-4" /> Link Project</DropdownMenuItem>
              <DropdownMenuItem className="text-red-500" onClick={() => onDelete(item.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {(item.linked_projects.length > 0 || item.children.length > 0) && (
          <div className="bg-secondary/30 px-4 py-2 border-t space-y-2">
            {item.children.map((child) => <HorizonSmartListItem key={child.id} item={child} level={level + 1} onAddSubGoal={onAddSubGoal} onDelete={onDelete} onLinkProject={onLinkProject} />)}
            {item.linked_projects.map((proj) => <div key={proj.id} className={cn('flex items-center gap-2 text-sm py-1', level > 0 && 'pl-6')}><FolderKanban className="h-4 w-4 text-primary" /><span>{proj.name}</span></div>)}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Horizon;