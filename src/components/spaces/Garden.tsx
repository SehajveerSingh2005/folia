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
import { Input } from '@/components/ui/input';
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
import { Sparkles, Trash2, PlusCircle, ArrowUpCircle } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';

type GardenItem = {
  id: string;
  content: string;
  category: string | null;
  moods: string[] | null;
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
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [itemToPromote, setItemToPromote] = useState<GardenItem | null>(null);
  const [newItem, setNewItem] = useState({
    content: '',
    category: '',
    moods: '',
  });
  const [promotedItem, setPromotedItem] = useState({ name: '', type: '' });

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('garden_items')
      .select('id, content, category, moods, created_at')
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

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const moodsArray =
      newItem.moods.trim() === ''
        ? null
        : newItem.moods.split(',').map((m) => m.trim());

    const { error } = await supabase.from('garden_items').insert({
      content: newItem.content,
      category: newItem.category || null,
      moods: moodsArray,
      user_id: user.id,
    });

    if (error) {
      showError(error.message);
    } else {
      setNewItem({ content: '', category: '', moods: '' });
      setIsAddDialogOpen(false);
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

    // 1. Create the new loom_item
    const { error: loomError } = await supabase.from('loom_items').insert({
      name: promotedItem.name,
      type: promotedItem.type || null,
      user_id: user.id,
    });

    if (loomError) {
      showError(`Failed to promote: ${loomError.message}`);
      return;
    }

    // 2. Delete the original garden_item
    const { error: gardenError } = await supabase
      .from('garden_items')
      .delete()
      .eq('id', itemToPromote.id);

    if (gardenError) {
      showError(`Item promoted, but failed to delete original note: ${gardenError.message}`);
    } else {
      showSuccess('Idea promoted to Flow!');
    }

    // 3. Reset and refetch
    setIsPromoteDialogOpen(false);
    setItemToPromote(null);
    fetchItems();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Sparkles className="h-10 w-10 text-primary" />
          <div>
            <h2 className="text-4xl font-serif">Garden</h2>
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
              <Input
                placeholder="Moods (comma-separated, optional)"
                value={newItem.moods}
                onChange={(e) =>
                  setNewItem({ ...newItem, moods: e.target.value })
                }
              />
              <Button type="submit" className="w-full">
                Save Note
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p>Loading notes...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    {item.category && <Badge variant="secondary">{item.category}</Badge>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="whitespace-pre-wrap">{item.content}</p>
              </CardContent>
              <CardFooter className="border-t p-2 flex flex-col items-stretch gap-2">
                 <div className="flex flex-wrap gap-2 px-2 pt-2">
                  {item.moods?.map((mood) => (
                    <Badge key={mood} variant="outline">{mood}</Badge>
                  ))}
                </div>
                <Button variant="ghost" className="w-full justify-center" onClick={() => openPromoteDialog(item)}>
                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                  Promote to Flow
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
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