import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { showError, showSuccess } from '@/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { Wand2, Loader2 } from 'lucide-react';
import { useNavigate } from '@/lib/navigation';

interface MakePlanFormProps {
  onPlanCreated: () => void;
}

const planPresets = [
  'Learn a new programming language',
  'Start a side project',
  'Write a blog post series',
  'Train for a 5k run',
  'Read 12 books this year',
  'Organize my digital files',
];

const MakePlanForm = ({ onPlanCreated }: MakePlanFormProps) => {
  const [goal, setGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (goal.trim() === '') {
      showError('Please enter a goal.');
      return;
    }
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('You must be logged in to create a plan.');
      }

      const response = await fetch('/api/ai/plan-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ goal }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate plan');
      }

      showSuccess(result.message || 'Your plan has been created!');
      queryClient.invalidateQueries({ queryKey: ['flow_data'] });
      queryClient.invalidateQueries({ queryKey: ['loom_tasks'] });
      queryClient.invalidateQueries({ queryKey: ['horizon_data'] });

      onPlanCreated();
      navigate('/flow');
    } catch (error: any) {
      showError(error.message || 'Failed to create plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pt-4 flex flex-col h-full">
      <p className="text-sm text-muted-foreground mb-2">
        Start with a preset or write your own goal below.
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {planPresets.map((preset) => (
          <Button
            key={preset}
            type="button"
            variant="secondary"
            size="sm"
            className="text-xs h-7"
            onClick={() => setGoal(preset)}
            disabled={isLoading}
          >
            {preset}
          </Button>
        ))}
      </div>
      <Textarea
        placeholder="e.g., Learn to play the guitar in 3 months"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        className="flex-grow text-base"
        disabled={isLoading}
      />
      <Button type="submit" className="w-full mt-4" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            Generate Plan
          </>
        )}
      </Button>
    </form>
  );
};

export default MakePlanForm;