import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sparkles, Trash2, PlusCircle, ArrowUpCircle, MoreVertical, Pencil } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import GardenSkeleton from '../skeletons/GardenSkeleton';

// Types
type GardenItem = {
  id: string;
  content: string;
  category: string | null;
  created_at: string;
};

const categories = ['Writing', 'Project', 'Life', 'Business', 'Random'];
const loomItemTypes = [
  'Project',
  'Book',
  'Course',
  'Writing',
  'Open Source',
  'Habit',
  'Misc',
];

// Data Fetching
const fetchGardenItems = async (): Promise<GardenItem[]> => {
  const response = await fetch('/api/garden');
  if (!response.ok) throw new Error('Failed to fetch garden items');
  const result = await response.json();
  return result.data || result; // Handle both { data: [] } and [] formats
};

// Component
const Garden = () => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<GardenItem | null>(null);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [itemToPromote, setItemToPromote] = useState<GardenItem | null>(null);
  const [newItem, setNewItem] = useState({ content: '', category: '' });
  const [promotedItem, setPromotedItem] = useState({ name: '', type: '' });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: items, isLoading, error } = useQuery<GardenItem[]>({
    queryKey: ['garden_items'],
    queryFn: fetchGardenItems,
  });

  const mutationOptions = {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['garden_items'] }),
    onError: (err: Error) => showError(err.message),
  };

  const addItemMutation = useMutation({
    mutationFn: async (itemData: typeof newItem) => {
      const response = await fetch('/api/garden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      if (!response.ok) throw new Error('Failed to add garden item');
    },
    ...mutationOptions,
    onSuccess: () => {
      setNewItem({ content: '', category: '' });
      setIsAddDialogOpen(false);
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: async (itemData: GardenItem) => {
      const response = await fetch('/api/garden', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemData.id, content: itemData.content, category: itemData.category }),
      });
      if (!response.ok) throw new Error('Failed to update garden item');
    },
    ...mutationOptions,
    onSuccess: () => {
      showSuccess('Note updated.');
      setIsEditDialogOpen(false);
      setItemToEdit(null);
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/garden?id=${itemId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete garden item');
    },
    ...mutationOptions,
    onSuccess: () => showSuccess('Note deleted.'),
  });

  const promoteItemMutation = useMutation({
    mutationFn: async ({ item, promotedData }: { item: GardenItem, promotedData: typeof promotedItem }) => {
      // Create loom item
      const createResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: promotedData.name, type: promotedData.type }),
      });
      if (!createResponse.ok) throw new Error('Failed to create loom item');

      // Delete garden item
      const deleteResponse = await fetch(`/api/garden?id=${item.id}`, { method: 'DELETE' });
      if (!deleteResponse.ok) throw new Error('Failed to delete garden item');
    },
    onSuccess: () => {
      showSuccess('Idea promoted to Flow!');
      setIsPromoteDialogOpen(false);
      setItemToPromote(null);
      queryClient.invalidateQueries({ queryKey: ['garden_items'] });
      queryClient.invalidateQueries({ queryKey: ['flow_data'] });
    },
    onError: (err: Error) => showError(err.message),
  });

  if (error) showError('Could not fetch notes.');

  const openEditDialog = (item: GardenItem) => { setItemToEdit(item); setIsEditDialogOpen(true); };
  const openPromoteDialog = (item: GardenItem) => { setItemToPromote(item); setPromotedItem({ name: item.content, type: '' }); setIsPromoteDialogOpen(true); };

  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (activeCategory) return items.filter((item) => item.category === activeCategory);
    return items;
  }, [items, activeCategory]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-4">
          <Sparkles className="h-10 w-10 text-primary flex-shrink-0" />
          <div>
            <h2 className="text-3xl sm:text-4xl font-serif">Garden</h2>
            <p className="text-foreground/70">Cultivate raw ideas and quick notes.</p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild><Button className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" />Plant Seed</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Note</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); addItemMutation.mutate(newItem); }} className="space-y-4">
              <Textarea placeholder="What's on your mind?" value={newItem.content} onChange={(e) => setNewItem({ ...newItem, content: e.target.value })} rows={5} required />
              <Select onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                <SelectTrigger><SelectValue placeholder="Select a category (optional)" /></SelectTrigger>
                <SelectContent>{categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
              </Select>
              <Button type="submit" className="w-full" disabled={addItemMutation.isPending}>Save Note</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 mb-8 border-b pb-4 flex-wrap">
        <Button variant={!activeCategory ? 'default' : 'ghost'} onClick={() => setActiveCategory(null)}>All</Button>
        {categories.map((cat) => <Button key={cat} variant={activeCategory === cat ? 'default' : 'ghost'} onClick={() => setActiveCategory(cat)}>{cat}</Button>)}
      </div>

      {isLoading ? <GardenSkeleton /> : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader>{item.category && <Badge variant="secondary">{item.category}</Badge>}</CardHeader>
              <CardContent className="flex-grow"><p className="whitespace-pre-wrap">{item.content}</p></CardContent>
              <CardFooter className="border-t p-2 flex justify-between items-center">
                <Button variant="ghost" className="flex-grow justify-center" onClick={() => openPromoteDialog(item)}><ArrowUpCircle className="mr-2 h-4 w-4" />Promote to Flow</Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => openEditDialog(item)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-500" onClick={() => deleteItemMutation.mutate(item.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12"><p className="text-lg text-foreground/70">{activeCategory ? `No notes in '${activeCategory}' yet.` : 'Your garden is empty.'}</p><p className="text-sm text-foreground/50">Click "Plant Seed" to cultivate a new idea.</p></div>
      )}

      {itemToEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Note</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); updateItemMutation.mutate(itemToEdit); }} className="space-y-4">
              <Textarea placeholder="What's on your mind?" value={itemToEdit.content} onChange={(e) => setItemToEdit({ ...itemToEdit, content: e.target.value })} rows={5} required />
              <Select value={itemToEdit.category || ''} onValueChange={(value) => setItemToEdit({ ...itemToEdit, category: value })}>
                <SelectTrigger><SelectValue placeholder="Select a category (optional)" /></SelectTrigger>
                <SelectContent>{categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
              </Select>
              <Button type="submit" className="w-full" disabled={updateItemMutation.isPending}>Save Changes</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Promote to Flow</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); itemToPromote && promoteItemMutation.mutate({ item: itemToPromote, promotedData: promotedItem }); }} className="space-y-4">
            <Textarea value={promotedItem.name} onChange={(e) => setPromotedItem({ ...promotedItem, name: e.target.value })} rows={3} required />
            <Select onValueChange={(value) => setPromotedItem({ ...promotedItem, type: value })} required>
              <SelectTrigger><SelectValue placeholder="Select a type for the new item" /></SelectTrigger>
              <SelectContent>{loomItemTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
            </Select>
            <Button type="submit" className="w-full" disabled={promoteItemMutation.isPending}>Create Item in Flow</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Garden;