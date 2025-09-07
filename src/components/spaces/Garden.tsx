import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

const Garden = () => {
  const [items, setItems] = useState<GardenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<GardenItem | null>(null);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [itemToPromote, setItemToPromote] = useState<GardenItem | null>(null);
  const [newItem, setNewItem] = useState({ content: '', category: '' });
  const [promotedItem, setPromotedItem] = useState({ name: '', type: '' });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('garden_items')
      .select('id, content, category, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      showError('Could not fetch notes.');
      console.error(error);
    } else {
      setItems(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.content.trim() === '') return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('garden_items').insert({
      content: newItem.content,
      category: newItem.category || null,
      user_id: user.id,
    });

    if (error) {
      showError(error.message);
    } else {
      setNewItem({ content: '', category: '' });
      setIsAddDialogOpen(false);
      fetchItems();
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToEdit || itemToEdit.content.trim() === '') return;

    const { error } = await supabase
      .from('garden_items')
      .update({
        content: itemToEdit.content,
        category: itemToEdit.category || null,
      })
      .eq('id', itemToEdit.id);

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Note updated.');
      setIsEditDialogOpen(false);
      setItemToEdit(null);
      fetchItems();
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const { error } = await supabase
      .from('garden_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Note deleted.');
      fetchItems();
    }
  };

  const openEditDialog = (item: GardenItem) => {
    setItemToEdit(item);
    setIsEditDialogOpen(true);
  };

  const openPromoteDialog = (item: GardenItem) => {
    setItemToPromote(item);
    setPromotedItem({ name: item.content, type: '' });
    setIsPromoteDialogOpen(true);
  };

  const handlePromoteItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToPromote || promotedItem.name.trim() === '') return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: loomError } = await supabase.from('loom_items').insert({
      name: promotedItem.name,
      type: promotedItem.type || null,
      user_id: user.id,
    });

    if (loomError) {
      showError(`Failed to promote: ${loomError.message}`);
      return;
    }

    const { error: gardenError } = await supabase
      .from('garden_items')
      .delete()
      .eq('id', itemToPromote.id);

    if (gardenError) {
      showError(`Item promoted, but failed to delete original note: ${gardenError.message}`);
    } else {
      showSuccess('Idea promoted to Flow!');
    }

    setIsPromoteDialogOpen(false);
    setItemToPromote(null);
    fetchItems();
  };

  const filteredItems = activeCategory
    ? items.filter((item) => item.category === activeCategory)
    : items;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <Sparkles className="h-10 w-10 text-primary flex-shrink-0" />
          <div>
            <h2 className="text-3xl sm:text-4xl font-serif">Garden</h2>
            <p className="text-foreground/70">
              Cultivate raw ideas and quick notes.
            </p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Plant Seed
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Note</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddItem} className="space-y-4">
              <Textarea
                placeholder="What's on your mind?"
                value={newItem.content}
                onChange={(e) =>
                  setNewItem({ ...newItem, content: e.target.value })
                }
                rows={5}
                required
              />
              <Select
                onValueChange={(value) =>
                  setNewItem({ ...newItem, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full">
                Save Note
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 mb-8 border-b pb-4">
        <Button
          variant={!activeCategory ? 'default' : 'ghost'}
          onClick={() => setActiveCategory(null)}
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? 'default' : 'ghost'}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {loading ? (
        <p>Loading notes...</p>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader>
                <div>
                  {item.category && <Badge variant="secondary">{item.category}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="whitespace-pre-wrap">{item.content}</p>
              </CardContent>
              <CardFooter className="border-t p-2 flex justify-between items-center">
                <Button variant="ghost" className="flex-grow justify-center" onClick={() => openPromoteDialog(item)}>
                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                  Promote to Flow
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => openEditDialog(item)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-500"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-foreground/70">
            {activeCategory ? `No notes in '${activeCategory}' yet.` : 'Your garden is empty.'}
          </p>
          <p className="text-sm text-foreground/50">
            Click "Plant Seed" to cultivate a new idea.
          </p>
        </div>
      )}

      {/* Edit Note Dialog */}
      {itemToEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Note</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateItem} className="space-y-4">
              <Textarea
                placeholder="What's on your mind?"
                value={itemToEdit.content}
                onChange={(e) =>
                  setItemToEdit({ ...itemToEdit, content: e.target.value })
                }
                rows={5}
                required
              />
              <Select
                value={itemToEdit.category || ''}
                onValueChange={(value) =>
                  setItemToEdit({ ...itemToEdit, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full">
                Save Changes
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Promote to Project Dialog */}
      <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote to Flow</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePromoteItem} className="space-y-4">
            <Textarea
              value={promotedItem.name}
              onChange={(e) =>
                setPromotedItem({ ...promotedItem, name: e.target.value })
              }
              rows={3}
              required
            />
            <Select
              onValueChange={(value) =>
                setPromotedItem({ ...promotedItem, type: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a type for the new item" />
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
              Create Item in Flow
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Garden;