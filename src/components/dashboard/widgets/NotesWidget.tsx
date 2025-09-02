import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { showError, showSuccess } from '@/utils/toast';

const categories = ['Writing', 'Project', 'Life', 'Business', 'Random'];

const NotesWidget = () => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [moods, setMoods] = useState('');
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

    const moodsArray = moods.trim() === '' ? null : moods.split(',').map(m => m.trim());

    const { error } = await supabase
      .from('garden_items')
      .insert({ 
          content, 
          user_id: user.id, 
          category: category || 'Random',
          moods: moodsArray 
      });

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Note added to Garden.');
      setContent('');
      setCategory('');
      setMoods('');
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
      <CardContent className="flex-grow flex flex-col gap-2">
        <Textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-grow"
        />
        <div className="flex gap-2">
            <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                    <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
            </Select>
            <Input 
                placeholder="Tags (comma-separated)"
                value={moods}
                onChange={(e) => setMoods(e.target.value)}
            />
        </div>
        <Button onClick={handleAddNote} disabled={isSubmitting} className="mt-auto">
          {isSubmitting ? 'Saving...' : 'Save Note'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotesWidget;