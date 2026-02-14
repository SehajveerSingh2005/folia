import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Archive as ArchiveIcon, FolderKanban, Trash2 } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import ArchiveSkeleton from '../skeletons/ArchiveSkeleton';

type LoomItem = {
  id: string;
  name: string;
  type: string | null;
};

const fetchCompletedItems = async (): Promise<LoomItem[]> => {
  const response = await fetch('/api/projects');
  if (!response.ok) throw new Error('Failed to fetch archived items');
  const result = await response.json();
  const data = result.data || result; // Handle both { data: [] } and [] formats
  // Filter only completed items
  return data.filter((item: LoomItem & { status?: string }) => item.status === 'Completed');
};

const Archive = () => {
  const queryClient = useQueryClient();
  const { data: completedItems, isLoading, error } = useQuery<LoomItem[]>({
    queryKey: ['archived_items'],
    queryFn: fetchCompletedItems,
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, status: 'Active' }),
      });
      if (!response.ok) throw new Error('Failed to unarchive item');
    },
    onSuccess: () => {
      showSuccess('Item moved back to Flow.');
      queryClient.invalidateQueries({ queryKey: ['archived_items'] });
      queryClient.invalidateQueries({ queryKey: ['flow_data'] });
    },
    onError: (err: Error) => showError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/projects?id=${itemId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete item');
    },
    onSuccess: () => {
      showSuccess('Item permanently deleted.');
      queryClient.invalidateQueries({ queryKey: ['archived_items'] });
    },
    onError: (err: Error) => showError(err.message),
  });

  if (error) {
    showError('Could not fetch archived items.');
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <ArchiveIcon className="h-10 w-10 text-primary flex-shrink-0" />
        <div>
          <h2 className="text-3xl sm:text-4xl font-serif">Archive</h2>
          <p className="text-foreground/70">
            A record of your completed projects and endeavors.
          </p>
        </div>
      </div>
      {isLoading ? (
        <ArchiveSkeleton />
      ) : (
        <div className="space-y-4">
          {completedItems && completedItems.map((item) => (
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
                    <DropdownMenuItem onClick={() => unarchiveMutation.mutate(item.id)}>
                      <FolderKanban className="mr-2 h-4 w-4" />
                      Move to Active
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-500"
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Permanently
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
            </Card>
          ))}
          {completedItems && completedItems.length === 0 && (
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