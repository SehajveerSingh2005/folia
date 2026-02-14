import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { showError, showSuccess } from '@/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { Wand2, Loader2, Sparkles } from 'lucide-react';
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
  const [loadingStep, setLoadingStep] = useState(0);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const loadingTasks = [
    { text: "Analyzing your goal...", color: "bg-blue-500/10 border-blue-500/20 text-blue-500" },
    { text: "Identifying key milestones...", color: "bg-purple-500/10 border-purple-500/20 text-purple-500" },
    { text: "Breaking down actionable steps...", color: "bg-indigo-500/10 border-indigo-500/20 text-indigo-500" },
    { text: "Estimating timelines...", color: "bg-pink-500/10 border-pink-500/20 text-pink-500" },
    { text: "Crafting your perfect plan...", color: "bg-green-500/10 border-green-500/20 text-green-500" }
  ];

  // Duplicate tasks to create a seamless loop illusion if needed, or just cycle
  // For a true "feed" feel, we might want more items or a loop.
  // Simple loop:
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingTasks.length); // Loop back to 0
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

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

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 space-y-8 animate-in fade-in-0 duration-500">
        <div className="relative w-full max-w-md h-64 overflow-hidden mask-linear-gradient">
          <div
            className="absolute inset-x-0 transition-transform duration-700 ease-in-out"
            style={{ transform: `translateY(-${loadingStep * 40}px)` }} // Sync with item height + margin
          >
            {loadingTasks.map((task, index) => {
              const isActive = index === loadingStep;
              const isPast = index < loadingStep;
              const isFuture = index > loadingStep;

              return (
                <div
                  key={index}
                  className={`
                                    h-16 mb-4 rounded-xl border p-4 flex items-center gap-4 transition-all duration-700
                                    ${isActive
                      ? 'bg-background border-primary/20 shadow-lg scale-100 opacity-100 translate-x-0'
                      : isPast
                        ? 'bg-muted/30 border-transparent opacity-40 scale-95 translate-x-0'
                        : 'opacity-0 translate-x-10' // Slide in from right
                    }
                                `}
                >
                  <div className={`
                                    h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-500
                                    ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                                `}>
                    {isActive ? <Loader2 className="h-4 w-4 animate-spin" /> : <div className="h-2 w-2 rounded-full bg-current" />}
                  </div>
                  <span className={`font-serif text-lg font-medium transition-colors duration-500 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {task.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-sm text-muted-foreground animate-pulse text-center">
          Consulting the oracle... <br />
          <span className="text-xs opacity-50">This may take up to 30 seconds</span>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in-0 zoom-in-95 duration-300">
      <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-4">

        <div className="relative flex-grow pt-2">
          <Textarea
            placeholder="What would you like to achieve? (e.g., 'Learn Spanish in 6 months')"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="h-full resize-none text-xl p-8 bg-secondary/20 border-transparent focus:border-primary/20 focus:ring-0 transition-all font-serif placeholder:text-muted-foreground/50 rounded-xl leading-relaxed selection:bg-primary/10"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Ideas</p>
          <div className="flex flex-wrap gap-2">
            {planPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setGoal(preset)}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary hover:text-primary transition-colors text-muted-foreground border border-transparent hover:border-border"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-base font-medium"
          disabled={isLoading}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Plan
        </Button>
      </form>
    </div>
  );
};

export default MakePlanForm;