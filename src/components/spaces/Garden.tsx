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
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Trash2 } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type Note = {
  id: string;
  content: string;
  created_at: string;
};

const Garden = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNoteContent, setNewNoteContent] = useState('');

  const fetchNotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notes')
      .select('id, content, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      showError('Could not fetch notes.');
      console.error(error);
    } else {
      setNotes(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newNoteContent.trim() === '') return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notes')
      .insert({ content: newNoteContent, user_id: user.id });

    if (error) {
      showError(error.message);
    } else {
      setNewNoteContent('');
      fetchNotes();
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', noteId);

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Note deleted.');
      fetchNotes();
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Sparkles className="h-10 w-10 text-primary" />
        <div>
          <h2 className="text-4xl font-serif">Garden</h2>
          <p className="text-foreground/70">
            Cultivate raw ideas and quick notes.
          </p>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="font-sans font-medium">New Note</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddNote} className="flex flex-col gap-2">
            <Textarea
              placeholder="What's on your mind?"
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows={3}
            />
            <Button type="submit" className="self-end">
              Plant Seed
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <p>Loading notes...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <Card key={note.id} className="flex flex-col">
              <CardContent className="p-4 flex-grow">
                <p className="whitespace-pre-wrap">{note.content}</p>
              </CardContent>
              <div className="p-2 border-t flex justify-between items-center">
                <p className="text-xs text-foreground/60">
                  {new Date(note.created_at).toLocaleDateString()}
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your note.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Garden;