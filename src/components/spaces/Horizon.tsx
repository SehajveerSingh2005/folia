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
type HorizonItem = { id: string; title: string; type: string | null; priority: string | null; link: string | null; parent_id: string | null; user_id: string; created_at: string; };
type HorizonItemNode = HorizonItem & { children: HorizonItemNode[]; linked_projects: LoomItemStub[] };
type HorizonData = { tree: HorizonItemNode[]; availableProjects: LoomItemStub[] };
const itemTypes = ['Skill', 'Field', 'Book', 'Course', 'Hobby', 'Project Idea', 'Misc'];
const priorities = ['High', 'Medium', 'Low'];
type ViewMode = 'list' | 'tree' | 'compact';

// --- DATA FETCHING ---
const fetchHorizonData = async (): Promise<HorizonData> => {
  const { data: horizonItems, error: horizonError } = await supabase.from('horizon_items').select('*');
  if (horizonError) throw new Error(horizonError.message);
  const { data: loomItems, error: loomError } = await supabase.from('loom_items').select('id, name').neq('status', 'Completed');
  if (loomError) throw new Error(loomError.message);
  const { data: links, error: linksError } = await supabase.from('horizon_flow_links').select('horizon_item_id, loom_item_id');
  if (linksError) throw new Error(linksError.message);

  const itemsById = new Map(horizonItems.map((item) => [item.id, { ...item, children: [], linked_projects: [] }]));
  links.forEach((link) => {
    const horizonItem = itemsById.get(link.horizon_item_id);
    const loomItem = loomItems.find((l) => l.id === link.loom_item_id);
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
  const [newItem, setNewItem] = useState({ title: '', type: '', priority: '', link: '', parent_id: null as string | null });

  const { data, isLoading, error } = useQuery<HorizonData>({ queryKey: ['horizon_data'], queryFn: fetchHorizonData });
  const items = data?.tree || [];
  const availableProjects = data?.availableProjects || [];

  const mutationOptions = {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['horizon_data'] }),
    onError: (err: Error) => showError(err.message),
  };

  const addItemMutation = useMutation({
    mutationFn: async (itemData: typeof newItem) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");
      const { error } = await supabase.from('horizon_items').insert({ ...itemData, user_id: user.id });
      if (error) throw error;
    },
    ...mutationOptions,
    onSuccess: () => {
      showSuccess('Item added to Horizon!');
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['horizon_data'] });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => supabase.from('horizon_items').delete().eq('id', itemId),
    ...mutationOptions,
    onSuccess: () => {
      showSuccess('Item removed.');
      queryClient.invalidateQueries({ queryKey: ['horizon_data'] });
    }
  });

  const linkProjectMutation = useMutation({
    mutationFn: async ({ horizon_item_id, loom_item_id }: { horizon_item_id: string, loom_item_id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");
      const { error } = await supabase.from('horizon_flow_links').insert({ user_id: user.id, horizon_item_id, loom_item_id });
      if (error) throw error;
    },
    ...mutationOptions,
    onSuccess: () => {
      showSuccess('Project linked successfully.');
      setIsLinkDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['horizon_data'] });
    },
    onError: (err: any) => showError(err.code === '23505' ? 'This project is already linked.' : err.message),
  });

  if (error) showError('Could not fetch horizon data.');

  const openAddDialog = (parentId: string | null = null) => { setNewItem({ title: '', type: '', priority: '', link: '', parent_id: parentId }); setIsAddDialogOpen(true); };
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
            <h2 className="text-3xl sm:text-4xl font-serif">Horizon</h2>
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
            <Input placeholder="Title" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} required />
            <Select onValueChange={(value) => setNewItem({ ...newItem, type: value })}><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger><SelectContent>{itemTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select>
            <Select onValueChange={(value) => setNewItem({ ...newItem, priority: value })}><SelectTrigger><SelectValue placeholder="Select a priority" /></SelectTrigger><SelectContent>{priorities.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
            <Input placeholder="Link (optional)" value={newItem.link} onChange={(e) => setNewItem({ ...newItem, link: e.target.value })} />
            <Button type="submit" className="w-full" disabled={addItemMutation.isPending}>Save Item</Button>
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
const HorizonSmartListItem = ({ item, level, onAddSubGoal, onDelete, onLinkProject }: HorizonSmartListItemProps) => (
  <div className={cn(level > 0 && 'pl-6')}>
    <Card className="overflow-hidden">
      <div className="p-4 flex justify-between items-center">
        <div className="flex-grow">
          <p className="font-medium">{item.title}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            {item.type && <Badge variant="secondary">{item.type}</Badge>}
            {item.priority && <Badge>{item.priority}</Badge>}
            {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="xs" className="h-6 px-2"><LinkIcon className="mr-1 h-3 w-3" /> Link</Button></a>}
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

export default Horizon;