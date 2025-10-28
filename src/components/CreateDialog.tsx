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
        const { data, error } = await supabase.from('loom_items').select('id, name').neq('status', 'Completed');
        if (error) showError('Could not fetch projects.');
        else setLoomItems(data);
      };
      fetchLoomItems();
    }
  }, [isOpen, taskForm, flowForm]);

  const onTaskSubmit = async (values: z.infer<typeof taskSchema>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('ledger_items').insert({
      ...values,
      due_date: values.due_date ? format(values.due_date, 'yyyy-MM-dd') : null,
      user_id: user.id,
      type: 'Task',
    });
    if (error) showError(error.message);
    else {
      showSuccess('Task created.');
      onItemCreated();
      onOpenChange(false);
    }
  };

  const onFlowSubmit = async (values: z.infer<typeof flowItemSchema>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('loom_items').insert({
      ...values,
      user_id: user.id,
      start_date: new Date().toISOString().split('T')[0],
    });
    if (error) showError(error.message);
    else {
      showSuccess('New item created in Flow.');
      onItemCreated();
      onOpenChange(false);
    }
  };

  const handlePlanCreated = () => {
    onItemCreated();
    onOpenChange(false);
  };

  const contentWrapperClass = "pt-4 min-h-[420px] data-[state=active]:animate-in data-[state=active]:fade-in-0";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>Create</DialogTitle></DialogHeader>
        <Tabs defaultValue="task" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="task">New Task</TabsTrigger>
            <TabsTrigger value="flow">New Flow Item</TabsTrigger>
            <TabsTrigger value="plan">Make a Plan</TabsTrigger>
          </TabsList>
          <TabsContent value="task" className={contentWrapperClass}>
            <form onSubmit={taskForm.handleSubmit(onTaskSubmit)} className="space-y-4 flex flex-col h-full">
              <Input {...taskForm.register('content')} placeholder="Task content" />
              <Controller control={taskForm.control} name="loom_item_id" render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}><SelectTrigger><SelectValue placeholder="Link to project (optional)" /></SelectTrigger><SelectContent>{loomItems.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <Controller control={taskForm.control} name="due_date" render={({ field }) => (
                  <Popover><PopoverTrigger asChild><Button variant={'outline'} className={cn('justify-start text-left font-normal', !field.value && 'text-muted-foreground')}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, 'PPP') : <span>Due Date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /><Button variant="ghost" className="w-full rounded-t-none" onClick={() => field.onChange(null)}>Clear Date</Button></PopoverContent></Popover>
                )} />
                <Controller control={taskForm.control} name="priority" render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ''}><SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger><SelectContent>{priorities.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
                )} />
              </div>
              <Textarea {...taskForm.register('notes')} placeholder="Notes (optional)" rows={3} />
              <div className="flex-grow" />
              <Button type="submit" className="w-full" disabled={taskForm.formState.isSubmitting}>{taskForm.formState.isSubmitting ? 'Creating...' : 'Create Task'}</Button>
            </form>
          </TabsContent>
          <TabsContent value="flow" className={contentWrapperClass}>
            <form onSubmit={flowForm.handleSubmit(onFlowSubmit)} className="space-y-4 flex flex-col h-full">
              <Input {...flowForm.register('name')} placeholder="Name (e.g., Launch new website)" />
              <Select onValueChange={(value) => flowForm.setValue('type', value)}><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger><SelectContent>{loomItemTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select>
              <Textarea {...flowForm.register('notes')} placeholder="Description / Notes (optional)" rows={4} />
              <Input {...flowForm.register('link')} placeholder="Link (optional)" />
              <div className="flex-grow" />
              <Button type="submit" className="w-full" disabled={flowForm.formState.isSubmitting}>{flowForm.formState.isSubmitting ? 'Creating...' : 'Create Item'}</Button>
            </form>
          </TabsContent>
          <TabsContent value="plan" className={contentWrapperClass}>
            <div className="flex flex-col h-full">
              <DialogDescription>
                Describe your goal, and the AI will generate a new project in your Flow with a list of actionable tasks to get you started.
              </DialogDescription>
              <div className="flex-grow">
                <MakePlanForm onPlanCreated={handlePlanCreated} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDialog;