import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  ArrowUpCircle,
} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';

type HorizonItem = {
  id: string;
  title: string;
  type: string | null;
  priority: string | null;
  link: string | null;
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
const loomItemTypes = [
  'Project',
  'Book',
  'Course',
  'Writing',
  'Open Source',
  'Habit',
  'Misc',
];

const Horizon = () => {
  const [items, setItems] = useState<HorizonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [itemToPromote, setItemToPromote] = useState<HorizonItem | null>(null);
  const [newItem, setNewItem] = useState({
    title: '',
    type: '',
    priority: '',
    link: '',
  });
  const [promotedItem, setPromotedItem] = useState({ name: '', type: '' });

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('horizon_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showError('Could not fetch horizon items.');
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
    if (newItem.title.trim() === '') return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('horizon_items').insert({
      ...newItem,
      user_id: user.id,
      type: newItem.type || null,
      priority: newItem.priority || null,
      link: newItem.link || null,
    });

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Item added to Horizon!');
      setNewItem({ title: '', type: '', priority: '', link: '' });
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

  const openPromoteDialog = (item: HorizonItem) => {
    setItemToPromote(item);
    setPromotedItem({ name: item.title, type: '' });
    setIsPromoteDialogOpen(true);
  };

  const handlePromoteItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToPromote || promotedItem.name.trim() === '') return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
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

    // 2. Delete the original horizon_item
    const { error: horizonError } = await supabase
      .from('horizon_items')
      .delete()
      .eq('id', itemToPromote.id);

    if (horizonError) {
      showError(
        `Item promoted, but failed to delete original item: ${horizonError.message}`,
      );
    } else {
      showSuccess('Item promoted to Flow!');
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
          <Telescope className="h-10 w-10 text-primary" />
          <div>
            <h2 className="text-4xl font-serif">Horizon</h2>
            <p className="text-foreground/70">
              Set your sights on the future.
            </p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Horizon</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddItem} className="space-y-4">
              <Input
                placeholder="Title"
                value={newItem.title}
                onChange={(e) =>
                  setNewItem({ ...newItem, title: e.target.value })
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
                  {itemTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                onValueChange={(value) =>
                  setNewItem({ ...newItem, priority: value })
                }
              >
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
                onChange={(e) =>
                  setNewItem({ ...newItem, link: e.target.value })
                }
              />
              <Button type="submit" className="w-full">
                Save Item
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {loading ? (
        <p>Loading items...</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="font-sans font-medium">
                    {item.title}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2 pt-1">
                  {item.type && <Badge variant="secondary">{item.type}</Badge>}
                  {item.priority && <Badge>{item.priority}</Badge>}
                </div>
              </CardHeader>
              {item.link && (
                <CardContent>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Button variant="outline" size="sm">
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Visit Link
                    </Button>
                  </a>
                </CardContent>
              )}
              <CardFooter className="border-t p-2">
                <Button
                  variant="ghost"
                  className="w-full justify-center"
                  onClick={() => openPromoteDialog(item)}
                >
                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                  Promote to Flow
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Promote to Flow Dialog */}
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

export default Horizon;