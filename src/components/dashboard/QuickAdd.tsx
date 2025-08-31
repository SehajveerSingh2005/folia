import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Plus } from 'lucide-react';

interface QuickAddProps {
  onItemAdded: () => void;
}

const QuickAdd = ({ onItemAdded }: QuickAddProps) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() === '') return;

    setIsSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      showError('You must be logged in.');
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from('tasks')
      .insert({ content, user_id: user.id, project_id: null });

    if (error) {
      showError(error.message);
    } else {
      setContent('');
      onItemAdded();
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="Add a task to your inbox..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isSubmitting}
      />
      <Button type="submit" disabled={isSubmitting}>
        <Plus className="h-4 w-4 mr-2" />
        Add
      </Button>
    </form>
  );
};

export default QuickAdd;