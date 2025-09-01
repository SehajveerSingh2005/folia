import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Archive, FolderKanban, Trash2 } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

type LoomItem = {
  id: string;
  name: string;
  type: string | null;
};

const Archive = () => {
  const [completedItems, setCompletedItems] = useState<LoomItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompletedItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('loom_items')
      .select('id, name, type')
      .eq('status', 'Completed')
      .order('created_at', { ascending: false });

    if (error) {
      showError('Could not fetch archived items.');
      console.error(error);
    } else {
      setCompletedItems(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCompletedItems();
  }, []);

  const handleUnarchive = async (itemId: string) => {
    const { error } = await supabase
      .from('loom_items')
      .update({ status: 'Active' })
      .eq('id', itemId);

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Item moved back to Flow.');
      fetchCompletedItems();
    }
  };

  const handleDelete = async (itemId: string) => {
     const { error } = await supabase.from('loom_items').delete().eq('id', itemId);
    if (error) showError(error.message);
    else {
      showSuccess('Item permanently deleted.');
      fetchCompletedItems();
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Archive className="h-10 w-10 text-primary" />
        <div>
          <h2 className="text-4xl font-serif">Archive</h2>
          <p className="text-foreground/70">
            A record of your completed projects and endeavors.
          </p>
        </div>
      </div>
      {loading ? (
        <p>Loading archive...</p>
      ) : (
        <div className="space-y-4">
          {completedItems.map((item) => (
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
                    <DropdownMenuItem onClick={() => handleUnarchive(item.id)}>
                      <FolderKanban className="mr-2 h-4 w-4" />
                      Move to Active
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-500"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Permanently
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
            </Card>
          ))}
           {completedItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-foreground/70">Your archive is empty.</p>
              <p className="text-sm text-foreground/50">Completed items from Flow will appear here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Archive;