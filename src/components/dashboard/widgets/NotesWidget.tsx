import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { showError, showSuccess } from '@/utils/toast';

const NotesWidget = () => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNote = async () => {
    if (content.trim() === '') return;
    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError('You must be logged in.');
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from('notes')
      .insert({ content, user_id: user.id });

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Note added to Garden.');
      setContent('');
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-sans font-medium">Quick Note</CardTitle>
        <CardDescription>
          Plant a new seed in your Garden.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <Textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-grow"
        />
        <Button onClick={handleAddNote} disabled={isSubmitting} className="mt-2 self-end">
          {isSubmitting ? 'Saving...' : 'Save Note'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotesWidget;