import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import MakePlanForm from './ai/MakePlanForm';

const priorities = ['High', 'Medium', 'Low'];
const loomItemTypes = [
  'Project',
  'Book',
  'Course',
  'Writing',
  'Open Source',
  'Habit',
  'Misc',
];

const taskSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  priority: z.string().nullable(),
  due_date: z.date().nullable(),
  loom_item_id: z.string().nullable(),
  notes: z.string().nullable(),
});

const flowItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().optional(),
  notes: z.string().optional(),
  link: z.string().url().or(z.literal('')).optional(),
});

type LoomItem = {
  id: string;
  name: string;
};

interface CreateDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onItemCreated: () => void;
}

const CreateDialog = ({
  isOpen,
  onOpenChange,
  onItemCreated,
}: CreateDialogProps) => {
  const [loomItems, setLoomItems] = useState<LoomItem[]>([]);

  const taskForm = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: { content: '', priority: null, due_date: null, loom_item_id: null, notes: '' },
  });

  const flowForm = useForm<z.infer<typeof flowItemSchema>>({
    resolver: zodResolver(flowItemSchema),
    defaultValues: { name: '', type: '', notes: '', link: '' },
  });

  useEffect(() => {
    if (isOpen) {
      taskForm.reset();
      flowForm.reset();
      const fetchLoomItems = async () => {
        try {
          const response = await fetch('/api/projects');
          if (!response.ok) throw new Error('Failed to fetch projects');
          const result = await response.json();
          const data = result.data || [];
          // Filter out completed projects
          const activeProjects = data.filter((item: LoomItem & { status?: string }) => item.status !== 'Completed');
          setLoomItems(activeProjects);
        } catch (error) {
          showError('Could not fetch projects.');
        }
      };
      fetchLoomItems();
    }
  }, [isOpen, taskForm, flowForm]);

  const onTaskSubmit = async (values: z.infer<typeof taskSchema>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          due_date: values.due_date ? format(values.due_date, 'yyyy-MM-dd') : null,
          type: 'Task',
        }),
      });

      if (!response.ok) throw new Error('Failed to create task');

      showSuccess('Task created.');
      onItemCreated();
      onOpenChange(false);
    } catch (error: any) {
      showError(error.message || 'Failed to create task');
    }
  };

  const onFlowSubmit = async (values: z.infer<typeof flowItemSchema>) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          start_date: new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) throw new Error('Failed to create loom item');

      showSuccess('New item created in Flow.');
      onItemCreated();
      onOpenChange(false);
    } catch (error: any) {
      showError(error.message || 'Failed to create loom item');
    }
  };

  const handlePlanCreated = () => {
    onItemCreated();
    onOpenChange(false);
  };

  const contentWrapperClass = "pt-4 min-h-[420px] data-[state=active]:animate-in data-[state=active]:fade-in-0";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl flex flex-col p-0 gap-0 overflow-hidden h-[600px]">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl font-serif">Create New</DialogTitle>
          <DialogDescription className="hidden">Create tasks, projects, or use AI planning.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="task" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-2 border-b bg-muted/30">
            <TabsList className="bg-transparent p-0 gap-6 w-full justify-start">
              <TabsTrigger
                value="task"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-1 pb-2 font-medium text-muted-foreground transition-all"
              >
                Task
              </TabsTrigger>
              <TabsTrigger
                value="flow"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-1 pb-2 font-medium text-muted-foreground transition-all"
              >
                Project
              </TabsTrigger>
              <TabsTrigger
                value="plan"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-1 pb-2 font-medium text-muted-foreground transition-all"
              >
                AI Plan
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-background/50">
            <TabsContent value="task" className="mt-0 h-full">
              <form onSubmit={taskForm.handleSubmit(onTaskSubmit)} className="space-y-5 flex flex-col h-full">
                <div className="space-y-4">
                  <Input
                    {...taskForm.register('content')}
                    placeholder="What needs to be done?"
                    className="text-lg border-transparent px-0 shadow-none border-b border-border/50 rounded-none focus-visible:ring-0 placeholder:text-muted-foreground/50 h-12"
                    autoFocus
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Controller control={taskForm.control} name="due_date" render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant={'outline'} className={cn('justify-start text-left font-normal border-border/50', !field.value && 'text-muted-foreground')}>
                            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                            {field.value ? format(field.value, 'PPP') : <span>Due Date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                          <Button variant="ghost" className="w-full rounded-t-none" onClick={() => field.onChange(null)}>Clear Date</Button>
                        </PopoverContent>
                      </Popover>
                    )} />

                    <Controller control={taskForm.control} name="priority" render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <SelectTrigger className="border-border/50">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {priorities.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )} />
                  </div>

                  <Controller control={taskForm.control} name="loom_item_id" render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger className="border-border/50">
                        <SelectValue placeholder="Link to Project (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {loomItems.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />

                  <Textarea
                    {...taskForm.register('notes')}
                    placeholder="Additional notes..."
                    rows={4}
                    className="resize-none bg-muted/20 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                  />
                </div>

                <div className="flex-grow" />
                <Button type="submit" size="lg" className="w-full font-medium" disabled={taskForm.formState.isSubmitting}>
                  {taskForm.formState.isSubmitting ? 'Creating...' : 'Create Task'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="flow" className="mt-0 h-full">
              <form onSubmit={flowForm.handleSubmit(onFlowSubmit)} className="space-y-5 flex flex-col h-full">
                <Input
                  {...flowForm.register('name')}
                  placeholder="Project Name"
                  className="text-lg border-transparent px-0 shadow-none border-b border-border/50 rounded-none focus-visible:ring-0 placeholder:text-muted-foreground/50 h-12"
                  autoFocus
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select onValueChange={(value) => flowForm.setValue('type', value)}>
                    <SelectTrigger className="border-border/50">
                      <SelectValue placeholder="Type (e.g. Project)" />
                    </SelectTrigger>
                    <SelectContent>
                      {loomItemTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Input
                    {...flowForm.register('link')}
                    placeholder="External Link (Optional)"
                    className="border-border/50 bg-background"
                  />
                </div>

                <Textarea
                  {...flowForm.register('notes')}
                  placeholder="Description and goals..."
                  rows={6}
                  className="resize-none bg-muted/20 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                />

                <div className="flex-grow" />
                <Button type="submit" size="lg" className="w-full font-medium" disabled={flowForm.formState.isSubmitting}>
                  {flowForm.formState.isSubmitting ? 'Creating...' : 'Create Project'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="plan" className="mt-0 h-full flex flex-col">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-foreground mb-1">AI Planner</h3>
                <p className="text-sm text-muted-foreground">Describe your goal, and we'll generate a project with actionable steps.</p>
              </div>
              <div className="flex-grow border rounded-lg bg-muted/10 p-4 border-border/50">
                <MakePlanForm onPlanCreated={handlePlanCreated} />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDialog;