import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showError, showSuccess } from '@/utils/toast';
import GardenSkeleton from '../skeletons/GardenSkeleton';
import GardenLayout from './garden/GardenLayout';
import NoteList, { GardenItem } from './garden/NoteList';
import GardenEditor from './garden/GardenEditor';
import { v4 as uuidv4 } from 'uuid';

// Data Fetching
const fetchGardenItems = async (): Promise<GardenItem[]> => {
  const { data, error } = await supabase
    .from('garden_items')
    .select('id, title, content, category, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

const Garden = () => {
  const queryClient = useQueryClient();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(true);

  const { data: items, isLoading, error } = useQuery<GardenItem[]>({
    queryKey: ['garden_items'],
    queryFn: fetchGardenItems,
  });

  // Select first note on load if none selected
  useEffect(() => {
    if (items && items.length > 0 && !selectedNoteId) {
      setSelectedNoteId(items[0].id);
    }
  }, [items, selectedNoteId]);

  const activeNote = useMemo(() =>
    items?.find(item => item.id === selectedNoteId),
    [items, selectedNoteId]);

  const mutationOptions = {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['garden_items'] }),
    onError: (err: Error) => showError(err.message),
  };

  const createNoteMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const newNote = {
        title: '',
        content: '',
        user_id: user.id,
        category: 'Random' // Default category
      };

      const { data, error } = await supabase
        .from('garden_items')
        .insert(newNote)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: ['garden_items'] });
      setSelectedNoteId(newItem.id);
      showSuccess('New note created.');
    },
    onError: (err: Error) => showError(err.message),
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<GardenItem> }) => {
      const { error } = await supabase
        .from('garden_items')
        .update(data)
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
    // We don't show success toast on every auto-save to avoid spam
  });

  if (error) showError('Could not fetch notes.');
  if (isLoading) return <GardenSkeleton />; // We might want a dedicated skeleton for the new layout later

  return (
    <div className="h-full">
      <GardenLayout
        isPinned={isPinned}
        sidebar={
          <NoteList
            items={items || []}
            selectedId={selectedNoteId}
            onSelect={setSelectedNoteId}
            onAdd={() => createNoteMutation.mutate()}
            isPinned={isPinned}
            onTogglePin={() => setIsPinned(!isPinned)}
          />
        }
      >
        {activeNote ? (
          <GardenEditor
            key={activeNote.id} // Re-mount editor when switching notes to reset state
            item={activeNote}
            onUpdate={async (id, data) => updateNoteMutation.mutateAsync({ id, data })}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
            <h3 className="text-xl font-medium mb-2">Select a note to view</h3>
            <p>Or create a new one to start writing.</p>
          </div>
        )}
      </GardenLayout>
    </div>
  );
};

export default Garden;