import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, Link as LinkIcon } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

type WishlistItem = {
  id: string;
  item_name: string;
  notes: string | null;
  link: string | null;
};

const Wishlist = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({ item_name: '', notes: '', link: '' });

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wishlist_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showError('Could not fetch wishlist.');
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
    if (newItem.item_name.trim() === '') return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('wishlist_items')
      .insert({ ...newItem, user_id: user.id });

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Item added to wishlist!');
      setNewItem({ item_name: '', notes: '', link: '' });
      setIsDialogOpen(false);
      fetchItems();
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const { error } = await supabase.from('wishlist_items').delete().eq('id', itemId);
    if (error) {
      showError(error.message);
    } else {
      showSuccess('Item removed.');
      fetchItems();
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Wishlist</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddItem} className="space-y-4">
              <Input
                placeholder="Item name"
                value={newItem.item_name}
                onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
              />
              <Input
                placeholder="Link (optional)"
                value={newItem.link}
                onChange={(e) => setNewItem({ ...newItem, link: e.target.value })}
              />
              <Textarea
                placeholder="Notes (optional)"
                value={newItem.notes}
                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
              />
              <Button type="submit" className="w-full">
                Save Item
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {loading ? (
        <p>Loading wishlist...</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="font-sans font-medium">{item.item_name}</CardTitle>
                {item.notes && <CardDescription>{item.notes}</CardDescription>}
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                {item.link ? (
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Visit Link
                    </Button>
                  </a>
                ) : <div />}
                <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;