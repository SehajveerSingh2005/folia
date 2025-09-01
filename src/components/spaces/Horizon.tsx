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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Telescope, PlusCircle, Trash2, Link as LinkIcon } from 'lucide-react';
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

const Horizon = () => {
  const [items, setItems] = useState<HorizonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    type: '',
    priority: '',
    link: '',
  });

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
      setIsDialogOpen(false);
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
            <Card key={item.id}>
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Horizon;