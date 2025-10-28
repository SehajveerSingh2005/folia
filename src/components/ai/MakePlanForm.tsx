import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { showError, showSuccess } from '@/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { Wand2 } from 'lucide-react';

interface MakePlanFormProps {
  onPlanCreated: () => void;
}

const MakePlanForm = ({ onPlanCreated }: MakePlanFormProps) => {
  const [goal, setGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (goal.trim() === '') {
      showError('Please enter a goal.');
      return;
    }
    setIsLoading(true);

    try {
      const { error } = await supabase.functions.invoke('plan-generator', {
        body: { goal },
      });

      if (error) {
        throw new Error(error.message);
      }

      showSuccess('Your plan has been created in Flow!');
      queryClient.invalidateQueries({ queryKey: ['flow_data'] });
      onPlanCreated();
    } catch (error: any) {
      showError(error.message || 'Failed to create plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pt-4 flex flex-col h-full">
      <Textarea
        placeholder="e.g., Learn to play the guitar in 3 months"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        className="flex-grow text-base"
        disabled={isLoading}
      />
      <Button type="submit" className="w-full mt-4" disabled={isLoading}>
        {isLoading ? (
          'Generating...'
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