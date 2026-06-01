import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showError, showSuccess } from '@/utils/toast';
import { useSearchParams, useRouter } from 'next/navigation';
import GardenLayout from './garden/GardenLayout';
import NoteList, { GardenItem } from './garden/NoteList';
import GardenEditor from './garden/GardenEditor';
import GardenGraph from './garden/GardenGraph';
import { Loader2 } from 'lucide-react';

// Data Fetching
const fetchGardenItems = async (): Promise<GardenItem[]> => {
  const { data, error } = await supabase
    .from('garden_items')
    .select('id, title, content, category, tags, source, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

const Garden = () => {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const noteIdParam = searchParams.get('noteId');

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(true);
  const [viewMode, setViewMode] = useState<'editor' | 'graph'>('editor');

  const { data: items, isLoading, error } = useQuery<GardenItem[]>({
    queryKey: ['garden_items'],
    queryFn: fetchGardenItems,
  });

  useEffect(() => {
    if (noteIdParam) {
      setSelectedNoteId(noteIdParam);
      setViewMode('editor');
      router.replace('/garden');
    }
  }, [noteIdParam, router]);


  // Select first note on load if none selected, ONLY if in editor mode
  useEffect(() => {
    if (items && items.length > 0 && !selectedNoteId && viewMode === 'editor') {
      setSelectedNoteId(items[0].id);
    }
  }, [items, selectedNoteId, viewMode]);

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

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('garden_items').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garden_items'] });
      queryClient.invalidateQueries({ queryKey: ['constellation_data'] });
      setSelectedNoteId(null);
      setViewMode('graph');
      showSuccess('Note deleted.');
    }
  });

  if (error) showError('Could not fetch notes.');
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="animate-spin text-muted-foreground w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="h-full">
      <GardenLayout
        isPinned={isPinned}
        sidebar={
          <NoteList
            items={items || []}
            selectedId={selectedNoteId}
            onSelect={(id) => {
              setSelectedNoteId(id);
              setViewMode('editor');
            }}
            onAdd={() => {
              createNoteMutation.mutate();
              setViewMode('editor');
            }}
            isPinned={isPinned}
            onTogglePin={() => setIsPinned(!isPinned)}
            viewMode={viewMode}
            onChangeViewMode={(mode) => {
              setViewMode(mode);
              if (mode === 'editor' && !selectedNoteId && items && items.length > 0) {
                setSelectedNoteId(items[0].id);
              }
            }}
          />
        }
      >

        {viewMode === 'graph' ? (
          <GardenGraph
            onNodeClick={(nodeId, type) => {
              if (type === 'Garden') {
                setSelectedNoteId(nodeId);
                setViewMode('editor');
              } else {
                // Future: Open project directly or handle otherwise
                console.log("Clicked project", nodeId);
              }
            }}
          />
        ) : (
          activeNote ? (
            <GardenEditor
              key={activeNote.id} // Re-mount editor when switching notes to reset state
              item={activeNote}
              onUpdate={async (id, data) => updateNoteMutation.mutateAsync({ id, data })}
              onDelete={async (id) => deleteNoteMutation.mutateAsync(id)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
              <h3 className="text-xl font-medium mb-2">Select a note to view</h3>
              <p>Or create a new one to start writing.</p>
            </div>
          )
        )}
      </GardenLayout>
    </div>
  );
};

export default Garden;